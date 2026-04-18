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
  | { type: 'button'; label: string; onClick: () => void };

export type DropdownLinkComponentProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  role?: string;
};

export type DropdownProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  LinkComponent?: React.ComponentType<DropdownLinkComponentProps>;
  /** Use `iconGhost` for a compact icon trigger (small type, outlined; e.g. inline with message timestamps). */
  triggerVariant?: 'default' | 'iconGhost';
  'aria-label'?: string;
};

export function Dropdown({
  trigger,
  items,
  LinkComponent = Link,
  triggerVariant = 'default',
  'aria-label': ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current !== null && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    if (focusables === undefined || focusables.length === 0) return;
    const list = Array.from(focusables);
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

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={
          triggerVariant === 'iconGhost'
            ? `${styles.trigger} ${styles.triggerIconGhost}`
            : styles.trigger
        }
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
      >
        {trigger}
      </button>
      {open && (
        <div ref={panelRef} className={styles.panel} role="menu" onKeyDown={handlePanelKeyDown}>
          {items.map((item, i) => {
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
            return (
              <button
                key={i}
                type="button"
                className={styles.item}
                role="menuitem"
                onClick={() => {
                  item.onClick();
                  close();
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
