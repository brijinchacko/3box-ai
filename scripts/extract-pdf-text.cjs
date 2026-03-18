#!/usr/bin/env node
/**
 * Standalone PDF text extraction script.
 * Runs outside Next.js webpack — uses pdf-parse v2 directly via Node.js.
 *
 * Usage: node scripts/extract-pdf-text.cjs <base64-encoded-pdf>
 * Output: JSON { "text": "..." } on stdout
 */

const { PDFParse } = require('pdf-parse');

async function main() {
  const base64 = process.argv[2];
  if (!base64) {
    process.stdout.write(JSON.stringify({ error: 'No input provided' }));
    process.exit(1);
  }

  try {
    const buffer = Buffer.from(base64, 'base64');
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    const pdfData = await parser.getText();
    await parser.destroy();
    process.stdout.write(JSON.stringify({ text: pdfData.text }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err.message || 'PDF extraction failed' }));
    process.exit(1);
  }
}

main();
