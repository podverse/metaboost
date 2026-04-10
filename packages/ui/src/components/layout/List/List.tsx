import type { HTMLAttributes } from 'react';

import styles from './List.module.scss';

export type ListProps = HTMLAttributes<HTMLUListElement> & {
  size?: 'sm';
};

export function List({ size, className = '', ...props }: ListProps) {
  const classes = size === 'sm' ? [styles.list, styles.listSm] : [styles.list];
  if (className) classes.push(className);
  return <ul className={classes.join(' ')} {...props} />;
}
