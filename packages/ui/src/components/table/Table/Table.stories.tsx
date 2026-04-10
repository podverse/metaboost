import type { Meta, StoryObj } from '@storybook/react-vite';

import { Table } from './Table';

const meta: Meta<typeof Table> = {
  component: Table,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Role</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Alice</Table.Cell>
          <Table.Cell>Admin</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Bob</Table.Cell>
          <Table.Cell>Viewer</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};

export const WithScrollContainer: Story = {
  render: () => (
    <Table.ScrollContainer>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Alice</Table.Cell>
            <Table.Cell>Admin</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Bob</Table.Cell>
            <Table.Cell>Viewer</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </Table.ScrollContainer>
  ),
};

export const EventsLike: Story = {
  render: () => (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Timestamp</Table.HeaderCell>
          <Table.HeaderCell>Actor type</Table.HeaderCell>
          <Table.HeaderCell>Action</Table.HeaderCell>
          <Table.HeaderCell>Target</Table.HeaderCell>
          <Table.HeaderCell>Details</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Feb 28, 2026, 1:52 PM CST</Table.Cell>
          <Table.Cell>admin</Table.Cell>
          <Table.Cell>user_created</Table.Cell>
          <Table.Cell>user — abc-123</Table.Cell>
          <Table.Cell>—</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Feb 28, 2026, 2:00 PM CST</Table.Cell>
          <Table.Cell>super_admin</Table.Cell>
          <Table.Cell>admin_updated</Table.Cell>
          <Table.Cell>admin — def-456</Table.Cell>
          <Table.Cell>Permissions changed</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  ),
};
