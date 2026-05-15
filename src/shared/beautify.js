function beautifyHtml(html) {
  html = html.replace(/>\s+</g, '><').trim();
  const tokens = html.split(/(?=<)|(?<=>)/g).filter(Boolean);
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  let indent = 0;
  const lines = [];

  tokens.forEach(token => {
    token = token.trim();
    if (!token) return;
    if (/^<\//.test(token)) {
      indent = Math.max(0, indent - 1);
      lines.push('  '.repeat(indent) + token);
      return;
    }

    const tagMatch = token.match(/^<\s*([a-zA-Z0-9-]+)/);
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : null;
    lines.push('  '.repeat(indent) + token);
    if (tagName && !voidTags.has(tagName) && !/^<\?/.test(token) && !/^<!/.test(token) && !/\/>$/.test(token)) {
      indent += 1;
    }
  });

  return lines.join('\n') + '\n';
}

module.exports = { beautifyHtml };