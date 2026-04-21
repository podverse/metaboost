'use client';

import { usePathname } from 'next/navigation';

import { Link, Stack, Text } from '@metaboost/ui';

import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../lib/routes';

import styles from './TermsReminderBanner.module.scss';

function formatDeadline(value: string | null): string {
  if (value === null || value.trim() === '') {
    return 'the enforcement deadline';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function TermsReminderBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (user === null || (!user.needsUpcomingTermsAcceptance && !user.mustAcceptTermsNow)) {
    return null;
  }

  if (pathname === ROUTES.TERMS_REQUIRED && user.termsAcceptedAt === null) {
    return null;
  }

  const deadline = formatDeadline(user.upcomingTermsAcceptanceBy);
  const href = user.mustAcceptTermsNow ? ROUTES.TERMS_REQUIRED : ROUTES.TERMS;

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <Stack className={styles.content}>
        <Text>
          Agree to the new terms by <strong>{deadline}</strong> to continue receiving Metaboost
          messages.
        </Text>
        <Link href={href}>Review and accept terms</Link>
      </Stack>
    </div>
  );
}
