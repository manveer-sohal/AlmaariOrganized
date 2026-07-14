import { Clothes, User } from "../models/Users.js";
import { hasRichStylingFields } from "../utils/normalizeClothingAnalysisResponse.js";
import { enrichClothingStyling } from "./stylingEnrichment.service.js";

export const BACKFILL_MODES = ["missing-only", "failed-and-missing"];
export const DEFAULT_BACKFILL_MODE = "missing-only";
export const DEFAULT_BACKFILL_CONCURRENCY = 3;

/**
 * Meaningful rich styling metadata on a clothing document.
 */
export const clothingHasMeaningfulRichMetadata = (item) =>
  hasRichStylingFields(item?.stylingMetadata || {});

/**
 * Classify whether a clothing item is eligible for backfill.
 */
export const classifyBackfillItem = (
  item,
  { mode = DEFAULT_BACKFILL_MODE, force = false } = {},
) => {
  const meta = item?.stylingMetadata;
  const status = meta?.enrichmentStatus;
  const hasRich = clothingHasMeaningfulRichMetadata(item);

  if (force) {
    return { eligible: true, reason: "force" };
  }

  if (!meta) {
    return { eligible: true, reason: "missing_styling_metadata" };
  }

  if (status === "completed") {
    if (hasRich) {
      return { eligible: false, reason: "already_completed" };
    }
    return { eligible: true, reason: "completed_without_rich" };
  }

  if (status === "failed") {
    if (mode === "failed-and-missing") {
      return { eligible: true, reason: "failed" };
    }
    return { eligible: false, reason: "failed_excluded_by_mode" };
  }

  if (status === "processing") {
    return { eligible: false, reason: "processing" };
  }

  // pending / unset status
  if (!hasRich) {
    return {
      eligible: true,
      reason: status === "pending" ? "pending_without_rich" : "missing_rich_metadata",
    };
  }

  return { eligible: false, reason: "has_rich_metadata" };
};

export const parseBackfillArgs = (argv = []) => {
  const options = {
    auth0Id: null,
    mode: DEFAULT_BACKFILL_MODE,
    limit: null,
    dryRun: false,
    force: false,
    concurrency: DEFAULT_BACKFILL_CONCURRENCY,
    yes: false,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--yes" || arg === "-y") {
      options.yes = true;
      continue;
    }

    if (arg.startsWith("--user=")) {
      options.auth0Id = arg.slice("--user=".length).trim();
      continue;
    }
    if (arg.startsWith("--mode=")) {
      options.mode = arg.slice("--mode=".length).trim();
      continue;
    }
    if (arg.startsWith("--limit=")) {
      const value = Number(arg.slice("--limit=".length));
      options.limit = Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
      continue;
    }
    if (arg.startsWith("--concurrency=")) {
      const value = Number(arg.slice("--concurrency=".length));
      options.concurrency =
        Number.isFinite(value) && value > 0
          ? Math.floor(value)
          : DEFAULT_BACKFILL_CONCURRENCY;
      continue;
    }
  }

  return options;
};

export const buildBackfillPlan = (items, options = {}) => {
  const mode = options.mode || DEFAULT_BACKFILL_MODE;
  const force = Boolean(options.force);
  const limit =
    options.limit != null && Number(options.limit) > 0
      ? Math.floor(Number(options.limit))
      : null;

  const classified = items.map((item) => {
    const decision = classifyBackfillItem(item, { mode, force });
    return {
      item,
      eligible: decision.eligible,
      reason: decision.reason,
    };
  });

  const eligibleAll = classified.filter((entry) => entry.eligible);
  const skipped = classified.filter((entry) => !entry.eligible);
  const eligible =
    limit != null ? eligibleAll.slice(0, limit) : eligibleAll;
  const limitedOut = eligibleAll.slice(eligible.length).map((entry) => ({
    ...entry,
    eligible: false,
    reason: "limit_excluded",
  }));

  return {
    mode,
    force,
    total: items.length,
    eligible,
    skipped: [...skipped, ...limitedOut],
    eligibleCount: eligible.length,
    skippedCount: skipped.length + limitedOut.length,
  };
};

export const formatBackfillSummary = ({
  auth0Id,
  plan,
  dryRun = false,
  concurrency = DEFAULT_BACKFILL_CONCURRENCY,
}) => {
  const lines = [
    `User:`,
    `${auth0Id}`,
    ``,
    `Wardrobe:`,
    `${plan.total} items`,
    ``,
    `Eligible:`,
    `${plan.eligibleCount}`,
    ``,
    `Skipped:`,
    `${plan.skippedCount}`,
    ``,
    `Mode:`,
    `${plan.mode}${plan.force ? " (force)" : ""}${dryRun ? " [dry-run]" : ""}`,
    ``,
    `Concurrency:`,
    `${concurrency}`,
  ];
  return lines.join("\n");
};

/**
 * Bounded concurrency worker pool. Does not Promise.all the entire list at once.
 */
export const runWithConcurrency = async (
  items,
  concurrency,
  workerFn,
) => {
  const limit = Math.max(1, Math.min(concurrency || 1, items.length || 1));
  const results = new Array(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await workerFn(items[index], index);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    runWorker(),
  );
  await Promise.all(workers);
  return results;
};

const resolveProcessOutcome = (item, result, force) => {
  if (!result) {
    return { status: "failed", reason: "enrichment_returned_null" };
  }

  const status = result.stylingMetadata?.enrichmentStatus;
  if (status === "completed") {
    return { status: "completed", reason: "completed" };
  }
  if (status === "failed") {
    return {
      status: "failed",
      reason: result.stylingMetadata?.enrichmentError || "failed",
    };
  }

  const prior = item.stylingMetadata?.enrichmentStatus;
  if (prior === "completed" && !force) {
    return { status: "skipped", reason: "already_completed" };
  }
  if (status === "processing" || prior === "processing") {
    return { status: "skipped", reason: "in_progress" };
  }

  return {
    status: "failed",
    reason: status || "unexpected_status",
  };
};

/**
 * Load wardrobe for an Auth0 user and build a backfill plan.
 */
export const prepareBackfillForUser = async ({
  auth0Id,
  mode = DEFAULT_BACKFILL_MODE,
  limit = null,
  force = false,
}) => {
  if (!auth0Id) {
    throw { status: 400, message: "--user=<auth0Id> is required" };
  }
  if (!BACKFILL_MODES.includes(mode)) {
    throw {
      status: 400,
      message: `Invalid mode. Expected one of: ${BACKFILL_MODES.join(", ")}`,
    };
  }

  const user = await User.findOne({ auth0Id }).lean();
  if (!user) {
    throw { status: 404, message: `User not found for auth0Id: ${auth0Id}` };
  }

  const items = await Clothes.find({ userId: user._id })
    .sort({ createdAt: 1 })
    .lean();

  const plan = buildBackfillPlan(items, { mode, limit, force });

  return { user, items, plan };
};

/**
 * Run the backfill using the shared enrichClothingStyling pipeline.
 */
export const runStylingMetadataBackfill = async ({
  auth0Id,
  mode = DEFAULT_BACKFILL_MODE,
  limit = null,
  force = false,
  dryRun = false,
  concurrency = DEFAULT_BACKFILL_CONCURRENCY,
  onProgress,
  enrichFn = enrichClothingStyling,
}) => {
  const startedAt = Date.now();
  const { user, plan } = await prepareBackfillForUser({
    auth0Id,
    mode,
    limit,
    force,
  });

  const totals = {
    started: plan.eligibleCount,
    completed: 0,
    skipped: plan.skippedCount,
    failed: 0,
  };

  if (dryRun) {
    const dryResults = plan.eligible.map((entry, index) => {
      const row = {
        index: index + 1,
        total: plan.eligibleCount,
        id: String(entry.item._id),
        type: entry.item.type || "Unknown",
        status: "skipped",
        reason: `dry_run:${entry.reason}`,
      };
      onProgress?.(row);
      return row;
    });

    const elapsedMs = Date.now() - startedAt;
    return {
      auth0Id,
      userId: String(user._id),
      dryRun: true,
      plan,
      results: dryResults,
      skippedDetails: plan.skipped.map((entry) => ({
        id: String(entry.item._id),
        type: entry.item.type || "Unknown",
        reason: entry.reason,
      })),
      totals: {
        ...totals,
        completed: 0,
        skipped: plan.skippedCount + plan.eligibleCount,
        failed: 0,
      },
      elapsedMs,
      averageMsPerItem: plan.eligibleCount
        ? elapsedMs / plan.eligibleCount
        : 0,
    };
  }

  const results = await runWithConcurrency(
    plan.eligible,
    concurrency,
    async (entry, index) => {
      const label = entry.item.type || "Unknown";
      try {
        const enriched = await enrichFn(entry.item._id, { force });
        const outcome = resolveProcessOutcome(entry.item, enriched, force);
        if (outcome.status === "completed") totals.completed += 1;
        else if (outcome.status === "skipped") totals.skipped += 1;
        else totals.failed += 1;

        const row = {
          index: index + 1,
          total: plan.eligibleCount,
          id: String(entry.item._id),
          type: label,
          status: outcome.status,
          reason: outcome.reason,
        };
        onProgress?.(row);
        return row;
      } catch (error) {
        totals.failed += 1;
        const row = {
          index: index + 1,
          total: plan.eligibleCount,
          id: String(entry.item._id),
          type: label,
          status: "failed",
          reason: error?.message || "unexpected_error",
        };
        onProgress?.(row);
        return row;
      }
    },
  );

  const elapsedMs = Date.now() - startedAt;

  return {
    auth0Id,
    userId: String(user._id),
    dryRun: false,
    plan,
    results,
    skippedDetails: plan.skipped.map((entry) => ({
      id: String(entry.item._id),
      type: entry.item.type || "Unknown",
      reason: entry.reason,
    })),
    totals,
    elapsedMs,
    averageMsPerItem: plan.eligibleCount ? elapsedMs / plan.eligibleCount : 0,
  };
};
