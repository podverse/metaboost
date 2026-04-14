import type { MinimalRssParserErrorCode, MinimalRssParserErrorShape } from './types.js';

export class MinimalRssParserError extends Error {
  readonly code: MinimalRssParserErrorCode;
  readonly details?: unknown;

  constructor({ code, message, details }: MinimalRssParserErrorShape) {
    super(message);
    this.name = 'MinimalRssParserError';
    this.code = code;
    this.details = details;
  }
}
