'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './Tooltip.module.scss';

const VIEWPORT_PADDING = 16; // 1rem – keep tooltip inside viewport
const GAP = 8; // space between trigger and tooltip

export type TooltipProps = {
  /** Content shown on hover or focus. */
  content: React.ReactNode;
  /** Trigger element (e.g. an icon). */
  children: React.ReactNode;
  /** Optional class for the wrapper. */
  className?: string;
};

/**
 * Shows content in a tooltip on hover and focus. Use for short explanations (e.g. next to a label).
 * The trigger is focusable so keyboard users can reveal the tooltip.
 * Position is clamped so the tooltip always stays within the viewport.
 */
export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const wrapperClass = [styles.wrapper, className].filter(Boolean).join(' ');

  useLayoutEffect(() => {
    if (!visible || triggerRef.current === null || tooltipRef.current === null) {
      setPosition(null);
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer above trigger; if not enough room, show below
    let top =
      triggerRef.current.getBoundingClientRect().top -
      tooltipRef.current.getBoundingClientRect().height -
      GAP;
    if (top < VIEWPORT_PADDING) {
      top = triggerRef.current.getBoundingClientRect().bottom + GAP;
    }
    top = Math.max(
      VIEWPORT_PADDING,
      Math.min(top, vh - tooltipRef.current.getBoundingClientRect().height - VIEWPORT_PADDING)
    );

    // Center horizontally on trigger, clamped to viewport
    let left =
      triggerRef.current.getBoundingClientRect().left +
      triggerRef.current.getBoundingClientRect().width / 2 -
      tooltipRef.current.getBoundingClientRect().width / 2;
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, vw - tooltipRef.current.getBoundingClientRect().width - VIEWPORT_PADDING)
    );

    setPosition({ left, top });
  }, [visible]);

  const tooltipEl = (
    <span
      ref={tooltipRef}
      id={id}
      role="tooltip"
      className={styles.tooltip}
      data-visible={visible ? 'true' : undefined}
      style={
        visible
          ? {
              position: 'fixed',
              left: position !== null ? position.left : -9999,
              top: position !== null ? position.top : -9999,
              opacity: position !== null ? 1 : 0,
              transform: 'none',
            }
          : undefined
      }
    >
      {content}
    </span>
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={wrapperClass}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <span
          tabIndex={0}
          className={styles.trigger}
          onFocus={() => setVisible(true)}
          onBlur={() => setVisible(false)}
          aria-describedby={visible ? id : undefined}
        >
          {children}
        </span>
      </span>
      {visible && typeof document !== 'undefined' ? createPortal(tooltipEl, document.body) : null}
    </>
  );
}
