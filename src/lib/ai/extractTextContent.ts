/**
 * Best-effort extraction of plain text from LangChain/OpenAI-style message content.
 *
 * Handles:
 * - string
 * - array content (uses first element)
 * - objects with a `text` field
 * - falls back to JSON stringification
 */
export function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content) && content.length > 0) {
    const firstContent = content[0] as unknown;

    if (typeof firstContent === "string") return firstContent;

    if (firstContent && typeof firstContent === "object" && "text" in firstContent) {
      const text = (firstContent as { text?: unknown }).text;
      return typeof text === "string" ? text : JSON.stringify(text);
    }

    return JSON.stringify(firstContent);
  }

  return JSON.stringify(content);
}
