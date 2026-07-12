const fs = require('fs');
const path = require('path');
const { connect } = require('mongoose');
const app = require('./app');
const config = require('./config');
const { seedDemoData } = require('./seed');

async function ensureUploadsFolder() {
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
}

async function start() {
  await ensureUploadsFolder();
  await connect(config.mongoUri);
  await seedDemoData();

  app.listen(config.port, () => {
    console.log(`Smart Student Hub API running on port ${config.port}`);
  });
}

start().catch(error => {
  console.error('Failed to start server', error);
  process.exit(1);
});