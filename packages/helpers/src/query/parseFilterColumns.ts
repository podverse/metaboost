type FilterColumnsParams = {
  filterColumns?: string;
};

/**
 * Parses filterColumns and returns only valid column ids.
 * When empty or invalid, returns validColumnIds (all columns).
 */
export function parseFilterColumns(
  resolvedSearchParams: FilterColumnsParams,
  validColumnIds: string[]
): string[] {
  const raw = resolvedSearchParams.filterColumns ?? '';
  if (raw.trim() === '') {
    return validColumnIds;
  }
  const parsed = raw
    .split(',')
    .map((value) => value.trim())
    .filter((id) => validColumnIds.includes(id));
  return parsed.length > 0 ? parsed : validColumnIds;
}
