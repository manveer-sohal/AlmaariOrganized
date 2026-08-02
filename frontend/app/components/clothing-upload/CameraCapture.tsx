"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../ux/motion";
import CameraOverlay from "./CameraOverlay";
import CameraReview from "./CameraReview";
import CameraShell from "./CameraShell";
import {
  CROP_OVERLAY_OPTIONS,
  type CropOverlayId,
} from "../../utils/cropOverlays";
import {
  type CameraFacing,
  type CameraState,
  captureVideoFrameToFile,
  countAvailableCameras,
  flipCameraFacing,
  isGetUserMediaSupported,
  isVideoReadyForCapture,
  logCameraError,
  mapCameraError,
  prefersEnvironmentCamera,
  readDeviceIdFromStream,
  readFacingFromStream,
  requestCameraStream,
  stopMediaStream,
} from "./cameraCaptureUtils";

export type CameraCaptureProps = {
  onCapture: (file: File, cropOverlay: CropOverlayId) => void;
  onClose: () => void;
  /** Opens gallery when camera unavailable. */
  onOpenGallery?: () => void;
  initialCropOverlay?: CropOverlayId;
};

export default function CameraCapture({
  onCapture,
  onClose,
  onOpenGallery,
  initialCropOverlay = "none",
}: CameraCaptureProps) {
  const reduced = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [state, setState] = useState<CameraState>("requesting-permission");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacing>(
    prefersEnvironmentCamera() ? "environment" : "user",
  );
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>();
  const [canFlipCamera, setCanFlipCamera] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [cropOverlay, setCropOverlay] =
    useState<CropOverlayId>(initialCropOverlay);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const attachStream = useCallback(async () => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    setVideoReady(false);

    const stream = await requestCameraStream();
    streamRef.current = stream;
    setFacingMode(readFacingFromStream(stream));
    setActiveDeviceId(readDeviceIdFromStream(stream));

    const cameraCount = await countAvailableCameras();
    setCanFlipCamera(cameraCount > 1 || prefersEnvironmentCamera());

    const video = videoRef.current;
    if (!video) {
      stopMediaStream(stream);
      throw new Error("Video element unavailable");
    }

    video.srcObject = stream;
    await video.play();
  }, []);

  const startCamera = useCallback(async () => {
    setState("requesting-permission");
    setErrorMessage(null);

    if (!isGetUserMediaSupported()) {
      setState("error");
      setErrorMessage(
        "This browser does not support in-app camera capture. Choose a photo from your gallery instead.",
      );
      return;
    }

    try {
      await attachStream();
      setState("live");
    } catch (error) {
      logCameraError("startCamera", error);
      setState("error");
      setErrorMessage(mapCameraError(error));
    }
  }, [attachStream]);

  useEffect(() => {
    void startCamera();
    return () => {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      revokePreviewUrl();
    };
  }, [startCamera, revokePreviewUrl]);

  const handleVideoMetadata = () => {
    const video = videoRef.current;
    if (video && isVideoReadyForCapture(video)) {
      setVideoReady(true);
    }
  };

  const handleClose = () => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    revokePreviewUrl();
    onClose();
  };

  const handleShutter = async () => {
    const video = videoRef.current;
    if (!video || !videoReady || state !== "live") return;

    try {
      if (!reduced) {
        setCaptureFlash(true);
        window.setTimeout(() => setCaptureFlash(false), 120);
      }

      if ("vibrate" in navigator) {
        try {
          navigator.vibrate(12);
        } catch {
          /* optional haptic */
        }
      }

      const file = await captureVideoFrameToFile(
        video,
        "clothing-photo.jpg",
        0.92,
        facingMode === "user",
      );
      revokePreviewUrl();
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;

      stopMediaStream(streamRef.current);
      streamRef.current = null;
      if (video.srcObject) {
        video.srcObject = null;
      }

      setCapturedFile(file);
      setPreviewUrl(url);
      setState("captured");
    } catch (error) {
      logCameraError("capture", error);
      setState("error");
      setErrorMessage("Could not capture the photo. Try again or choose from gallery.");
    }
  };

  const handleRetake = async () => {
    revokePreviewUrl();
    setPreviewUrl(null);
    setCapturedFile(null);
    setConfirming(false);
    await startCamera();
  };

  const handleConfirm = () => {
    if (!capturedFile) return;
    setConfirming(true);
    setState("confirming");
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    onCapture(capturedFile, cropOverlay);
    revokePreviewUrl();
    onClose();
  };

  const handleFlipCamera = async () => {
    if (state !== "live") return;
    try {
      setVideoReady(false);
      const { stream, facing, deviceId, canFlip } = await flipCameraFacing(
        streamRef.current,
        facingMode,
        activeDeviceId,
      );
      streamRef.current = stream;
      setFacingMode(facing);
      setActiveDeviceId(deviceId);
      setCanFlipCamera(canFlip);
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch (error) {
      logCameraError("flipCamera", error);
      setState("error");
      setErrorMessage(mapCameraError(error));
    }
  };

  useEffect(() => {
    if (state !== "live") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
        return;
      }

      if (event.key === " " || event.key === "Enter") {
        const target = event.target as HTMLElement | null;
        if (target?.closest("button, [role='radio'], select, input, textarea")) {
          return;
        }
        event.preventDefault();
        void handleShutter();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state]);

  if (state === "captured" || state === "confirming") {
    if (!previewUrl) return null;
    return (
      <CameraReview
        previewUrl={previewUrl}
        confirming={confirming}
        onRetake={() => void handleRetake()}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );
  }

  return (
    <CameraShell ariaLabel="Take clothing photo" onBackdropClose={handleClose}>
      {state === "live" || state === "requesting-permission" ? (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            onLoadedMetadata={handleVideoMetadata}
            className={`absolute inset-0 h-full w-full object-cover ${
              facingMode === "user" ? "scale-x-[-1]" : ""
            }`}
          />

          {state === "live" ? (
            <CameraOverlay
              cropOverlay={cropOverlay}
              onClose={handleClose}
              onFlipCamera={
                canFlipCamera ? () => void handleFlipCamera() : undefined
              }
              showFlip={canFlipCamera}
            />
          ) : null}

          {state === "requesting-permission" ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 px-6 text-center">
              <p className="text-sm font-medium text-white" role="status">
                Starting camera…
              </p>
            </div>
          ) : null}

          {!reduced && captureFlash ? (
            <div
              className="pointer-events-none absolute inset-0 z-30 bg-white/35 motion-reduce:hidden"
              aria-hidden
            />
          ) : null}

          {state === "live" ? (
            <div
              id="camera-crop-overlay-select"
              className="pointer-events-auto absolute inset-x-0 bottom-[calc(6.25rem+var(--safe-bottom))] z-20 px-3"
            >
              <p className="mb-2 text-center text-xs font-medium text-white/90 drop-shadow-sm">
                Crop guide
              </p>
              <div
                className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="radiogroup"
                aria-label="Crop guide"
              >
                {CROP_OVERLAY_OPTIONS.map((option) => {
                  const selected = cropOverlay === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setCropOverlay(option.id)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                        selected
                          ? "border-white bg-white text-black"
                          : "border-white/35 bg-black/35 text-white hover:bg-black/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 pb-[max(1.5rem,var(--safe-bottom))]">
            <p className="hidden text-xs text-white/75 md:block">
              Space or Enter to capture · Esc to close
            </p>
            <button
              type="button"
              onClick={() => void handleShutter()}
              disabled={!videoReady || state !== "live"}
              aria-label="Take photo"
              className="pointer-events-auto inline-flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[4px] border-white/90 bg-white/15 backdrop-blur-sm transition enabled:hover:scale-[1.02] enabled:active:scale-95 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className="block h-[3.25rem] w-[3.25rem] rounded-full bg-white" />
            </button>
          </div>
        </>
      ) : null}

      {state === "error" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close camera"
            className="absolute left-4 top-[max(0.75rem,var(--safe-top))] inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            ×
          </button>
          <p className="max-w-sm text-base font-medium text-white" role="alert">
            {errorMessage}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void startCamera()}
              className="min-h-touch rounded-almaari bg-almaari-accent px-5 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Try again
            </button>
            {onOpenGallery ? (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenGallery();
                }}
                className="min-h-touch rounded-almaari border border-white/30 px-5 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Choose from gallery
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </CameraShell>
  );
}
