import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from '../../../navigation/Link';
import { FormLinks } from './FormLinks';

const meta: Meta<typeof FormLinks> = {
  component: FormLinks,
  tags: ['autodocs'],
  argTypes: {
    separator: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof FormLinks>;

const DefaultLink: React.ComponentType<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => <a href={href}>{children}</a>;

export const Default: Story = {
  args: {
    LinkComponent: Link,
    items: [
      { href: '#signup', children: 'Sign up' },
      { href: '#forgot', children: 'Forgot password?' },
    ],
  },
};

export const CustomSeparator: Story = {
  args: {
    LinkComponent: DefaultLink,
    items: [
      { href: '#a', children: 'Link A' },
      { href: '#b', children: 'Link B' },
      { href: '#c', children: 'Link C' },
    ],
    separator: ' | ',
  },
};

export const WithPrefix: Story = {
  args: {
    LinkComponent: Link,
    items: [{ href: '#help', children: 'Help' }],
    prefix: 'Need help? ',
  },
};

export const Empty: Story = {
  args: {
    LinkComponent: Link,
    items: [],
  },
};
