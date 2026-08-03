"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Area, Point } from "react-easy-crop";
import ClothingCropSurface from "./ClothingCropSurface";
import CropAdjustControls from "./CropAdjustControls";
import { ABSOLUTE_MIN_USER_ZOOM, CropRotation } from "../../utils/clientImageCrop";
import { getCroppedClothingBlob } from "../../utils/getCroppedClothingBlob";
import {
  CROP_OVERLAY_OPTIONS,
  cropOverlayFromClothingType,
  CropOverlayId,
} from "../../utils/cropOverlays";

type ClothingImageCropEditorProps = {
  imageSrc: string;
  clothingType?: string;
  saving?: boolean;
  onCancel: () => void;
  onSave: (blob: Blob) => Promise<void>;
};

export default function ClothingImageCropEditor({
  imageSrc,
  clothingType,
  saving = false,
  onCancel,
  onSave,
}: ClothingImageCropEditorProps) {
  const previewUrlRef = useRef<string | null>(null);
  const croppedAreaPixelsRef = useRef<Area | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<CropRotation>(0);
  const [cropReady, setCropReady] = useState(false);
  const [cropOverlay, setCropOverlay] = useState<CropOverlayId>(() =>
    cropOverlayFromClothingType(clothingType ?? "T-shirt"),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    let cancelled = false;

    const revokePreviewUrl = () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };

    (async () => {
      setLoading(true);
      setLoadError(null);
      revokePreviewUrl();
      croppedAreaPixelsRef.current = null;
      setCropReady(false);

      try {
        const response = await fetch(imageSrc);
        if (!response.ok) {
          throw new Error("Could not load image");
        }
        const blob = await response.blob();
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreview(url);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load image",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      revokePreviewUrl();
    };
  }, [imageSrc]);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
  }, [rotation]);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    croppedAreaPixelsRef.current = pixels;
    setCropReady(true);
  }, []);

  const handleSave = async () => {
    if (!preview) return;

    const pixels = croppedAreaPixelsRef.current;
    if (!pixels) {
      setLoadError("Could not save crop. Try adjusting the image again.");
      return;
    }

    const framed = await getCroppedClothingBlob(preview, pixels, rotation);
    if (!framed) {
      setLoadError("Could not save crop. Try adjusting the image again.");
      return;
    }

    await onSave(framed);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[101] flex flex-col bg-almaari-bg safe-pt safe-pb"
      role="dialog"
      aria-modal="true"
      aria-label="Adjust image"
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-almaari-border px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-sm font-semibold text-almaari-muted hover:text-almaari-ink disabled:opacity-50"
        >
          Cancel
        </button>
        <h2 className="font-display text-lg text-almaari-ink">Adjust image</h2>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loading || !preview || !cropReady}
          className="text-sm font-semibold text-almaari-accent hover:text-almaari-accent-strong disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <p className="text-sm text-almaari-muted">
          Drag to reposition, use the rotation dial and zoom slider. Your item stays on a transparent
          background.
        </p>

        {loadError ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {loadError}
          </p>
        ) : null}

        <div className="relative mx-auto flex h-[min(280px,45vh)] w-full max-w-sm items-center justify-center overflow-hidden rounded-almaari-lg border border-almaari-border bg-almaari-warm">
          {loading ? (
            <p className="text-sm text-almaari-muted">Loading image…</p>
          ) : preview ? (
            <ClothingCropSurface
              imageUrl={preview}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              minZoom={ABSOLUTE_MIN_USER_ZOOM}
              cropOverlay={cropOverlay}
              disabled={saving || loading}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={handleCropComplete}
            />
          ) : null}
        </div>

        <label htmlFor="edit-crop-overlay-select" className="text-sm font-medium text-almaari-ink">
          Crop guide
        </label>
        <select
          id="edit-crop-overlay-select"
          value={cropOverlay}
          onChange={(e) => setCropOverlay(e.target.value as CropOverlayId)}
          className="min-h-11 w-full rounded-almaari border border-almaari-border bg-almaari-surface-raised px-3 text-sm text-almaari-ink focus:outline-none focus:ring-2 focus:ring-almaari-accent/30"
        >
          {CROP_OVERLAY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        {preview ? (
          <CropAdjustControls
            zoom={zoom}
            minZoom={ABSOLUTE_MIN_USER_ZOOM}
            rotation={rotation}
            disabled={saving || loading}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
