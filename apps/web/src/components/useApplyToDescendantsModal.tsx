'use client';

import { useCallback, useRef, useState } from 'react';

import { Button, Modal, ModalDialogContent, Text } from '@metaboost/ui';

export type ApplyToDescendantsModalLabels = {
  prompt: string;
  thisBucketOnly: string;
  allSubBuckets: string;
};

export function useApplyToDescendantsModal(options: {
  loading: boolean;
  labels: ApplyToDescendantsModalLabels;
  onResolved: (enable: boolean, applyToDescendants: boolean) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const forEnableRef = useRef(true);

  const openFor = useCallback((enable: boolean) => {
    forEnableRef.current = enable;
    setIsOpen(true);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const dismiss = useCallback(() => {
    if (!options.loading) {
      setIsOpen(false);
    }
  }, [options.loading]);

  const confirm = useCallback(
    async (applyToDescendants: boolean) => {
      try {
        await options.onResolved(forEnableRef.current, applyToDescendants);
      } finally {
        setIsOpen(false);
      }
    },
    [options.onResolved]
  );

  const modal = isOpen ? (
    <Modal withBackdrop backdropOpaque onClose={options.loading ? undefined : dismiss}>
      <ModalDialogContent
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={options.loading}
              onClick={() => {
                void confirm(false);
              }}
            >
              {options.labels.thisBucketOnly}
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={options.loading}
              onClick={() => {
                void confirm(true);
              }}
            >
              {options.labels.allSubBuckets}
            </Button>
          </>
        }
      >
        <Text as="p">{options.labels.prompt}</Text>
      </ModalDialogContent>
    </Modal>
  ) : null;

  return { openFor, open, dismiss, confirm, modal };
}
