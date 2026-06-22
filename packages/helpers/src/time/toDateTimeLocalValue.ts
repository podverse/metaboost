/**
 * Format a value for `<input type="datetime-local">` using the environment's
 * local calendar fields (not UTC). Matches Podverse `toDatetimeLocalInputValue`.
 */
export function toDateTimeLocalValue(value: Date | number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
