const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, source, status, notes } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    const lead = new Lead({ name, email, source, status, notes });
    const savedLead = await lead.save();
    res.status(201).json(savedLead);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, source, status, notes } = req.body;
    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      { name, email, source, status, notes },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Lead not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Lead not found' });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
