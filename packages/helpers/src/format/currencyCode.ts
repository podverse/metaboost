/**
 * Normalizes stored currency labels to ISO-style codes for display (e.g. "Bitcoin" -> BTC).
 */
export function normalizeCurrencyCodeForDisplay(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return '';
  }
  const trimmed = raw.trim();
  if (trimmed === '') {
    return '';
  }
  const upper = trimmed.toUpperCase();
  if (upper === 'BITCOIN' || upper === 'XBT') {
    return 'BTC';
  }
  return upper;
}
