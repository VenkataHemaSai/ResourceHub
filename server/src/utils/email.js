import nodemailer from 'nodemailer';
import { config } from '../config.js';
import logger from './logger.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    });
  } else {
    transporter = { sendMail: null };
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();

  if (!t.sendMail) {
    logger.info({ to, subject }, '[email] SMTP not configured — skipping send');
    return;
  }

  try {
    await t.sendMail({ from: config.SMTP_FROM, to, subject, html, text });
    logger.info({ to, subject }, '[email] sent');
  } catch (err) {
    logger.error({ err, to, subject }, '[email] send failed');
  }
}

export function bookingReminderEmail({ userName, resourceName, startTime, endTime }) {
  return {
    subject: `Your booking starts in 10 minutes — ${resourceName}`,
    html: `<p>Hi ${userName},</p>
<p>Your booking for <strong>${resourceName}</strong> starts at <strong>${startTime}</strong> and ends at <strong>${endTime}</strong>.</p>
<p>Please collect your resource from the admin desk on time.</p>`,
  };
}

export function returnReminderEmail({ userName, resourceName, endTime }) {
  return {
    subject: `Please return ${resourceName} in 5 minutes`,
    html: `<p>Hi ${userName},</p>
<p>Your booking for <strong>${resourceName}</strong> ends at <strong>${endTime}</strong>.</p>
<p>Please return it to the admin desk within the next 5 minutes to avoid any penalties.</p>`,
  };
}

export function overdueEmail({ userName, resourceName }) {
  return {
    subject: `OVERDUE: Please return ${resourceName} immediately`,
    html: `<p>Hi ${userName},</p>
<p>Your booking for <strong>${resourceName}</strong> has ended and the item has not been returned yet.</p>
<p>Please return it to the admin desk immediately. Failure to do so may result in a suspension.</p>`,
  };
}

export function apologyEmail({ userName, resourceName, startTime }) {
  return {
    subject: `Sorry — your booking for ${resourceName} cannot be fulfilled`,
    html: `<p>Hi ${userName},</p>
<p>Unfortunately, your booking for <strong>${resourceName}</strong> starting at <strong>${startTime}</strong> cannot be fulfilled because the previous user has not returned the item yet.</p>
<p>Your booking has been cancelled. We apologize for the inconvenience.</p>`,
  };
}

export function banNotificationEmail({ userName, resourceType, bannedUntil, reason }) {
  return {
    subject: `Your booking privileges for ${resourceType} have been suspended`,
    html: `<p>Hi ${userName},</p>
<p>Your ability to book <strong>${resourceType}</strong> resources has been suspended until <strong>${bannedUntil}</strong>.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p>If you believe this is a mistake, please contact your organization administrator.</p>`,
  };
}
