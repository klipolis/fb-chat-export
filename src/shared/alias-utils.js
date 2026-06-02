function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

function replaceWholeWord(text, name, replacement) {
    const escaped = escapeRegExp(name);
    const pattern = new RegExp(`(^|[^\\p{L}])${escaped}(?=[^\\p{L}]|$)`, 'giu');
    return String(text || '').replace(pattern, (match, prefix) => {
        const originalWord = match.slice(prefix.length);
        if (name.toLowerCase() === 'you' && originalWord === 'you') {
            return match;
        }
        return `${prefix}${replacement}`;
    });
}

function applyAliasToText(text, aliasMap = {}, sender) {
    let result = String(text || '');
    for (const [from, to] of Object.entries(aliasMap || {})) {
        if (!from || !to || from === 'any') continue;
        result = replaceWholeWord(result, from, to);
    }
    if (sender && aliasMap?.any) {
        result = replaceWholeWord(result, sender, aliasMap.any);
    }
    return result;
}

module.exports = {
    applyAliasToText,
};
