/**
 * Awaits session teardown, then replaces the URL (typical logout → `/login`).
 * Prefer over navigating before logout completes so cookies clear before RSC requests.
 */
export async function logoutThenReplace(
  logout: () => Promise<void>,
  replace: (href: string) => void,
  path: string
): Promise<void> {
  await logout();
  replace(path);
}

/**
 * Wraps {@link logoutThenReplace} for handlers typed as `() => void` (e.g. NavBar `onLogout`).
 */
export function runLogoutThenReplace(
  logout: () => Promise<void>,
  replace: (href: string) => void,
  path: string
): void {
  void logoutThenReplace(logout, replace, path);
}
