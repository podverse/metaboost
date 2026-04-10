'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export type DeleteTarget = { id: string; displayName: string };

export type UseDeleteModalOptions = {
  /** Call API to delete; returns promise of ApiResponse<void>. */
  onDelete: (baseUrl: string, id: string) => Promise<{ ok: boolean; error?: { message?: string } }>;
  apiBaseUrl: string;
  deleteFailedMessage: string;
  /** When set, if deleted id matches currentUserId, onSelfDelete is called instead of refresh. */
  currentUserId?: string;
  /** When deleting self, called after success; app should redirect (e.g. to login) inside this. */
  onSelfDelete?: () => Promise<void>;
};

export function useDeleteModal({
  onDelete,
  apiBaseUrl,
  deleteFailedMessage,
  currentUserId,
  onSelfDelete,
}: UseDeleteModalOptions) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    if (deleteTarget === null) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const res = await onDelete(apiBaseUrl, deleteTarget.id);
    setDeleteLoading(false);
    if (res.ok) {
      setDeleteTarget(null);
      if (
        currentUserId !== undefined &&
        onSelfDelete !== undefined &&
        deleteTarget.id === currentUserId
      ) {
        await onSelfDelete();
      } else {
        router.refresh();
      }
    } else {
      setDeleteError(res.error?.message ?? deleteFailedMessage);
    }
  }, [
    deleteTarget,
    onDelete,
    apiBaseUrl,
    deleteFailedMessage,
    currentUserId,
    onSelfDelete,
    router,
  ]);

  const handleCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteTarget(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  return {
    deleteTarget,
    setDeleteTarget,
    deleteLoading,
    deleteError,
    handleConfirm,
    handleCancel,
  };
}
