import type { Meta, StoryObj } from '@storybook/react-vite';

import { NavBar } from './NavBar';

const meta: Meta<typeof NavBar> = {
  component: NavBar,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    loginHref: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof NavBar>;

export const WithUser: Story = {
  args: {
    title: 'App name',
    homeHref: '#',
    user: { displayName: 'Jane Doe', email: 'jane@example.com', username: null },
    onLogout: () => {},
    navItems: [
      { href: '#dashboard', label: 'Dashboard' },
      { href: '#settings', label: 'Settings' },
    ],
  },
};

export const WithUserNoDisplayName: Story = {
  args: {
    title: 'App name',
    homeHref: '#',
    user: { displayName: null, email: 'user@example.com', username: null },
    onLogout: () => {},
    navItems: [{ href: '#dashboard', label: 'Dashboard' }],
  },
};

export const LoggedOut: Story = {
  args: {
    title: 'App name',
    homeHref: '#',
    user: null,
    onLogout: () => {},
    navItems: [],
    loginHref: '#login',
  },
};

export const LoggedOutNoLoginLink: Story = {
  args: {
    title: 'App name',
    homeHref: '#',
    user: null,
    onLogout: () => {},
    navItems: [],
  },
};
