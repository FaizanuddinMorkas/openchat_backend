const serverless = require('serverless-http');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

module.exports.handler = serverless(app);
