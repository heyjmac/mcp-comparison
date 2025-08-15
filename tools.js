import path from 'path';
import PDFDocument from 'pdfkit';
import fs from 'fs';

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
function getWeather(city) { return { city, forecast: 'Sunny', temperature: 28 }; }
function translateText(text, targetLanguage) { return { original: text, translated: `[${targetLanguage}] ${text}` }; }
function summarizeText(text) { return { summary: text.slice(0, 50) + '...' }; }
function generateInvoice(invoiceData) { return { invoiceId: Date.now(), invoiceData }; }
function fetchStockPrice(symbol) { return { symbol, price: (Math.random() * 100).toFixed(2) }; }
function bookFlight(from, to, date) { return { bookingId: Date.now(), from, to, date }; }
function scheduleMeeting(topic, date) { return { meetingId: Date.now(), topic, date }; }
function searchDatabase(query) { return { query, results: [`Result for ${query} #1`, `Result for ${query} #2`] }; }

// ---------- Tools ----------
export const tools = [
  { name: 'answerUser', parameters: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } },
  { name: 'generateReportPDF', parameters: { type: 'object', properties: { reportData: { type: 'object' } }, required: ['reportData'] } },
  { name: 'sendEmail', parameters: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to','subject','body'] } },
  { name: 'getWeather', parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] } },
  { name: 'translateText', parameters: { type: 'object', properties: { text: { type: 'string' }, targetLanguage: { type: 'string' } }, required: ['text','targetLanguage'] } },
  { name: 'summarizeText', parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'generateInvoice', parameters: { type: 'object', properties: { invoiceData: { type: 'object' } }, required: ['invoiceData'] } },
  { name: 'fetchStockPrice', parameters: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] } },
  { name: 'bookFlight', parameters: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, date: { type: 'string' } }, required: ['from','to','date'] } },
  { name: 'scheduleMeeting', parameters: { type: 'object', properties: { topic: { type: 'string' }, date: { type: 'string' } }, required: ['topic','date'] } },
  { name: 'searchDatabase', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } }
];

export const toolExecutors = {
  answerUser: ({ message }) => answerUser(message),
  generateReportPDF: ({ reportData }) => generateReportPDF(reportData),
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
