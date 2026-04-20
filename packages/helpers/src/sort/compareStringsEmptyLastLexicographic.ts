import type { AscDescSortOrder } from '../query/sortOrderQueryParam.js';

/**
 * Comparator for sorting string keys (e.g. ISO timestamps from `Date.prototype.toISOString()`).
 *
 * **Empty string** means “missing” and sorts **after** any non-empty value (stable tie-break:
 * both empty ⇒ equal). Order follows **lexicographic** `<`/`>` rules, which matches
 * chronological order for ISO-8601 strings from `toISOString()`.
 */
export function compareStringsEmptyLastLexicographic(
  a: string,
  b: string,
  order: AscDescSortOrder
): number {
  const dir = order === 'asc' ? 1 : -1;
  if (a === '' && b === '') {
    return 0;
  }
  if (a === '') {
    return 1;
  }
  if (b === '') {
    return -1;
  }
  return dir * (a < b ? -1 : a > b ? 1 : 0);
}
