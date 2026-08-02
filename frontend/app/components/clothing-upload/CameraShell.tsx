"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CAMERA_DESKTOP_SHELL_CLASS } from "./cameraCaptureUtils";

type CameraShellProps = {
  children: ReactNode;
  onBackdropClose?: () => void;
  ariaLabel: string;
};

/** Full-screen on mobile; centered modal on desktop. Portaled above app chrome. */
export default function CameraShell({
  children,
  onBackdropClose,
  ariaLabel,
}: CameraShellProps) {
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

  if (!mounted) return null;

  return createPortal(
    <>
      {onBackdropClose ? (
        <button
          type="button"
          aria-label="Close camera"
          onClick={onBackdropClose}
          className="fixed inset-0 z-[100] hidden bg-black/60 md:block"
        />
      ) : null}

      <div
        className={`fixed inset-0 z-[101] flex flex-col bg-black ${CAMERA_DESKTOP_SHELL_CLASS}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
