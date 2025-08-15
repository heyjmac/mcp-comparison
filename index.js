import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' +
  GEMINI_API_KEY;

// ---------- Local functions ----------
function answerUser(message) { return { message }; }
function generateReportPDF(reportData) {
  return new Promise((resolve) => {
    const fileName = `report_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'downloads', fileName);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(18).text('Generated Report', { align: 'center' });
    doc.moveDown();
    Object.entries(reportData).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`);
    });
    doc.end();
    stream.on('finish', () => resolve({ fileName, filePath }));
  });
}
function sendEmail(to, subject, body) { return { status: 'sent', to, subject, body }; }

// ---------- Tools ----------
const tools = [
  { name: 'answerUser', parameters: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } },
  { name: 'generateReportPDF', parameters: { type: 'object', properties: { reportData: { type: 'object' } }, required: ['reportData'] } },
  { name: 'sendEmail', parameters: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to','subject','body'] } },
];

const toolExecutors = {
  answerUser: ({ message }) => answerUser(message),
  generateReportPDF: ({ reportData }) => generateReportPDF(reportData),
  sendEmail: ({ to, subject, body }) => sendEmail(to, subject, body),
};


app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/ask-ai', async (req, res) => {
  console.log('📥 Incoming request body:', req.body);

  const userRequest = req.body.prompt || '';
  console.log('📝 Extracted userRequest:', userRequest);

  const body = {
    contents: [{ role: 'user', parts: [{ text: `You have tools. Always use answerUser.\nUser request: ${userRequest}` }] }],
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
