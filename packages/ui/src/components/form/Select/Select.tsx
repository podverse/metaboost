'use client';

import { useId } from 'react';

import styles from './Select.module.scss';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> & {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** When true, select width is sized to the selected option (CSS field-sizing: content). */
  sizeToSelected?: boolean;
  /** When "tab", styles the select to match navigation tabs (pill shape, chip colors, same size). "tabTransparent" is like tab but with transparent background (e.g. for sort dropdowns). */
  variant?: 'default' | 'tab' | 'tabTransparent';
};

export function Select({
  label,
  options,
  value,
  onChange,
  id: idProp,
  className = '',
  disabled = false,
  sizeToSelected = false,
  variant = 'default',
  'aria-label': ariaLabel,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const id = idProp ?? `select-${generatedId}`;

  const wrapperClassName = [
    styles.wrapper,
    sizeToSelected ? styles.wrapperSizeToSelected : '',
    variant === 'tab' ? styles.wrapperTab : '',
    variant === 'tabTransparent' ? styles.wrapperTabTransparent : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const selectClassName =
    variant === 'tab'
      ? styles.selectTab
      : variant === 'tabTransparent'
        ? styles.selectTabTransparent
        : sizeToSelected
          ? styles.selectSizeToSelected
          : styles.select;

  return (
    <div className={wrapperClassName}>
      {label !== undefined && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={selectClassName}
        aria-label={ariaLabel ?? label}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
