import type { HTMLAttributes } from 'react';

import styles from './Row.module.scss';

export type RowProps = HTMLAttributes<HTMLDivElement> & {
  wrap?: boolean;
  /** When "end", items align to the end. When "space-between", first at start, last at end. */
  justify?: 'end' | 'space-between';
};

export function Row({ wrap = false, justify, className = '', ...props }: RowProps) {
  const layoutClass = wrap ? styles.rowWrap : styles.row;
  const justifyClass =
    justify === 'end'
      ? styles.rowJustifyEnd
      : justify === 'space-between'
        ? styles.rowJustifyBetween
        : '';
  const fullClass = [layoutClass, justifyClass, className].filter(Boolean).join(' ');
  return <div className={fullClass} {...props} />;
}
