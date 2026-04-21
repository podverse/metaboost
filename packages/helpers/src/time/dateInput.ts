const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateInputYyyyMmDd(value: string): boolean {
  return DATE_INPUT_PATTERN.test(value);
}

function parseDateInputParts(value: string): { year: number; month: number; day: number } | null {
  if (!isDateInputYyyyMmDd(value)) return null;
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return { year, month, day };
}

export function toUtcIsoForLocalDateStart(value: string): string | null {
  const parts = parseDateInputParts(value);
  if (parts === null) return null;
  const date = new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toUtcIsoForLocalDateEnd(value: string): string | null {
  const parts = parseDateInputParts(value);
  if (parts === null) return null;
  const date = new Date(parts.year, parts.month - 1, parts.day, 23, 59, 59, 999);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
