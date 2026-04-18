import React, { useState } from 'react';

const COLUMNS = [
  { label: 'First Name',     field: 'firstName' },
  { label: 'Last Name',      field: 'lastName' },
  { label: 'Gender',         field: 'gender' },
  { label: 'Character Name', field: 'characterName' },
  { label: 'Last Modified',  field: 'updatedAt' },
];

function SortIcon({ active, dir }) {
  if (!active) return <span aria-hidden="true" style={{ marginLeft: '4px', opacity: 0.3 }}>⇅</span>;
  return (
    <span aria-hidden="true" style={{ marginLeft: '4px' }}>
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function PropertyTable({ properties, sortBy, sortDir, onEdit, onDelete, onSortChange }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleColumnClick = (field) => {
    if (sortBy === field) {
      onSortChange(field, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  if (!properties || !properties.length) {
    return <div className="gh-alert gh-alert-info" role="status">No properties yet.</div>;
  }

  const handleRowClick = (p) => {
    setSelectedId((prev) => (prev === p.id ? null : p.id));
  };

  return (
    <div className="gh-card overflow-hidden">
      <table className="gh-table">
        <thead>
          <tr>
            {COLUMNS.map(({ label, field }) => (
              <th
                key={field}
                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                onClick={() => handleColumnClick(field)}
                aria-sort={sortBy === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {label}
                <SortIcon active={sortBy === field} dir={sortDir} />
              </th>
            ))}
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr
              key={p.id}
              className={selectedId === p.id ? 'selected' : ''}
              onClick={() => handleRowClick(p)}
              style={{ cursor: 'pointer' }}
            >
              <td>
                <button type="button" className="btn-invisible btn" style={{ padding: 0, color: 'var(--color-accent-fg)' }}
                  onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                  {p.firstName}
                </button>
              </td>
              <td>
                <button type="button" className="btn-invisible btn" style={{ padding: 0, color: 'var(--color-accent-fg)' }}
                  onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                  {p.lastName}
                </button>
              </td>
              <td>
                <button type="button" className="btn-invisible btn" style={{ padding: 0, color: 'var(--color-accent-fg)' }}
                  onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                  {p.gender}
                </button>
              </td>
              <td>
                <button type="button" className="btn-invisible btn" style={{ padding: 0, color: 'var(--color-accent-fg)' }}
                  onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                  {p.characterName}
                </button>
              </td>
              <td style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                <button type="button" className="btn-invisible btn" style={{ padding: 0, color: 'var(--color-fg-muted)' }}
                  onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                  {p.updatedAt || p.createdAt ? new Date(p.updatedAt || p.createdAt).toLocaleString() : '—'}
                </button>
              </td>
              <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => onDelete(p.id)}
                  aria-label={`Delete ${p.firstName} ${p.lastName}`.trim()}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PropertyTable;

