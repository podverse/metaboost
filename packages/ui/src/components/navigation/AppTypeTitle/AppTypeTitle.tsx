/**
 * Renders the app-type title: brand name plus an optional icon class (e.g. Font Awesome).
 * A space is rendered between the name and icon only when an icon is present.
 */
export function AppTypeTitle({
  brandName,
  titleIcon,
}: {
  brandName: string;
  titleIcon?: string | null;
}) {
  const iconClass = titleIcon?.trim();
  const hasIcon = iconClass !== undefined && iconClass !== '';
  return (
    <>
      {brandName}
      {hasIcon ? (
        <>
          {' '}
          <i className={iconClass} aria-hidden />
        </>
      ) : null}
    </>
  );
}
