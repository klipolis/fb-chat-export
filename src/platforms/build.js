const fs = require('fs');
const path = require('path');

function loadHeaderTemplate(platform) {
  const configFile = path.resolve(__dirname, '..', '..', 'data-config', platform, 'header.txt');
  if (fs.existsSync(configFile)) {
    return fs.readFileSync(configFile, 'utf8');
  }

  const legacyFile = path.resolve(__dirname, platform, 'header.txt');
  if (fs.existsSync(legacyFile)) {
    return fs.readFileSync(legacyFile, 'utf8');
  }

  return '';
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
