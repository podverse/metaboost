'use client';

import { Dropdown, type DropdownProps } from './Dropdown';

import styles from './CaretMenuDropdown.module.scss';

export type CaretMenuDropdownProps = Omit<DropdownProps, 'trigger' | 'triggerVariant'> & {
  /**
   * When true, uses `iconGhostInline` so the caret lines up with UnderlineToggle tabs (bucket summary
   * toolbar). When false (default), uses `iconGhostInlineCaret` for a symmetric, centered caret (e.g. message cards).
   */
  alignWithToolbarTabs?: boolean;
  /**
   * When true, wraps the dropdown in a flex container that stretches with the parent row and
   * vertically centers the caret trigger (pair with a stretched parent in the message header).
   */
  centerTriggerVertically?: boolean;
};

/**
 * Borderless caret trigger. Default styling centers the caret; pass `alignWithToolbarTabs` next to
 * Data/Graphs toggles on the bucket summary.
 */
export function CaretMenuDropdown({
  alignWithToolbarTabs = false,
  centerTriggerVertically = false,
  wrapperClassName: wrapperClassNameProp,
  ...props
}: CaretMenuDropdownProps) {
  const triggerVariant = alignWithToolbarTabs ? 'iconGhostInline' : 'iconGhostInlineCaret';

  const wrapperClassName =
    [centerTriggerVertically ? styles.wrapperStretchCenter : '', wrapperClassNameProp ?? '']
      .filter(Boolean)
      .join(' ')
      .trim() || undefined;

  return (
    <Dropdown
      {...props}
      wrapperClassName={wrapperClassName}
      triggerVariant={triggerVariant}
      trigger={<i className={`fa-solid fa-caret-down ${styles.caretIcon}`} aria-hidden />}
    />
  );
}
