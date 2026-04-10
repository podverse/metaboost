import type { Meta, StoryObj } from '@storybook/react-vite';

import { TableWithFilter } from './TableWithFilter';

const meta: Meta<typeof TableWithFilter> = {
  component: TableWithFilter,
  tags: ['autodocs'],
  argTypes: {
    emptyMessage: { control: 'text' },
    maxGoToPage: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof TableWithFilter>;

const columns = [
  { id: 'email', label: 'Email' },
  { id: 'displayName', label: 'Display name' },
  { id: 'role', label: 'Role' },
];

const sampleRows = [
  { id: '1', cells: { email: 'admin@example.com', displayName: 'Admin One', role: 'Super admin' } },
  { id: '2', cells: { email: 'editor@example.com', displayName: 'Editor', role: 'Admin' } },
  { id: '3', cells: { email: 'viewer@example.com', displayName: 'Viewer', role: 'Admin' } },
];

const baseArgs = {
  tableRows: sampleRows,
  columns,
  initialFilterColumns: columns.map((c) => c.id),
  initialSearch: '',
  basePath: '/admins',
  currentQueryParams: {},
  currentPage: 1,
  totalPages: 1,
  limit: 10,
  defaultLimit: 10,
};

export const Default: Story = {
  args: baseArgs,
};

export const WithPagination: Story = {
  args: {
    ...baseArgs,
    totalPages: 5,
    currentPage: 2,
  },
};

export const Empty: Story = {
  args: {
    ...baseArgs,
    tableRows: [],
    emptyMessage: 'No admins found.',
  },
};
