import React, { useState, useEffect, useCallback } from 'react';
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
        const updated = await api.update(selected.id, form);
        setSelected(updated);
      } else {
        await api.create(form);
        setSelected(null);
        setView('list');
        await load(1);
      }
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
    <div>
      {/* GitHub-style top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 h-12"
        style={{ background: '#24292f', borderBottom: '1px solid #444c56' }}>
        <span className="font-semibold text-white flex-1" style={{ fontSize: 'var(--font-size-base)' }}>
          Property Editor
        </span>
        <button
          className={`btn btn-sm ${view === 'new' ? 'btn-primary' : 'btn-default'}`}
          style={view !== 'new' ? { background: 'transparent', borderColor: '#6e7681', color: '#cdd9e5' } : {}}
          onClick={handleNavNew}
        >
          New
        </button>
        <button
          className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-default'}`}
          style={view !== 'list' ? { background: 'transparent', borderColor: '#6e7681', color: '#cdd9e5' } : {}}
          onClick={handleNavList}
        >
          List
        </button>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 py-6" style={{ marginTop: '56px' }}>
        {error && (
          <div className="gh-alert gh-alert-error mb-4" role="alert">
            <span style={{ flex: 1 }}>{error}</span>
            <button className="btn-invisible btn" onClick={() => setError(null)} aria-label="Dismiss error">✕</button>
          </div>
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
      </main>
    </div>
  );
}

export default App;
