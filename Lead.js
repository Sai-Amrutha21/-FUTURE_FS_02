const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  source: { type: String, enum: ['Website', 'Referral', 'Social Media', 'Email', 'Other'], default: 'Website' },
  status: { type: String, enum: ['New', 'Contacted', 'Converted'], default: 'New' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
