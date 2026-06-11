/**
 * Normalizes multipart form fields that may be a plain string or legacy JSON array.
 */
export const parseStringField = (value) => {
  if (value == null || value === "") return "";
  if (typeof value !== "string") return String(value);

  const trimmed = value.trim();
  if (!trimmed.startsWith("[")) return trimmed;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed[0] != null ? String(parsed[0]).trim() : "";
    }
    if (typeof parsed === "string") return parsed.trim();
  } catch {
    return trimmed;
  }

  return trimmed;
};
