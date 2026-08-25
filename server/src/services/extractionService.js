const { extractText: extractPdfText, getDocumentProxy } = require('unpdf');
const mammoth = require('mammoth');
const AppError = require('../utils/AppError');

const MIN_USABLE_CHARS = 200;

async function extractText(buffer, mimeType) {
  let text = '';
  try {
    if (mimeType === 'application/pdf') {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractPdfText(pdf, { mergePages: true });
      text = result.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      throw new AppError('Upload a PDF or Word (.docx) file', 400, 'UNSUPPORTED_FILE_TYPE');
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "We couldn't read that file. It may be a scanned image or corrupted. Try uploading a text-based PDF or a Word file.",
      422,
      'EXTRACTION_FAILED',
    );
  }

  const cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();

  if (cleaned.length < MIN_USABLE_CHARS) {
    throw new AppError(
      "We couldn't find enough readable text in that file. It may be a scanned image. Try uploading a text-based PDF or a Word file.",
      422,
      'EXTRACTION_TOO_SHORT',
    );
  }

  return cleaned;
}

module.exports = { extractText };
