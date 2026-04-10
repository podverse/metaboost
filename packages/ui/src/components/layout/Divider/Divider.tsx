import type { HTMLAttributes } from 'react';

import styles from './Divider.module.scss';

export type DividerProps = HTMLAttributes<HTMLHRElement>;

export function Divider({ className = '', ...props }: DividerProps) {
  return (
    <hr
      className={className ? `${styles.divider} ${className}` : styles.divider}
      role="separator"
      {...props}
    />
  );
}
