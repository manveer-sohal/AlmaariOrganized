//controller to generate ai thoughts for the selected items
// controllers/aiStylistController.js
const STYLE_PROFILES = {
  casual: {
    colourLimit: 3,
    allowLayering: true,
    tone: "relaxed",
    notes: ["Comfort-first silhouettes", "Soft colour transitions"],
  },
  street: {
    colourLimit: 4,
    allowLayering: true,
    tone: "confident",
    notes: ["Statement pieces encouraged", "Contrast and layering welcomed"],
  },
  formal: {
    colourLimit: 2,
    allowLayering: false,
    tone: "refined",
    notes: ["Clean lines", "Minimal colour palette"],
  },
};

function parseUserIntent(message) {
  if (/street/i.test(message)) return { style: "street" };
  if (/casual/i.test(message)) return { style: "casual" };
  if (/formal/i.test(message)) return { style: "formal" };
  return null;
}

export const generateAiThoughts = async (req, res) => {
  try {
    const { selectedItems } = req.body;

    // -----------------------------
    // 1. Handle empty state gracefully
    // -----------------------------
    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      return res.status(200).json({
        stage: "idle",
        summary: "No items selected yet.",
        insights: [],
        nextStep: "Start by selecting one core piece (top or bottoms).",
        confidence: "low",
      });
    }

    // Flatten items
    const items = selectedItems.flat();

    if (items.length === 0) {
      return res.status(200).json({
        stage: "idle",
        summary: "No items selected yet. ",
        insights: [],
        nextStep: "Start by selecting one core piece (top or bottoms). ",
        confidence: "low",
      });
    }

    // -----------------------------
    // 2. Normalize by slot
    // -----------------------------
    const bySlot = {};
    items.forEach((item) => {
      if (!bySlot[item.slot]) bySlot[item.slot] = [];
      bySlot[item.slot].push(item);
    });

    const slotsUsed = Object.keys(bySlot);
    const selectedCount = items.length;

    // -----------------------------
    // 3. Extract features
    // -----------------------------
    const colours = items.map((i) => i.colour).filter(Boolean);
    const uniqueColours = Array.from(new Set(colours));

    const types = items.map((i) => i.type).filter(Boolean);

    const neutrals = uniqueColours.filter((c) =>
      /black|white|beige|grey|gray|navy/i.test(c),
    );

    // -----------------------------
    // 4. Determine outfit stage
    // -----------------------------
    let stage = "build";
    if (selectedCount <= 1) stage = "start";
    else if (selectedCount >= 4) stage = "refine";

    // -----------------------------
    // 5. Build insights
    // -----------------------------
    const insights = [];

    // Slot awareness
    Object.entries(bySlot).forEach(([slot, slotItems]) => {
      if (slotItems.length > 1) {
        insights.push(
          `You have multiple items selected for ${slot}. Consider narrowing to one. Let me know if you want a layered look. `,
        );
      }
    });

    // Colour balance
    if (uniqueColours.length >= 4) {
      insights.push(
        "The colour palette is getting busy. Limiting to 2–3 core colours can improve cohesion. Let me know if you want it colourful. ",
      );
    } else if (uniqueColours.length === 1) {
      insights.push(
        "The outfit is very monochrome. Adding a secondary colour could add interest. ",
      );
    }

    // Neutral logic
    if (neutrals.length > 0 && uniqueColours.length > neutrals.length) {
      insights.push(
        "Neutrals detected — they help anchor the outfit and balance bolder colours. ",
      );
    }

    // Basic layering heuristic
    if (
      types.some((t) => t.includes("jacket")) &&
      types.some((t) => t.includes("shorts"))
    ) {
      insights.push(
        "Layering a jacket with shorts works best in mild weather or with lighter fabrics. ",
      );
    }

    // -----------------------------
    // 6. Determine next action
    // -----------------------------
    let nextStep = "Refine the outfit by adjusting colours or textures. ";

    if (stage === "start") {
      nextStep =
        "Add a complementary piece (top or bottoms) to start forming the outfit. ";
    } else if (stage === "build") {
      if (!bySlot.feet) {
        nextStep = "Add footwear to ground the outfit. ";
      } else if (uniqueColours.length <= 2) {
        nextStep =
          "Consider adding one accent colour or texture for visual interest. ";
      } else {
        nextStep =
          "Try swapping one bold piece for a neutral to tighten the look. ";
      }
    } else if (stage === "refine") {
      nextStep =
        "Fine-tune the outfit — small swaps or accessories can elevate it. ";
    }

    // -----------------------------
    // 7. Confidence score (simple heuristic)
    // -----------------------------
    let confidence = "medium";
    if (uniqueColours.length <= 3 && slotsUsed.length >= 3) {
      confidence = "high";
    } else if (selectedCount <= 1) {
      confidence = "low";
    }

    // -----------------------------
    // 8. Summary
    // -----------------------------
    const summary = `Current outfit includes ${slotsUsed.join(
      ", ",
    )} with ${uniqueColours.join(", ")} tones.`;

    // -----------------------------
    // 9. Final response
    // -----------------------------
    return res.status(200).json({
      stage,
      summary,
      insights,
      nextStep,
      confidence,
    });
  } catch (error) {
    console.error("AI Stylist error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
