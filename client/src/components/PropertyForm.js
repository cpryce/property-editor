import React, { useState, useEffect } from 'react';
import { Button, Form, Header, Select, Segment } from 'semantic-ui-react';

const EMPTY = { firstName: '', lastName: '', gender: 'M', characterName: '' };

const GENDER_OPTIONS = [
  { key: 'M', text: 'M', value: 'M' },
  { key: 'F', text: 'F', value: 'F' },
];

function PropertyForm({ selected, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(selected ? { ...selected } : EMPTY);
  }, [selected]);

  const handleChange = (e, { name, value }) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
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
        <Button type="submit" primary>
          {selected ? 'Update' : 'Create'}
        </Button>
        <Button type="button" onClick={() => setForm(EMPTY)}>
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
