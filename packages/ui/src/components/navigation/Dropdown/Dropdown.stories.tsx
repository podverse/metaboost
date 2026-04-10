import type { Meta, StoryObj } from '@storybook/react-vite';

import { Dropdown } from './Dropdown';

const meta: Meta<typeof Dropdown> = {
  component: Dropdown,
  tags: ['autodocs'],
  argTypes: {
    'aria-label': { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Dropdown>;

export const LinksOnly: Story = {
  args: {
    trigger: 'Menu',
    'aria-label': 'Options',
    items: [
      { type: 'link', href: '#profile', label: 'Profile' },
      { type: 'link', href: '#settings', label: 'Settings' },
      { type: 'link', href: '#help', label: 'Help' },
    ],
  },
};

export const WithButton: Story = {
  args: {
    trigger: 'User',
    'aria-label': 'User menu',
    items: [
      { type: 'link', href: '#profile', label: 'Profile' },
      { type: 'link', href: '#settings', label: 'Settings' },
      { type: 'button', label: 'Log out', onClick: () => {} },
    ],
  },
};

export const SingleItem: Story = {
  args: {
    trigger: 'Actions',
    'aria-label': 'Actions',
    items: [{ type: 'link', href: '#single', label: 'Single action' }],
  },
};
