export function isClient(): boolean {
  return typeof document !== 'undefined';
}
