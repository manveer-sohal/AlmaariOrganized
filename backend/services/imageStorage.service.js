/**
 * Production-ready object-storage adapter (legacy no-op or S3).
 * Presigned uploads, HEAD verification, CDN delivery URLs.
 * Never logs credentials or presigned query strings.
 */

import { createHash } from "crypto";
import {
  DERIVATIVE_CONTENT_TYPE,
} from "../constants/imageProcessing.js";

export const hashBuffer = (buffer) =>
  createHash("sha256").update(buffer).digest("hex");

const uploadTtl = () =>
  Number(process.env.S3_UPLOAD_URL_TTL_SECONDS || 900);
const readTtl = () =>
  Number(process.env.S3_READ_URL_TTL_SECONDS || 900);
const maxUploadBytes = () =>
  Number(process.env.S3_MAX_UPLOAD_BYTES || process.env.UPLOAD_MAX_BYTES || 5_242_880);

export const createLegacyStorageAdapter = () => ({
  provider: "legacy-base64",
  async createUploadUrl() {
    throw new Error("Presigned uploads require IMAGE_STORAGE_PROVIDER=s3");
  },
  async createReadUrl() {
    return null;
  },
  async headObject() {
    return null;
  },
  async getObjectMetadata() {
    return null;
  },
  async putObject() {
    throw new Error("Object storage is not configured (IMAGE_STORAGE_PROVIDER=legacy)");
  },
  async getObjectBuffer() {
    throw new Error("Object storage is not configured");
  },
  async deleteObject() {
    return { deleted: false, reason: "legacy" };
  },
  async deleteObjects() {
    return { deleted: 0 };
  },
  async objectExists() {
    return false;
  },
  getPublicDeliveryUrl() {
    return null;
  },
});

const loadAws = async () => {
  const s3 = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return { ...s3, getSignedUrl };
};

export const createS3StorageAdapter = async () => {
  const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || process.env.REGION || "us-east-1";
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is required for s3 image storage");
  }

  const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    getSignedUrl,
  } = await loadAws();

  const client = new S3Client({ region });
  const cdnBase =
    process.env.IMAGE_CDN_BASE_URL ||
    (process.env.AWS_CLOUDFRONT_DOMAIN
      ? `https://${String(process.env.AWS_CLOUDFRONT_DOMAIN)
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "")}`
      : "");

  const getPublicDeliveryUrl = (key) => {
    if (!key || !cdnBase) return null;
    return `${cdnBase.replace(/\/$/, "")}/${key}`;
  };

  return {
    provider: "s3",
    bucket,
    region,
    maxUploadBytes: maxUploadBytes(),

    getPublicDeliveryUrl,

    async createUploadUrl({
      key,
      contentType,
      contentLength,
      expiresIn = uploadTtl(),
    }) {
      if (!key) throw new Error("object key required");
      if (!contentType || !/^image\/(jpeg|jpg|png|webp)$/i.test(contentType)) {
        throw new Error("unsupported content type");
      }
      if (contentLength != null && contentLength > maxUploadBytes()) {
        throw new Error("file exceeds maximum upload size");
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ...(contentLength != null
          ? { ContentLength: Number(contentLength) }
          : {}),
      });
      const uploadUrl = await getSignedUrl(client, command, { expiresIn });
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      return { uploadUrl, expiresAt, key, bucket, expiresIn };
    },

    async createReadUrl(key, { expiresIn = readTtl() } = {}) {
      if (!key) return null;
      const publicUrl = getPublicDeliveryUrl(key);
      if (publicUrl) return publicUrl;
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn },
      );
    },

    async headObject(key) {
      if (!key) return null;
      try {
        const out = await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        return {
          key,
          contentType: out.ContentType || null,
          contentLength: out.ContentLength ?? null,
          etag: out.ETag || null,
          lastModified: out.LastModified || null,
        };
      } catch (err) {
        if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") {
          return null;
        }
        throw err;
      }
    },

    async getObjectMetadata(key) {
      return this.headObject(key);
    },

    async putObject({ key, body, contentType = DERIVATIVE_CONTENT_TYPE }) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return { key, bucket, contentType, bytes: body?.length };
    },

    async getObjectBuffer(key) {
      const out = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      const chunks = [];
      for await (const chunk of out.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    },

    async deleteObject(key) {
      if (!key) return { deleted: false };
      try {
        await client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: key }),
        );
        return { deleted: true };
      } catch (err) {
        if (err?.$metadata?.httpStatusCode === 404) {
          return { deleted: true, alreadyMissing: true };
        }
        throw err;
      }
    },

    async deleteObjects(keys = []) {
      const unique = [...new Set(keys.filter(Boolean))];
      if (!unique.length) return { deleted: 0 };
      // S3 allows up to 1000 keys per DeleteObjects call
      let deleted = 0;
      for (let i = 0; i < unique.length; i += 1000) {
        const chunk = unique.slice(i, i + 1000);
        const out = await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: chunk.map((Key) => ({ Key })),
              Quiet: true,
            },
          }),
        );
        deleted += chunk.length - (out.Errors?.length || 0);
      }
      return { deleted };
    },

    async objectExists(key) {
      const meta = await this.headObject(key);
      return Boolean(meta);
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

/** Reset cached adapter (tests). */
export const resetImageStorageAdapterCache = () => {
  _adapterPromise = undefined;
};

export const isObjectStorageEnabled = () =>
  (process.env.IMAGE_STORAGE_PROVIDER || "legacy").toLowerCase() === "s3";

/** @deprecated use objectKeyFactory.buildClothingObjectKey */
export { buildClothingObjectKey } from "../utils/objectKeyFactory.js";
