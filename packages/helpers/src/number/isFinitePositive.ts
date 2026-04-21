export function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
