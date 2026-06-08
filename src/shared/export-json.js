const { CALL_TYPES, TIMED_CALL_TYPES } = require('./constants');

function parseDurationToSeconds(duration) {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function buildFullJsonExport(entries = [], options = {}) {
  const conversation = options.conversation || 'Chat Export';
  const participants = options.fixedParticipants || [];
  const participantNames = participants.length
    ? participants
    : [...new Set(entries.map((e) => e.sender).filter(Boolean))];

  const messages = entries.map((entry) => {
    const semanticType = String(entry.semanticType || entry.fileType || '').toLowerCase();
    const isTimedCall = TIMED_CALL_TYPES.includes(semanticType);
    const contentText = String(entry.content || '').trim();
    const textWords = contentText
      ? contentText.split(/\s+/).filter(Boolean).length
      : 0;
    const rawDuration = entry.duration || '';

    return {
      date: entry.dateText || '',
      sender: entry.sender || 'Unknown',
      type: semanticType,
      text: contentText,
      duration: rawDuration,
      durationSeconds: parseDurationToSeconds(rawDuration),
      isCall: CALL_TYPES.includes(semanticType),
      isImage: semanticType === 'image',
      contentLength: contentText.length,
      wordCount: isTimedCall || semanticType === 'image' ? 0 : (entry.words || textWords),
      repliedTo: entry.repliedTo || null,
      repliedType: entry.repliedType || null,
    };
  });

  const result = {
    exportDate: new Date().toISOString(),
    conversation,
    messageCount: messages.length,
    participants: participantNames,
    messages,
  };

  return JSON.stringify(result, null, 2) + '\n';
}

module.exports = { buildFullJsonExport };
