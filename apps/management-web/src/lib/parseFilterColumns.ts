import { parseFilterColumns as parseSharedFilterColumns } from '@metaboost/helpers';

/**
 * Parses filterColumns from search params / persisted state and returns only valid column ids.
 * When empty or invalid, returns validColumnIds (all columns).
 */
export function parseFilterColumns(
  resolvedSearchParams: { filterColumns?: string },
  validColumnIds: string[]
): string[] {
  return parseSharedFilterColumns(resolvedSearchParams, validColumnIds);
}
