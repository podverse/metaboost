import type { HTMLAttributes } from 'react';

import styles from './BackToButton.module.scss';

export type BackToButtonProps = HTMLAttributes<HTMLSpanElement> & {
  /** Label or content shown after the back arrow icon (e.g. "Back to bucket"). */
  children: React.ReactNode;
};

/**
 * Back navigation label: Font Awesome arrow-left icon + text.
 * Use inside a Link or Button for "back to …" actions.
 * Requires Font Awesome CSS (e.g. @fortawesome/fontawesome-free/css/all.min.css).
 */
export function BackToButton({ children, className = '', ...props }: BackToButtonProps) {
  return (
    <span className={[styles.root, className].filter(Boolean).join(' ') || undefined} {...props}>
      <i className="fa-solid fa-arrow-left" aria-hidden />
      <span>{children}</span>
    </span>
  );
}
