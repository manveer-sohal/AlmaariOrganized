type MobileSaveBarProps = {
  selectedCount: number;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
};

export default function MobileSaveBar({
  selectedCount,
  saving,
  canSave,
  onSave,
}: MobileSaveBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-indigo-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(79,70,229,0.08)] backdrop-blur md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <p className="text-sm font-medium text-indigo-800">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </p>
        <button
          type="button"
          disabled={saving || !canSave}
          onClick={onSave}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Outfit"}
        </button>
      </div>
    </div>
  );
}
