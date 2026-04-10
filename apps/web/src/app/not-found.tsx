import { CenterInViewport, Text } from '@metaboost/ui';

/**
 * Custom 404 page shown when notFound() is called from any route.
 * Includes data-testid="not-found-page" so E2E can assert the 404 page loaded.
 */
export default function NotFound() {
  return (
    <CenterInViewport title="Page not found" contentMaxWidth="readable" contentTextAlign="center">
      <div data-testid="not-found-page">
        <Text>This page could not be found.</Text>
      </div>
    </CenterInViewport>
  );
}
