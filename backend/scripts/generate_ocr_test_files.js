const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');

const dir = path.join(process.cwd(), 'scripts', 'ocr_test_files');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function makeImage(textLines, filename) {
  const width = 1200;
  const height = 1400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000000';
  ctx.font = '48px Arial';
  let y = 100;
  for (const line of textLines) {
    ctx.fillText(line, 80, y);
    y += 80;
  }
  const out = fs.createWriteStream(path.join(dir, filename));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  return new Promise(resolve => out.on('finish', resolve));
}

async function main() {
  await makeImage([
    'Chicken Biryani - ₹220',
    'Veg Fried Rice - ₹160',
    'Coffee - ₹80',
    'Tea - ₹50',
    'Pizza - ₹350',
    'Burger - ₹180',
  ], 'english-menu.png');

  await makeImage([
    'சிக்கன் பிரியாணி - ₹220',
    'வெஜ் பிரைட் ரைஸ் - ₹160',
    'காபி - ₹80',
    'டீ - ₹50',
    'பீட்சா - ₹350',
    'பர்கர் - ₹180',
  ], 'tamil-menu.png');

  const pdfPath = path.join(dir, 'menu.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(fs.createWriteStream(pdfPath));
  doc.fontSize(22).text('Menu', { underline: true });
  doc.moveDown();
  const lines = [
    'Chicken Biryani - ₹220',
    'Mutton Biryani - ₹280',
    'Veg Fried Rice - ₹160',
    'Coffee - ₹80',
    'Tea - ₹50',
    'Pizza - ₹350',
    'Burger - ₹180',
  ];
  lines.forEach(line => doc.fontSize(18).text(line));
  doc.end();
}

main().catch(err => { console.error(err); process.exit(1); });