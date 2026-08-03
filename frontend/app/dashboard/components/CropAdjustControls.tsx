"use client";

import { normalizeCropRotation } from "../../utils/clientImageCrop";
import CropRotationDial from "./CropRotationDial";

type CropAdjustControlsProps = {
  zoom: number;
  minZoom: number;
  rotation: number;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  disabled?: boolean;
};

export default function CropAdjustControls({
  zoom,
  minZoom,
  rotation,
  onZoomChange,
  onRotationChange,
  disabled = false,
}: CropAdjustControlsProps) {
  const rotationIsDefault = normalizeCropRotation(rotation) === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <CropRotationDial
            compact
            rotation={rotation}
            onRotationChange={onRotationChange}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => onRotationChange(0)}
            disabled={disabled || rotationIsDefault}
            aria-label="Reset rotation"
            className="inline-flex min-h-9 shrink-0 items-center rounded-almaari border border-almaari-border bg-almaari-surface-raised px-2.5 text-xs font-semibold text-almaari-ink transition hover:bg-almaari-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-almaari-accent/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <input
            type="range"
            min={minZoom}
            max={3}
            step="0.01"
            value={zoom}
            disabled={disabled}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="min-h-8 w-full touch-manipulation accent-almaari-accent disabled:opacity-50"
            aria-label="Zoom image for crop"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-almaari-muted">
        <span>Zoom out</span>
        <span>Drag image to reposition</span>
        <span>Zoom in</span>
      </div>
    </div>
  );
}
