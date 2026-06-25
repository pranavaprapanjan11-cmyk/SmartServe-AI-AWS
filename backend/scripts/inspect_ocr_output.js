const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');

const dir = path.join(process.cwd(), 'scripts', 'ocr_test_files');
const english = path.join(dir, 'english-menu.png');
const tamil = path.join(dir, 'tamil-menu.png');
const pdfPath = path.join(dir, 'menu.pdf');

async function inspect() {
  console.log('=== English image raw text ===');
  const engData = fs.readFileSync(english);
  const engRes = await Tesseract.recognize(engData, 'eng', { logger: () => {} });
  console.log(JSON.stringify(engRes.data.text, null, 2));

  console.log('=== Tamil image raw text ===');
  const tamData = fs.readFileSync(tamil);
  let tamRes;
  try {
    tamRes = await Tesseract.recognize(tamData, 'tam', { logger: () => {} });
  } catch (err) {
    console.error('Tamil OCR failed', err.message || err);
    tamRes = await Tesseract.recognize(tamData, 'eng', { logger: () => {} });
  }
  console.log(JSON.stringify(tamRes.data.text, null, 2));

  console.log('=== PDF text ===');
  const pdfData = fs.readFileSync(pdfPath);
  const pdfRes = await pdf(pdfData);
  console.log(JSON.stringify(pdfRes.text, null, 2));
}

inspect().catch(err => { console.error(err); process.exit(1); });