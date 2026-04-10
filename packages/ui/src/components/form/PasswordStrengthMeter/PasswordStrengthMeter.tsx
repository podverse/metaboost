'use client';

import { useTranslations } from 'next-intl';

import { getPasswordStrength, PASSWORD_MIN_LENGTH } from '@metaboost/helpers';

import styles from './PasswordStrengthMeter.module.scss';

export type PasswordStrengthMeterProps = {
  password: string;
};

const SEGMENTS = 4;

type StrengthMeta = {
  segmentsFilled: number;
  labelKey: string;
  colorClass: string | undefined;
};

function getStrengthMeta(password: string, strength: number): StrengthMeta | null {
  if (password.length === 0) return null;
  if (strength === 0) {
    return { segmentsFilled: 1, labelKey: 'tooShort', colorClass: styles.colorTooShort };
  }
  const map: Record<number, StrengthMeta> = {
    1: { segmentsFilled: 1, labelKey: 'weak', colorClass: styles.colorWeak },
    2: { segmentsFilled: 2, labelKey: 'fair', colorClass: styles.colorFair },
    3: { segmentsFilled: 3, labelKey: 'good', colorClass: styles.colorGood },
    4: { segmentsFilled: 4, labelKey: 'strong', colorClass: styles.colorStrong },
  };
  return map[strength] ?? null;
}

/**
 * Shows password requirements above the strength bar and a labelled
 * strength indicator (Too short / Weak / Fair / Good / Strong) to the right.
 * Does not validate; use isPasswordValid from @metaboost/helpers to gate submit.
 */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const t = useTranslations('ui.passwordStrength');
  const strength = getPasswordStrength(password);
  const meta = getStrengthMeta(password, strength);

  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <ul className={styles.requirements}>
        <li>{t('requireLength', { count: PASSWORD_MIN_LENGTH })}</li>
        <li>{t('requireMix')}</li>
      </ul>
      <div className={styles.barRow}>
        <div className={styles.bar} aria-hidden>
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const isFilled = meta !== null && i < meta.segmentsFilled;
            const segClass = [
              styles.segment,
              isFilled && styles.segmentFilled,
              isFilled && meta?.colorClass,
            ]
              .filter(Boolean)
              .join(' ');
            return <span key={i} className={segClass} />;
          })}
        </div>
        {meta !== null && (
          <span className={[styles.label, meta.colorClass].filter(Boolean).join(' ')}>
            {t(meta.labelKey)}
          </span>
        )}
      </div>
    </div>
  );
}
