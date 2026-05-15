const fs = require('fs');
const path = require('path');
const { beautifyHtml } = require('./beautify');

const dir = path.join(__dirname, 'HTML Optimised');
const files = fs.readdirSync(dir).filter(file => file.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let html = fs.readFileSync(filePath, 'utf8');
  html = beautifyHtml(html);
  fs.writeFileSync(filePath, html, 'utf8');
});

console.log(`Beautified ${files.length} HTML Optimised files.`);
