# OpenRouter Express API

A Node.js Express application to interact with OpenRouter free models via their API.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```
   You can get an API key from [OpenRouter](https://openrouter.ai/).

3. Start the server:
   ```
   npm start
   ```

The server will run on `http://localhost:3001`.

## Usage

### Web Interface
Open `http://localhost:3001` in your browser for a simple chat interface.

### API
Send a POST request to `/chat` with JSON body containing `messages` and optionally `model`.

Example using curl:
```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "model": "openrouter/auto"
  }'
```

The response will be the OpenRouter API response.

## Endpoints

- `GET /`: Health check
- `POST /chat`: Send chat messages to OpenRouter models

## Free Models

This app defaults to `openrouter/auto` which selects free models. You can specify other free models like `microsoft/wizardlm-2-8x22b` or `meta-llama/llama-3.1-8b-instruct:free` in the `model` field.