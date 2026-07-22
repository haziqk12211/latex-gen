import type React from "react";
import type { FormData } from "../App";
import { Field, Select, MiniInput, Section, NavButton } from "../components/FormField";

interface Props {
  data: FormData;
  update: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  unresolvedFields?: string[];
}

const DOCUMENT_CLASSES_BY_PUBLISHER: Record<string, { value: string; label: string }[]> = {
  IEEE: [{ value: "IEEEtran.cls", label: "IEEEtran.cls" }],
  ACM: [{ value: "acmart.cls", label: "acmart.cls" }],
  Elsevier: [{ value: "elsarticle.cls", label: "elsarticle.cls" }],
  Springer: [{ value: "sn-jnl.cls", label: "sn-jnl.cls" }],
  Wiley: [{ value: "WileyNJDv5", label: "WileyNJDv5" }],
};

const FALLBACK_DOCUMENT_CLASSES = [
  { value: "article.cls", label: "article.cls (generic)" },
];

export default function Page2({
  data,
  update,
  onNext,
  onBack,
  unresolvedFields = [],
}: Props) {
  const availableDocumentClasses =
    DOCUMENT_CLASSES_BY_PUBLISHER[data.publisher] ?? FALLBACK_DOCUMENT_CLASSES;

  // Column layout options per publisher
  const getColumnOptions = () => {
    if (data.publisher === "IEEE") {
      return [
        { value: "double", label: "Double Column (IEEE Standard)" },
        { value: "single", label: "Single Column" },
      ];
    }
    // Other publishers only support double column by default
    return [{ value: "double", label: "Double Column (Default)" }];
  };

  const columnOptions = getColumnOptions();

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
    data.highlights !== "" &&
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
            <Field label="Column Layout">
              <Select
                value={data.columnLayout}
                onChange={(e) =>
                  update({
                    columnLayout: e.target.value as FormData["columnLayout"],
                  })
                }
              >
                <option value="">Select layout…</option>
                {columnOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <UnresolvedNote field="columnLayout" />
            </Field>
            <Field label="Line Spacing">
              <Select
                value={data.lineSpacing}
                onChange={(e) =>
                  update({
                    lineSpacing: e.target.value as FormData["lineSpacing"],
                  })
                }
              >
                <option value="">Select spacing…</option>
                <option value="single">Single (1.0)</option>
                <option value="double">Double (2.0)</option>
              </Select>
              <UnresolvedNote field="lineSpacing" />
            </Field>
          </div>

          <Field label="Margins (mm)">
            <div className="grid grid-cols-4 gap-4 mt-1">
              <MiniInput
                label="T"
                type="number"
                min="0"
                value={data.marginTop}
                onChange={(e) => update({ marginTop: e.target.value })}
              />
              <MiniInput
                label="B"
                type="number"
                min="0"
                value={data.marginBottom}
                onChange={(e) => update({ marginBottom: e.target.value })}
              />
              <MiniInput
                label="L"
                type="number"
                min="0"
                value={data.marginLeft}
                onChange={(e) => update({ marginLeft: e.target.value })}
              />
              <MiniInput
                label="R"
                type="number"
                min="0"
                value={data.marginRight}
                onChange={(e) => update({ marginRight: e.target.value })}
              />
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
              onChange={(e) => update({ fontFamily: e.target.value })}
            >
              <option value="">Select font…</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Arial">Arial</option>
              <option value="Computer Modern">Computer Modern</option>
            </Select>
            <UnresolvedNote field="fontFamily" />
          </Field>

          <Field label="Font Sizes (pt)">
            <div className="grid grid-cols-4 gap-4 mt-1">
              <MiniInput
                label="Title"
                type="number"
                min="1"
                value={data.fontSizeTitle}
                onChange={(e) => update({ fontSizeTitle: e.target.value })}
              />
              <MiniInput
                label="Text"
                type="number"
                min="1"
                value={data.fontSizeText}
                onChange={(e) => update({ fontSizeText: e.target.value })}
              />
              <MiniInput
                label="Fig Caption"
                type="number"
                min="1"
                value={data.fontSizeFigureCaption}
                onChange={(e) =>
                  update({ fontSizeFigureCaption: e.target.value })
                }
              />
              <MiniInput
                label="Tbl Caption"
                type="number"
                min="1"
                value={data.fontSizeTableCaption}
                onChange={(e) =>
                  update({ fontSizeTableCaption: e.target.value })
                }
              />
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
            <Field label="Referencing Style">
              <Select
                value={data.referencingStyle}
                onChange={(e) =>
                  update({
                    referencingStyle: e.target
                      .value as FormData["referencingStyle"],
                  })
                }
              >
                <option value="">Select style…</option>
                <option value="IEEE">IEEE</option>
                <option value="APA">APA</option>
                <option value="Harvard">Harvard</option>
                <option value="Vancouver">Vancouver</option>
              </Select>
              <UnresolvedNote field="referencingStyle" />
            </Field>
            <Field label="Keyword Separator">
              <Select
                value={data.keywordSeparator}
                onChange={(e) =>
                  update({
                    keywordSeparator: e.target
                      .value as FormData["keywordSeparator"],
                  })
                }
              >
                <option value="">Select separator…</option>
                <option value="semicolon">Semicolon (;)</option>
                <option value="comma">Comma (,)</option>
              </Select>
              <UnresolvedNote field="keywordSeparator" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Document Class">
              <Select
                value={data.documentClass}
                onChange={(e) => update({ documentClass: e.target.value })}
              >
                <option value="">Select class…</option>
                {availableDocumentClasses.map((cls) => (
                  <option key={cls.value} value={cls.value}>
                    {cls.label}
                  </option>
                ))}
              </Select>
              <UnresolvedNote field="documentClass" />
            </Field>
            <Field label="Highlights Required">
              <Select
                value={data.highlights}
                onChange={(e) =>
                  update({
                    highlights: e.target.value as FormData["highlights"],
                  })
                }
              >
                <option value="">Select…</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
              <UnresolvedNote field="highlights" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="ORCID Required">
              <Select
                value={data.orcidRequired}
                onChange={(e) =>
                  update({
                    orcidRequired: e.target
                      .value as FormData["orcidRequired"],
                  })
                }
              >
                <option value="">Select…</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
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