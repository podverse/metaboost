/**
 * API runtime logging. Centralizes stderr output so a structured backend logger can be
 * swapped in without touching feature modules.
 */
export const logger = {
  error(message: string, context?: Record<string, unknown>): void {
    if (context !== undefined) {
      console.error(message, context);
    } else {
      console.error(message);
    }
  },
};
