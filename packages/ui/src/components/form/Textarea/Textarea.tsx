import { forwardRef, useId } from 'react';

import styles from './Textarea.module.scss';

export type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
> & {
  label?: string;
  error?: string | null;
  value: string;
  onChange: (value: string) => void;
  /** Minimum height in lines of text (uses font size and line-height). Default 6. */
  minRows?: number;
  /** When set, show character counter in bottom-right. Parent can pass i18n formatter. */
  maxLength?: number | null;
  /** Format counter text when max is set (e.g. t('buckets.charCount', { current, max })). */
  charCountLabel?: (current: number, max: number) => string;
  /** When true, show counter even when maxLength is not set (use charCountLabelNoMax for text). */
  showCharCount?: boolean;
  /** Format counter text when no max (e.g. t('buckets.charCountNoMax', { current })). */
  charCountLabelNoMax?: (current: number) => string;
  /** Max to show in counter when no enforced maxLength (e.g. 1000). Display only, not enforced. */
  displayMaxLength?: number;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    error,
    value,
    onChange,
    minRows = 6,
    maxLength,
    charCountLabel,
    showCharCount = false,
    charCountLabelNoMax,
    displayMaxLength,
    id: idProp,
    className = '',
    disabled = false,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const id = idProp ?? `textarea-${generatedId}`;
  const hasError = Boolean(error);
  const overLimit = maxLength !== undefined && maxLength !== null && value.length > maxLength;
  const showDanger = hasError || overLimit;

  const hasMax = maxLength !== undefined && maxLength !== null;
  const maxForDisplay = hasMax ? maxLength : displayMaxLength;
  const counterText =
    maxForDisplay !== undefined && maxForDisplay !== null
      ? charCountLabel
        ? charCountLabel(value.length, maxForDisplay)
        : `${value.length}/${maxForDisplay}`
      : showCharCount
        ? charCountLabelNoMax
          ? charCountLabelNoMax(value.length)
          : String(value.length)
        : null;

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      {label !== undefined && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div
        className={styles.textareaWrapper}
        style={{ ['--textarea-min-rows' as string]: minRows }}
      >
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={showDanger}
          aria-describedby={showDanger || error ? `${id}-error` : undefined}
          className={showDanger ? `${styles.textarea} ${styles.textareaError}` : styles.textarea}
          {...props}
        />
        {counterText !== null && (
          <span
            className={
              overLimit ? `${styles.charCount} ${styles.charCountDanger}` : styles.charCount
            }
            aria-live="polite"
          >
            {counterText}
          </span>
        )}
      </div>
      {error !== undefined && error !== null && error !== '' && (
        <span id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});
