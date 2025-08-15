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
function draftEmail(to, subject, body) { return { status: 'draft', to, subject, body }; }
function generateWordSnippet(content) { return { content }; }

// ---------- Tools ----------
export const tools = [
  {
    name: 'generateReportPDF',
    description: 'Generates a PDF file based on the provided report data, including formatting and layout.',
    parameters: {
      type: 'object',
      properties: {
        reportData: {
          type: 'object',
          description: 'An object containing all the necessary data to be included in the PDF report, such as titles, tables, charts, and text content.'
        }
      },
      required: ['reportData']
    }
  },
  {
    name: 'draftEmail',
    description: 'Creates an email draft ready for sending, including recipient, subject, and message body.',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'The email address of the recipient.'
        },
        subject: {
          type: 'string',
          description: 'The subject line of the email.'
        },
        body: {
          type: 'string',
          description: 'The main content of the email body, supporting plain text or HTML.'
        }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'generateWordSnippet',
    description: 'Generates a Microsoft Word-compatible snippet based on the provided text content.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The text or formatted content to be inserted into a Word document snippet.'
        }
      },
      required: ['content']
    }
  },
  {
    name: 'informUser',
    description: 'Sends an informational message to the user without executing any action.',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message text to display to the user, explaining the next step or providing context.'
        }
      },
      required: ['message']
    }
  }
];

export const toolExecutors = {
    informUser: ({ message }) => informUser(message),
    generateReportPDF: ({ reportData }) => generateReportPDF(reportData),
    generateWordSnippet: ({ content }) => generateWordSnippet(content),
    draftEmail: ({ to, subject, body }) => draftEmail(to, subject, body),
};
