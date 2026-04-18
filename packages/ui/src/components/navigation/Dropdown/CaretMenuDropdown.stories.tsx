import type { Meta, StoryObj } from '@storybook/react-vite';

import { CaretMenuDropdown } from './CaretMenuDropdown';
import { DropdownMenuCheckboxRow } from './DropdownMenuCheckboxRow';

const meta: Meta<typeof CaretMenuDropdown> = {
  component: CaretMenuDropdown,
  tags: ['autodocs'],
  argTypes: {
    'aria-label': { control: 'text' },
    alignWithToolbarTabs: { control: 'boolean' },
    centerTriggerVertically: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: '2.5rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CaretMenuDropdown>;

export const WithMenuItems: Story = {
  args: {
    'aria-label': 'Message actions',
    items: [
      { type: 'button', label: 'Block sender', onClick: () => {} },
      { type: 'button', label: 'Delete', onClick: () => {} },
    ],
  },
};

/** Same trigger metrics as next to Data/Graphs on the bucket summary (`iconGhostInline`). */
export const SummaryToolbarTabs: Story = {
  args: {
    alignWithToolbarTabs: true,
    'aria-label': 'Summary options',
    panelContent: (
      <DropdownMenuCheckboxRow
        label="Include blocked senders"
        checked={false}
        onChange={() => {}}
      />
    ),
  },
};

export const WithCustomPanel: Story = {
  args: {
    'aria-label': 'Summary options',
    panelContent: (
      <DropdownMenuCheckboxRow
        label="Include blocked senders"
        checked={false}
        onChange={() => {}}
      />
    ),
  },
};

/** Use with `centerTriggerVertically` inside a stretched row (see message card header). */
export const VerticallyCenteredInTallRow: Story = {
  args: {
    centerTriggerVertically: true,
    'aria-label': 'Message actions',
    items: [{ type: 'button', label: 'Delete', onClick: () => {} }],
  },
  decorators: [
    (Story) => (
      <div
        style={{
          alignItems: 'stretch',
          border: '1px dashed var(--color-border, #555)',
          display: 'flex',
          gap: '1rem',
          minHeight: '4rem',
          padding: '0.5rem',
          width: 'min(22rem, 100%)',
        }}
      >
        <span style={{ alignSelf: 'center', flex: 1 }}>
          Tall sender column so the caret column can stretch.
        </span>
        <Story />
      </div>
    ),
  ],
};
