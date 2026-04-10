import type { HTMLAttributes } from 'react';

import styles from './AppView.module.scss';

export type AppViewProps = HTMLAttributes<HTMLDivElement>;

export function AppView({ className = '', ...props }: AppViewProps) {
  return (
    <div className={className ? `${styles.appView} ${className}` : styles.appView} {...props} />
  );
}
