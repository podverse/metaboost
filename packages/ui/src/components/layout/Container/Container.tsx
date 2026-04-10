import type { HTMLAttributes } from 'react';

import { Stack } from '../Stack';

import styles from './Container.module.scss';

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  /** When set, constrains inner content width: "readable" (e.g. messages list), "form" (form width). Passed to Stack. */
  contentMaxWidth?: 'readable' | 'form';
  /** When true and contentMaxWidth is set, centers the constrained content horizontally (e.g. invite page). */
  centerContent?: boolean;
};

export function Container({
  className = '',
  children,
  contentMaxWidth,
  centerContent = false,
  ...rest
}: ContainerProps) {
  return (
    <div className={className ? `${styles.container} ${className}` : styles.container} {...rest}>
      <Stack maxWidth={contentMaxWidth} centerContent={centerContent}>
        {children}
      </Stack>
    </div>
  );
}
