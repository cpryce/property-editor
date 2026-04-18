import React, { useState, useEffect, useCallback } from 'react';
import { Container, Menu, Message } from 'semantic-ui-react';
import * as api from './api';
import ListView from './components/ListView';
import PropertyForm from './components/PropertyForm';

const PAGE_SIZE = 10;

function App() {
  const [view, setView] = useState('list'); // 'list' | 'new'
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async (p = page) => {
    try {
      const data = await api.getAll({ page: p, limit: PAGE_SIZE });
      // handle both paginated response and legacy plain array
      if (Array.isArray(data)) {
        setProperties(data);
        setTotal(data.length);
      } else {
        setProperties(data.properties ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? p);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [page]);

  useEffect(() => {
    if (view === 'list') load(page);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage) => {
    load(newPage);
  };

  const handleEdit = (property) => {
    setSelected(property);
    setView('new');
  };

  const handleSave = async (form) => {
    try {
      if (selected) {
        await api.update(selected.id, form);
      } else {
        await api.create(form);
      }
      setSelected(null);
      setView('list');
      await load(1);
    } catch (e) {
      setError(e.message);
      throw e; // let the form know save failed so it doesn't clear
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.remove(id);
      await load(page);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleNavNew = () => {
    setSelected(null);
    setView('new');
  };

  const handleNavList = () => {
    setSelected(null);
    setView('list');
  };

  return (
    <>
      <Menu inverted fixed="top">
        <Menu.Item header>Property Editor</Menu.Item>
        <Menu.Item active={view === 'new'} onClick={handleNavNew}>New</Menu.Item>
        <Menu.Item active={view === 'list'} onClick={handleNavList}>List</Menu.Item>
      </Menu>
      <Container className="app-shell">
        {error && (
          <Message negative onDismiss={() => setError(null)}>
            <Message.Header>Error</Message.Header>
            <p>{error}</p>
          </Message>
        )}
        {view === 'new' ? (
          <PropertyForm
            selected={selected}
            onSave={handleSave}
            onCancel={handleNavList}
          />
        ) : (
          <ListView
            properties={properties}
            total={total}
            page={page}
            limit={PAGE_SIZE}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
          />
        )}
      </Container>
    </>
  );
}

export default App;
