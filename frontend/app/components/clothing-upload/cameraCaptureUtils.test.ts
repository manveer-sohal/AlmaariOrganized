import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureVideoFrameToFile,
  isGetUserMediaSupported,
  isVideoReadyForCapture,
  mapCameraError,
  prefersEnvironmentCamera,
  requestCameraStream,
  stopMediaStream,
} from "./cameraCaptureUtils";

describe("cameraCaptureUtils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps permission denied to a friendly message", () => {
    const message = mapCameraError(
      new DOMException("denied", "NotAllowedError"),
    );
    expect(message).toContain("denied");
    expect(message.toLowerCase()).toContain("gallery");
  });

  it("maps not found camera errors", () => {
    const message = mapCameraError(new DOMException("missing", "NotFoundError"));
    expect(message.toLowerCase()).toContain("gallery");
  });

  it("detects getUserMedia support", () => {
    expect(typeof isGetUserMediaSupported()).toBe("boolean");
  });

  it("stops all tracks on cleanup", () => {
    const stop = vi.fn();
    const stream = {
      getTracks: () => [{ stop }, { stop }],
    } as unknown as MediaStream;

    stopMediaStream(stream);
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it("requires video metadata before capture", () => {
    const video = document.createElement("video");
    expect(isVideoReadyForCapture(video)).toBe(false);
    Object.defineProperty(video, "videoWidth", { value: 1080 });
    Object.defineProperty(video, "videoHeight", { value: 1920 });
    expect(isVideoReadyForCapture(video)).toBe(true);
  });

  it("captures a JPEG file from a video frame", async () => {
    const video = document.createElement("video");
    Object.defineProperty(video, "videoWidth", { value: 100 });
    Object.defineProperty(video, "videoHeight", { value: 200 });

    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function toBlob(this: HTMLCanvasElement, callback) {
        callback(new Blob(["jpeg"], { type: "image/jpeg" }));
      },
    );

    const file = await captureVideoFrameToFile(video);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 100, 200);
    expect(file.type).toBe("image/jpeg");
    expect(file.name).toBe("clothing-photo.jpg");
  });

  it("rejects capture when video dimensions are missing", async () => {
    const video = document.createElement("video");
    await expect(captureVideoFrameToFile(video)).rejects.toThrow(
      "Video metadata not loaded",
    );
  });

  it("mirrors user-facing captures", async () => {
    const video = document.createElement("video");
    Object.defineProperty(video, "videoWidth", { value: 100 });
    Object.defineProperty(video, "videoHeight", { value: 200 });

    const translate = vi.fn();
    const scale = vi.fn();
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      translate,
      scale,
      drawImage,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function toBlob(this: HTMLCanvasElement, callback) {
        callback(new Blob(["jpeg"], { type: "image/jpeg" }));
      },
    );

    await captureVideoFrameToFile(video, "clothing-photo.jpg", 0.92, true);
    expect(translate).toHaveBeenCalledWith(100, 0);
    expect(scale).toHaveBeenCalledWith(-1, 1);
  });

  it("falls back to default webcam constraints on desktop", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 Macintosh",
    );
    expect(prefersEnvironmentCamera()).toBe(false);

    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(
        new DOMException("Cannot satisfy constraints", "OverconstrainedError"),
      )
      .mockResolvedValueOnce({ getTracks: () => [] });

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    await requestCameraStream();
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(getUserMedia.mock.calls[0][0].video).not.toHaveProperty(
      "facingMode",
    );
    expect(getUserMedia.mock.calls[1][0].video.facingMode).toEqual({
      ideal: "user",
    });
  });
});
