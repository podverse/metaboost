export function toDateTimeLocalValue(value: string | Date | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 16);
}
