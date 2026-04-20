import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tabs } from './Tabs';

function MockLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    activeHref: {
      control: 'text',
      description: 'Current path (for active tab). Omit in Next.js to use usePathname().',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

const defaultItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/admins', label: 'Admins' },
  { href: '/events', label: 'Events' },
];

export const Default: Story = {
  args: {
    items: defaultItems,
    LinkComponent: MockLink,
    activeHref: '/dashboard',
  },
};

export const AdminsActive: Story = {
  args: {
    items: defaultItems,
    LinkComponent: MockLink,
    activeHref: '/admins',
  },
};

const manyItems = [
  { href: '/a', label: 'General' },
  { href: '/b', label: 'Currency' },
  { href: '/c', label: 'Admins' },
  { href: '/d', label: 'Roles' },
  { href: '/e', label: 'Blocked' },
  { href: '/f', label: 'Delete' },
  { href: '/g', label: 'Extra' },
];

export const WrappingNarrow: Story = {
  args: {
    items: manyItems,
    LinkComponent: MockLink,
    activeHref: '/a',
    exactMatch: true,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 280 }}>
        <Story />
      </div>
    ),
  ],
};
