const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['late_delivery', 'poor_quality', 'fraud', 'payment_issue', 'other'], default: 'other' },
  status: { type: String, enum: ['pending', 'triaged', 'escalated', 'resolved'], default: 'pending' },
  notes: String,
  escalated: { type: Boolean, default: false },
  recommendedAction: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model('Dispute', disputeSchema);
