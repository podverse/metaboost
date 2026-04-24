import type { Meta, StoryObj } from '@storybook/react-vite';

import { NavCardGrid } from './NavCardGrid';

const meta: Meta<typeof NavCardGrid> = {
  component: NavCardGrid,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof NavCardGrid>;

const defaultCards = [
  {
    href: '/admins',
    title: 'Admins',
    description: 'Manage management admins and their permissions.',
  },
  {
    href: '/users',
    title: 'Users',
    description: 'Browse users and inspect account details.',
  },
  {
    href: '/buckets',
    title: 'Buckets',
    description: 'Manage buckets and related settings.',
  },
];

export const Default: Story = {
  args: {
    cards: defaultCards,
  },
};

export const ManyCards: Story = {
  args: {
    cards: [
      ...defaultCards,
      {
        href: '/events',
        title: 'Events',
        description: 'Review recent management events and activity.',
      },
      {
        href: '/global-blocked-apps',
        title: 'Global blocked apps',
        description: 'Review and manage globally blocked app IDs.',
      },
    ],
  },
};
