import os
import re
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# --- Field keys the model must respond with, one per line -----------------
# Using explicit "Key: value" lines instead of strict JSON mode (per your
# earlier decision) - simple to parse, no schema-lock dependency, and Groq
# performs this reliably as long as the keys are spelled out exactly.

FORMATTING_FIELDS = [
    "columnLayout",       # single | double
    "marginLeft",
    "marginRight",
    "marginTop",
    "marginBottom",
    "lineSpacing",         # single | double
    "fontSizeTitle",
    "fontSizeText",
    "fontSizeFigureCaption",
    "fontSizeTableCaption",
    "fontFamily",
    "keywordSeparator",    # comma | semicolon
    "documentClass",
    "referencingStyle",    # APA | Harvard | IEEE | Vancouver
    "highlights",          # yes | no
    "orcidRequired",       # yes | no
]

REQUIREMENT_FLAGS = [
    "dataAvailabilityRequired",
    "fundingStatementRequired",
    "conflictOfInterestRequired",
    "ethicsApprovalRequired",
    "consentForPublicationRequired",
    "authorContributionsRequired",
    "creditStatementRequired",
    "generativeAIRequired",
]

ALL_FIELDS = FORMATTING_FIELDS + REQUIREMENT_FLAGS

# Mirrors the exact <option> values in Page2's dropdowns - anything the
# model returns is matched (case-insensitively) against these before being
# accepted, so a mismatch never silently reaches the frontend as a value
# that can't be selected in its <Select>.
ALLOWED_VALUES: dict[str, list[str]] = {
    "columnLayout": ["single", "double"],
    "lineSpacing": ["single", "double"],
    "keywordSeparator": ["comma", "semicolon"],
    "documentClass": ["IEEEtran.cls", "article.cls", "acmart.cls", "elsarticle.cls","WileyNJDv5"],
    "fontFamily": ["Times New Roman", "Arial", "Computer Modern"],
    "referencingStyle": ["APA", "Harvard", "IEEE", "Vancouver"],
    "highlights": ["yes", "no"],
    "orcidRequired": ["yes", "no"],
}

# Fields that must end up as a plain number string for Page2's
# <MiniInput type="number">. Guideline text almost always states these
# with a unit ("25mm", "10pt") - HTML number inputs render blank if their
# value isn't a strictly valid number, so units must be stripped here.
MARGIN_FIELDS = [
    "marginLeft",
    "marginRight",
    "marginTop",
    "marginBottom",
]

FONT_SIZE_FIELDS = [
    "fontSizeTitle",
    "fontSizeText",
    "fontSizeFigureCaption",
    "fontSizeTableCaption",
]

NUMERIC_FIELDS = MARGIN_FIELDS + FONT_SIZE_FIELDS

INCH_TO_MM = 25.4


class ExtractionResult(BaseModel):
    formatting: dict
    requirements: dict
    unresolved: list[str]  # fields the model could not find in the text


def build_extraction_prompt(guideline_text: str) -> str:
    field_list = "\n".join(f"- {f}" for f in ALL_FIELDS)
    return (
        "Read the author guideline text below and extract these fields.\n"
        "Respond with exactly one line per field, in the format:\n"
        "fieldName: value\n\n"
        "Use these exact field names:\n"
        f"{field_list}\n\n"
        "Rules:\n"
        "- For boolean-style fields use only: 'yes', 'no', or 'NOT_SPECIFIED'\n"
        "- For columnLayout use only: 'single', 'double', or 'NOT_SPECIFIED'\n"
        "- For lineSpacing use only: 'single', 'double', or 'NOT_SPECIFIED'\n"
        "- For keywordSeparator use only: 'comma', 'semicolon', or 'NOT_SPECIFIED'\n"
        "- For referencingStyle use only: 'APA', 'Harvard', 'IEEE', 'Vancouver', or 'NOT_SPECIFIED'\n"
        "- For fontFamily use only: 'Times New Roman', 'Arial', 'Computer Modern', or 'NOT_SPECIFIED' "
        "(pick whichever is closest if the text names a similar font)\n"
        "- For documentClass use only: 'IEEEtran.cls', 'article.cls', 'acmart.cls', 'elsarticle.cls', "
        "or 'NOT_SPECIFIED'\n"
        "- For marginLeft, marginRight, marginTop, marginBottom: this application "
        "only accepts millimeters. If the guideline text states the margin in "
        "inches (e.g. '1 inch', '1in', '0.5\"'), convert it to millimeters "
        "yourself using 1 inch = 25.4mm, and report only the millimeter number "
        "(e.g. '25.4', not '1 inch'). If already stated in mm or cm, convert to "
        "mm and report the plain number with no unit.\n"
        "- For fontSizeTitle, fontSizeText, fontSizeFigureCaption, "
        "fontSizeTableCaption: respond with the plain number only, "
        "with no unit (e.g. '10', not '10pt')\n"
        "- If a field is not mentioned or cannot be determined, write: fieldName: NOT_SPECIFIED\n"
        "- Do not guess or invent values.\n"
        "- For list fields (keywords, keySections), separate values with commas.\n"
        "- Do not include any explanation, headers, or extra text — only the field lines.\n\n"
        f"Guideline text:\n{guideline_text}"
    )


def _normalize_constrained_value(field: str, raw_value: str) -> str | None:
    """
    Case-insensitively matches the model's answer against the allowed
    values for a constrained field. Returns the canonical value (exact
    casing Page2's <option> tags expect) or None if it doesn't match
    anything - safer to treat as unresolved than to pass through a value
    that will silently fail to select any dropdown option.
    """
    allowed = ALLOWED_VALUES.get(field)
    if allowed is None:
        return raw_value  # unconstrained field - pass through as-is

    raw_lower = raw_value.strip().lower()
    for option in allowed:
        if option.lower() == raw_lower:
            return option

    # A few common near-misses worth catching explicitly
    aliases = {
        "double column": "double",
        "double-column": "double",
        "single column": "single",
        "single-column": "single",
        "true": "yes",
        "false": "no",
        "required": "yes",
        "not required": "no",
        "optional": "no",
    }
    return aliases.get(raw_lower)


def _normalize_numeric_value(raw_value: str) -> str | None:
    """Strips units like 'pt' and validates it's actually a number."""
    match = re.search(r"[\d.]+", raw_value)
    return match.group() if match else None


def _normalize_margin_value(raw_value: str) -> str | None:
    """
    Extracts the number and converts to millimeters if the value was
    given in inches. The prompt already asks the model to do this
    conversion itself, but this is a code-level safety net in case the
    model returns something like '1in' or '0.5"' unconverted.
    """
    match = re.search(r"[\d.]+", raw_value)
    if not match:
        return None
    number = float(match.group())

    # Check whatever immediately follows the number, rather than
    # searching the whole string - avoids missing cases like '1in' with
    # no space, and avoids false positives from unrelated text.
    remainder = raw_value[match.end():].strip().lower()
    is_inches = (
        remainder.startswith("in")  # catches 'in', 'in.', 'inch', 'inches'
        or remainder.startswith('"')
        or remainder.startswith("″")  # unicode double-prime, sometimes used for inches
    )

    if is_inches:
        number = round(number * INCH_TO_MM, 1)

    # Return as a clean integer string when possible (e.g. "25" not "25.0"),
    # otherwise keep one decimal place.
    return str(int(number)) if number == int(number) else str(number)


def parse_extraction_response(raw_text: str) -> ExtractionResult:
    """Turns 'fieldName: value' lines into structured, form-ready dicts."""
    found: dict[str, str] = {}

    for line in raw_text.splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if key in ALL_FIELDS:
            found[key] = value

    formatting = {}
    requirements = {}
    unresolved = []

    for field in FORMATTING_FIELDS:
        raw_value = found.get(field, "NOT_SPECIFIED")

        if raw_value == "NOT_SPECIFIED":
            unresolved.append(field)
            formatting[field] = ""  # leave blank for the user to fill in
            continue

        if field in MARGIN_FIELDS:
            cleaned = _normalize_margin_value(raw_value)
        elif field in FONT_SIZE_FIELDS:
            cleaned = _normalize_numeric_value(raw_value)
        elif field in ALLOWED_VALUES:
            cleaned = _normalize_constrained_value(field, raw_value)
        else:
            cleaned = raw_value  # unconstrained free-text field

        if cleaned is None:
            # Model returned something that doesn't match what this field
            # expects - treat as unresolved rather than pass through a
            # value that will silently fail to render or select.
            unresolved.append(field)
            formatting[field] = ""
        else:
            formatting[field] = cleaned

    for field in REQUIREMENT_FLAGS:
        value = found.get(field, "NOT_SPECIFIED")
        if value == "NOT_SPECIFIED":
            unresolved.append(field)
            requirements[field] = None  # unknown - let user decide
        else:
            requirements[field] = value.lower() in ("yes", "true", "required")

    return ExtractionResult(
        formatting=formatting, requirements=requirements, unresolved=unresolved
    )


def call_groq_extraction(guideline_text: str) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Check that your .env file exists in "
            "the same folder as this script, contains a line exactly like "
            "'GROQ_API_KEY=your-key-here' (no quotes, no spaces around '='), "
            "and that the server has been restarted since it was added."
        )

    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=GROQ_API_KEY,
    )
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": "You are an expert at extracting formatting rules "
                "from academic author guidelines.",
            },
            {"role": "user", "content": build_extraction_prompt(guideline_text)},
        ],
        temperature=0,  # deterministic extraction, not creative writing
    )
    return response.choices[0].message.content


def extract_fields(guideline_text: str) -> ExtractionResult:
    raw = call_groq_extraction(guideline_text)
    return parse_extraction_response(raw)


# --- FastAPI route ----------------------------------------------------------

router = APIRouter()


class ExtractRequest(BaseModel):
    publisher: str
    guidelines: str


@router.post("/api/extract-formatting-rules", response_model=ExtractionResult)
def extract_formatting_rules(payload: ExtractRequest):
    if not payload.guidelines.strip():
        raise HTTPException(status_code=400, detail="Guidelines text is empty.")
    try:
        return extract_fields(payload.guidelines)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Extraction failed: {exc}")


if __name__ == "__main__":
    sample = (
        "Manuscripts must use a double-column, single-spaced format using a "
        "10-point font size, with a margin of at least 1 inch on all sides. "
        "All authors must supply an ORCID iD before final submission."
    )
    result = extract_fields(sample)
    print("Formatting fields:", result.formatting)
    print("Requirement flags:", result.requirements)
    print("Unresolved:", result.unresolved)