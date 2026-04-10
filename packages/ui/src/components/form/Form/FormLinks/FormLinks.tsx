'use client';

import type { FormLinkComponent } from '../types';

import { useTranslations } from 'next-intl';

import { Link } from '../../../navigation/Link';

import styles from '../Form/Form.module.scss';

export type FormLinkItem = {
  href: string;
  children: React.ReactNode;
};

export type FormLinksProps = {
  LinkComponent?: FormLinkComponent;
  items: FormLinkItem[];
  separator?: string;
  prefix?: React.ReactNode;
};

export function FormLinks({ LinkComponent = Link, items, separator, prefix }: FormLinksProps) {
  const t = useTranslations('ui.formLinks');
  const defaultSeparator = t('separator');
  const sep = separator !== undefined ? separator : defaultSeparator;
  if (items.length === 0) {
    return null;
  }
  return (
    <p className={styles.links}>
      {prefix}
      {items.map((item, i) => (
        <span key={item.href}>
          {i > 0 ? sep : null}
          <LinkComponent href={item.href}>{item.children}</LinkComponent>
        </span>
      ))}
    </p>
  );
}
