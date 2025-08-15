import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { toolExecutors, tools } from './tools.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' +
  GEMINI_API_KEY;

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/ask-ai', async (req, res) => {
  console.log('📥 Incoming request body:', req.body);

  const userRequest = req.body.prompt || '';
  console.log('📝 Extracted userRequest:', userRequest);

  const body = {
    contents: [{ role: 'user', parts: [{ text: `
You have tools. 
You can use multiple tools.
Use informUser to tell the user what you will do.
Use informUser to tell the user when it's node.
Never promise and don't call the function.
\nUser request: ${userRequest}` }] }],
    tools: [{ functionDeclarations: tools }]
  };
  console.log('📦 Sending to Gemini:', JSON.stringify(body, null, 2));

  try {
    const llmRes = await fetch(GEMINI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    console.log('🌐 LLM Response status:', llmRes.status);

    const llmData = await llmRes.json();
    console.log('📄 LLM Response data:', JSON.stringify(llmData, null, 2));

    const parts = llmData?.candidates?.[0]?.content?.parts || [];
    console.log('🔍 Extracted parts:', parts);

    const toolCalls = parts.filter(p => p.functionCall).map(p => p.functionCall);
    console.log('🛠 Tool calls:', toolCalls);

    const results = [];
    for (const call of toolCalls) {
      if (toolExecutors[call.name]) {
        console.log(`⚙️ Executing tool: ${call.name} with args:`, call.args);
        const output = await toolExecutors[call.name](call.args || {});
        console.log(`✅ Tool output for ${call.name}:`, output);
        results.push({ tool: call.name, output });
      } else {
        console.warn(`⚠️ No executor found for tool: ${call.name}`);
      }
    }

    console.log('📤 Final results:', results);
    res.json({ toolResults: results });
  } catch (error) {
    console.error('❌ Error in /ask-ai:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/downloads', express.static(path.join(process.cwd(), 'downloads')));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
