import styles from '../Form/Form.module.scss';

export type SubmitErrorProps = {
  message?: string | null;
};

export function SubmitError({ message }: SubmitErrorProps) {
  if (!message) {
    return null;
  }
  return (
    <p className={styles.submitError} role="alert">
      {message}
    </p>
  );
}
