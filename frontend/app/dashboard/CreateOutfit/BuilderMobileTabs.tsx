export type BuilderTab = "clothes" | "preview" | "ai";

const TABS: { id: BuilderTab; label: string }[] = [
  { id: "clothes", label: "Clothes" },
  { id: "preview", label: "Preview" },
  { id: "ai", label: "AI Stylist" },
];

type BuilderMobileTabsProps = {
  activeTab: BuilderTab;
  onChange: (tab: BuilderTab) => void;
};

export default function BuilderMobileTabs({
  activeTab,
  onChange,
}: BuilderMobileTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Outfit builder sections"
      className="sticky top-0 z-20 -mx-4 mb-3 border-b border-indigo-200/80 bg-indigo-100/95 px-4 py-2 backdrop-blur md:hidden"
    >
      <div className="flex rounded-xl border border-indigo-200 bg-white/80 p-1 shadow-sm">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`builder-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`builder-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`min-h-10 flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-indigo-800 hover:bg-indigo-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
