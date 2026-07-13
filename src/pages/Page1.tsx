import type React from "react";
import type { FormData } from "../App";
import { Field, Select, Textarea, Section, NavButton } from "../components/FormField";

interface Props {
  data: FormData;
  update: (updates: Partial<FormData>) => void;
  onNext: () => void;
}

export default function Page1({ data, update, onNext }: Props) {
  const requiredFilled = data.publisher !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiredFilled) onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-3xl font-bold text-[#0f172a] mb-2 text-center">
        New submission
      </h1>
      <p className="text-center text-[#64748b] mb-6">
        Choose the target publisher to load its formatting rules.
      </p>

      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 flex flex-col gap-6">
        <Field label="Publisher" required>
          <Select
            value={data.publisher}
            onChange={(e) => update({ publisher: e.target.value })}
          >
            <option value="">Select a publisher…</option>
            <option value="IEEE">IEEE</option>
            <option value="Elsevier">Elsevier</option>
            <option value="Springer">Springer</option>
            <option value="ACM">ACM</option>
          </Select>
        </Field>

        <div className="h-px bg-[#e2e8f0]" />

        <Section title="Smart Guidelines">
          <Field
            label="Paste Author Guidelines"
            hint="Our AI will automatically fill the technical specs based on the text provided."
          >
            <Textarea
              className="min-h-[140px]"
              placeholder="Paste the text from the publisher's website here…"
              value={data.authorGuidelines}
              onChange={(e) => update({ authorGuidelines: e.target.value })}
            />
          </Field>
        </Section>

        <div className="h-px bg-[#e2e8f0]" />

        <div className="flex items-center justify-end">
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
