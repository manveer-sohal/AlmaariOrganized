/**
 * Dry-run-safe migration scaffold: Base64 imageSrc → object storage.
 *
 * Default mode is dry-run (no writes). Never logs image bodies.
 *
 * Usage:
 *   node scripts/migrateImagesToObjectStorage.js
 *   node scripts/migrateImagesToObjectStorage.js --write --limit=10
 *   node scripts/migrateImagesToObjectStorage.js --write --user=<auth0Id>
 *   node scripts/migrateImagesToObjectStorage.js --write --id=<clothingObjectId>
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Clothes, User } from "../models/Users.js";
import {
  getImageStorageAdapter,
  hashBuffer,
  buildClothingObjectKey,
} from "../services/imageStorage.service.js";

const args = process.argv.slice(2);
const write = args.includes("--write");
const limitArg = args.find((a) => a.startsWith("--limit="));
const userArg = args.find((a) => a.startsWith("--user="));
const idArg = args.find((a) => a.startsWith("--id="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 25;
const auth0Id = userArg ? userArg.split("=")[1] : null;
const clothingId = idArg ? idArg.split("=")[1] : null;

const stripDataUrl = (src) => {
  if (!src?.startsWith("data:")) return null;
  const i = src.indexOf(",");
  if (i < 0) return null;
  return {
    header: src.slice(0, i),
    b64: src.slice(i + 1),
  };
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI required");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const adapter = await getImageStorageAdapter();

  const filter = {
    imageSrc: { $regex: /^data:image\// },
    $or: [
      { imageStorage: { $exists: false } },
      { "imageStorage.migratedAt": null },
      { "imageStorage.provider": "legacy-base64" },
    ],
  };

  if (clothingId) {
    filter._id = clothingId;
  }
  if (auth0Id) {
    const user = await User.findOne({ auth0Id }).select("_id").lean();
    if (!user) {
      console.error("User not found");
      process.exit(1);
    }
    filter.userId = user._id;
  }

  const cursor = Clothes.find(filter).limit(limit).cursor();
  const summary = {
    scanned: 0,
    wouldMigrate: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    dryRun: !write,
    provider: adapter.provider,
  };

  for await (const doc of cursor) {
    summary.scanned += 1;
    const parsed = stripDataUrl(doc.imageSrc);
    if (!parsed) {
      summary.skipped += 1;
      continue;
    }

    let buffer;
    try {
      buffer = Buffer.from(parsed.b64, "base64");
    } catch {
      summary.errors += 1;
      continue;
    }

    const checksum = hashBuffer(buffer);
    if (doc.imageStorage?.checksum === checksum && doc.imageStorage?.displayKey) {
      summary.skipped += 1;
      continue;
    }

    const user = await User.findById(doc.userId).select("auth0Id").lean();
    const key = buildClothingObjectKey({
      auth0Id: user?.auth0Id || "unknown",
      clothingId: String(doc._id),
      variant: "display",
      ext: parsed.header.includes("png") ? "png" : "jpg",
    });

    summary.wouldMigrate += 1;
    console.log(
      JSON.stringify({
        event: write ? "migrate_write" : "migrate_dry_run",
        clothingId: String(doc._id),
        bytes: buffer.length,
        checksumPrefix: checksum.slice(0, 12),
        key,
      }),
    );

    if (!write) continue;

    if (adapter.provider === "legacy-base64") {
      console.error(
        "IMAGE_STORAGE_PROVIDER is legacy — refusing writes. Set provider=s3 and install AWS SDK.",
      );
      summary.errors += 1;
      break;
    }

    try {
      await adapter.putObject({
        key,
        body: buffer,
        contentType: parsed.header.includes("png")
          ? "image/png"
          : "image/jpeg",
      });
      const displayUrl = await adapter.getDisplayUrl(key);
      doc.imageStorage = {
        provider: "s3",
        displayKey: key,
        originalKey: key,
        thumbnailKey: null,
        displayUrl,
        thumbnailUrl: null,
        contentType: parsed.header.includes("png")
          ? "image/png"
          : "image/jpeg",
        bytes: buffer.length,
        checksum,
        migratedAt: new Date(),
      };
      // Preserve imageSrc during transition (dual-read).
      await doc.save();
      summary.migrated += 1;
    } catch (err) {
      summary.errors += 1;
      console.error(
        JSON.stringify({
          event: "migrate_error",
          clothingId: String(doc._id),
          errorMessage: err.message,
        }),
      );
    }
  }

  console.log(JSON.stringify({ event: "migrate_summary", ...summary }));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
