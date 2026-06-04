const { escapeRegExp, replaceWholeWord } = require('./string-utils');

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
