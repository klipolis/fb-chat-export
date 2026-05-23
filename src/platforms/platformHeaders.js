const { renderHeader, prependHeaderToFile } = require('./build');

function getPlatformHeader(buildPlatform, buildVersion) {
  return renderHeader(buildPlatform, buildVersion);
}

function attachHeader(outputFile, buildPlatform, buildVersion) {
  const headerText = getPlatformHeader(buildPlatform, buildVersion);
  prependHeaderToFile(outputFile, headerText);
}

module.exports = {
  getPlatformHeader,
  attachHeader,
};
