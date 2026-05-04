/**
 * Calendar-month addition (native `Date#setMonth` semantics, including end-of-month rollover).
 */
export function addMonths(baseDate: Date, months: number): Date {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() + months);
  return date;
}
