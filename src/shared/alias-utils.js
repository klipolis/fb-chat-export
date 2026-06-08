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

function detectAliasCollisions(aliasMap) {
    const reverseMap = {};
    const collisions = [];
    for (const [original, alias] of Object.entries(aliasMap || {})) {
        if (!original || !alias) continue;
        if (!reverseMap[alias]) reverseMap[alias] = [];
        reverseMap[alias].push(original);
    }
    for (const [alias, originals] of Object.entries(reverseMap)) {
        if (originals.length > 1) {
            collisions.push({ alias, originals: originals.map((o) => `"${o}"`).join(', ') });
        }
    }
    return collisions;
}

module.exports = {
    applyAliasToText,
    detectAliasCollisions,
};
