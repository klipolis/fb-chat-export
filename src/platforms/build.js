const fs = require('fs');
const path = require('path');

function loadHeaderTemplate(platform) {
  const headerFile = path.resolve(__dirname, platform, 'header.txt');
  if (!fs.existsSync(headerFile)) return '';
  return fs.readFileSync(headerFile, 'utf8');
}

function renderHeader(platform, buildVersion) {
  const template = loadHeaderTemplate(platform);
  if (!template) return '';
  return template.replace('%VERSION%', buildVersion);
}

function prependHeaderToFile(filePath, headerText) {
  if (!headerText) return;
  const contents = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(filePath, `${headerText}\n\n${contents}`, 'utf8');
}

module.exports = {
  loadHeaderTemplate,
  renderHeader,
  prependHeaderToFile,
};
