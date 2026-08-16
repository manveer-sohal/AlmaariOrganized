"use client";

import Cropper, { type Area, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import CropOverlayGuide from "../addClothes/CropOverlayGuide";
import type { CropOverlayId } from "../../utils/cropOverlays";
import { ABSOLUTE_MIN_USER_ZOOM } from "../../utils/clientImageCrop";

export type ClothingCropSurfaceProps = {
  imageUrl: string;
  crop: Point;
  zoom: number;
  rotation: number;
  minZoom?: number;
  maxZoom?: number;
  cropOverlay: CropOverlayId;
  disabled?: boolean;
  onCropChange: (crop: Point) => void;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  className?: string;
};

export default function ClothingCropSurface({
  imageUrl,
  crop,
  zoom,
  rotation,
  minZoom = ABSOLUTE_MIN_USER_ZOOM,
  maxZoom = 3,
  cropOverlay,
  disabled = false,
  onCropChange,
  onZoomChange,
  onRotationChange,
  onCropComplete,
  className = "",
}: ClothingCropSurfaceProps) {
  return (
    <div
      className={`relative aspect-square h-full max-h-full w-full ${className}`}
    >
      <Cropper
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        rotation={rotation}
        aspect={1}
        cropShape="rect"
        showGrid={false}
        restrictPosition={false}
        minZoom={minZoom}
        maxZoom={maxZoom}
        zoomWithScroll={!disabled}
        onCropChange={disabled ? () => {} : onCropChange}
        onZoomChange={disabled ? () => {} : onZoomChange}
        onRotationChange={disabled ? () => {} : onRotationChange}
        onCropComplete={onCropComplete}
        style={{
          containerStyle: {
            background: "transparent",
            cursor: disabled ? "default" : "grab",
          },
          cropAreaStyle: {
            border: "none",
            boxShadow: "none",
          },
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <CropOverlayGuide overlay={cropOverlay} />
      </div>
    </div>
  );
}
