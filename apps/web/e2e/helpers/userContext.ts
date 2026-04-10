import type { TestInfo } from '@playwright/test';

const USER_ROLE_ANNOTATION_TYPE = 'user-role';

/**
 * Set the user context (role / CRUD permissions) for the current test so the E2E HTML report
 * shows "User context: <description>" in the test section and summary.
 * Call at the start of each test (e.g. after login or for unauthenticated).
 *
 * Standard descriptions for web:
 * - "unauthenticated"
 * - "bucket-owner"
 * - "bucket-admin (bucket CRUD)"
 */
export function setE2EUserContext(testInfo: TestInfo, description: string): void {
  const trimmed = description.trim();
  if (trimmed !== '') {
    testInfo.annotations.push({ type: USER_ROLE_ANNOTATION_TYPE, description: trimmed });
  }
}
