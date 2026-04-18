import type { ButtonHTMLAttributes } from 'react';

import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'link' | 'danger';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

export function Button({
  variant = 'secondary',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantClass =
    variant === 'primary'
      ? styles.primary
      : variant === 'link'
        ? styles.link
        : variant === 'danger'
          ? styles.danger
          : styles.secondary;
  const cn = [styles.root, variantClass, loading ? styles.loading : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={cn} disabled={isDisabled} aria-busy={loading} {...props}>
      {loading ? (
        <span className={styles.loadingLabel} aria-hidden>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
