type OutfitBuilderHeaderProps = {
  name: string;
  onNameChange: (value: string) => void;
  selectedCount: number;
  slotCount?: number;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
  hideSaveOnMobile?: boolean;
};

export default function OutfitBuilderHeader({
  name,
  onNameChange,
  selectedCount,
  slotCount = 4,
  saving,
  canSave,
  onSave,
  hideSaveOnMobile = false,
}: OutfitBuilderHeaderProps) {
  return (
    <header className="mb-4 rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-xl font-semibold text-indigo-900 sm:text-2xl">
              Build an Outfit
            </h2>
            <span className="text-xs font-medium text-indigo-700/80 sm:text-sm">
              {selectedCount} of {slotCount} selected
            </span>
          </div>
          <p className="mt-1 text-sm text-indigo-700/75">
            Create a look manually or let Almaari style it for you.
          </p>
        </div>

        <div
          className={`flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:max-w-xl ${
            hideSaveOnMobile ? "hidden md:flex" : ""
          }`}
        >
          <input
            id="create-outfit-form-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Outfit name (optional)"
            className="h-10 w-full min-w-0 flex-1 rounded-xl border border-indigo-300 bg-white px-3 text-sm text-indigo-900 placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            type="button"
            disabled={saving || !canSave}
            onClick={onSave}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Outfit"}
          </button>
        </div>
      </div>
    </header>
  );
}
