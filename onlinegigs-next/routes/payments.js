const express = require('express');
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const User = require('../models/User');

const router = express.Router();

function computeCommission(user) {
  if (!user) {
    return 0.3;
  }
  if (user.rating >= 4.8) return 0.18;
  if (user.rating >= 4.5) return 0.22;
  if (user.rating >= 4.2) return 0.26;
  return 0.3;
}

router.post('/approve-work', async (req, res) => {
  const { jobId } = req.body;
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found.' });
  if (job.status === 'disputed') return res.status(409).json({ message: 'Work is under dispute.' });

  job.status = 'closed';
  job.releasedAt = new Date();
  await job.save();

  const payment = await Payment.findOne({ job: job._id });
  if (payment) {
    payment.status = 'released';
    payment.updatedAt = new Date();
    await payment.save();
  }

  return res.json({ message: 'Escrow released successfully.' });
});

router.post('/raise-dispute', async (req, res) => {
  const { jobId, reason } = req.body;
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found.' });

  job.status = 'disputed';
  job.disputeRaisedAt = new Date();
  await job.save();

  const payment = await Payment.findOne({ job: job._id });
  if (payment) {
    payment.status = 'held';
    payment.updatedAt = new Date();
    await payment.save();
  }

  return res.json({ message: 'Dispute raised and funds held in escrow.' });
});

router.post('/create', async (req, res) => {
  const { clientId, workerId, jobId, amount } = req.body;
  const worker = await User.findById(workerId);
  const commissionPct = computeCommission(worker);

  const payment = new Payment({
    job: jobId,
    client: clientId,
    worker: workerId,
    amount,
    commissionPct,
    status: 'held'
  });
  await payment.save();

  return res.status(201).json({ message: 'Payment created and held in escrow.', payment });
});

router.get('/summary', async (req, res) => {
  const summary = await Payment.aggregate([
    { $match: {} },
    { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);
  return res.json({ summary });
});

module.exports = router;
