import path from 'path';
import PDFDocument from 'pdfkit';
import fs from 'fs';

// ---------- Local functions ----------
function informUser(message) { return { message }; }
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
    stream.on('finish', () => {
    resolve({
        fileName,
        filePath,
        publicUrl: `/downloads/${fileName}`
        });
    });
  });
}
function sendEmail(to, subject, body) { return { status: 'sent', to, subject, body }; }
function generateWordSnippet(content) { return { content }; }

// ---------- Tools ----------
export const tools = [
    { name: 'generateReportPDF', parameters: { type: 'object', properties: { reportData: { type: 'object' } }, required: ['reportData'] } },
    { name: 'sendEmail', parameters: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to','subject','body'] } },
    { name: 'generateWordSnippet', parameters: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] } },
    { name: 'informUser', parameters: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } },
];

export const toolExecutors = {
    informUser: ({ message }) => informUser(message),
    generateReportPDF: ({ reportData }) => generateReportPDF(reportData),
    generateWordSnippet: ({ content }) => generateWordSnippet(content),
    sendEmail: ({ to, subject, body }) => sendEmail(to, subject, body),
};
