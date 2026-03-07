import './config.js'; // validate env vars first
import { config } from './config.js';
import app from './app.js';

app.listen(config.SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${config.SERVER_PORT}`);
});
