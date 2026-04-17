const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

// GET /api/properties — list with pagination, sorted by updatedAt desc
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      Property.find().sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Property.countDocuments(),
    ]);
    res.json({ properties, total, page, limit });
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
    const { firstName, lastName, gender, characterName, addresses, creditCards } = req.body;
    const data = { firstName, lastName, gender, characterName };
    if (Array.isArray(addresses))   data.addresses   = addresses;
    if (Array.isArray(creditCards)) data.creditCards = creditCards;
    const property = await Property.create(data);
    res.status(201).json(property);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/properties/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, gender, characterName, addresses, creditCards } = req.body;
    const update = { firstName, lastName, gender };
    const unset  = {};
    if (characterName === null || characterName === '') {
      unset.characterName = '';
    } else if (characterName !== undefined) {
      update.characterName = characterName;
    }
    if (Array.isArray(addresses))   update.addresses   = addresses;
    if (Array.isArray(creditCards)) update.creditCards = creditCards;
    const op = Object.keys(unset).length
      ? { $set: update, $unset: unset }
      : update;
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      op,
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
