import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 8080;
const app = createApp();

app.listen(port, () => {
  console.log(`OPC server running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
