import { forwardRef, useId } from 'react';

import styles from './Input.module.scss';

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label?: string;
  error?: string | null;
  value: string;
  onChange: (value: string) => void;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, value, onChange, id: idProp, className = '', disabled = false, ...props },
  ref
) {
  const generatedId = useId();
  const id = idProp ?? `input-${generatedId}`;
  const hasError = Boolean(error);

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      {label !== undefined && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={hasError ? `${styles.input} ${styles.inputError}` : styles.input}
        {...props}
      />
      {hasError && (
        <span id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});
