const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const sendOtpEmail = async (email, otpCode) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email transport not configured; OTP would be sent here:', email, otpCode);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@onlinegigs.co.ke',
    to: email,
    subject: 'Your OnlineGigs verification code',
    text: `Your verification code is ${otpCode}. It expires in 15 minutes.`
  });
};

const notifyParties = async (job, dispute) => {
  console.log(`Notify parties for job ${job._id}: dispute ${dispute._id}`);
  return;
};

module.exports = { sendOtpEmail, notifyParties };
