import React, { useState, useEffect } from 'react';
import { Accordion, Button, Form, Header, Icon, Input, Select, Segment, Table } from 'semantic-ui-react';

const EMPTY = { firstName: '', lastName: '', gender: 'M', characterName: '' };

const DEFAULT_ATTRIBUTES = [
  { name: 'Strength',     title: 'Str', score: 10 },
  { name: 'Dexterity',    title: 'Dex', score: 10 },
  { name: 'Constitution', title: 'Con', score: 10 },
  { name: 'Intelligence', title: 'Int', score: 10 },
  { name: 'Wisdom',       title: 'Wis', score: 10 },
  { name: 'Charisma',     title: 'Cha', score: 10 },
];

const GENDER_OPTIONS = [
  { key: 'M', text: 'M', value: 'M' },
  { key: 'F', text: 'F', value: 'F' },
];

function freshAttributes(selected) {
  return selected?.attributes?.length === 6
    ? selected.attributes.map((a) => ({ ...a }))
    : DEFAULT_ATTRIBUTES.map((a) => ({ ...a }));
}

function PropertyForm({ selected, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [attributes, setAttributes] = useState(() => freshAttributes(null));
  const [attributesOpen, setAttributesOpen] = useState(false);

  useEffect(() => {
    setForm(selected ? { ...selected } : EMPTY);
    setAttributes(freshAttributes(selected));
    setAttributesOpen(false);
  }, [selected]);

  const handleChange = (e, { name, value }) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleScoreChange = (index, value) => {
    const parsed = parseInt(value, 10);
    setAttributes((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, score: isNaN(parsed) ? 0 : Math.max(0, parsed) } : a
      )
    );
  };

  const reset = () => {
    setForm(EMPTY);
    setAttributes(DEFAULT_ATTRIBUTES.map((a) => ({ ...a })));
    setAttributesOpen(false);
  };

  const handleSubmit = async () => {
    await onSave({ ...form, attributes });
    reset();
  };

  return (
    <Segment>
      <Header as="h3">{selected ? 'Edit Property' : 'New Property'}</Header>
      <Form onSubmit={handleSubmit}>
        <Form.Group widths="equal">
          <Form.Input
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="First Name"
            required
          />
          <Form.Input
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            required
          />
        </Form.Group>
        <Form.Group widths="equal">
          <Form.Field
            control={Select}
            label="Gender"
            name="gender"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={handleChange}
            required
          />
          <Form.Input
            label="Character Name"
            name="characterName"
            value={form.characterName}
            onChange={handleChange}
            placeholder="Character Name"
            required
          />
        </Form.Group>
        <Accordion styled fluid style={{ marginBottom: '1rem' }}>
          <Accordion.Title
            active={attributesOpen}
            onClick={() => setAttributesOpen((o) => !o)}
            style={{ fontSize: '1.07rem', fontWeight: 'bold' }}
          >
            <Icon name="dropdown" />
            Attributes
          </Accordion.Title>
          <Accordion.Content active={attributesOpen}>
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
          </Accordion.Content>
        </Accordion>
        <Button type="submit" primary>
          {selected ? 'Update' : 'Create'}
        </Button>
        <Button type="button" onClick={() => { reset(); onCancel(); }}>
          Clear
        </Button>
        {selected && (
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </Form>
    </Segment>
  );
}

export default PropertyForm;
