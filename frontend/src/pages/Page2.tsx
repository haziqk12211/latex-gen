import { useEffect } from "react";
import type React from "react";
import type { FormData } from "../App";
import { Field, Select, Section, NavButton } from "../components/FormField";

interface Props {
  data: FormData;
  update: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  unresolvedFields?: string[];
}

// Each publisher maps to the one document class its official LaTeX
// template actually uses - none of the five currently supported publishers
// offer more than one recognized class, just different class options
// (e.g. IEEE's [journal,onecolumn] vs [journal]).
const DOCUMENT_CLASSES_BY_PUBLISHER: Record<string, { value: string; label: string }[]> = {
  IEEE: [{ value: "IEEEtran.cls", label: "IEEEtran.cls" }],
  ACM: [{ value: "acmart.cls", label: "acmart.cls" }],
  Elsevier: [{ value: "elsarticle.cls", label: "elsarticle.cls" }],
  Springer: [{ value: "sn-jnl.cls", label: "sn-jnl.cls" }],
  Wiley: [{ value: "WileyNJDv5.cls", label: "WileyNJDv5.cls" }],
};

const FALLBACK_DOCUMENT_CLASSES = [
  { value: "article.cls", label: "article.cls (generic)" },
];

// Publishers whose official template offers a column-count choice at all.
// Springer's sn-jnl class has no column class option - it's fixed
// single-column and controlled by the journal, not the author.
const PUBLISHERS_WITHOUT_COLUMN_CHOICE = ["Springer"];

// Each publisher's actual supported referencing/citation styles, based on
// what each publisher's real LaTeX class supports (not a generic list
// applied to all five - none of them support the same set).
const REFERENCING_STYLES_BY_PUBLISHER: Record<string, { value: string; label: string }[]> = {
  IEEE: [{ value: "Numeric", label: "Numeric" }],
  ACM: [
    { value: "Numbered", label: "Numbered" },
    { value: "AuthorYear", label: "Author-Year" },
  ],
  Elsevier: [
    { value: "Harvard", label: "Harvard / Author-Year " },
    { value: "Numbered", label: "Numbered" },
  ],
  Wiley: [
    { value: "AMA", label: "AMA (Numbered)" },
    { value: "VANCOUVER", label: "Vancouver (Numbered)" },
    { value: "MPS", label: "Math & Physical Sciences (Numbered)" },
    { value: "AMS", label: "AMS (Numbered)" },
    { value: "APS", label: "APS (Numbered)" },
    { value: "WCMS", label: "Chemistry / Materials Sciences (Numbered)" },
    { value: "HARVARD", label: "Harvard (Author-Year)" },
    { value: "APA", label: "APA (Author-Year)" },
    { value: "CHICAGO", label: "Chicago (Author-Year)" },
    { value: "MLA", label: "MLA (Author-Year)" },
  ],
  Springer: [
    { value: "APA", label: "APA" },
    { value: "VancouverNumbered", label: "Vancouver (Numbered)" },
    { value: "VancouverAuthorYear", label: "Vancouver (Author-Year)" },
    { value: "Chicago", label: "Chicago" },
    { value: "Basic", label: "Basic / Name-Date" },
    { value: "MathPhysNumbered", label: "Math & Physical Sciences (Numbered)" },
    { value: "MathPhysAuthorYear", label: "Math & Physical Sciences (Author-Year)" },
    { value: "APS", label: "APS" },
    { value: "Nature", label: "Nature-style" },
  ],
};

const FALLBACK_REFERENCING_STYLES = [
  { value: "APA", label: "APA" },
  { value: "Harvard", label: "Harvard" },
  { value: "Numbered", label: "Numbered" },
  { value: "Vancouver", label: "Vancouver" },
];

// Publishers where the referencing style is genuinely fixed to one option -
// lock it automatically rather than presenting a dropdown with one choice.
const PUBLISHERS_WITH_FIXED_REFERENCING_STYLE = ["IEEE"];

/**
 * Closed-select text tone: muted while the placeholder is showing, solid once
 * a real value is chosen. Real <option> elements also set an explicit dark
 * inline color so the open dropdown does not inherit the muted tone.
 */
function selectTone(value: string) {
  return value === "" ? "text-[#94a3b8]" : "text-[#0f172a]";
}

const OPTION_SOLID = { color: "#0f172a" } as const;
const OPTION_MUTED = { color: "#94a3b8" } as const;

export default function Page2({
  data,
  update,
  onNext,
  onBack,
  unresolvedFields = [],
}: Props) {
  const availableDocumentClasses =
    DOCUMENT_CLASSES_BY_PUBLISHER[data.publisher] ?? FALLBACK_DOCUMENT_CLASSES;

  const availableReferencingStyles =
    REFERENCING_STYLES_BY_PUBLISHER[data.publisher] ?? FALLBACK_REFERENCING_STYLES;

  // Highlights are an Elsevier-specific convention - clear any leftover
  // value if the user switches away from Elsevier to a different publisher.
  useEffect(() => {
    if (data.publisher !== "Elsevier" && data.highlights !== "") {
      update({ highlights: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.publisher]);

  // Some publishers (Springer) don't offer a column-count choice at all -
  // their template is fixed single-column. Lock the value automatically
  // rather than asking the user to pick something that isn't really a choice.
  useEffect(() => {
    if (
      PUBLISHERS_WITHOUT_COLUMN_CHOICE.includes(data.publisher) &&
      data.columnLayout !== "single"
    ) {
      update({ columnLayout: "single" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.publisher]);

  // Some publishers (IEEE) only support one referencing style at all -
  // lock it automatically rather than presenting a one-item dropdown.
  useEffect(() => {
    if (PUBLISHERS_WITH_FIXED_REFERENCING_STYLE.includes(data.publisher)) {
      const onlyOption = REFERENCING_STYLES_BY_PUBLISHER[data.publisher][0].value;
      if (data.referencingStyle !== onlyOption) {
        update({ referencingStyle: onlyOption as FormData["referencingStyle"] });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.publisher]);

  // Pre-select "default" for every field that offers a Default option so the
  // user can advance faster without having to open each dropdown.
  useEffect(() => {
    const defaults: Partial<FormData> = {};
    if (data.marginTop === "") defaults.marginTop = "default";
    if (data.marginBottom === "") defaults.marginBottom = "default";
    if (data.marginLeft === "") defaults.marginLeft = "default";
    if (data.marginRight === "") defaults.marginRight = "default";
    if (data.fontFamily === "") defaults.fontFamily = "default";
    if (data.fontSizeTitle === "") defaults.fontSizeTitle = "default";
    if (data.fontSizeText === "") defaults.fontSizeText = "default";
    if (data.fontSizeFigureCaption === "") defaults.fontSizeFigureCaption = "default";
    if (data.fontSizeTableCaption === "") defaults.fontSizeTableCaption = "default";
    if (Object.keys(defaults).length > 0) {
      update(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requiredFilled =
    data.columnLayout !== "" &&
    data.lineSpacing !== "" &&
    data.marginTop !== "" &&
    data.marginBottom !== "" &&
    data.marginLeft !== "" &&
    data.marginRight !== "" &&
    data.fontFamily !== "" &&
    data.fontSizeTitle !== "" &&
    data.fontSizeText !== "" &&
    data.fontSizeFigureCaption !== "" &&
    data.fontSizeTableCaption !== "" &&
    data.referencingStyle !== "" &&
    data.keywordSeparator !== "" &&
    data.documentClass !== "" &&
    (data.publisher !== "Elsevier" || data.highlights !== "") &&
    data.orcidRequired !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiredFilled) onNext();
  };

  // Renders a small note under a field if the extractor couldn't find it
  // in the guideline text - reused wherever a single field might be flagged.
  const UnresolvedNote = ({ field }: { field: string }) =>
    unresolvedFields.includes(field) ? (
      <p className="text-xs text-[#b45309] mt-1">
        Not found in guidelines — please verify
      </p>
    ) : null;

  // For grouped fields (margins, font sizes) - lists which specific
  // sub-fields were unresolved, since those share one Field wrapper.
  const UnresolvedGroupNote = ({
    fields,
    labels,
  }: {
    fields: string[];
    labels: string[];
  }) => {
    const missing = fields
      .map((f, i) => (unresolvedFields.includes(f) ? labels[i] : null))
      .filter(Boolean);
    if (missing.length === 0) return null;
    return (
      <p className="text-xs text-[#b45309] mt-1">
        Not found in guidelines, please verify: {missing.join(", ")}
      </p>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-3xl font-bold text-[#0f172a] mb-6">
        Formatting settings
      </h1>

      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 flex flex-col gap-8">
        <Section title="Page Layout & Spacing">
          <div className="grid grid-cols-2 gap-5">
            {PUBLISHERS_WITHOUT_COLUMN_CHOICE.includes(data.publisher) ? (
              <Field label="Column Layout">
                <p className="text-sm text-[#334155] py-2">
                  Single column (fixed by {data.publisher || "this publisher"}'s template)
                </p>
              </Field>
            ) : (
              <Field label="Column Layout">
                <Select
                  value={data.columnLayout}
                  className={selectTone(data.columnLayout)}
                  onChange={(e) =>
                    update({
                      columnLayout: e.target.value as FormData["columnLayout"],
                    })
                  }
                >
                  <option value="" disabled style={OPTION_MUTED}>
                    Select layout…
                  </option>
                  <option value="double" style={OPTION_SOLID}>Double Column (IEEE Standard)</option>
                  <option value="single" style={OPTION_SOLID}>Single Column</option>
                </Select>
                <UnresolvedNote field="columnLayout" />
              </Field>
            )}
            <Field label="Line Spacing">
              <Select
                value={data.lineSpacing}
                className={selectTone(data.lineSpacing)}
                onChange={(e) =>
                  update({
                    lineSpacing: e.target.value as FormData["lineSpacing"],
                  })
                }
              >
                <option value="" disabled style={OPTION_MUTED}>
                  Select spacing…
                </option>
                <option value="single" style={OPTION_SOLID}>Single (1.0)</option>
                <option value="double" style={OPTION_SOLID}>Double (2.0)</option>
              </Select>
              <UnresolvedNote field="lineSpacing" />
            </Field>
          </div>

          <Field label="Margins (mm)">
            <div className="grid grid-cols-4 gap-4 mt-1">
              {(
                [
                  ["T", "marginTop"],
                  ["B", "marginBottom"],
                  ["L", "marginLeft"],
                  ["R", "marginRight"],
                ] as const
              ).map(([label, key]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[#64748b]">
                    {label}
                  </span>
                  <Select
                    value={data[key]}
                    className={selectTone(data[key])}
                    onChange={(e) =>
                      update({ [key]: e.target.value } as Partial<FormData>)
                    }
                  >
                    <option value="" disabled style={OPTION_MUTED}>
                      Select…
                    </option>
                    <option value="default" style={OPTION_SOLID}>Default</option>
                    <option value="15" style={OPTION_SOLID}>15 mm</option>
                    <option value="20" style={OPTION_SOLID}>20 mm</option>
                    <option value="25" style={OPTION_SOLID}>25 mm</option>
                    <option value="30" style={OPTION_SOLID}>30 mm</option>
                    <option value="40" style={OPTION_SOLID}>40 mm</option>
                    <option value="50.8" style={OPTION_SOLID}>50.8 mm</option>
                  </Select>
                </div>
              ))}
            </div>
            <UnresolvedGroupNote
              fields={["marginTop", "marginBottom", "marginLeft", "marginRight"]}
              labels={["Top", "Bottom", "Left", "Right"]}
            />
          </Field>
        </Section>

        <Section title="Typography Defaults">
          <Field label="Font Family">
            <Select
              value={data.fontFamily}
              className={selectTone(data.fontFamily)}
              onChange={(e) => update({ fontFamily: e.target.value })}
            >
              <option value="" disabled style={OPTION_MUTED}>
                Select font…
              </option>
              <option value="default" style={OPTION_SOLID}>Default (publisher recommended)</option>
              <option value="Times New Roman" style={OPTION_SOLID}>Times New Roman</option>
              <option value="Arial" style={OPTION_SOLID}>Arial</option>
              <option value="Computer Modern" style={OPTION_SOLID}>Computer Modern</option>
            </Select>
            <UnresolvedNote field="fontFamily" />
          </Field>

          <Field label="Font Sizes (pt)">
            <div className="grid grid-cols-4 gap-4 mt-1">
              {(
                [
                  ["Title", "fontSizeTitle"],
                  ["Text", "fontSizeText"],
                  ["Fig Caption", "fontSizeFigureCaption"],
                  ["Tbl Caption", "fontSizeTableCaption"],
                ] as const
              ).map(([label, key]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[#64748b]">
                    {label}
                  </span>
                  <Select
                    value={data[key]}
                    className={selectTone(data[key])}
                    onChange={(e) =>
                      update({ [key]: e.target.value } as Partial<FormData>)
                    }
                  >
                    <option value="" disabled style={OPTION_MUTED}>
                      Select…
                    </option>
                    <option value="default" style={OPTION_SOLID}>Default</option>
                    <option value="8" style={OPTION_SOLID}>8 pt</option>
                    <option value="9" style={OPTION_SOLID}>9 pt</option>
                    <option value="10" style={OPTION_SOLID}>10 pt</option>
                    <option value="11" style={OPTION_SOLID}>11 pt</option>
                    <option value="12" style={OPTION_SOLID}>12 pt</option>
                    <option value="14" style={OPTION_SOLID}>14 pt</option>
                    <option value="16" style={OPTION_SOLID}>16 pt</option>
                    <option value="18" style={OPTION_SOLID}>18 pt</option>
                    <option value="20" style={OPTION_SOLID}>20 pt</option>
                    <option value="24" style={OPTION_SOLID}>24 pt</option>
                  </Select>
                </div>
              ))}
            </div>
            <UnresolvedGroupNote
              fields={[
                "fontSizeTitle",
                "fontSizeText",
                "fontSizeFigureCaption",
                "fontSizeTableCaption",
              ]}
              labels={["Title", "Text", "Fig Caption", "Tbl Caption"]}
            />
          </Field>
        </Section>

        <Section title="Referencing & Content">
          <div className="grid grid-cols-2 gap-5">
            {PUBLISHERS_WITH_FIXED_REFERENCING_STYLE.includes(data.publisher) ? (
              <Field label="Referencing Style">
                <p className="text-sm text-[#334155] py-2">
                  {availableReferencingStyles[0].label} (fixed by {data.publisher}'s template)
                </p>
              </Field>
            ) : (
              <Field label="Referencing Style">
                <Select
                  value={data.referencingStyle}
                  className={selectTone(data.referencingStyle)}
                  onChange={(e) =>
                    update({
                      referencingStyle: e.target
                        .value as FormData["referencingStyle"],
                    })
                  }
                >
                  <option value="" disabled style={OPTION_MUTED}>
                    Select style…
                  </option>
                  {availableReferencingStyles.map((style) => (
                    <option key={style.value} value={style.value} style={OPTION_SOLID}>
                      {style.label}
                    </option>
                  ))}
                </Select>
                <UnresolvedNote field="referencingStyle" />
              </Field>
            )}
            <Field label="Keyword Separator">
              <Select
                value={data.keywordSeparator}
                className={selectTone(data.keywordSeparator)}
                onChange={(e) =>
                  update({
                    keywordSeparator: e.target
                      .value as FormData["keywordSeparator"],
                  })
                }
              >
                <option value="" disabled style={OPTION_MUTED}>
                  Select separator…
                </option>
                <option value="semicolon" style={OPTION_SOLID}>Semicolon (;)</option>
                <option value="comma" style={OPTION_SOLID}>Comma (,)</option>
              </Select>
              <UnresolvedNote field="keywordSeparator" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Document Class">
              <Select
                value={data.documentClass}
                className={selectTone(data.documentClass)}
                onChange={(e) => update({ documentClass: e.target.value })}
              >
                <option value="" disabled style={OPTION_MUTED}>
                  Select class…
                </option>
                {availableDocumentClasses.map((cls) => (
                  <option key={cls.value} value={cls.value} style={OPTION_SOLID}>
                    {cls.label}
                  </option>
                ))}
              </Select>
              <UnresolvedNote field="documentClass" />
            </Field>
            {data.publisher === "Elsevier" && (
              <Field label="Highlights Required">
                <Select
                  value={data.highlights}
                  className={selectTone(data.highlights)}
                  onChange={(e) =>
                    update({
                      highlights: e.target.value as FormData["highlights"],
                    })
                  }
                >
                  <option value="" disabled style={OPTION_MUTED}>
                    Select…
                  </option>
                  <option value="no" style={OPTION_SOLID}>No</option>
                  <option value="yes" style={OPTION_SOLID}>Yes</option>
                </Select>
                <UnresolvedNote field="highlights" />
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="ORCID Required">
              <Select
                value={data.orcidRequired}
                className={selectTone(data.orcidRequired)}
                onChange={(e) =>
                  update({
                    orcidRequired: e.target
                      .value as FormData["orcidRequired"],
                  })
                }
              >
                <option value="" disabled style={OPTION_MUTED}>
                  Select…
                </option>
                <option value="yes" style={OPTION_SOLID}>Yes</option>
                <option value="no" style={OPTION_SOLID}>No</option>
              </Select>
              <UnresolvedNote field="orcidRequired" />
            </Field>
          </div>
        </Section>

        <div className="h-px bg-[#e2e8f0]" />

        <div className="flex items-center justify-between">
          <NavButton variant="ghost" type="button" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11 7H3M7 11L3 7l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Publisher
          </NavButton>

          <NavButton type="submit" disabled={!requiredFilled}>
            Continue
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7h8M7 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </NavButton>
        </div>
      </div>

      <p className="text-center text-sm text-[#94a3b8] mt-4">
        Settings are automatically saved as you edit.
      </p>
    </form>
  );
}
