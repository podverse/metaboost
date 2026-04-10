'use client';

/// <reference lib="dom" />
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { THEMES, type Theme } from '../../lib/settingsCookie';
import { setSettingsCookie } from '../../lib/settingsCookieClient';

export type { Theme };

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export type PersistWithCookie = {
  name: string;
  path?: string;
  maxAge?: number;
};

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  /** When set, theme is persisted to this cookie (JSON) so SSR can read it. Use for Next.js apps. */
  persistWithCookie?: PersistWithCookie;
  /** When set and persistWithCookie is not set, theme is persisted to localStorage. Use for Storybook etc. */
  storageKey?: string;
};

const DEFAULT_COOKIE_PATH = '/';
const DEFAULT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  persistWithCookie,
  storageKey = 'metaboost-theme',
}: ThemeProviderProps) {
  // Use defaultTheme for initial state so server and client first paint match (avoids hydration error).
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      if (typeof window === 'undefined') return;
      if (persistWithCookie) {
        setSettingsCookie(
          persistWithCookie.name,
          { theme: next },
          {
            path: persistWithCookie.path ?? DEFAULT_COOKIE_PATH,
            maxAge: persistWithCookie.maxAge ?? DEFAULT_COOKIE_MAX_AGE,
          }
        );
      } else {
        try {
          window.localStorage.setItem(storageKey, next);
        } catch {
          // ignore
        }
      }
    },
    [persistWithCookie, storageKey]
  );

  const toggleTheme = useCallback(() => {
    const i = THEMES.indexOf(theme);
    const nextIndex = (i + 1) % THEMES.length;
    const next = THEMES[nextIndex];
    setTheme(next ?? THEMES[0]);
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export type ThemeWrapperProps = {
  children: React.ReactNode;
  /** Theme from server (e.g. from settings cookie). Ensures SSR and client match. */
  initialTheme?: Theme | null;
  /** When set, theme is persisted to this cookie so SSR can read it. null/undefined = use localStorage (e.g. Storybook). */
  settingsCookieName?: string | null;
};

export function ThemeWrapper({ children, initialTheme, settingsCookieName }: ThemeWrapperProps) {
  const defaultTheme =
    initialTheme !== null && initialTheme !== undefined && THEMES.includes(initialTheme)
      ? initialTheme
      : 'dark';
  return (
    <ThemeProvider
      defaultTheme={defaultTheme}
      {...(settingsCookieName
        ? {
            persistWithCookie: {
              name: settingsCookieName,
              path: DEFAULT_COOKIE_PATH,
              maxAge: DEFAULT_COOKIE_MAX_AGE,
            },
          }
        : { storageKey: 'metaboost-theme' })}
    >
      {children}
    </ThemeProvider>
  );
}
