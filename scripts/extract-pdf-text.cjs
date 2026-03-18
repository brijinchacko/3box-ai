#!/usr/bin/env node
/**
 * Standalone PDF text extraction script.
 * Runs outside Next.js webpack — uses pdf-parse v2 directly via Node.js.
 *
 * Usage: echo <base64-pdf> | node scripts/extract-pdf-text.cjs
 * Output: JSON { "text": "..." } on stdout
 */

const { PDFParse } = require('pdf-parse');

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('error', reject);
  });
}

async function main() {
  try {
    const base64 = await readStdin();
    if (!base64 || !base64.trim()) {
      process.stdout.write(JSON.stringify({ error: 'No input provided' }));
      process.exit(1);
    }

    const buffer = Buffer.from(base64.trim(), 'base64');
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
