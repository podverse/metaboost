'use client';

import type { CrudBit } from '@boilerplate/helpers';

import { useEffect, useRef } from 'react';

import { InfoIcon } from '../../feedback/InfoIcon/InfoIcon';
import { Tooltip } from '../../feedback/Tooltip/Tooltip';

import styles from './CrudCheckboxes.module.scss';

export type CrudFlags = Record<CrudBit, boolean>;

export type CrudCheckboxesProps = {
  /** Group label shown in the header row alongside the select-all checkbox. */
  label: string;
  /** Display label for each bit. Typically translated by the consumer. */
  labels: Record<CrudBit, string>;
  /** Current checked state for each bit. */
  flags: CrudFlags;
  onChange: (flags: CrudFlags) => void;
  /**
   * When true (default), read is required whenever create, update, or delete is selected:
   * turning on any write bit auto-enables read, and read cannot be turned off while any write bit is on.
   */
  readRequired?: boolean;
  /**
   * Bits that are forced-on and cannot be toggled by the user.
   * Forced bits are rendered checked and disabled.
   */
  disabledBits?: Partial<Record<CrudBit, boolean>>;
  /** Disable the whole checkbox group, including select-all. */
  disabled?: boolean;
  /** Optional tooltip shown next to the select-all checkbox. */
  selectAllInfo?: string;
  /** Optional error message displayed below the checkbox group. */
  error?: string | null;
};

const BITS: CrudBit[] = ['create', 'read', 'update', 'delete'];

/** If readRequired, ensure read is true whenever any write bit is on. */
function enforceReadWhenRequired(flags: CrudFlags, readRequired: boolean): CrudFlags {
  if (!readRequired) return flags;
  if (flags.create || flags.update || flags.delete) {
    return { ...flags, read: true };
  }
  return flags;
}

/**
 * Renders a bordered group with a select-all header checkbox and four CRUD
 * permission checkboxes. The header checkbox reflects partial selections as
 * an indeterminate state. Labels are provided by the consumer so this
 * component stays translation-agnostic.
 *
 * When readRequired is true (default), read is enforced whenever create, update,
 * or delete is selected: the component normalizes onChange payloads and disables
 * unchecking read while any write bit is on.
 */
export function CrudCheckboxes({
  label,
  labels,
  flags,
  onChange,
  readRequired = true,
  disabledBits,
  disabled = false,
  selectAllInfo,
  error,
}: CrudCheckboxesProps) {
  const checkedCount = BITS.filter((bit) => flags[bit]).length;
  const allChecked = checkedCount === BITS.length;
  const isIndeterminate = checkedCount > 0 && checkedCount < BITS.length;

  const readForcedByWrite = readRequired && (flags.create || flags.update || flags.delete);
  const effectiveDisabledBits: Partial<Record<CrudBit, boolean>> = {
    ...disabledBits,
    ...(readForcedByWrite ? { read: true } : {}),
  };

  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current !== null) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleChange = (next: CrudFlags) => {
    onChange(enforceReadWhenRequired(next, readRequired));
  };

  const handleSelectAll = (checked: boolean) => {
    const next = Object.fromEntries(BITS.map((bit) => [bit, checked])) as CrudFlags;
    handleChange(next);
  };

  const hasError = Boolean(error);

  return (
    <div className={`${styles.container}${hasError ? ` ${styles.containerError}` : ''}`}>
      <div className={styles.headerLabel}>
        <span>{label}</span>
        <label className={styles.selectAllLabel}>
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allChecked}
            disabled={disabled}
            aria-label={label}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          {selectAllInfo !== undefined && selectAllInfo !== '' ? (
            <Tooltip content={selectAllInfo}>
              <InfoIcon size={16} />
            </Tooltip>
          ) : null}
        </label>
      </div>
      <div className={styles.checkboxGroup}>
        {BITS.map((bit) => {
          const isDisabled = disabled || effectiveDisabledBits[bit] === true;
          return (
            <label
              key={bit}
              className={`${styles.checkboxLabel}${isDisabled ? ` ${styles.checkboxLabelDisabled}` : ''}`}
            >
              <input
                type="checkbox"
                checked={flags[bit]}
                disabled={isDisabled}
                onChange={(e) => handleChange({ ...flags, [bit]: e.target.checked })}
              />
              {labels[bit]}
            </label>
          );
        })}
      </div>
      {hasError && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
