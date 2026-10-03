import app from './app.js';
import { config } from './config.js';
import logger from './utils/logger.js';
import { startReminderJobs } from './jobs/reminderJob.js';

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT} [${config.NODE_ENV}]`);
  startReminderJobs();
});

setInterval(() => {}, 1000 * 60 * 60);
