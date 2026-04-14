'use client';

import { useId } from 'react';

import styles from './OptionTileSelector.module.scss';

export type OptionTileSelectorOption = {
  value: string;
  label: string;
  iconClassName: string;
};

export type OptionTileSelectorProps = {
  label?: string;
  options: OptionTileSelectorOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function OptionTileSelector({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className = '',
}: OptionTileSelectorProps) {
  const generatedId = useId();
  const groupId = `option-tile-selector-${generatedId}`;
  const groupClassName = [styles.group, className].filter(Boolean).join(' ');

  return (
    <div className={styles.wrapper}>
      {label !== undefined && (
        <span id={`${groupId}-label`} className={styles.label}>
          {label}
        </span>
      )}
      <div
        className={groupClassName}
        role="radiogroup"
        aria-labelledby={label !== undefined ? `${groupId}-label` : undefined}
      >
        {options.map((option) => {
          const selected = option.value === value;
          const tileClassName = [styles.tile, selected ? styles.tileSelected : '']
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={option.value}
              type="button"
              className={tileClassName}
              onClick={() => onChange(option.value)}
              disabled={disabled}
              role="radio"
              aria-checked={selected}
            >
              <span className={styles.tileContent}>
                <i className={option.iconClassName} aria-hidden />
                <span className={styles.tileLabel}>{option.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
