import type { HTMLAttributes } from 'react';

import styles from './UnorderedList.module.scss';

export type UnorderedListProps = HTMLAttributes<HTMLUListElement>;

/**
 * A semantic <ul> with the same vertical gap as Stack (gap-standard). Use for lists where items should be spaced like Stack children.
 */
export function UnorderedList({ className = '', ...props }: UnorderedListProps) {
  return <ul className={className ? `${styles.root} ${className}` : styles.root} {...props} />;
}
