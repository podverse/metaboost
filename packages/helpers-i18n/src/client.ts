/**
 * Browser-safe entry: human-readable date formatting only.
 * Import from `@metaboost/helpers-i18n/client` in Next.js client bundles so the graph
 * does not pull `backend/` (fs, compiled JSON loaders).
 */

export { formatDateTimeReadable, type FormatDateTimeOptions } from './format-date.js';
