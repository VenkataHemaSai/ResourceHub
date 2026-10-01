import app from './app.js';
import { config } from './config.js';
import logger from './utils/logger.js';

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT} [${config.NODE_ENV}]`);
});

setInterval(() => {}, 1000 * 60 * 60);
