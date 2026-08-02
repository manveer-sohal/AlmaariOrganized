export type CameraState =
  | "idle"
  | "requesting-permission"
  | "live"
  | "captured"
  | "confirming"
  | "error";

export type CameraFacing = "environment" | "user";

const MOBILE_UA = /Android|iPhone|iPad|iPod|Mobile/i;

/** Tailwind `md` — used for desktop camera shell layout. */
export const CAMERA_DESKTOP_SHELL_CLASS =
  "md:inset-auto md:left-1/2 md:top-1/2 md:h-[min(92vh,780px)] md:w-[min(92vw,520px)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:overflow-hidden md:shadow-2xl md:ring-1 md:ring-white/10";

export function prefersEnvironmentCamera(): boolean {
  if (typeof navigator === "undefined") return false;
  return MOBILE_UA.test(navigator.userAgent);
}

export function isGetUserMediaSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

export function isVideoReadyForCapture(video: HTMLVideoElement): boolean {
  return video.videoWidth > 0 && video.videoHeight > 0;
}

export function readFacingFromStream(stream: MediaStream): CameraFacing {
  const track = stream.getVideoTracks?.()?.[0];
  const settings = track?.getSettings?.();
  if (settings?.facingMode === "environment" || settings?.facingMode === "user") {
    return settings.facingMode;
  }
  return prefersEnvironmentCamera() ? "environment" : "user";
}

export function readDeviceIdFromStream(stream: MediaStream): string | undefined {
  const track = stream.getVideoTracks?.()?.[0];
  const settings = track?.getSettings?.();
  return settings?.deviceId;
}

export async function listVideoInputDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

function videoConstraints(
  options: { facingMode?: CameraFacing; deviceId?: string } = {},
): MediaTrackConstraints {
  const base: MediaTrackConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  };

  if (options.deviceId) {
    return { ...base, deviceId: { exact: options.deviceId } };
  }

  if (options.facingMode) {
    return { ...base, facingMode: { ideal: options.facingMode } };
  }

  return base;
}

/**
 * Request a camera stream with fallbacks for desktop webcams (no environment facing).
 */
export async function requestCameraStream(
  options: { facingMode?: CameraFacing; deviceId?: string } = {},
): Promise<MediaStream> {
  if (!isGetUserMediaSupported()) {
    throw new DOMException("getUserMedia is not supported", "NotSupportedError");
  }

  const strategies: MediaStreamConstraints[] = [];

  if (options.deviceId) {
    strategies.push({ audio: false, video: videoConstraints({ deviceId: options.deviceId }) });
  } else if (options.facingMode) {
    strategies.push({
      audio: false,
      video: videoConstraints({ facingMode: options.facingMode }),
    });
  } else if (prefersEnvironmentCamera()) {
    strategies.push({
      audio: false,
      video: videoConstraints({ facingMode: "environment" }),
    });
  }

  strategies.push({ audio: false, video: videoConstraints() });
  strategies.push({
    audio: false,
    video: videoConstraints({ facingMode: "user" }),
  });

  let lastError: unknown;
  const seen = new Set<string>();

  for (const constraints of strategies) {
    const key = JSON.stringify(constraints);
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
      if (
        error instanceof DOMException &&
        (error.name === "OverconstrainedError" ||
          error.name === "ConstraintNotSatisfiedError" ||
          error.name === "NotFoundError")
      ) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

export function mapCameraError(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Camera access was denied. You can still choose a photo from your gallery.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No camera was found on this device. Choose a photo from your gallery instead.";
      case "NotReadableError":
      case "TrackStartError":
        return "Your camera is in use by another app. Close it and try again, or pick from gallery.";
      case "OverconstrainedError":
      case "ConstraintNotSatisfiedError":
        return "This camera could not start with the requested settings. Try gallery upload instead.";
      case "SecurityError":
        return "Camera access requires a secure connection (HTTPS). Choose a photo from your gallery.";
      default:
        break;
    }
  }

  if (error instanceof Error && error.message.toLowerCase().includes("secure")) {
    return "Camera access requires a secure connection (HTTPS). Choose a photo from your gallery.";
  }

  return "We couldn't start the camera. Try choosing a photo from your gallery instead.";
}

export function logCameraError(context: string, error: unknown): void {
  const detail =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { message: String(error) };
  console.warn(`[CameraCapture] ${context}`, detail);
}

export async function captureVideoFrameToFile(
  video: HTMLVideoElement,
  fileName = "clothing-photo.jpg",
  quality = 0.92,
  mirror = false,
): Promise<File> {
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!width || !height) {
    throw new Error("Video metadata not loaded");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", quality);
  });

  if (!blob) {
    throw new Error("Could not encode captured photo");
  }

  return new File([blob], fileName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function flipCameraFacing(
  stream: MediaStream | null,
  currentFacing: CameraFacing,
  currentDeviceId?: string,
): Promise<{
  stream: MediaStream;
  facing: CameraFacing;
  deviceId?: string;
  canFlip: boolean;
}> {
  stopMediaStream(stream);

  const devices = await listVideoInputDevices();
  if (devices.length > 1) {
    const currentIndex = devices.findIndex(
      (device) => device.deviceId === currentDeviceId,
    );
    const nextDevice = devices[(Math.max(currentIndex, 0) + 1) % devices.length];
    const nextStream = await requestCameraStream({
      deviceId: nextDevice.deviceId,
    });
    return {
      stream: nextStream,
      facing: readFacingFromStream(nextStream),
      deviceId: nextDevice.deviceId,
      canFlip: true,
    };
  }

  const nextFacing: CameraFacing =
    currentFacing === "environment" ? "user" : "environment";

  try {
    const nextStream = await requestCameraStream({ facingMode: nextFacing });
    return {
      stream: nextStream,
      facing: readFacingFromStream(nextStream),
      deviceId: readDeviceIdFromStream(nextStream),
      canFlip: prefersEnvironmentCamera(),
    };
  } catch (error) {
    logCameraError("flipCameraFacing", error);
    throw error;
  }
}

export async function countAvailableCameras(): Promise<number> {
  try {
    const devices = await listVideoInputDevices();
    return devices.length;
  } catch {
    return 0;
  }
}
