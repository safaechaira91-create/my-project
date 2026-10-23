import nodemailer from 'nodemailer';

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporterInstance = null;

const getTransporter = () => {
  if (!hasSmtpConfig()) return null;

  if (!transporterInstance) {
    const port = Number(process.env.SMTP_PORT || 587);
    const isSecure =
      String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporterInstance;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    console.log('[email skipped: missing recipient]', { subject });
    return { skipped: true, reason: 'missing-recipient' };
  }

  const transporter = getTransporter();
  const message = {
    from: process.env.EMAIL_FROM || 'MyDar <no-reply@mydar.local>',
    to,
    subject,
    text,
    html: html || text,
  };

  if (!transporter) {
    console.log('[email skipped: SMTP not configured]', message);
    return { skipped: true, reason: 'smtp-not-configured' };
  }

  try {
    const info = await transporter.sendMail(message);
    console.log('[email sent]', { to, subject, messageId: info.messageId });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email failed]', { to, subject, message: error.message });
    return { sent: false, error: error.message };
  }
};

export const formatDate = (date) => {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return '';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};