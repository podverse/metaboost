import type { HTMLAttributes } from 'react';

import styles from './InfoIcon.module.scss';

export type InfoIconProps = HTMLAttributes<HTMLSpanElement> & {
  /** Size in pixels. Default 18. */
  size?: number;
};

/**
 * Font Awesome circle-info icon. Use with Tooltip to explain a field or option.
 * Requires Font Awesome CSS (e.g. @fortawesome/fontawesome-free/css/all.min.css).
 */
export function InfoIcon({ size = 18, className = '', style, ...props }: InfoIconProps) {
  const combinedStyle = style !== undefined ? { ...style, fontSize: size } : { fontSize: size };
  return (
    <span
      className={[styles.icon, className].filter(Boolean).join(' ') || undefined}
      style={combinedStyle}
      aria-hidden
      {...props}
    >
      <i className="fa-solid fa-circle-info" aria-hidden />
    </span>
  );
}
