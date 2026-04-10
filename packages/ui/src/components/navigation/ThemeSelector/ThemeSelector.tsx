'use client';

import { useTranslations } from 'next-intl';

import { useTheme } from '../../../contexts/ThemeContext';
import { THEMES, type Theme } from '../../../lib/settingsCookie';
import { Select } from '../../form/Select';

function isTheme(value: string): value is Theme {
  return THEMES.includes(value as Theme);
}

export type ThemeSelectorProps = {
  label?: string;
};

export function ThemeSelector({ label }: ThemeSelectorProps) {
  const t = useTranslations('ui.themeSelector');
  const { theme, setTheme } = useTheme();
  const options = THEMES.map((value) => ({ value, label: t(value) }));
  return (
    <Select
      options={options}
      value={theme}
      onChange={(value) => {
        if (isTheme(value)) setTheme(value);
      }}
      label={label}
      aria-label={label ?? t('groupAriaLabel')}
    />
  );
}
