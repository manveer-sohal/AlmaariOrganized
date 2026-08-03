"use client";

import { useRef } from "react";
import { normalizeCropRotation } from "../../utils/clientImageCrop";

type CropRotationDialProps = {
  rotation: number;
  onRotationChange: (rotation: number) => void;
  disabled?: boolean;
  /** Compact dial for inline layout beside zoom slider. */
  compact?: boolean;
};

function pointerAngle(clientX: number, clientY: number, rect: DOMRect): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rad = Math.atan2(clientY - cy, clientX - cx);
  return normalizeCropRotation((rad * 180) / Math.PI + 90);
}

export default function CropRotationDial({
  rotation,
  onRotationChange,
  disabled = false,
  compact = false,
}: CropRotationDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startRotationRef = useRef(0);
  const startAngleRef = useRef(0);

  const displayRotation = normalizeCropRotation(rotation);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;

    draggingRef.current = true;
    startRotationRef.current = rotation;
    startAngleRef.current = pointerAngle(event.clientX, event.clientY, rect);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || disabled) return;
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentAngle = pointerAngle(event.clientX, event.clientY, rect);
    const delta = currentAngle - startAngleRef.current;
    onRotationChange(normalizeCropRotation(startRotationRef.current + delta));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const nudge = (delta: number) => {
    onRotationChange(normalizeCropRotation(rotation + delta));
  };

  const dialSize = compact ? "h-11 w-11" : "h-14 w-14";

  return (
    <div className={`flex items-center ${compact ? "flex-col gap-1" : "gap-3"}`}>
      <div
        ref={dialRef}
        role="slider"
        aria-valuemin={-180}
        aria-valuemax={180}
        aria-valuenow={displayRotation}
        aria-label={`Rotate image, ${displayRotation} degrees`}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(event) => {
          if (disabled) return;
          const step = event.shiftKey ? 0.1 : 1;
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            nudge(-step);
          }
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            nudge(step);
          }
        }}
        className={`relative ${dialSize} shrink-0 touch-none rounded-full border-2 border-almaari-border bg-almaari-surface-raised shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-almaari-accent/30 ${
          disabled
            ? "opacity-50"
            : "cursor-grab active:cursor-grabbing hover:border-almaari-accent/40"
        }`}
      >
        <div className="absolute left-1/2 top-1.5 h-1 w-1 -translate-x-1/2 rounded-full bg-almaari-muted/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute bottom-1/2 left-1/2 h-[38%] w-0.5 -ml-px origin-bottom rounded-full bg-almaari-accent"
            style={{ transform: `rotate(${displayRotation}deg)` }}
          />
        </div>
      </div>

      {compact ? (
        <p className="text-[11px] font-semibold tabular-nums text-almaari-muted">
          {displayRotation}°
        </p>
      ) : (
        <div className="min-w-[4.5rem]">
          <p className="text-xs font-medium text-almaari-muted">Rotation</p>
          <p className="text-sm font-semibold tabular-nums text-almaari-ink">
            {displayRotation}°
          </p>
        </div>
      )}
    </div>
  );
}
