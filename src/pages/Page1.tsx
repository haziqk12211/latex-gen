import { useState } from "react";
import {
  LayoutGrid,
  FileText,
  Settings as SettingsIcon,
  HelpCircle,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function AuthorGuidelinesScreen1() {
  const [publisher, setPublisher] = useState("");
  const [guidelines, setGuidelines] = useState("");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 shrink-0">
        <h1 className="text-xl font-bold text-[#0f172a]">
          Author Guidelines Form
        </h1>

        <nav className="flex items-center gap-8">
          <a
            href="#"
            className="text-sm font-medium text-[#0f766e] border-b-2 border-[#0f766e] pb-5 -mb-5"
          >
            Publisher
          </a>
          <a href="#" className="text-sm font-medium text-[#475569]">
            Manuscript
          </a>
          <a href="#" className="text-sm font-medium text-[#475569]">
            Settings
          </a>

          <div className="flex items-center gap-4 pl-4 border-l border-[#e2e8f0]">
            <button
              aria-label="Help"
              className="text-[#94a3b8] hover:text-[#475569]"
            >
              <HelpCircle size={20} strokeWidth={1.75} />
            </button>
            <button
              aria-label="Settings"
              className="text-[#94a3b8] hover:text-[#475569]"
            >
              <SettingsIcon size={20} strokeWidth={1.75} />
            </button>
            <img
              src="https://i.pravatar.cc/64"
              alt="User avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        </nav>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-[#f8fafc] border-r border-[#e2e8f0] flex flex-col justify-between px-6 py-6 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] mb-1">
              Formatting Progress
            </h2>
            <p className="text-sm text-[#94a3b8] mb-6">Step 1 of 3</p>

            <nav className="flex flex-col gap-1">
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-[#dbeafe] text-[#0f766e] font-medium text-sm"
              >
                <LayoutGrid size={18} strokeWidth={1.75} />
                Publisher
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#475569] text-sm"
              >
                <FileText size={18} strokeWidth={1.75} />
                Manuscript
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#475569] text-sm"
              >
                <SettingsIcon size={18} strokeWidth={1.75} />
                Settings
              </a>
            </nav>
          </div>

          <button className="w-full bg-[#0f766e] text-white font-medium text-sm rounded-lg py-3 hover:bg-[#0d6b63] transition-colors">
            Save Draft
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center py-12 px-6">
          {/* Step progress */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0f766e]" />
              <div className="w-16 h-px bg-[#e2e8f0]" />
              <div className="w-3 h-3 rounded-full border-2 border-[#e2e8f0] bg-white" />
              <div className="w-16 h-px bg-[#e2e8f0]" />
              <div className="w-3 h-3 rounded-full border-2 border-[#e2e8f0] bg-white" />
            </div>
            <p className="text-xs font-medium text-[#94a3b8] tracking-wide mt-2">
              STEP 1 OF 3
            </p>
          </div>

          {/* Card */}
          <div className="w-full max-w-2xl bg-white border border-[#e2e8f0] rounded-2xl p-10">
            <h2 className="text-3xl font-bold text-[#0f172a] text-center mb-2">
              New submission
            </h2>
            <p className="text-center text-[#64748b] mb-8">
              Choose the target publisher to load its formatting rules.
            </p>

            <label className="block text-xs font-semibold tracking-wide text-[#475569] mb-2">
              PUBLISHER
            </label>
            <div className="relative mb-6">
              <select
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[#cbd5e1] px-4 py-3 text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
              >
                <option value="">Select a publisher…</option>
                <option value="IEEE">IEEE</option>
                <option value="Elsevier">Elsevier</option>
                <option value="Springer">Springer</option>
                <option value="ACM">ACM</option>
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]"
              />
            </div>

            <div className="h-px bg-[#e2e8f0] mb-6" />

            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-[#0f766e]" />
              <span className="font-bold text-[#0f766e]">
                Smart Guidelines
              </span>
            </div>

            <label className="block text-xs font-semibold tracking-wide text-[#475569] mb-2">
              PASTE AUTHOR GUIDELINES
            </label>
            <textarea
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="Paste the text from the publisher's website here…"
              className="w-full min-h-[140px] rounded-lg border border-[#cbd5e1] p-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 mb-3"
            />
            <p className="text-sm text-[#94a3b8] mb-6">
              Our AI will automatically fill the technical specs based on the
              text provided.
            </p>

            <button
              disabled={!publisher}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f766e] text-white font-semibold py-3.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0d6b63] transition-colors"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
