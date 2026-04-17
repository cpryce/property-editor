import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Snackbar,
  Alert,
  Toolbar,
  Typography,
} from '@mui/material';
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
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            Property Editor
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <PropertyForm
          selected={selected}
          onSave={handleSave}
          onCancel={() => setSelected(null)}
        />
        <Box sx={{ mt: 4 }}>
          <PropertyTable
            properties={properties}
            onEdit={setSelected}
            onDelete={handleDelete}
          />
        </Box>
      </Container>
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
