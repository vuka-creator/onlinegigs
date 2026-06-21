const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/notify');
const { detectSuspiciousAccount } = require('../utils/fraud');

const router = express.Router();

function generateOtp() {
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}

router.post('/signup', async (req, res) => {
  const { name, email, password, role, ip } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ message: 'Account already exists with that email.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otpCode = generateOtp();
  const otpExpires = new Date(Date.now() + 1000 * 60 * 15);

  const user = new User({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: role || 'customer',
    verified: false,
    otpCode,
    otpExpires,
    ipAddresses: ip ? [ip] : []
  });

  if (ip) {
    user.flags.duplicateAccount = await detectSuspiciousAccount({ email: user.email, ip });
  }

  await user.save();
  await sendOtpEmail(user.email, otpCode);

  return res.status(201).json({
    message: 'Signup complete. An OTP has been sent for verification.',
    userId: user._id,
    suspicious: user.flags.duplicateAccount
  });
});

router.post('/verify-otp', async (req, res) => {
  const { email, otpCode } = req.body;
  if (!email || !otpCode) {
    return res.status(400).json({ message: 'Email and OTP code are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  if (user.verified) {
    return res.json({ message: 'Account is already verified.' });
  }

  if (!user.otpCode || user.otpCode !== otpCode || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP.' });
  }

  user.verified = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();

  return res.json({ message: 'Account verified successfully.', verified: true });
});

router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(404).json({ message: 'Account does not exist.' });
  }

  const otpCode = generateOtp();
  user.otpCode = otpCode;
  user.otpExpires = new Date(Date.now() + 1000 * 60 * 15);
  await user.save();
  await sendOtpEmail(user.email, otpCode);

  return res.json({ message: 'A new OTP has been sent to your email.' });
});

router.post('/login', async (req, res) => {
  const { email, password, role, ip } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (!user.verified) {
    return res.status(403).json({ message: 'Account must be verified before login.' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match || user.role !== role) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (ip && !user.ipAddresses.includes(ip)) {
    user.ipAddresses.push(ip);
    await user.save();
  }

  return res.json({ message: 'Login successful.', user: { id: user._id, email: user.email, role: user.role } });
});

module.exports = router;
