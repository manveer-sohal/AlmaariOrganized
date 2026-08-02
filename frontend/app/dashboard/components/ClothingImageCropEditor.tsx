"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CropOverlayGuide from "../addClothes/CropOverlayGuide";
import {
  CROP_OUTPUT_SIZE,
  clampCropOffset,
  drawSquareCrop,
  frameImageBlob,
  getDrawScale,
  getMinUserZoom,
} from "../../utils/clientImageCrop";
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const workingBlobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cropOverlay, setCropOverlay] = useState<CropOverlayId>(() =>
    cropOverlayFromClothingType(clothingType ?? "T-shirt"),
  );
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const drawCropPreview = useCallback(
    (
      src: string,
      zoomLevel: number,
      drawOffset: { x: number; y: number },
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let img = imageRef.current;

      if (!img || img.src !== src) {
        img = new window.Image();
        img.src = src;
        imageRef.current = img;
      }

      if (!img.complete || img.naturalWidth === 0) {
        img.onload = () => {
          const nextMin = getMinUserZoom(img!.naturalWidth, img!.naturalHeight);
          setMinZoom(nextMin);
          setZoom((prev) => Math.max(nextMin, prev));
          drawCropPreview(src, Math.max(nextMin, zoomLevel), drawOffset);
        };
        return;
      }

      canvas.width = CROP_OUTPUT_SIZE;
      canvas.height = CROP_OUTPUT_SIZE;

      const nextMin = getMinUserZoom(img.naturalWidth, img.naturalHeight);
      const clampedZoom = Math.max(nextMin, zoomLevel);
      const scale = getDrawScale(
        img.naturalWidth,
        img.naturalHeight,
        clampedZoom,
      );
      const clampedOffset = clampCropOffset(
        drawOffset.x,
        drawOffset.y,
        img.naturalWidth,
        img.naturalHeight,
        scale,
      );

      drawSquareCrop(ctx, img, clampedZoom, clampedOffset, CROP_OUTPUT_SIZE, "transparent");
    },
    [],
  );

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
      imageRef.current = null;
      workingBlobRef.current = null;

      try {
        const response = await fetch(imageSrc);
        if (!response.ok) {
          throw new Error("Could not load image");
        }
        const blob = await response.blob();
        if (cancelled) return;

        workingBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        const initialOffset = { x: 0, y: 0 };
        setPreview(url);
        setZoom(1);
        setMinZoom(0.2);
        setOffset(initialOffset);
        drawCropPreview(url, 1, initialOffset);
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
  }, [imageSrc, drawCropPreview]);

  useEffect(() => {
    if (preview) {
      drawCropPreview(preview, zoom, offset);
    }
  }, [preview, zoom, offset, drawCropPreview]);

  const handlePointerMove = (dx: number, dy: number) => {
    if (!preview || !imageRef.current) return;

    const img = imageRef.current;
    const scale = getDrawScale(img.naturalWidth, img.naturalHeight, zoom);

    setOffset((prev) =>
      clampCropOffset(
        prev.x + dx,
        prev.y + dy,
        img.naturalWidth,
        img.naturalHeight,
        scale,
      ),
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    handlePointerMove(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    isDraggingRef.current = true;
    lastPosRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - lastPosRef.current.x;
    const dy = t.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: t.clientX, y: t.clientY };
    handlePointerMove(dx, dy);
  };

  const handleSave = async () => {
    const source = workingBlobRef.current;
    if (!source) return;

    const framed = await frameImageBlob(source, zoom, offset);
    if (!framed) {
      setLoadError("Could not save crop. Try adjusting the image again.");
      return;
    }

    await onSave(framed);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-almaari-bg safe-pt safe-pb">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-almaari-border px-4 py-3">
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
          disabled={saving || loading || !preview}
          className="text-sm font-semibold text-almaari-accent hover:text-almaari-accent-strong disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <p className="text-sm text-almaari-muted">
          Drag to reposition and use the slider to zoom. Your item stays on a
          transparent background.
        </p>

        {loadError ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {loadError}
          </p>
        ) : null}

        <div className="relative mx-auto flex h-[min(280px,45vh)] w-full max-w-sm items-center justify-center overflow-hidden rounded-almaari-lg border border-almaari-border bg-white">
          {loading ? (
            <p className="text-sm text-almaari-muted">Loading image…</p>
          ) : preview ? (
            <div className="relative flex h-full w-full items-center justify-center">
              <div className="relative aspect-square h-full max-h-full w-auto max-w-full shrink-0">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
                />
                <div className="pointer-events-none absolute inset-0">
                  <CropOverlayGuide overlay={cropOverlay} />
                </div>
              </div>
            </div>
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
          <>
            <input
              type="range"
              min={minZoom}
              max={3}
              step="0.01"
              value={zoom}
              onChange={(e) => {
                const nextZoom = Number(e.target.value);
                setZoom(nextZoom);
                if (imageRef.current) {
                  const img = imageRef.current;
                  const scale = getDrawScale(
                    img.naturalWidth,
                    img.naturalHeight,
                    nextZoom,
                  );
                  setOffset((prev) =>
                    clampCropOffset(
                      prev.x,
                      prev.y,
                      img.naturalWidth,
                      img.naturalHeight,
                      scale,
                    ),
                  );
                }
              }}
              className="min-h-8 w-full touch-manipulation accent-almaari-accent"
              aria-label="Zoom image for crop"
            />
            <div className="flex items-center justify-between text-xs text-almaari-muted">
              <span>Zoom out</span>
              <span>Adjust crop</span>
              <span>Zoom in</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
