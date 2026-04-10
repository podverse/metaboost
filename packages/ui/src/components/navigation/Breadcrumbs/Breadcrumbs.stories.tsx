import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumbs } from './Breadcrumbs';

function LinkAdapter({
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

const meta: Meta<typeof Breadcrumbs> = {
  component: Breadcrumbs,
  tags: ['autodocs'],
  args: {
    items: [
      { label: 'Bucket name', href: '/buckets/1' },
      { label: 'Bucket Settings', href: '/buckets/1/settings' },
      { label: 'Admins' },
    ],
    LinkComponent: LinkAdapter,
  },
};

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {};

export const TwoLevels: Story = {
  args: {
    items: [{ label: 'My bucket', href: '/buckets/1' }, { label: 'Bucket Settings' }],
  },
};

export const FourLevels: Story = {
  args: {
    items: [
      { label: 'Bucket name', href: '/buckets/1' },
      { label: 'Bucket Settings', href: '/buckets/1/settings' },
      { label: 'Admins', href: '/buckets/1/settings/admins' },
      { label: 'Edit admin' },
    ],
  },
};
