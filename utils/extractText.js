import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract plain text from a resume file (PDF or DOCX).
 * @param {string} filePath - Absolute path to the uploaded file.
 * @returns {Promise<string>} - Extracted text content.
 */
export async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.trim();
  }

  throw new Error(`Unsupported file type: ${ext}. Only .pdf and .docx files are accepted.`);
}
