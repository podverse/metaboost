'use client';

import { LoadingSpinner } from '../../feedback/LoadingSpinner';
import { Modal } from './Modal';

/**
 * Full-window transparent overlay with an extra-large centered loading spinner.
 * Use with NavigationProvider to show while client-side navigation is in progress.
 * Non-blocking: pointer-events none so the user can still interact with the page.
 */
export function NavigationLoadingOverlay() {
  return (
    <Modal withBackdrop={false} clickThrough contentTransparent>
      <LoadingSpinner size="xl" />
    </Modal>
  );
}
