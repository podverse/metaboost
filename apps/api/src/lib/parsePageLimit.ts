type PageLimitQuery = {
  page?: unknown;
  limit?: unknown;
};

export type ParsedPageLimit = {
  page: number;
  limit: number;
  offset: number;
};

export function parsePageLimit(
  query: PageLimitQuery,
  options: {
    defaultLimit: number;
    maxLimit: number;
  }
): ParsedPageLimit {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(
    options.maxLimit,
    Math.max(1, Number(query.limit) || options.defaultLimit)
  );
  return { page, limit, offset: (page - 1) * limit };
}
