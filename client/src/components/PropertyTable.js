import React, { useState } from 'react';
import {
  Alert,
  Button,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

function PropertyTable({ properties, onEdit, onDelete }) {
  const [selectedId, setSelectedId] = useState(null);

  if (!properties || !properties.length) {
    return <Alert severity="info">No properties yet.</Alert>;
  }

  const handleRowClick = (p) => {
    setSelectedId((prev) => (prev === p.id ? null : p.id));
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Gender</TableCell>
            <TableCell>Character Name</TableCell>
            <TableCell>Last Modified</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        {properties.map((p) => (
          <TableRow
            hover
            key={p.id}
            selected={selectedId === p.id}
            onClick={() => handleRowClick(p)}
          >
            <TableCell>
              <Link component="button" type="button" underline="hover" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                {p.firstName}
              </Link>
            </TableCell>
            <TableCell>
              <Link component="button" type="button" underline="hover" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                {p.lastName}
              </Link>
            </TableCell>
            <TableCell>
              <Link component="button" type="button" underline="hover" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                {p.gender}
              </Link>
            </TableCell>
            <TableCell>
              <Link component="button" type="button" underline="hover" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                {p.characterName}
              </Link>
            </TableCell>
            <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
              <Link component="button" type="button" underline="hover" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
                {p.updatedAt || p.createdAt ? new Date(p.updatedAt || p.createdAt).toLocaleString() : '—'}
              </Link>
            </TableCell>
            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
              <Button
                color="error"
                size="small"
                variant="outlined"
                onClick={() => onDelete(p.id)}
                aria-label={`Delete ${p.firstName} ${p.lastName}`.trim()}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default PropertyTable;
