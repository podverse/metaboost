import { SectionWithHeading } from '../../../layout/SectionWithHeading';
import { Stack } from '../../../layout/Stack';
import { SubmitError } from '../SubmitError';

import styles from './Form.module.scss';

export type FormProps = {
  title: string;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  submitError?: string | null;
  children: React.ReactNode;
};

export function Form({ title, onSubmit, submitError, children }: FormProps) {
  return (
    <SectionWithHeading title={title}>
      <form className={styles.form} onSubmit={onSubmit}>
        <Stack>
          <SubmitError message={submitError} />
          {children}
        </Stack>
      </form>
    </SectionWithHeading>
  );
}
