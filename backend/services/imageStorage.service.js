/**
 * Object-storage abstraction.
 * Default provider is legacy (no-op). S3 adapter activates only when configured.
 */

import { createHash } from "crypto";

export const hashBuffer = (buffer) =>
  createHash("sha256").update(buffer).digest("hex");

export const createLegacyStorageAdapter = () => ({
  provider: "legacy-base64",
  async putObject() {
    throw new Error("Object storage is not configured (IMAGE_STORAGE_PROVIDER=legacy)");
  },
  async getDisplayUrl() {
    return null;
  },
  async deleteObject() {
    return { deleted: false, reason: "legacy" };
  },
  async objectExists() {
    return false;
  },
});

export const createS3StorageAdapter = async () => {
  const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || process.env.REGION || "us-east-1";
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is required for s3 image storage");
  }

  // Dynamic import so environments without AWS SDK still boot in legacy mode.
  let S3Client;
  let PutObjectCommand;
  let HeadObjectCommand;
  let DeleteObjectCommand;
  let getSignedUrl;
  try {
    ({ S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } =
      await import("@aws-sdk/client-s3"));
    ({ getSignedUrl } = await import("@aws-sdk/s3-request-presigner"));
  } catch {
    throw new Error(
      "S3 storage selected but @aws-sdk/client-s3 is not installed",
    );
  }

  const client = new S3Client({ region });
  const cdn = process.env.AWS_CLOUDFRONT_DOMAIN || "";

  return {
    provider: "s3",
    async putObject({ key, body, contentType }) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return { key, bucket };
    },
    async getDisplayUrl(key, { expiresIn = 3600 } = {}) {
      if (!key) return null;
      if (cdn) {
        const host = cdn.replace(/^https?:\/\//, "").replace(/\/$/, "");
        return `https://${host}/${key}`;
      }
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn },
      );
    },
    async deleteObject(key) {
      if (!key) return { deleted: false };
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key }),
      );
      return { deleted: true };
    },
    async objectExists(key) {
      if (!key) return false;
      try {
        await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        return true;
      } catch {
        return false;
      }
    },
  };
};

let _adapterPromise;

export const getImageStorageAdapter = async () => {
  if (_adapterPromise) return _adapterPromise;
  const provider = (process.env.IMAGE_STORAGE_PROVIDER || "legacy").toLowerCase();
  _adapterPromise =
    provider === "s3"
      ? createS3StorageAdapter()
      : Promise.resolve(createLegacyStorageAdapter());
  return _adapterPromise;
};

/** Build a collision-resistant object key for a user garment derivative. */
export const buildClothingObjectKey = ({
  auth0Id,
  clothingId,
  variant = "display",
  ext = "png",
}) => {
  const safeUser = String(auth0Id || "unknown").replace(/[^a-zA-Z0-9_-]/g, "");
  const safeId = String(clothingId || "new").replace(/[^a-zA-Z0-9_-]/g, "");
  return `clothes/${safeUser}/${safeId}/${variant}.${ext}`;
};
