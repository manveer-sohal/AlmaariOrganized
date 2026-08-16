/**
 * Safe image diagnostics for logs — never includes bytes or data URLs.
 */

export const summarizeImageBuffer = (buffer, mimeType) => {
  const bytes = Buffer.isBuffer(buffer) ? buffer.length : 0;
  return {
    mimeType: mimeType || undefined,
    decodedBytes: bytes,
    encodedBytesEstimate: Math.ceil((bytes * 4) / 3),
  };
};

export const summarizeImageSrcMeta = (imageSrc) => {
  if (!imageSrc || typeof imageSrc !== "string") {
    return { kind: "missing", charLength: 0 };
  }
  if (imageSrc.startsWith("/samples/")) {
    return { kind: "sample", charLength: imageSrc.length, samplePath: imageSrc };
  }
  if (imageSrc.startsWith("data:")) {
    const comma = imageSrc.indexOf(",");
    const header = comma >= 0 ? imageSrc.slice(0, comma) : "data:";
    const bodyLen = comma >= 0 ? imageSrc.length - comma - 1 : 0;
    return {
      kind: "data_url",
      charLength: imageSrc.length,
      header,
      encodedBytes: bodyLen,
    };
  }
  if (/^https?:\/\//i.test(imageSrc)) {
    try {
      const u = new URL(imageSrc);
      return {
        kind: "http_url",
        charLength: imageSrc.length,
        host: u.host,
        pathname: u.pathname,
      };
    } catch {
      return { kind: "http_url", charLength: imageSrc.length };
    }
  }
  return { kind: "other", charLength: imageSrc.length };
};
