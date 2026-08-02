"use client";

import CropOverlayGuide from "../../dashboard/addClothes/CropOverlayGuide";
import {
  CROP_OVERLAY_OPTIONS,
  type CropOverlayId,
} from "../../utils/cropOverlays";

type CameraOverlayProps = {
  cropOverlay: CropOverlayId;
  onClose: () => void;
  onFlipCamera?: () => void;
  showFlip?: boolean;
};

const overlayHint = (overlay: CropOverlayId): string => {
  if (overlay === "none") {
    return "Fit one clothing item inside the square frame";
  }
  const label =
    CROP_OVERLAY_OPTIONS.find((option) => option.id === overlay)?.label ??
    "item";
  return `Align the ${label.toLowerCase()} with the guide`;
};

/** HTML overlay above live camera — not captured in the photo. */
export default function CameraOverlay({
  cropOverlay,
  onClose,
  onFlipCamera,
  showFlip = false,
}: CameraOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col"
      aria-hidden={false}
    >
      <div className="pointer-events-auto flex items-start justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,var(--safe-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <span aria-hidden className="text-xl leading-none">
            ×
          </span>
        </button>

        <div className="flex flex-col items-center pt-1">
          <p className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
            Add clothing
          </p>
        </div>

        {showFlip && onFlipCamera ? (
          <button
            type="button"
            onClick={onFlipCamera}
            aria-label="Switch camera"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/25 bg-black/35 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            Flip
          </button>
        ) : (
          <div className="min-h-11 min-w-11" aria-hidden />
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center ">
        <div className="relative h-full w-full">
          <div className="absolute inset-3 rounded-[1.75rem] border-2 border-dashed " />

          <span className="absolute left-3 top-3 h-8 w-8 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white" />
          <span className="absolute right-3 top-3 h-8 w-8 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white" />
          <span className="absolute bottom-3 left-3 h-8 w-8 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white" />
          <span className="absolute bottom-3 right-3 h-8 w-8 rounded-br-2xl border-b-[3px] border-r-[3px] border-white" />

          <div className="absolute inset-3">
            <CropOverlayGuide overlay={cropOverlay} variant="camera" />
          </div>

          <div className="absolute inset-x-0 -bottom-16 px-2 text-center">
            <p className="font-display text-lg text-white drop-shadow-sm">
              {overlayHint(cropOverlay)}
            </p>
            <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
              Use a plain background and avoid shadows
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
