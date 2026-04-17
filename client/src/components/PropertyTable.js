import React, { useState } from 'react';
import { Button, Icon, Message, Table } from 'semantic-ui-react';

const cellStyle = { cursor: 'pointer' };
const textStyle = { cursor: 'text', display: 'inline' };

function PropertyTable({ properties, onEdit, onDelete }) {
  const [selectedId, setSelectedId] = useState(null);

  if (!properties || !properties.length) {
    return <Message info content="No properties yet." />;
  }

  const handleRowClick = (p) => {
    setSelectedId((prev) => (prev === p.id ? null : p.id));
  };

  return (
    <Table celled striped selectable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>First Name</Table.HeaderCell>
          <Table.HeaderCell>Last Name</Table.HeaderCell>
          <Table.HeaderCell>Gender</Table.HeaderCell>
          <Table.HeaderCell>Character Name</Table.HeaderCell>
          <Table.HeaderCell>Last Modified</Table.HeaderCell>
          <Table.HeaderCell textAlign="center">Actions</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {properties.map((p) => (
          <Table.Row
            key={p.id}
            active={selectedId === p.id}
            onClick={() => handleRowClick(p)}
            style={{ cursor: 'pointer' }}
          >
            <Table.Cell style={cellStyle}>
              <span style={textStyle} onClick={(e) => { e.stopPropagation(); onEdit(p); }}>{p.firstName}</span>
            </Table.Cell>
            <Table.Cell style={cellStyle}>
              <span style={textStyle} onClick={(e) => { e.stopPropagation(); onEdit(p); }}>{p.lastName}</span>
            </Table.Cell>
            <Table.Cell style={cellStyle}>
              <span style={textStyle} onClick={(e) => { e.stopPropagation(); onEdit(p); }}>{p.gender}</span>
            </Table.Cell>
            <Table.Cell style={cellStyle}>
              <span style={textStyle} onClick={(e) => { e.stopPropagation(); onEdit(p); }}>{p.characterName}</span>
            </Table.Cell>
            <Table.Cell style={{ ...cellStyle, whiteSpace: 'nowrap', color: '#888', fontSize: '0.85rem' }}>
              <span style={textStyle} onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                {p.updatedAt || p.createdAt ? new Date(p.updatedAt || p.createdAt).toLocaleString() : '—'}
              </span>
            </Table.Cell>
            <Table.Cell textAlign="center" onClick={(e) => e.stopPropagation()}>
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
