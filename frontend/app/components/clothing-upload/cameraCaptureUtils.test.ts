import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureVideoFrameToFile,
  captureVideoFrameCroppedToFile,
  computeVideoSourceCrop,
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

  it("maps object-cover crop frame to source pixels", () => {
    const crop = computeVideoSourceCrop(
      1600,
      900,
      { left: 0, top: 0, width: 400, height: 800 },
      { left: 50, top: 100, width: 300, height: 300 },
      false,
    );

    expect(crop.sw).toBeGreaterThan(0);
    expect(crop.sh).toBeGreaterThan(0);
    expect(crop.sx).toBeGreaterThanOrEqual(0);
    expect(crop.sy).toBeGreaterThanOrEqual(0);
    expect(crop.sx + crop.sw).toBeLessThanOrEqual(1600);
    expect(crop.sy + crop.sh).toBeLessThanOrEqual(900);
  });

  it("mirrors crop mapping for user-facing preview", () => {
    const normal = computeVideoSourceCrop(
      1000,
      1000,
      { left: 0, top: 0, width: 200, height: 200 },
      { left: 60, top: 20, width: 80, height: 160 },
      false,
    );
    const mirrored = computeVideoSourceCrop(
      1000,
      1000,
      { left: 0, top: 0, width: 200, height: 200 },
      { left: 60, top: 20, width: 80, height: 160 },
      true,
    );

    expect(mirrored.sw).toBeCloseTo(normal.sw, 4);
    expect(mirrored.sh).toBeCloseTo(normal.sh, 4);
    expect(mirrored.sx + mirrored.sw).toBeCloseTo(
      1000 - normal.sx,
      0,
    );
  });

  it("captures only the crop frame region from video", async () => {
    const video = document.createElement("video");
    Object.defineProperty(video, "videoWidth", { value: 400 });
    Object.defineProperty(video, "videoHeight", { value: 400 });
    video.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 200,
        height: 200,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    const cropFrame = document.createElement("div");
    cropFrame.getBoundingClientRect = () =>
      ({
        left: 40,
        top: 40,
        width: 120,
        height: 120,
        right: 160,
        bottom: 160,
        x: 40,
        y: 40,
        toJSON: () => ({}),
      }) as DOMRect;

    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function toBlob(this: HTMLCanvasElement, callback) {
        callback(new Blob(["jpeg"], { type: "image/jpeg" }));
      },
    );

    const file = await captureVideoFrameCroppedToFile(video, cropFrame);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(drawImage.mock.calls[0].slice(1, 5)).toEqual(
      expect.arrayContaining([
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      ]),
    );
    expect(file.type).toBe("image/jpeg");
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
