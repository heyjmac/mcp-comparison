import express from 'express';
import fetch from 'node-fetch';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' +
  GEMINI_API_KEY;

// ---------- Local functions ---------- //
function answerUser(message) {
  return { message };
}

function generateReportPDF(reportData) {
  return new Promise((resolve) => {
    const fileName = `report_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), fileName);
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

function sendEmail(to, subject, body) {
  return { status: 'sent', to, subject, body };
}

function getWeather(city) {
  return { city, forecast: 'Sunny', temperature: 28 };
}

function translateText(text, targetLanguage) {
  return { original: text, translated: `[${targetLanguage}] ${text}` };
}

function summarizeText(text) {
  return { summary: text.slice(0, 50) + '...' };
}

function generateInvoice(invoiceData) {
  return { invoiceId: Date.now(), invoiceData };
}

function fetchStockPrice(symbol) {
  return { symbol, price: (Math.random() * 100).toFixed(2) };
}

function bookFlight(from, to, date) {
  return { bookingId: Date.now(), from, to, date };
}

function scheduleMeeting(topic, date) {
  return { meetingId: Date.now(), topic, date };
}

function searchDatabase(query) {
  return { query, results: [`Result for ${query} #1`, `Result for ${query} #2`] };
}

// ---------- Tools Definition ---------- //
const tools = [
    {
  name: 'answerUser',
  description: 'In addition to other tools, always say something to the user: useful information, advice, or an answer to their question',
  parameters: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'The message to send to the user' }
    },
    required: ['message']
  }
    },
  {
    name: 'generateReportPDF',
    description: 'Generates a PDF report from provided key-value pairs',
    parameters: {
      type: 'object',
      properties: {
        reportData: { type: 'object', description: 'Key-value pairs for the PDF' }
      },
      required: ['reportData']
    }
  },
  {
    name: 'sendEmail',
    description: 'Send an email to a recipient',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'getWeather',
    description: 'Get weather forecast for a city',
    parameters: {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city']
    }
  },
  {
    name: 'translateText',
    description: 'Translate text into another language',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        targetLanguage: { type: 'string' }
      },
      required: ['text', 'targetLanguage']
    }
  },
  {
    name: 'summarizeText',
    description: 'Summarize a block of text',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text']
    }
  },
  {
    name: 'generateInvoice',
    description: 'Generate an invoice with given data',
    parameters: {
      type: 'object',
      properties: { invoiceData: { type: 'object' } },
      required: ['invoiceData']
    }
  },
  {
    name: 'fetchStockPrice',
    description: 'Fetch latest stock price for a symbol',
    parameters: {
      type: 'object',
      properties: { symbol: { type: 'string' } },
      required: ['symbol']
    }
  },
  {
    name: 'bookFlight',
    description: 'Book a flight between two cities',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        date: { type: 'string' }
      },
      required: ['from', 'to', 'date']
    }
  },
  {
    name: 'scheduleMeeting',
    description: 'Schedule a meeting with a topic and date',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        date: { type: 'string' }
      },
      required: ['topic', 'date']
    }
  },
  {
    name: 'searchDatabase',
    description: 'Search a database for a query',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    }
  }
];

// ---------- Tool Executor ---------- //
const toolExecutors = {
  answerUser: ({ message }) => answerUser(message),
  generateReportPDF: async ({ reportData }) => generateReportPDF(reportData),
  sendEmail: ({ to, subject, body }) => sendEmail(to, subject, body),
  getWeather: ({ city }) => getWeather(city),
  translateText: ({ text, targetLanguage }) => translateText(text, targetLanguage),
  summarizeText: ({ text }) => summarizeText(text),
  generateInvoice: ({ invoiceData }) => generateInvoice(invoiceData),
  fetchStockPrice: ({ symbol }) => fetchStockPrice(symbol),
  bookFlight: ({ from, to, date }) => bookFlight(from, to, date),
  scheduleMeeting: ({ topic, date }) => scheduleMeeting(topic, date),
  searchDatabase: ({ query }) => searchDatabase(query)
};

// ---------- Endpoint ---------- //
app.post('/', async (req, res) => {
  const start = Date.now();

  const userRequest = req.body.prompt || 'Can you make a quarterly performance PDF for Project Alpha with the title, date, prepared by, and key metrics? Then email it to me at itsme@julia.com. Also, what’s a good way to start my meeting based on this report?';

  const body = {
  contents: [
    {
      role: 'user',
      parts: [
        {
          text: `You have access to the following tools. You may call more than one tool in your response. Always use at least once the tool answerUser.
User request: ${userRequest}`
        }
      ]
    }
  ],
  tools: [{ functionDeclarations: tools }],
    };


  console.log('📤 Sending request to Gemini with body:', JSON.stringify(body, null, 2));

  const llmStart = Date.now();
  const llmRes = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const llmData = await llmRes.json();
  const llmEnd = Date.now();

  console.log('📥 Raw Gemini response:', JSON.stringify(llmData, null, 2));

  const parts = llmData?.candidates?.[0]?.content?.parts || [];
  const toolCalls = [];

  // Separate text and tool calls
  for (const p of parts) {
    if (p.functionCall) {
      toolCalls.push(p.functionCall);
    }
  }

  console.log('🔍 Extracted toolCalls:', JSON.stringify(toolCalls, null, 2));

  const results = [];
  for (const call of toolCalls) {
    if (toolExecutors[call.name]) {
      console.log(`⚙️ Executing tool: ${call.name} with args:`, call.args);
      const output = await toolExecutors[call.name](call.args || {});
      results.push({ tool: call.name, output });
    } else {
      console.warn(`⚠️ No matching executor found for function: ${call.name}`);
    }
  }

  const totalEnd = Date.now();

  res.json({
    userRequest,
    toolCalls,
    toolResults: results,
    llmResponseTimeMs: llmEnd - llmStart,
    totalTimeMs: totalEnd - start
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
