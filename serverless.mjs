import express from 'express';
import serverless from 'serverless-http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, 'out');

const app = express();

const pingHandler = (_req, res) => {
  res.sendStatus(200);
};

app.get('/ping', pingHandler);

// Serve exported static files
app.use(express.static(outDir));

// Fallback to index.html for any unmatched route
app.get('*', (_req, res) => {
  res.sendFile(path.join(outDir, 'index.html'));
});

// Export handler expected by Runpod serverless
export const handler = serverless(app);

// Health check server for Runpod
if (process.env.PORT_HEALTH) {
  const healthApp = express();
  healthApp.get('/ping', pingHandler);
  healthApp.listen(process.env.PORT_HEALTH, () => {
    console.log(`Health server running on port ${process.env.PORT_HEALTH}`);
  });
}

// Allow local testing
if (process.env.RUNPOD_LOCAL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
