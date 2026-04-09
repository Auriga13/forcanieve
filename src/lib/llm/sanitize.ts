const MAX_LENGTH = 2000;

export function sanitizeLlmOutput(raw: string): string {
  // Strip any HTML tags
  let clean = raw.replace(/<[^>]*>/g, "");

  // Strip markdown links with URLs (prevent link injection)
  clean = clean.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Limit length
  clean = clean.slice(0, MAX_LENGTH);

  // Normalize whitespace
  clean = clean.replace(/\n{3,}/g, "\n\n").trim();

  return clean;
}
