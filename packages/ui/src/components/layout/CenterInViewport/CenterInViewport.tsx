import styles from './CenterInViewport.module.scss';

export type CenterInViewportProps = {
  children: React.ReactNode;
  /** Optional title rendered above the content (e.g. app name). */
  title?: React.ReactNode;
  /**
   * Max width of the content area. "readable" | "form" use layout tokens; string = custom CSS width.
   * Default (undefined) = 24rem. null = no max width.
   */
  contentMaxWidth?: 'readable' | 'form' | string | null;
  /** When "center", content text is centered. Use for invite/splash content. */
  contentTextAlign?: 'center';
};

/**
 * Fills the available viewport and centers its children vertically and horizontally
 * when they fit. Use for auth pages, invite pages, splash content, etc. Scrolls when content overflows.
 */
export function CenterInViewport({
  children,
  title,
  contentMaxWidth,
  contentTextAlign,
}: CenterInViewportProps) {
  const widthClass =
    contentMaxWidth === 'readable'
      ? styles.contentReadable
      : contentMaxWidth === 'form'
        ? styles.contentForm
        : '';
  const contentClass = [
    styles.content,
    widthClass,
    contentTextAlign === 'center' ? styles.contentTextCenter : '',
  ]
    .filter(Boolean)
    .join(' ');
  const style =
    typeof contentMaxWidth === 'string' &&
    contentMaxWidth !== 'readable' &&
    contentMaxWidth !== 'form'
      ? { maxWidth: contentMaxWidth }
      : {};
  return (
    <div className={styles.root}>
      <div className={styles.center}>
        {title !== undefined && <h1 className={styles.title}>{title}</h1>}
        <div className={contentClass} style={style}>
          {children}
        </div>
      </div>
    </div>
  );
}
