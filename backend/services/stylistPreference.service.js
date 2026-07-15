import connectMongoDB from "../libs/mongodb.js";
import { Clothes } from "../models/Users.js";
import { StylistFeedback } from "../models/StylistFeedback.js";
import { flattenColours, outfitSignature } from "../utils/aiStylistScoring.js";

const FEEDBACK_LIMIT = 50;
const RECENT_NEGATIVE_LIMIT = 10;
const SMOOTHING_K = 2;

const emptyCounts = () => ({ pos: 0, neg: 0 });

const bump = (map, key, rating) => {
  if (!key) return;
  const normalized = String(key).toLowerCase().trim();
  if (!normalized) return;
  if (!map[normalized]) map[normalized] = emptyCounts();
  if (rating === "positive") map[normalized].pos += 1;
  else map[normalized].neg += 1;
};

const toWeight = ({ pos = 0, neg = 0 }) =>
  (pos - neg) / (pos + neg + SMOOTHING_K);

const topKeys = (weightMap, direction, limit = 5) =>
  Object.entries(weightMap)
    .filter(([, weight]) =>
      direction === "liked" ? weight > 0.05 : weight < -0.05,
    )
    .sort((a, b) =>
      direction === "liked" ? b[1] - a[1] : a[1] - b[1],
    )
    .slice(0, limit)
    .map(([key]) => key);

/**
 * Builds a soft preference profile from recent stylist thumbs feedback.
 * Cold start returns empty maps so preferenceMatch stays neutral (0.5).
 */
export const getUserStyleProfile = async (auth0Id, preferences = {}) => {
  await connectMongoDB();

  const allFeedback = await StylistFeedback.find({ auth0Id })
    .sort({ createdAt: -1 })
    .limit(FEEDBACK_LIMIT)
    .lean();

  if (!allFeedback.length) {
    return {
      typeWeights: {},
      colourWeights: {},
      itemWeights: {},
      styleWeights: {},
      recentNegativeSignatures: [],
      summary: "",
      isEmpty: true,
    };
  }

  const { occasion, style } = preferences;
  const contextual = allFeedback.filter(
    (row) =>
      (!occasion || !row.occasion || row.occasion === occasion) &&
      (!style || !row.style || row.style === style),
  );
  const feedbackRows = contextual.length > 0 ? contextual : allFeedback;

  const itemIdSet = new Set();
  feedbackRows.forEach((row) => {
    (row.outfitItemIds || []).forEach((id) => itemIdSet.add(String(id)));
  });

  const clothingDocs = itemIdSet.size
    ? await Clothes.find(
        { _id: { $in: [...itemIdSet] } },
        { type: 1, colour: 1 },
      ).lean()
    : [];

  const clothesById = new Map(
    clothingDocs.map((doc) => [doc._id.toString(), doc]),
  );

  const typeCounts = {};
  const colourCounts = {};
  const itemCounts = {};
  const styleCounts = {};

  feedbackRows.forEach((row) => {
    bump(styleCounts, row.style, row.rating);

    (row.outfitItemIds || []).forEach((rawId) => {
      const id = String(rawId);
      bump(itemCounts, id, row.rating);
      const item = clothesById.get(id);
      if (!item) return;
      bump(typeCounts, item.type, row.rating);
      flattenColours(item).forEach((colour) =>
        bump(colourCounts, colour, row.rating),
      );
    });
  });

  const typeWeights = Object.fromEntries(
    Object.entries(typeCounts).map(([key, counts]) => [key, toWeight(counts)]),
  );
  const colourWeights = Object.fromEntries(
    Object.entries(colourCounts).map(([key, counts]) => [
      key,
      toWeight(counts),
    ]),
  );
  const itemWeights = Object.fromEntries(
    Object.entries(itemCounts).map(([key, counts]) => [key, toWeight(counts)]),
  );
  const styleWeights = Object.fromEntries(
    Object.entries(styleCounts).map(([key, counts]) => [key, toWeight(counts)]),
  );

  const recentNegativeSignatures = allFeedback
    .filter((row) => row.rating === "negative")
    .slice(0, RECENT_NEGATIVE_LIMIT)
    .map((row) => {
      if (row.outfitSignature) return row.outfitSignature;
      return [...(row.outfitItemIds || [])].map(String).sort().join("|");
    })
    .filter(Boolean);

  const liked = [
    ...topKeys(colourWeights, "liked", 3),
    ...topKeys(typeWeights, "liked", 3),
  ];
  const avoided = [
    ...topKeys(colourWeights, "disliked", 3),
    ...topKeys(typeWeights, "disliked", 3),
  ];

  const summaryParts = [];
  if (liked.length) summaryParts.push(`User likes: ${liked.join(", ")}`);
  if (avoided.length) summaryParts.push(`User avoids: ${avoided.join(", ")}`);

  return {
    typeWeights,
    colourWeights,
    itemWeights,
    styleWeights,
    recentNegativeSignatures,
    summary: summaryParts.join("; "),
    isEmpty: false,
  };
};

export const signatureFromItemIds = (itemIds) =>
  outfitSignature(itemIds.map((id) => ({ _id: id })));
