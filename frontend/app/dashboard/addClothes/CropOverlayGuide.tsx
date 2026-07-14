"use client";

import { useId } from "react";
import { CropOverlayId } from "../../utils/cropOverlays";

type CropOverlayGuideProps = {
  overlay: CropOverlayId;
  className?: string;
};

/** Semi-transparent silhouette guides for framing garments in the crop square. */
export default function CropOverlayGuide({
  overlay,
  className = "",
}: CropOverlayGuideProps) {
  const reactId = useId().replace(/:/g, "");
  const maskId = `crop-mask-${overlay}-${reactId}`;

  if (overlay === "none") return null;

  const shape = silhouetteShape(overlay);

  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-full w-full ${className}`}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <mask id={maskId}>
          <rect width="100" height="100" fill="white" />
          <g fill="black">{shape}</g>
        </mask>
      </defs>
      <rect
        width="100"
        height="100"
        fill="rgba(49, 46, 129, 0.18)"
        mask={`url(#${maskId})`}
      />
      <g fill="rgba(255, 255, 255, 0.1)">{shape}</g>
      <g
        fill="none"
        stroke="rgba(79, 70, 229, 0.9)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {shape}
      </g>
    </svg>
  );
}

function silhouetteShape(overlay: CropOverlayId) {
  switch (overlay) {
    case "top":
      return (
        <path d="M32 22 L26 18 L14 34 V78 H38 V58 H62 V78 H86 V34 L74 18 L68 22 V28 H32 Z" />
      );
    case "pants":
      return <path d="M24 4 H76 V2 L92 98 H64 L50 42 L36 98 H8 L16 42 Z" />;
    case "shorts":
      return <path d="M24 20 H73 V20 L89 80 H64 L50 42 L36 80 H12 L19 42 Z" />;
    case "skirt":
      return <path d="M36 20 H64 V36 L78 78 H22 L36 36 Z" />;
    case "dress":
      return (
        <path d="M36 12 L30 10 L20 24 V40 L14 82 H86 L80 40 V24 L70 10 L64 12 V18 H36 Z" />
      );
    case "shoes":
      return (
        <g>
          <path d="M18 48 H42 V58 L48 68 C56 72 58 78 52 82 H24 L18 82 Z" />
          <path d="M58 48 H82 V58 L88 68 C96 72 98 78 92 82 H64 L58 82 Z" />
        </g>
      );
    case "accessory":
      return (
        <g>
          <ellipse cx="50" cy="42" rx="22" ry="18" />
          <path d="M28 48 H72" />
        </g>
      );
    default:
      return null;
  }
}
