import './config.js'; // validate env vars first
import { config } from './config.js';
import app from './app.js';
import { logger } from './lib/logger.js';

app.listen(config.SERVER_PORT, () => {
  logger.info({ port: config.SERVER_PORT }, 'Server started');
});
