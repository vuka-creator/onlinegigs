const User = require('../models/User');

const detectSuspiciousAccount = async ({ email, ip }) => {
  if (!ip) return false;
  const accountsWithIp = await User.find({ ipAddresses: ip });
  if (accountsWithIp.length > 1) {
    return true;
  }

  const existing = await User.findOne({ email });
  if (existing && existing.ipAddresses.includes(ip)) {
    return false;
  }

  return false;
};

module.exports = { detectSuspiciousAccount };
