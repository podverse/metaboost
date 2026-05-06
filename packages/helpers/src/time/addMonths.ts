/**
 * Calendar-month addition with day clamping to the last valid day of the target month
 * (e.g. Jan 31 + 1 month → Feb 29 in a leap year, Feb 28 otherwise).
 */
export function addMonths(baseDate: Date, months: number): Date {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();
  const hours = baseDate.getHours();
  const minutes = baseDate.getMinutes();
  const seconds = baseDate.getSeconds();
  const milliseconds = baseDate.getMilliseconds();

  const targetMonthIndex = month + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;

  const lastDayInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayInTargetMonth);

  return new Date(targetYear, normalizedMonth, clampedDay, hours, minutes, seconds, milliseconds);
}
