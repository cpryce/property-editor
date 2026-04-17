import React from 'react';
import { Button, Icon, Message, Table } from 'semantic-ui-react';

function PropertyTable({ properties, onEdit, onDelete }) {
  if (!properties || !properties.length) {
    return <Message info content="No properties yet." />;
  }

  return (
    <Table celled striped>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>ID</Table.HeaderCell>
          <Table.HeaderCell>First Name</Table.HeaderCell>
          <Table.HeaderCell>Last Name</Table.HeaderCell>
          <Table.HeaderCell>Gender</Table.HeaderCell>
          <Table.HeaderCell>Character Name</Table.HeaderCell>
          <Table.HeaderCell textAlign="center">Actions</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {properties.map((p) => (
          <Table.Row key={p.id}>
            <Table.Cell style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>
              {p.id}
            </Table.Cell>
            <Table.Cell>{p.firstName}</Table.Cell>
            <Table.Cell>{p.lastName}</Table.Cell>
            <Table.Cell>{p.gender}</Table.Cell>
            <Table.Cell>{p.characterName}</Table.Cell>
            <Table.Cell textAlign="center">
              <Button icon size="tiny" onClick={() => onEdit(p)} title="Edit">
                <Icon name="edit" />
              </Button>
              <Button icon size="tiny" color="red" onClick={() => onDelete(p.id)} title="Delete">
                <Icon name="trash" />
              </Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export default PropertyTable;
