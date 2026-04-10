import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';

import { TableFilterBar } from './TableFilterBar';

import styles from './TableFilterBar.stories.module.scss';

const meta: Meta<typeof TableFilterBar> = {
  component: TableFilterBar,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    filterColumnsLabel: { control: 'text' },
    funnelButtonLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof TableFilterBar>;

const columns = [
  { id: 'timestamp', label: 'Timestamp' },
  { id: 'actorType', label: 'Actor type' },
  { id: 'action', label: 'Action' },
  { id: 'target', label: 'Target' },
  { id: 'details', label: 'Details' },
];

export const Default: Story = {
  render: function DefaultTableFilterBar() {
    const [searchValue, setSearchValue] = useState('');
    const [selectedColumnIds, setSelectedColumnIds] = useState(columns.map((c) => c.id));
    return (
      <div className={styles.wrapper}>
        <TableFilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          columns={columns}
          selectedColumnIds={selectedColumnIds}
          onSelectedColumnIdsChange={setSelectedColumnIds}
          placeholder="Filter table…"
          filterColumnsLabel="Search in columns"
          funnelButtonLabel="Choose which columns to search"
        />
      </div>
    );
  },
};

export const TwoColumns: Story = {
  render: function TwoColumnsTableFilterBar() {
    const [searchValue, setSearchValue] = useState('');
    const [selectedColumnIds, setSelectedColumnIds] = useState(['email', 'displayName']);
    return (
      <div className={styles.wrapper}>
        <TableFilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          columns={[
            { id: 'email', label: 'Email' },
            { id: 'displayName', label: 'Display name' },
          ]}
          selectedColumnIds={selectedColumnIds}
          onSelectedColumnIdsChange={setSelectedColumnIds}
          placeholder="Filter table…"
          filterColumnsLabel="Search in columns"
          funnelButtonLabel="Choose which columns to search"
        />
      </div>
    );
  },
};
