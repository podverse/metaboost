'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { Link } from '../Link';

import styles from './Dropdown.module.scss';

export type DropdownItem =
  | { type: 'link'; href: string; label: string }
  | { type: 'button'; label: string; onClick: () => void; selected?: boolean };

export type DropdownLinkComponentProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  role?: string;
};

export type DropdownProps = {
  trigger: ReactNode;
  /** Menu rows (links / buttons). Omit when using `panelContent`. */
  items?: DropdownItem[];
  /** Custom panel body (e.g. form controls). Omit when using `items` only. */
  panelContent?: ReactNode;
  LinkComponent?: React.ComponentType<DropdownLinkComponentProps>;
  /** Optional class names merged onto the dropdown panel element. */
  panelClassName?: string;
  /** Merged onto the root wrapper with `styles.wrapper`. Outside-click dismissal uses this element (include stretch layout classes here so dead space still counts as “inside”). */
  wrapperClassName?: string;
  /** Use `iconGhost` for a compact outlined icon trigger (e.g. message overflow). `iconGhostInline` is borderless text-sized (e.g. toolbar caret). `iconGhostInlineCaret` is borderless with a symmetrically centered caret (CaretMenuDropdown). `textMenu` is borderless label + caret (SelectMenuDropdown). */
  triggerVariant?:
    | 'default'
    | 'iconGhost'
    | 'iconGhostInline'
    | 'iconGhostInlineCaret'
    | 'textMenu';
  'aria-label'?: string;
};

export function Dropdown({
  trigger,
  items = [],
  panelContent,
  LinkComponent = Link,
  triggerVariant = 'default',
  panelClassName,
  wrapperClassName,
  'aria-label': ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (wrapperRef.current !== null && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [open, close]);

  const handleTriggerKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handlePanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (panelRef.current === null) {
      return;
    }
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
    if (panelRef.current.querySelectorAll<HTMLElement>(focusableSelector).length === 0) {
      return;
    }
    const list = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector));
    const current = document.activeElement;
    const idx = current !== null ? list.indexOf(current as HTMLElement) : -1;

    if (e.key === 'ArrowDown' && idx < list.length - 1) {
      e.preventDefault();
      list[idx + 1]?.focus();
    }
    if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault();
      list[idx - 1]?.focus();
    }
    if (e.key === 'Home') {
      e.preventDefault();
      list[0]?.focus();
    }
    if (e.key === 'End') {
      e.preventDefault();
      list[list.length - 1]?.focus();
    }
  };

  const hasPanelContent = panelContent !== undefined;
  const showPanel = open && (items.length > 0 || hasPanelContent);
  const ariaHasPopup = hasPanelContent ? ('dialog' as const) : ('menu' as const);

  const triggerClass =
    triggerVariant === 'iconGhost'
      ? `${styles.trigger} ${styles.triggerIconGhost}`
      : triggerVariant === 'iconGhostInlineCaret'
        ? styles.triggerIconGhostInlineCaret
        : triggerVariant === 'iconGhostInline'
          ? styles.triggerIconGhostInline
          : triggerVariant === 'textMenu'
            ? styles.triggerTextMenu
            : styles.trigger;

  const panelClass = [styles.panel, hasPanelContent ? styles.panelCustom : '', panelClassName ?? '']
    .filter(Boolean)
    .join(' ');

  const rootClassName = [styles.wrapper, wrapperClassName].filter(Boolean).join(' ');

  return (
    <div ref={wrapperRef} className={rootClassName}>
      <button
        type="button"
        className={triggerClass}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup={ariaHasPopup}
        aria-label={ariaLabel}
      >
        {trigger}
      </button>
      {showPanel ? (
        <div
          ref={panelRef}
          className={panelClass}
          role={hasPanelContent ? undefined : 'menu'}
          onKeyDown={handlePanelKeyDown}
        >
          {hasPanelContent ? panelContent : null}
          {!hasPanelContent
            ? items.map((item, i) => {
                if (item.type === 'link') {
                  return (
                    <LinkComponent
                      key={i}
                      href={item.href}
                      className={styles.itemLink}
                      role="menuitem"
                      onClick={() => close()}
                    >
                      {item.label}
                    </LinkComponent>
                  );
                }
                const itemClass =
                  item.selected === true ? `${styles.item} ${styles.itemSelected}` : styles.item;
                return (
                  <button
                    key={i}
                    type="button"
                    className={itemClass}
                    role="menuitem"
                    aria-current={item.selected === true ? 'true' : undefined}
                    onClick={() => {
                      item.onClick();
                      close();
                    }}
                  >
                    {item.label}
                  </button>
                );
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}
