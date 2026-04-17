import React, { useState, useEffect } from 'react';
import { Container, Menu, Message } from 'semantic-ui-react';
import * as api from './api';
import PropertyTable from './components/PropertyTable';
import PropertyForm from './components/PropertyForm';

function App() {
  const [properties, setProperties] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const data = await api.getAll();
      setProperties(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (form) => {
    try {
      if (selected) {
        await api.update(selected.id, form);
      } else {
        await api.create(form);
      }
      setSelected(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.remove(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <Menu inverted fixed="top">
        <Menu.Item header>Property Editor</Menu.Item>
      </Menu>
      <Container style={{ marginTop: '5rem', marginBottom: '2rem' }}>
        {error && (
          <Message negative onDismiss={() => setError(null)}>
            <Message.Header>Error</Message.Header>
            <p>{error}</p>
          </Message>
        )}
        <PropertyForm
          selected={selected}
          onSave={handleSave}
          onCancel={() => setSelected(null)}
        />
        <PropertyTable
          properties={properties}
          onEdit={setSelected}
          onDelete={handleDelete}
        />
      </Container>
    </>
  );
}

export default App;
