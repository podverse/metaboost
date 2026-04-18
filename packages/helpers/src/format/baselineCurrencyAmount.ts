/**
 * Formats a baseline summary amount for display using conventional fraction digits per currency.
 * Fiat codes use Intl currency formatting (ISO 4217 minor units). BTC uses up to 8 fractional digits + " BTC".
 */

function formatFallbackDecimal(amount: number, locale: string | undefined): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatBtcBaseline(amount: number, locale: string | undefined): string {
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  }).format(amount);
  return `${formatted} BTC`;
}

export function formatBaselineCurrencyAmount(
  amount: number | string,
  currencyCode: string,
  locale?: string
): string {
  const parsed =
    typeof amount === 'number'
      ? amount
      : Number.parseFloat(typeof amount === 'string' ? amount.trim() : '');
  if (!Number.isFinite(parsed)) {
    if (typeof amount === 'string' && amount.trim() !== '') {
      return amount.trim();
    }
    return formatFallbackDecimal(0, locale);
  }

  const code = currencyCode.trim().toUpperCase();
  if (code === '') {
    return formatFallbackDecimal(parsed, locale);
  }

  if (code === 'BTC') {
    return formatBtcBaseline(parsed, locale);
  }

  try {
    return new Intl.NumberFormat(locale, {
      currency: code,
      currencyDisplay: 'narrowSymbol',
      style: 'currency',
    }).format(parsed);
  } catch {
    const formatted = formatFallbackDecimal(parsed, locale);
    return `${formatted} ${code}`;
  }
}
