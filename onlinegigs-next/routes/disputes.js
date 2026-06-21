const express = require('express');
const Dispute = require('../models/Dispute');
const Job = require('../models/Job');
const User = require('../models/User');
const { notifyParties } = require('../utils/notify');

const router = express.Router();

function classifyDispute({ description, reason }) {
  const lower = `${description || ''} ${reason || ''}`.toLowerCase();
  if (lower.includes('late') || lower.includes('delay')) return 'late_delivery';
  if (lower.includes('quality') || lower.includes('poor')) return 'poor_quality';
  if (lower.includes('fraud') || lower.includes('scam')) return 'fraud';
  if (lower.includes('payment') || lower.includes('charge')) return 'payment_issue';
  return 'other';
}

router.post('/file', async (req, res) => {
  const { jobId, reporterId, reason, description } = req.body;
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found.' });

  const type = classifyDispute({ reason, description });
  const escalate = type === 'fraud' || type === 'payment_issue';

  const dispute = new Dispute({
    job: jobId,
    reporter: reporterId,
    type,
    status: escalate ? 'escalated' : 'triaged',
    escalated: escalate,
    recommendedAction: escalate
      ? 'Escalate to human review and freeze payment.'
      : 'Review deliverables and encourage client-worker mediation.'
  });
  await dispute.save();

  job.status = 'disputed';
  job.disputeRaisedAt = new Date();
  await job.save();

  await notifyParties(job, dispute);

  return res.status(201).json({ message: 'Dispute filed.', dispute });
});

router.get('/recent', async (req, res) => {
  const disputes = await Dispute.find().sort({ createdAt: -1 }).limit(20).populate('job reporter');
  return res.json({ disputes });
});

router.post('/escalate', async (req, res) => {
  const { disputeId } = req.body;
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) return res.status(404).json({ message: 'Dispute not found.' });

  dispute.escalated = true;
  dispute.status = 'escalated';
  dispute.updatedAt = new Date();
  await dispute.save();

  return res.json({ message: 'Dispute escalated to human review.', dispute });
});

module.exports = router;
