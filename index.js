require('dotenv').config();
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
    console.log('Starting a new worker');
    cluster.fork();
  });
} else {
  const express = require('express');
  const axios = require('axios');
  const cors = require('cors');
  const rateLimit = require('express-rate-limit');
 
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  const minuteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many requests from this IP, please try again after a minute',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const dayLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 950,
    message: 'Too many requests from this IP, please try again tomorrow',
    standardHeaders: true,
    legacyHeaders: false,
  });
 
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  app.post('/chat', minuteLimiter, dayLimiter, async (req, res) => {
    const { messages, model, stream } = req.body;
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured.' });
    }
    try {
      if (stream) {
        const response = await axios.post(
          OPENROUTER_API_URL,
          {
            model: model || 'tngtech/deepseek-r1t-chimera:free',
            messages,
            stream: true,
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            responseType: 'stream',
          }
        );
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        response.data.pipe(res);
      } else {
        const response = await axios.post(
          OPENROUTER_API_URL,
          {
            model: model || 'tngtech/deepseek-r1t-chimera:free',
            messages,
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        res.json(response.data);
      }
    } catch (error) {
      console.error(`Error for model: ${model || 'tngtech/deepseek-r1t-chimera:free'}`);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response statusText:', error.response.statusText);
        console.error('Error response data:', error.response.data);
      } else {
        console.error('Error message:', error.message);
      }
      res.status(500).json({
        error: error.message,
        model: model || 'tngtech/deepseek-r1t-chimera:free',
        status: error.response?.status,
      });
    }
  });

  app.get('/', (req, res) => {
    res.send('OpenRouter Express API is running. Use POST /chat to interact.');
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started, server running on port ${PORT}`);
  });
}
