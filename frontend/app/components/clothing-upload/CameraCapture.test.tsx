import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CameraCapture from "./CameraCapture";

const mockStream = {
  getTracks: () => [{ stop: vi.fn() }],
  getVideoTracks: () => [
    {
      stop: vi.fn(),
      getSettings: () => ({ facingMode: "user", deviceId: "camera-1" }),
    },
  ],
} as unknown as MediaStream;

describe("CameraCapture", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => ({
        drawImage: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
      }),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function toBlob(callback) {
        callback?.(new Blob(["jpeg"], { type: "image/jpeg" }));
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("starts camera stream on mount", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    render(<CameraCapture onCapture={vi.fn()} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled();
    });
  });

  it("shows friendly error when permission fails", async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    render(
      <CameraCapture
        onCapture={vi.fn()}
        onClose={vi.fn()}
        onOpenGallery={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/denied/i);
    expect(screen.getByRole("button", { name: /gallery/i })).toBeInTheDocument();
  });

  it("disables shutter until video metadata is ready", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    render(<CameraCapture onCapture={vi.fn()} onClose={vi.fn()} />);

    const shutter = await screen.findByRole("button", { name: /take photo/i });
    expect(shutter).toBeDisabled();
  });

  it("captures and confirms a photo", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    const onCapture = vi.fn();
    const onClose = vi.fn();

    render(<CameraCapture onCapture={onCapture} onClose={onClose} />);

    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    Object.defineProperty(video!, "videoWidth", { value: 640, configurable: true });
    Object.defineProperty(video!, "videoHeight", { value: 480, configurable: true });
    fireEvent.loadedMetadata(video!);

    const shutter = await screen.findByRole("button", { name: /take photo/i });
    await waitFor(() => expect(shutter).not.toBeDisabled());
    fireEvent.click(shutter);

    expect(await screen.findByText(/review photo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /use photo/i }));

    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(onCapture.mock.calls[0][0]).toBeInstanceOf(File);
    expect(onCapture.mock.calls[0][1]).toBe("none");
    expect(onClose).toHaveBeenCalled();
  });

  it("passes selected crop overlay on confirm", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    const onCapture = vi.fn();

    render(
      <CameraCapture
        onCapture={onCapture}
        onClose={vi.fn()}
        initialCropOverlay="pants"
      />,
    );

    const video = document.querySelector("video");
    Object.defineProperty(video!, "videoWidth", { value: 640, configurable: true });
    Object.defineProperty(video!, "videoHeight", { value: 480, configurable: true });
    fireEvent.loadedMetadata(video!);

    fireEvent.click(await screen.findByRole("radio", { name: /shoes/i }));
    fireEvent.click(await screen.findByRole("button", { name: /take photo/i }));
    fireEvent.click(await screen.findByRole("button", { name: /use photo/i }));

    expect(onCapture.mock.calls[0][1]).toBe("shoes");
  });

  it("returns to live camera on retake", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    render(<CameraCapture onCapture={vi.fn()} onClose={vi.fn()} />);

    const video = document.querySelector("video");
    Object.defineProperty(video!, "videoWidth", { value: 640, configurable: true });
    Object.defineProperty(video!, "videoHeight", { value: 480, configurable: true });
    fireEvent.loadedMetadata(video!);

    const shutter = await screen.findByRole("button", { name: /take photo/i });
    await waitFor(() => expect(shutter).not.toBeDisabled());
    fireEvent.click(shutter);

    fireEvent.click(await screen.findByRole("button", { name: /retake/i }));

    await waitFor(() => {
      expect(getUserMedia.mock.calls.length).toBeGreaterThan(1);
    });
  });

  it("stops tracks on unmount", async () => {
    const stop = vi.fn();
    const stream = {
      getTracks: () => [{ stop }],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia,
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    const { unmount } = render(
      <CameraCapture onCapture={vi.fn()} onClose={vi.fn()} />,
    );

    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    unmount();
    expect(stop).toHaveBeenCalled();
  });
});
