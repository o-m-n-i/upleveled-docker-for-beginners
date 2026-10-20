const os = require('node:os');
const path = require('node:path');
const express = require('express');
const { MongoClient } = require('mongodb');

// Configuration comes from environment variables, so the same image runs
// anywhere: on your laptop, in CI, or on a server. Only the env changes.
const PORT = process.env.PORT || 3000;
const MONGO_DB_HOST = process.env.MONGO_DB_HOST || 'localhost';
const MONGO_DB_USERNAME = process.env.MONGO_DB_USERNAME || 'admin';
const MONGO_DB_PWD = process.env.MONGO_DB_PWD || 'password';

const mongoUrl = `mongodb://${MONGO_DB_USERNAME}:${MONGO_DB_PWD}@${MONGO_DB_HOST}:27017`;
const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 3000 });
const messages = client.db('guestbook').collection('messages');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inside a container, the hostname is the container ID. Handy to show
// students that "it's running in a container" and which one.
app.get('/api/info', (req, res) => {
  res.json({ hostname: os.hostname(), node: process.version, mongoHost: MONGO_DB_HOST });
});

app.get('/api/messages', async (req, res) => {
  try {
    const list = await messages.find().sort({ createdAt: -1 }).limit(50).toArray();
    res.json(list);
  } catch (err) {
    console.error('Failed to read messages:', err.message);
    res.status(503).json({ error: 'Database not reachable' });
  }
});

app.post('/api/messages', async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 50);
  const text = String(req.body.text || '').trim().slice(0, 280);
  if (!name || !text) {
    return res.status(400).json({ error: 'Name and message are required' });
  }
  try {
    await messages.insertOne({ name, text, createdAt: new Date() });
    console.log(`New message from ${name}`);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Failed to save message:', err.message);
    res.status(503).json({ error: 'Database not reachable' });
  }
});

// Used by the Docker HEALTHCHECK (see Dockerfile). Healthy = we can reach the DB.
app.get('/health', async (req, res) => {
  try {
    await client.db('admin').command({ ping: 1 });
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Guestbook listening on port ${PORT} (MongoDB host: ${MONGO_DB_HOST})`);
});
