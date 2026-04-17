import React from 'react';
import { Pagination } from 'semantic-ui-react';
import PropertyTable from './PropertyTable';

function ListView({ properties, total, page, limit, onEdit, onDelete, onPageChange }) {
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <PropertyTable
        properties={properties}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {totalPages > 1 && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Pagination
            activePage={page}
            totalPages={totalPages}
            onPageChange={(_, { activePage }) => onPageChange(activePage)}
            boundaryRange={1}
            siblingRange={1}
            ellipsisItem={null}
          />
        </div>
      )}
    </>
  );
}

export default ListView;
