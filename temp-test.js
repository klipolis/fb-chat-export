const fs = require('fs');

const line = "Options: includeContent, includeLength, includeSummary";
console.log('Line:', line);
console.log('Test /^Options\\b/:', /^Options\b/.test(line));
console.log('Test /^Options:/:', /^Options:/.test(line));
console.log('Test /^Options /:', /^Options /.test(line));