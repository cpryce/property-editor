const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

// GET /api/properties — list all
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/properties/:id — get one
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties — create
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, gender, characterName } = req.body;
    const property = await Property.create({ firstName, lastName, gender, characterName });
    res.status(201).json(property);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/properties/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, gender, characterName } = req.body;
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, gender, characterName },
      { new: true, runValidators: true }
    );
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.json(property);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/properties/:id — delete
router.delete('/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
