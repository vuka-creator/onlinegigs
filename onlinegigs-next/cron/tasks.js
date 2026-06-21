const cron = require('node-cron');
const User = require('../models/User');
const Job = require('../models/Job');
const Payment = require('../models/Payment');

const dailyRevenueReport = async () => {
  const totalRevenue = await Payment.aggregate([
    { $match: { status: 'released' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  console.log('Daily revenue report:', totalRevenue[0] || { total: 0 });
};

const weeklyPerformanceSummary = async () => {
  const topWorkers = await User.find({ role: 'freelancer' })
    .sort({ rating: -1, disputesCount: 1 })
    .limit(5)
    .select('name email rating disputesCount');
  console.log('Weekly worker performance summary:', topWorkers);
};

const cleanupExpiredJobs = async () => {
  const threshold = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const expiredJobs = await Job.updateMany(
    { status: 'open', createdAt: { $lt: threshold } },
    { status: 'closed' }
  );
  console.log('Expired job cleanup applied:', expiredJobs.modifiedCount);
};

const removeInactiveAccounts = async () => {
  const threshold = new Date(Date.now() - 1000 * 60 * 60 * 24 * 180);
  const result = await User.deleteMany({ verified: false, createdAt: { $lt: threshold } });
  console.log('Inactive account cleanup removed:', result.deletedCount);
};

const startCronJobs = () => {
  cron.schedule('0 5 * * *', dailyRevenueReport, { timezone: 'UTC' });
  cron.schedule('0 6 * * 1', weeklyPerformanceSummary, { timezone: 'UTC' });
  cron.schedule('0 7 * * *', cleanupExpiredJobs, { timezone: 'UTC' });
  cron.schedule('0 7 * * 0', removeInactiveAccounts, { timezone: 'UTC' });
  console.log('Scheduled tasks started.');
};

module.exports = { startCronJobs };
