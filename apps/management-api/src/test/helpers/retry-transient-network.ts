type ErrorWithCode = Error & { code?: string };

const TRANSIENT_ERROR_CODES = new Set(['ECONNRESET', 'EPIPE', 'ETIMEDOUT']);
const TRANSIENT_ERROR_TEXT = /(socket hang up|connection reset|network socket|terminated)/i;

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isTransientNetworkError = (error: Error | ErrorWithCode): boolean => {
  const errorCode = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  if (errorCode !== undefined && TRANSIENT_ERROR_CODES.has(errorCode)) {
    return true;
  }

  return TRANSIENT_ERROR_TEXT.test(error.message);
};

export const retryTransientNetwork = async <T>(
  label: string,
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> => {
  let attempt = 1;
  let lastError: Error | null = null;

  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      lastError = error;

      const isRetryable = isTransientNetworkError(error);
      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = 100 * attempt;
      console.warn(
        `[test-retry] ${label} failed with "${error.message}". ` +
          `Retrying ${attempt + 1}/${maxAttempts} after ${delayMs}ms.`
      );
      await sleep(delayMs);
      attempt += 1;
    }
  }

  if (lastError !== null) {
    throw lastError;
  }

  throw new Error(`[test-retry] ${label} failed without an error object.`);
};
