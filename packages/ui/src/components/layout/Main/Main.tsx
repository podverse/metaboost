import type { HTMLAttributes } from 'react';

import styles from './Main.module.scss';

export type MainProps = HTMLAttributes<HTMLElement>;

export function Main({ className = '', ...props }: MainProps) {
  return <main className={className ? `${styles.main} ${className}` : styles.main} {...props} />;
}
