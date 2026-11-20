import nodemailer from 'nodemailer';

const port = Number(process.env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// Sends the approved reply as plain text. Plain text avoids HTML injection from edited drafts.
export async function sendReplyEmail(ticket) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email is not configured');
  }

  const name = ticket.customer.name;
  const trackUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/track`;

  const text = [
    `Hello ${name},`,
    '',
    ticket.response.final,
    '',
    `Ticket number: ${ticket.ticketNumber}`,
    `You can check the status any time at: ${trackUrl}`,
    '',
    'ResolveAI Support'
  ].join('\n');

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: ticket.customer.email,
    subject: `Update on your complaint ${ticket.ticketNumber}`,
    text
  });
}