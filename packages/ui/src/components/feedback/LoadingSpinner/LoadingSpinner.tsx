'use client';

import { useTranslations } from 'next-intl';

import styles from './LoadingSpinner.module.scss';

export type LoadingSpinnerProps = {
  /** Size: 'sm' (1em), 'md' (1.5rem), 'lg' (2rem), 'xl' (3rem). Default 'md'. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Use primary color for the spinner. Default false (muted color). */
  variant?: 'default' | 'primary';
  /** Optional className for the wrapper. */
  className?: string;
};

const sizeClassMap = {
  sm: 'wrapperSm',
  md: 'wrapperMd',
  lg: 'wrapperLg',
  xl: 'wrapperXl',
} as const;

/**
 * Rotating loading spinner (Font Awesome fa-spinner). Use instead of "Loading" text.
 * Requires Font Awesome CSS to be loaded (e.g. @fortawesome/fontawesome-free/css/all.min.css).
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className = '',
}: LoadingSpinnerProps) {
  const t = useTranslations('ui.loadingSpinner');
  const cn = [
    styles.wrapper,
    styles[sizeClassMap[size]],
    variant === 'primary' ? styles.wrapperPrimary : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cn} role="status" aria-label={t('ariaLabel')}>
      <i className="fa-solid fa-spinner fa-spin" aria-hidden />
    </span>
  );
}
