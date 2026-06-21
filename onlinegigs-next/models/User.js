const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['freelancer', 'customer', 'superAdmin', 'support', 'finance'], default: 'customer' },
  verified: { type: Boolean, default: false },
  otpCode: String,
  otpExpires: Date,
  flags: {
    fraud: { type: Boolean, default: false },
    duplicateAccount: { type: Boolean, default: false }
  },
  ipAddresses: [String],
  rating: { type: Number, default: 0 },
  disputesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
