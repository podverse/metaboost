import styles from './FormSection.module.scss';

export type FormSectionProps = {
  title: string;
  children: React.ReactNode;
};

/**
 * A titled group of related form fields. Uses a plain div so it does not
 * conflict with the fieldset elements that CrudCheckboxes renders.
 */
export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className={styles.section}>
      <p className={styles.title}>{title}</p>
      {children}
    </div>
  );
}
