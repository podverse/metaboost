import styles from './FormActions.module.scss';

export type FormActionsProps = {
  children: React.ReactNode;
};

/**
 * A flex row for primary/secondary action buttons at the bottom of a form.
 * Uses $space-3 gap (tighter than the Row component's $space-4).
 */
export function FormActions({ children }: FormActionsProps) {
  return <div className={styles.actions}>{children}</div>;
}
