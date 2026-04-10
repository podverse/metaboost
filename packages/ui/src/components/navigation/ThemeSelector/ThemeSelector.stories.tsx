import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ThemeSelector } from './ThemeSelector';

const meta: Meta<typeof ThemeSelector> = {
  component: ThemeSelector,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ThemeSelector>;

export const Default: Story = {};
