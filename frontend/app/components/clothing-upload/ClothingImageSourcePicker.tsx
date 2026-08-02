"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, ImagePlus } from "lucide-react";
import {
  cropOverlayFromClothingType,
  type CropOverlayId,
} from "../../utils/cropOverlays";
import CameraCapture from "./CameraCapture";

type ClothingImageSourcePickerProps = {
  onFileSelected: (file: File, cropOverlay?: CropOverlayId) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  id?: string;
  className?: string;
  clothingType?: string;
};

export default function ClothingImageSourcePicker({
  onFileSelected,
  fileInputRef,
  id = "add-picture-btn",
  className = "",
  clothingType,
}: ClothingImageSourcePickerProps) {
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const openGallery = () => {
    (fileInputRef.current ?? galleryInputRef.current)?.click();
  };

  return (
    <>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onFileSelected(picked);
          e.target.value = "";
        }}
      />

      <div
        id={id}
        className={`flex min-h-[200px] w-full flex-col overflow-hidden rounded-almaari-lg border-2 border-dashed border-almaari-border/80 bg-almaari-warm/60 sm:min-h-[240px] md:min-h-[280px] ${className}`}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-almaari-accent-soft text-almaari-accent">
            <ImagePlus className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <p className="font-display text-base text-almaari-ink">
              Add a clothing photo
            </p>
            <p className="mt-1 text-sm text-almaari-muted">
              One item on a plain background works best.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 border-t border-almaari-border/50 bg-almaari-surface-raised/80 p-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-almaari bg-almaari-accent px-4 text-sm font-semibold text-white transition hover:bg-almaari-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-almaari-accent/40"
          >
            <Camera className="h-4 w-4" aria-hidden />
            Take photo
          </button>

          <button
            type="button"
            onClick={openGallery}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-almaari border border-almaari-border bg-white px-4 text-sm font-semibold text-almaari-ink transition hover:bg-almaari-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-almaari-accent/40"
          >
            <ImageIcon className="h-4 w-4" aria-hidden />
            Choose from gallery
          </button>
        </div>
      </div>

      {cameraOpen ? (
        <CameraCapture
          initialCropOverlay={cropOverlayFromClothingType(clothingType)}
          onCapture={(file, cropOverlay) => onFileSelected(file, cropOverlay)}
          onClose={() => setCameraOpen(false)}
          onOpenGallery={openGallery}
        />
      ) : null}
    </>
  );
}
