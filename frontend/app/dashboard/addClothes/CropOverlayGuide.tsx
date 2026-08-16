"use client";

import { useId } from "react";
import { CropOverlayId } from "../../utils/cropOverlays";

type CropOverlayGuideProps = {
  overlay: CropOverlayId;
  className?: string;
  /** Lighter strokes for live camera preview on dark backgrounds. */
  variant?: "default" | "camera";
};

/** Semi-transparent silhouette guides for framing garments in the crop square. */
export default function CropOverlayGuide({
  overlay,
  className = "",
  variant = "default",
}: CropOverlayGuideProps) {
  const reactId = useId().replace(/:/g, "");
  const maskId = `crop-mask-${overlay}-${reactId}`;

  if (overlay === "none") return null;

  const shape = silhouetteShape(overlay);
  const isCamera = variant === "camera";
  const tintFill = isCamera
    ? "rgba(255, 255, 255, 0)"
    : "rgba(49, 46, 129, 0.18)";
  const shapeFill = isCamera
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(255, 255, 255, 0.1)";
  const stroke = isCamera
    ? "rgba(255, 255, 255, 0.92)"
    : "rgba(79, 70, 229, 0.9)";

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
      <rect width="100" height="100" fill={tintFill} mask={`url(#${maskId})`} />
      <g fill={shapeFill}>{shape}</g>
      <g
        fill="none"
        stroke={stroke}
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
    case "tie":
      return (
        <g transform="translate(50 54) scale(0.83) translate(-50 -50)">
          {/* top line, not a box */}
          <line x1="12" y1="7" x2="88" y2="7" />
          <line x1="50" y1="7" x2="50" y2="57" strokeWidth="0.9" />

          {/* bottom line, not a box */}
          <line x1="12" y1="83" x2="88" y2="83" strokeWidth="0.9" />
          <line
            x1="12"
            y1="86"
            x2="88"
            y2="86"
            stroke="rgba(79, 70, 229, 0.9)"
            strokeWidth="0.9"
          />
          {/* <path d="M24 4 H76 V2 L92 98 H64 L50 42 L36 98 H8 L16 42 Z" /> */}
        </g>
      );
    case "top":
      return (
        <g transform="translate(50 54) scale(0.83) translate(-50 -50)">
          {/* top line, not a box */}
          <line x1="22" y1="7" x2="78" y2="7" />
          {/* first bottom*/}
          <line x1="22" y1="84" x2="78" y2="84" strokeWidth="0.9" />
          {/* Second bottom*/}

          <line
            x1="22"
            y1="90"
            x2="78"
            y2="90"
            stroke="rgba(79, 70, 229, 0.9)"
            strokeWidth="0.9"
          />

          {/* middle line */}
          <line x1="50" y1="7" x2="50" y2="57" strokeWidth="0.4" />
          {/* Side lines */}
          <line x1="22" y1="40" x2="22" y2="90" strokeWidth="0.9" />
          <line x1="78" y1="40" x2="78" y2="90" strokeWidth="0.9" />

          {/* <path d="M24 4 H76 V2 L92 98 H64 L50 42 L36 98 H8 L16 42 Z" /> */}
        </g>
        // <path d="M38 20 L28 16 L10 30 L14 46 L22 42 L20 88 H80 L78 42 L86 46 L90 30 L72 16 L62 20 C58 30 42 30 38 20 Z" />
      );
    case "pants":
      return (
        <g transform="translate(50 54) scale(0.83) translate(-50 -50)">
          {/* top line, not a box */}
          <line x1="12" y1="3" x2="88" y2="3" />
          {/* bottom line, not a box */}
          <line x1="12" y1="98" x2="88" y2="98" />
          {/* <path d="M24 4 H76 V2 L92 98 H64 L50 42 L36 98 H8 L16 42 Z" /> */}
        </g>
        //  <g transform="translate(50 54) scale(0.83) translate(-50 -50)">
        //   <path d="M24 4 H76 V2 L92 98 H64 L50 42 L36 98 H8 L16 42 Z" />
        // </g>
      );
    case "shorts":
      return (
        <g transform="translate(50 54) scale(0.83) translate(-50 -50)">
          {/* top line, not a box */}
          <line x1="12" y1="3" x2="88" y2="3" />
          {/* bottom line, not a box */}
          <line x1="12" y1="68" x2="88" y2="68" />
          {/* <path d="M24 4 H76 V2 L92 98 H64 L50 42 L36 98 H8 L16 42 Z" /> */}
        </g>
      );
    case "skirt":
      return <path d="M38 8 H62 L88 94 H12 Z" />;
    case "dress":
      return (
        <path d="M36 12 L30 10 L20 24 V40 L14 82 H86 L80 40 V24 L70 10 L64 12 V18 H36 Z" />
      );
    case "shoes":
      return <path d="M12 48 H88 V82 H12 Z" />;
    case "accessory":
      return (
        <g>
          <ellipse cx="50" cy="50" rx="40" ry="40" />
        </g>
      );
    default:
      return null;
  }
}
