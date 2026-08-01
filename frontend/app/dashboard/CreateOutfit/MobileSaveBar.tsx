"use client";

import { Save } from "lucide-react";

type MobileSaveBarProps = {
  selectedCount: number;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
  /** Name + Save only on the builder preview slide. */
  showSaveControls?: boolean;
  name?: string;
  onNameChange?: (value: string) => void;
};

export default function MobileSaveBar({
  saving,
  canSave,
  onSave,
  showSaveControls = true,
  name,
  onNameChange,
}: MobileSaveBarProps) {
  if (!showSaveControls) return null;

  return (
    <div className="fixed inset-x-0 bottom-[4.25rem] z-30 border-t border-indigo-200 bg-white/95 px-3 py-2 shadow-[0_-4px_16px_rgba(79,70,229,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        {onNameChange ? (
          <input
            type="text"
            value={name ?? ""}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Outfit name (optional)"
            aria-label="Outfit name (optional)"
            className="h-10 min-w-0 flex-1 rounded-xl border border-indigo-300 bg-white px-3 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        <button
          id="mobile-save-outfit-btn"
          type="button"
          disabled={saving || !canSave}
          onClick={onSave}
          aria-label={saving ? "Saving outfit" : "Save outfit"}
          title={saving ? "Saving…" : "Save outfit"}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className={`h-5 w-5 ${saving ? "animate-pulse" : ""}`} aria-hidden />
        </button>
      </div>
    </div>
  );
}
