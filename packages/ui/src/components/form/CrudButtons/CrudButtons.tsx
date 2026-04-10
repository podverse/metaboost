'use client';

import { Button } from '../Button';
import { ButtonLink } from '../ButtonLink';

import styles from './CrudButtons.module.scss';

export type CrudButtonsProps = {
  viewHref?: string;
  viewLabel?: string;
  editHref?: string;
  editLabel?: string;
  onDelete?: () => void;
  deleteLabel?: string;
};

export function CrudButtons({
  viewHref,
  viewLabel,
  editHref,
  editLabel,
  onDelete,
  deleteLabel,
}: CrudButtonsProps) {
  const hasAny =
    (viewHref !== undefined && viewHref !== '') ||
    (editHref !== undefined && editHref !== '') ||
    onDelete !== undefined;

  if (!hasAny) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      {viewHref !== undefined && viewHref !== '' && (
        <ButtonLink
          href={viewHref}
          variant="secondary"
          className={styles.iconAction}
          aria-label={viewLabel}
        >
          <i className="fa-solid fa-eye" aria-hidden />
        </ButtonLink>
      )}
      {editHref !== undefined && editHref !== '' && (
        <ButtonLink
          href={editHref}
          variant="secondary"
          className={styles.iconAction}
          aria-label={editLabel}
        >
          <i className="fa-solid fa-pen" aria-hidden />
        </ButtonLink>
      )}
      {onDelete !== undefined && (
        <Button
          type="button"
          variant="secondary"
          className={styles.iconAction}
          onClick={onDelete}
          aria-label={deleteLabel}
        >
          <i className="fa-solid fa-trash" aria-hidden />
        </Button>
      )}
    </div>
  );
}
