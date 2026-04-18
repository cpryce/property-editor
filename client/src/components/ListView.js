import React from 'react';
import { Box, Pagination } from '@mui/material';
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            color="primary"
            page={page}
            totalPages={totalPages}
            onChange={(_, activePage) => onPageChange(activePage)}
            boundaryCount={1}
            siblingCount={1}
          />
        </Box>
      )}
    </>
  );
}

export default ListView;
