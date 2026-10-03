import cron from 'node-cron';
import prisma from '../utils/prisma.js';
import {
  sendEmail,
  bookingReminderEmail,
  returnReminderEmail,
  overdueEmail,
} from '../utils/email.js';
import logger from '../utils/logger.js';

function minutesFromNow(n) {
  return new Date(Date.now() + n * 60 * 1000);
}

export function startReminderJobs() {
  // Every minute: check for upcoming start times (T-10 min) and approaching end times (T-5 min)
  cron.schedule('* * * * *', async () => {
    try {
      const tenMinLow = minutesFromNow(9);
      const tenMinHigh = minutesFromNow(11);

      const starting = await prisma.reservation.findMany({
        where: {
          status: 'PENDING_ALLOCATION',
          startTime: { gte: tenMinLow, lte: tenMinHigh },
        },
        include: {
          user: { select: { name: true, email: true } },
          resource: { select: { name: true } },
        },
      });

      for (const r of starting) {
        sendEmail({
          to: r.user.email,
          ...bookingReminderEmail({
            userName: r.user.name,
            resourceName: r.resource.name,
            startTime: r.startTime.toLocaleTimeString(),
            endTime: r.endTime.toLocaleTimeString(),
          }),
        });
      }

      const fiveMinLow = minutesFromNow(4);
      const fiveMinHigh = minutesFromNow(6);

      const ending = await prisma.reservation.findMany({
        where: {
          status: 'ALLOCATED',
          endTime: { gte: fiveMinLow, lte: fiveMinHigh },
        },
        include: {
          user: { select: { name: true, email: true } },
          resource: { select: { name: true } },
        },
      });

      for (const r of ending) {
        sendEmail({
          to: r.user.email,
          ...returnReminderEmail({
            userName: r.user.name,
            resourceName: r.resource.name,
            endTime: r.endTime.toLocaleTimeString(),
          }),
        });
      }

      const overdue = await prisma.reservation.findMany({
        where: {
          status: 'ALLOCATED',
          endTime: { lt: new Date() },
        },
        include: {
          user: { select: { name: true, email: true } },
          resource: { select: { name: true } },
        },
      });

      for (const r of overdue) {
        sendEmail({
          to: r.user.email,
          ...overdueEmail({
            userName: r.user.name,
            resourceName: r.resource.name,
          }),
        });
      }
    } catch (err) {
      logger.error({ err }, '[cron] reminder job failed');
    }
  });

  logger.info('[cron] reminder jobs started');
}
