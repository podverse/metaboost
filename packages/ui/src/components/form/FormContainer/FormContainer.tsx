import { Stack } from '../../layout/Stack';

import styles from './FormContainer.module.scss';

export type FormContainerProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  /**
   * When true (default), the form is constrained to `$input-max-width`.
   * Pass false for forms that should expand to fill their container.
   */
  constrainWidth?: boolean;
  className?: string;
};

export function FormContainer({
  onSubmit,
  children,
  constrainWidth = true,
  className,
}: FormContainerProps) {
  const cls = [styles.form, !constrainWidth && styles.unconstrained, className]
    .filter(Boolean)
    .join(' ');

  return (
    <form className={cls} onSubmit={onSubmit}>
      <Stack>{children}</Stack>
    </form>
  );
}
