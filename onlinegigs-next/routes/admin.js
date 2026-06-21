const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Dispute = require('../models/Dispute');
const Payment = require('../models/Payment');

const router = express.Router();

const adminPassword = process.env.ADMIN_PASSWORD || '';
const adminEmail = process.env.ADMIN_EMAIL || '';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid admin credentials.' });
  }
  return res.json({ message: 'Admin login successful.', role: 'superAdmin' });
});

router.get('/analytics', async (req, res) => {
  const users = await User.countDocuments();
  const disputes = await Dispute.countDocuments({ status: 'pending' });
  const payments = await Payment.aggregate([
    { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  return res.json({
    totalUsers: users,
    pendingDisputes: disputes,
    paymentSummary: payments
  });
});

router.get('/flagged', async (req, res) => {
  const flagged = await User.find({ 'flags.fraud': true }).select('email role rating ipAddresses disputesCount');
  return res.json({ flagged });
});

router.post('/user/:id/flag', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.flags.fraud = true;
  await user.save();
  return res.json({ message: 'User flagged for review.' });
});

module.exports = router;
