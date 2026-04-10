/**
 * Test-only JWT secrets for Metaboost integration and E2E tests. Must satisfy
 * validateJwtSecret (length >= 32, no weak substrings). Used so all tests share
 * the same API and management-api secrets without importing from multiple places.
 */
export const TEST_JWT_SECRET_API = '94db2b9f-583b-46c3-b1cd-9752b886cb31';
export const TEST_JWT_SECRET_MANAGEMENT_API = '074f87f3-6ad2-4294-94f5-1a648a045be1';
