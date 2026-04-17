import React, { useState } from 'react';
import { Button, Header, Input, Segment, Table } from 'semantic-ui-react';

function AttributeForm({ property, onSave, onCancel }) {
  const [attributes, setAttributes] = useState(
    property.attributes && property.attributes.length === 6
      ? property.attributes.map((a) => ({ ...a }))
      : [
          { name: 'Strength',     title: 'Str', score: 10 },
          { name: 'Dexterity',    title: 'Dex', score: 10 },
          { name: 'Constitution', title: 'Con', score: 10 },
          { name: 'Intelligence', title: 'Int', score: 10 },
          { name: 'Wisdom',       title: 'Wis', score: 10 },
          { name: 'Charisma',     title: 'Cha', score: 10 },
        ]
  );

  const handleScoreChange = (index, value) => {
    const parsed = parseInt(value, 10);
    setAttributes((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, score: isNaN(parsed) ? 0 : Math.max(0, parsed) } : a
      )
    );
  };

  const handleSubmit = () => {
    onSave(attributes);
  };

  return (
    <Segment>
      <Header as="h3">
        Attributes — {property.firstName} {property.lastName} ({property.characterName})
      </Header>
      <Table celled compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Ability</Table.HeaderCell>
            <Table.HeaderCell>Title</Table.HeaderCell>
            <Table.HeaderCell>Score</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {attributes.map((attr, i) => (
            <Table.Row key={attr.title}>
              <Table.Cell>{attr.name}</Table.Cell>
              <Table.Cell>{attr.title}</Table.Cell>
              <Table.Cell>
                <Input
                  type="number"
                  min={0}
                  value={attr.score}
                  onChange={(e) => handleScoreChange(i, e.target.value)}
                  style={{ width: '80px' }}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Button primary onClick={handleSubmit}>Save</Button>
      <Button onClick={onCancel}>Cancel</Button>
    </Segment>
  );
}

export default AttributeForm;
