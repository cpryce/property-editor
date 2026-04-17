import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const EMPTY = { firstName: '', lastName: '', gender: 'M', characterName: '' };

function PropertyForm({ selected, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(selected ? { ...selected } : EMPTY);
  }, [selected]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {selected ? 'Edit Property' : 'New Property'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="First Name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl required fullWidth>
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select
                labelId="gender-label"
                name="gender"
                value={form.gender}
                label="Gender"
                onChange={handleChange}
              >
                <MenuItem value="M">M</MenuItem>
                <MenuItem value="F">F</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Character Name"
              name="characterName"
              value={form.characterName}
              onChange={handleChange}
              required
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained">
              {selected ? 'Update' : 'Create'}
            </Button>
            {selected && (
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default PropertyForm;
