function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseSmartSearch(raw: unknown): {
  term: string;
  wholeWord: boolean;
} {
  const input = String(raw ?? '');
  const wholeWord = /\s$/.test(input);
  const term = input.trim().toLowerCase();
  return { term, wholeWord };
}

/**
 * Smart search matcher used by tables:
 * - Normal input behaves like a substring search.
 * - If the input ends with whitespace (e.g. "test "), it becomes whole-word matching ("testing" won't match).
 */
export function matchesSmartSearch(haystackRaw: string, rawSearch: unknown) {
  const { term, wholeWord } = parseSmartSearch(rawSearch);
  if (!term) return true;

  const haystack = String(haystackRaw ?? '').toLowerCase();
  if (!wholeWord) return haystack.includes(term);

  const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
  return re.test(haystack);
}
