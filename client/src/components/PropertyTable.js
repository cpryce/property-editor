import React, { useState } from 'react';
import { Message } from 'semantic-ui-react';

function PropertyTable({ properties, onEdit, onDelete }) {
  const [selectedId, setSelectedId] = useState(null);

  if (!properties || !properties.length) {
    return <Message info content="No properties yet." />;
  }

  const handleRowClick = (p) => {
    setSelectedId((prev) => (prev === p.id ? null : p.id));
  };

  return (
    <table className="property-table">
      <thead className="property-table-head">
        <tr>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Gender</th>
          <th>Character Name</th>
          <th>Last Modified</th>
          <th className="property-table-actions-header">Actions</th>
        </tr>
      </thead>
      <tbody>
        {properties.map((p) => (
          <tr
            key={p.id}
            aria-selected={selectedId === p.id}
            onClick={() => handleRowClick(p)}
            className={selectedId === p.id ? 'property-table-row property-table-row--active' : 'property-table-row'}
          >
            <td className="property-table-cell">
              <span className="property-table-edit-text" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>{p.firstName}</span>
            </td>
            <td className="property-table-cell">
              <span className="property-table-edit-text" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>{p.lastName}</span>
            </td>
            <td className="property-table-cell">
              <span className="property-table-edit-text" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>{p.gender}</span>
            </td>
            <td className="property-table-cell">
              <span className="property-table-edit-text" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>{p.characterName}</span>
            </td>
            <td className="property-table-cell property-table-cell--timestamp">
              <span className="property-table-edit-text" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                {p.updatedAt || p.createdAt ? new Date(p.updatedAt || p.createdAt).toLocaleString() : '—'}
              </span>
            </td>
            <td className="property-table-actions-cell" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="property-table-delete-button"
                onClick={() => onDelete(p.id)}
                aria-label={`Delete ${p.firstName} ${p.lastName}`.trim()}
                title="Delete"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PropertyTable;
