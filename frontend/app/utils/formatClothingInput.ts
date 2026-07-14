/**
 * Title-case clothing labels, including multi-word and hyphenated names
 * (e.g. "button-up shirt" → "Button-Up Shirt").
 */
export function formatClothingInput(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  return trimmed
    .split(/(\s+)/)
    .map((chunk) => {
      if (/^\s+$/.test(chunk)) return chunk;
      return chunk
        .split("-")
        .map((part) =>
          part
            ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            : part,
        )
        .join("-");
    })
    .join("");
}
