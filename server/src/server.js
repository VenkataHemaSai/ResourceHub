import app from './app.js';
import { config } from './config.js';

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT} [${config.NODE_ENV}]`);
});

setInterval(() => {}, 1000 * 60 * 60); // Keep alive hack
