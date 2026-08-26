const PDFDocument = require('pdfkit');

const CORRECT_COLOR = '#127C3E';
const INCORRECT_COLOR = '#B3261E';

/**
 * Renders exactly the same result payload the app itself shows (see
 * attemptService.getParticipantResultForExport) as a downloadable PDF, so
 * the two can never disagree. Returns the PDFDocument, which is itself a
 * readable stream — pipe it straight to the HTTP response.
 */
function generateResultPdf({ result, examTitle, participantName }) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  doc.font('Helvetica-Bold').fontSize(20).fillColor('#000000').text(examTitle);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(11).fillColor('#555555').text(`Result for ${participantName}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(32).fillColor('#000000').text(`${result.percentage}%`);
  doc.font('Helvetica').fontSize(12).fillColor('#333333').text(
    `${result.score} / ${result.totalPoints} points   ·   pass mark ${result.passMark}%   ·   ${result.passed ? 'Passed' : 'Not passed'}`,
  );
  doc.moveDown(1.5);

  if (Array.isArray(result.breakdown) && result.breakdown.length > 0) {
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000').text('Question breakdown');
    doc.moveDown(0.5);

    result.breakdown.forEach((item, i) => {
      if (doc.y > 680) doc.addPage();

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000').text(`${i + 1}. ${item.prompt}`);

      doc.font('Helvetica-Bold').fontSize(10).fillColor(item.isCorrect ? CORRECT_COLOR : INCORRECT_COLOR)
        .text(`${item.isCorrect ? 'Correct' : 'Incorrect'} — ${item.pointsAwarded} / ${item.pointsPossible} points`);

      doc.font('Helvetica').fontSize(10).fillColor('#333333');
      doc.text(`Your answer: ${item.yourAnswer || '(no answer)'}`);
      if (!item.isCorrect && item.correctAnswer) {
        doc.text(`Correct answer: ${item.correctAnswer}`);
      }
      if (item.explanation) {
        doc.font('Helvetica-Oblique').text(`Why: ${item.explanation}`);
      }
      doc.moveDown(1);
    });
  }

  doc.end();
  return doc;
}

module.exports = { generateResultPdf };
