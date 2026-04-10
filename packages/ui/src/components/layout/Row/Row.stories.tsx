import type { Meta, StoryObj } from '@storybook/react-vite';

import { Row } from './Row';

const meta: Meta<typeof Row> = {
  component: Row,
  tags: ['autodocs'],
  argTypes: {
    wrap: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Row>;

export const Default: Story = {
  args: {
    children: (
      <>
        <span>Item 1</span>
        <span>Item 2</span>
        <span>Item 3</span>
      </>
    ),
  },
};

export const WithWrap: Story = {
  args: {
    wrap: true,
    children: (
      <>
        <span>Wrapped</span>
        <span>row</span>
        <span>items</span>
      </>
    ),
  },
};
