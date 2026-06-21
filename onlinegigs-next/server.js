require('dotenv').config({ path: '../.env' });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { connectDatabase } = require('./lib/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const paymentsRoutes = require('./routes/payments');
const disputesRoutes = require('./routes/disputes');
const { startCronJobs } = require('./cron/tasks');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/disputes', disputesRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

const port = Number(process.env.PORT || 4000);

connectDatabase()
  .then(() => {
    startCronJobs();
    app.listen(port, () => {
      console.log(`OnlineGigs API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
