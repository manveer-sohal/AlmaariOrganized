export const generateAiThoughts = async (req, res) => {
  try {
    const { selectedItems } = req.body;

    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      return res.status(200).json({
        stage: "idle",
        summary: "No items selected yet.",
        insights: [],
        nextStep: "Start by selecting one core piece (top or bottoms).",
        confidence: "low",
      });
    }

    const items = selectedItems.flat();
    if (items.length === 0) {
      return res.status(200).json({
        stage: "idle",
        summary: "No items selected yet.",
        insights: [],
        nextStep: "Start by selecting one core piece (top or bottoms).",
        confidence: "low",
      });
    }

    const bySlot = {};
    items.forEach((item) => {
      if (!bySlot[item.slot]) bySlot[item.slot] = [];
      bySlot[item.slot].push(item);
    });

    const slotsUsed = Object.keys(bySlot);
    const selectedCount = items.length;
    const colours = items.flatMap((i) =>
      Array.isArray(i.colour) ? i.colour : [i.colour],
    ).filter(Boolean);
    const uniqueColours = Array.from(new Set(colours));
    const neutrals = uniqueColours.filter((c) =>
      /black|white|beige|grey|gray|navy/i.test(c),
    );

    let stage = "build";
    if (selectedCount <= 1) stage = "start";
    else if (selectedCount >= 4) stage = "refine";

    const insights = [];
    Object.entries(bySlot).forEach(([slot, slotItems]) => {
      if (slotItems.length > 1) {
        insights.push(
          `You have multiple items selected for ${slot}. Consider narrowing to one.`,
        );
      }
    });

    if (uniqueColours.length >= 4) {
      insights.push(
        "The colour palette is getting busy. Limiting to 2–3 core colours can improve cohesion.",
      );
    } else if (uniqueColours.length === 1) {
      insights.push(
        "The outfit is very monochrome. Adding a secondary colour could add interest.",
      );
    }

    if (neutrals.length > 0 && uniqueColours.length > neutrals.length) {
      insights.push(
        "Neutrals detected — they help anchor the outfit and balance bolder colours.",
      );
    }

    let nextStep = "Refine the outfit by adjusting colours or textures.";
    if (stage === "start") {
      nextStep =
        "Add a complementary piece (top or bottoms) to start forming the outfit.";
    } else if (stage === "build" && !bySlot.feet) {
      nextStep = "Add footwear to ground the outfit.";
    }

    let confidence = "medium";
    if (uniqueColours.length <= 3 && slotsUsed.length >= 3) confidence = "high";
    else if (selectedCount <= 1) confidence = "low";

    return res.status(200).json({
      stage,
      summary: `Current outfit includes ${slotsUsed.join(", ")} with ${uniqueColours.join(", ")} tones.`,
      insights,
      nextStep,
      confidence,
    });
  } catch (error) {
    console.error("AI Stylist error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
