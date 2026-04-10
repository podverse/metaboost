/**
 * Translate a key for a locale. Supports dot-notation keys and {param} interpolation.
 * Backend only: uses loadMessages which reads from disk.
 */

import { loadMessages } from './load.js';

function getNested(obj: unknown, keyPath: string): unknown {
  if (obj === null || typeof obj !== 'object') return undefined;
  const parts = keyPath.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function interpolate(text: string, params: Record<string, string | number>): string {
  let result = text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * Return the message for a locale and key. Key is dot-notation (e.g. 'password.required', 'email.verifySubject').
 * If params are provided, replaces {key} placeholders in the message.
 */
export function t(locale: string, key: string, params?: Record<string, string | number>): string {
  const messages = loadMessages(locale);
  const value = getNested(messages, key);
  const text = typeof value === 'string' ? value : key;
  if (params !== undefined && Object.keys(params).length > 0) {
    return interpolate(text, params);
  }
  return text;
}
