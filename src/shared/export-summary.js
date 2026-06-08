function formatDayKey(date) {
  if (!(date instanceof Date) || isNaN(date)) return 'unknown';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const { summaryConcept } = require('./export-config.json');
const { TIMED_CALL_TYPES, MISSED_CALL_TYPES } = require('./constants');
const { formatDurationSeconds, durationToSeconds } = require('./duration-utils');
const TOTAL_SUMMARY_TITLE = summaryConcept.totalSummaryTitle || 'Total Summary';
const ROUGH_PREFIX = summaryConcept.roughPrefix || '~';
const PERSON_SUMMARY_SUFFIX = summaryConcept.personSummarySuffix || ' Summary';

function isIgnoredForIndividualCount(entry) {
  const type = String(entry.type || entry.fileType || '').toLowerCase();
  return ['unsent', 'deleted', ...MISSED_CALL_TYPES].includes(type);
}

function isMissedCall(entry) {
  const type = String(entry.type || entry.fileType || '').toLowerCase();
  return MISSED_CALL_TYPES.includes(type);
}

function isCountedCall(entry) {
  const type = String(entry.type || entry.fileType || '').toLowerCase();
  return TIMED_CALL_TYPES.includes(type);
}

function buildSummaryData(entries = [], options = {}) {
  if (!entries.length) {
    return {
      total: {
        title: TOTAL_SUMMARY_TITLE,
        messages: 0,
        days: 0,
        rough: {
          text: 0,
          words: 0,
          images: 0,
          calls: 0,
          callSeconds: 0,
        },
      },
      participants: [],
    };
  }

  const totals = new Map();
  const allDays = new Set();
  let totalCalls = 0;
  let totalCallSeconds = 0;
  let totalImages = 0;
  let totalImageEntries = 0;
  let totalWords = 0;
  let totalTextEntries = 0;

  entries.forEach((entry) => {
    const sender = entry.sender || 'Unknown';
    const dayKey = formatDayKey(entry.date);
    allDays.add(dayKey);

    const data = totals.get(sender) || {
      count: 0,
      days: new Set(),
      calls: 0,
      callSeconds: 0,
      images: 0,
    };
    data.count += 1;
    data.days.add(dayKey);
    if (isCountedCall(entry)) {
      data.calls += 1;
      data.callSeconds += Number(entry.callSeconds || 0) + (entry.duration ? durationToSeconds(entry.duration) : 0);
      totalCalls += 1;
      totalCallSeconds += Number(entry.callSeconds || 0) + (entry.duration ? durationToSeconds(entry.duration) : 0);
    }
    if (entry.imageCount) {
      data.images += Number(entry.imageCount || 0);
      totalImages += Number(entry.imageCount || 0);
    } else if (entry.isImage) {
      data.images += 1;
      totalImages += 1;
    }
    if (entry.isImage) totalImageEntries += 1;
    if (!isCountedCall(entry) && !entry.isImage && !isIgnoredForIndividualCount(entry)) {
      totalTextEntries += 1;
    }
    totalWords += Number(entry.wordCount || 0);
    totals.set(sender, data);
  });

  let selectedParticipants;
  if (Array.isArray(options.fixedParticipants) && options.fixedParticipants.length) {
    selectedParticipants = [...options.fixedParticipants];
  } else {
    const participantNames = [];
    entries.forEach((entry) => {
      if (!participantNames.includes(entry.sender)) {
        participantNames.push(entry.sender);
      }
    });
    selectedParticipants = participantNames;
  }

  const participantSummaries = selectedParticipants.map((name) => {
    const participantEntries = entries.filter((entry) => (entry.sender || 'Unknown') === name);
    const includedEntries = participantEntries.filter(
      (entry) => !isIgnoredForIndividualCount(entry)
    );

    const participantDays = new Set();
    let participantImages = 0;
    let participantImageEntries = 0;
    let participantCalls = 0;
    let participantSeconds = 0;
    let participantWords = 0;
    participantEntries.forEach((entry) => {
      const dayKey = formatDayKey(entry.date);
      participantDays.add(dayKey);
    });
    includedEntries.forEach((entry) => {
      if (entry.imageCount) participantImages += Number(entry.imageCount || 0);
      else if (entry.isImage) participantImages += 1;
      if (entry.isImage) participantImageEntries += 1;
      if (isCountedCall(entry) && !isMissedCall(entry)) {
        participantCalls += 1;
        participantSeconds += Number(entry.callSeconds || 0);
      }
      participantWords += Number(entry.wordCount || 0);
    });

    const participantText = Math.max(
      0,
      includedEntries.length - participantCalls - participantImageEntries
    );
    return {
      name,
      participantEntries,
      includedEntries,
      participantDays,
      participantText,
      participantWords,
      participantImages,
      participantCalls,
      participantSeconds,
    };
  });

  const totalText = participantSummaries.reduce((sum, item) => sum + item.participantText, 0);

  return {
    total: {
      title: TOTAL_SUMMARY_TITLE,
      messages: entries.length,
      days: allDays.size,
      rough: {
        text: totalTextEntries,
        words: totalWords,
        images: totalImages,
        calls: totalCalls,
        callSeconds: totalCallSeconds,
      },
    },
    participants: participantSummaries.map((summary) => ({
      title: `${summary.name}${PERSON_SUMMARY_SUFFIX}`,
      name: summary.name,
      messages: summary.participantEntries.length,
      days: summary.participantDays.size,
      rough: {
        text: summary.participantText,
        words: summary.participantWords,
        images: summary.participantImages,
        calls: summary.participantCalls,
        callSeconds: summary.participantSeconds,
      },
    })),
  };
}

function collectTypeCounts(entries = []) {
  const counts = {};
  entries.forEach((entry) => {
    const type = String(entry.type || entry.fileType || '').toLowerCase();
    counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
}

function formatTypeCount(type, count) {
  const label = String(type || '').replace(/-/g, ' ');
  return `${ROUGH_PREFIX} ${count} ${label}`;
}

const DETAILED_TYPE_ORDER = [
  'text',
  'reaction',
  'link',
  'image',
  'sticker',
  'poll',
  'audio-call',
  'video-call',
  'voice-note',
  'missed-call',
  'deleted',
  'unsent',
];

function renderTypeCounts(typeCounts) {
  const orderedTypes = DETAILED_TYPE_ORDER.filter((type) => typeCounts[type] != null);
  const extraTypes = Object.keys(typeCounts)
    .filter((type) => !DETAILED_TYPE_ORDER.includes(type))
    .sort();
  return orderedTypes.concat(extraTypes).map((type) => formatTypeCount(type, typeCounts[type]));
}

function buildDetailedSummary(entries = [], options = {}) {
  if (!entries.length) {
    return buildSummary(entries, options);
  }

  const totals = new Map();
  const allDays = new Set();

  entries.forEach((entry) => {
    const sender = entry.sender || 'Unknown';
    const dayKey = formatDayKey(entry.date);
    allDays.add(dayKey);

    const type = String(entry.type || entry.fileType || '').toLowerCase();
    const data = totals.get(sender) || {
      count: 0,
      days: new Set(),
      calls: 0,
      callSeconds: 0,
      images: 0,
      words: 0,
      typeCounts: {},
    };

    const isTimedCall = TIMED_CALL_TYPES.includes(type);
    const isCall = isTimedCall || type === 'missed-call';
    if (isTimedCall) {
      data.calls += 1;
      data.callSeconds += Number(entry.callSeconds || 0);
    }
    if (type === 'image') {
      data.images += 1;
    }
    data.words += Number(entry.wordCount || 0);
    data.typeCounts[type] = (data.typeCounts[type] || 0) + 1;

    data.count += 1;
    data.days.add(dayKey);
    totals.set(sender, data);
  });

  let selectedParticipants;
  if (Array.isArray(options.fixedParticipants) && options.fixedParticipants.length) {
    selectedParticipants = [...options.fixedParticipants];
  } else {
    const participantNames = [];
    entries.forEach((entry) => {
      if (!participantNames.includes(entry.sender)) {
        participantNames.push(entry.sender);
      }
    });
    selectedParticipants = participantNames;
  }

  const participantSummaries = selectedParticipants.map((name) => {
    const participantEntries = entries.filter((entry) => (entry.sender || 'Unknown') === name);
    const participantDays = new Set();
    const participantTypeCounts = {};
    let participantWords = 0;
    let participantCalls = 0;
    let participantSeconds = 0;

    participantEntries.forEach((entry) => {
      const dayKey = formatDayKey(entry.date);
      participantDays.add(dayKey);
      const type = String(entry.type || entry.fileType || '').toLowerCase();
      const isTimedCall = TIMED_CALL_TYPES.includes(type);
      if (isTimedCall) {
        participantCalls += 1;
        participantSeconds += Number(entry.callSeconds || 0);
      }
      participantWords += Number(entry.wordCount || 0);
      participantTypeCounts[type] = (participantTypeCounts[type] || 0) + 1;
    });

    return {
      name,
      participantEntries,
      participantDays,
      participantTypeCounts,
      participantWords,
      participantCalls,
      participantSeconds,
      participantMessages: participantEntries.length,
    };
  });

  const totalTypeCounts = collectTypeCounts(entries);
  const totalCalls = participantSummaries.reduce((sum, item) => sum + item.participantCalls, 0);
  const totalCallSeconds = participantSummaries.reduce(
    (sum, item) => sum + item.participantSeconds,
    0
  );
  const totalWords = participantSummaries.reduce((sum, item) => sum + item.participantWords, 0);

  const summary = {
    total: {
      title: TOTAL_SUMMARY_TITLE,
      messages: entries.length,
      days: allDays.size,
      rough: {
        words: totalWords,
        calls: totalCalls,
        callSeconds: totalCallSeconds,
      },
      typeCounts: totalTypeCounts,
    },
    participants: participantSummaries.map((summary) => ({
      title: `${summary.name}${PERSON_SUMMARY_SUFFIX}`,
      name: summary.name,
      messages: summary.participantMessages,
      days: summary.participantDays.size,
      rough: {
        words: summary.participantWords,
        calls: summary.participantCalls,
        callSeconds: summary.participantSeconds,
      },
      typeCounts: summary.participantTypeCounts,
    })),
  };

  const useMessageLabel = Boolean(options.useMessageLabel);
  const totalMessageLabel = useMessageLabel
    ? summary.total.messages === 1
      ? 'message'
      : 'messages'
    : summary.total.messages === 1
      ? 'post'
      : 'posts';
  const totalDayLabel = useMessageLabel ? (summary.total.days === 1 ? 'day' : 'days') : 'days';

  const detailLines = [
    summary.total.title,
    `${summary.total.messages} ${totalMessageLabel} / ${summary.total.days} ${totalDayLabel}`,
    `${ROUGH_PREFIX} ${summary.total.rough.words} words`,
    ...renderTypeCounts(summary.total.typeCounts),
  ];
  if (summary.total.rough.calls || summary.total.typeCounts['audio-call'] || summary.total.typeCounts['video-call'] || summary.total.typeCounts['voice-note']) {
    detailLines.push(
      `${ROUGH_PREFIX} ${summary.total.rough.calls} calls ${formatDurationSeconds(summary.total.rough.callSeconds)}`
    );
  }
  detailLines.push('');

  summary.participants.forEach((participant) => {
    const participantMessageLabel = useMessageLabel
      ? participant.messages === 1
        ? 'message'
        : 'messages'
      : participant.messages === 1
        ? 'post'
        : 'posts';
    const participantDayLabel = useMessageLabel
      ? participant.days === 1
        ? 'day'
        : 'days'
      : 'days';

    detailLines.push(participant.title);
    detailLines.push(
      `${participant.messages} ${participantMessageLabel} / ${participant.days} ${participantDayLabel}`
    );
    detailLines.push(`${ROUGH_PREFIX} ${participant.rough.words} words`);
    detailLines.push(...renderTypeCounts(participant.typeCounts));
    if (participant.rough.calls) {
      detailLines.push(
        `${ROUGH_PREFIX} ${participant.rough.calls} calls ${formatDurationSeconds(participant.rough.callSeconds)}`
      );
    }
    detailLines.push('');
  });

  detailLines.push('---');
  return detailLines.join('\n') + '\n';
}

function buildSummary(entries = [], options = {}) {
  if (!entries.length) return '';

  const summary = buildSummaryData(entries, options);
  const useMessageLabel = Boolean(options.useMessageLabel);
  const totalMessageLabel = useMessageLabel
    ? summary.total.messages === 1
      ? 'message'
      : 'messages'
    : summary.total.messages === 1
      ? 'post'
      : 'posts';
  const totalDayLabel = useMessageLabel ? (summary.total.days === 1 ? 'day' : 'days') : 'days';

  const detailLines = [
    summary.total.title,
    `${summary.total.messages} ${totalMessageLabel} / ${summary.total.days} ${totalDayLabel}`,
    `${ROUGH_PREFIX} ${summary.total.rough.text} text / ${summary.total.rough.words} words`,
    `${ROUGH_PREFIX} ${summary.total.rough.images} images`,
    `${ROUGH_PREFIX} ${summary.total.rough.calls} calls ${formatDurationSeconds(summary.total.rough.callSeconds)}`,
    '',
  ];

  summary.participants.forEach((participant) => {
    const participantMessageLabel = useMessageLabel
      ? participant.messages === 1
        ? 'message'
        : 'messages'
      : participant.messages === 1
        ? 'post'
        : 'posts';
    const participantDayLabel = useMessageLabel
      ? participant.days === 1
        ? 'day'
        : 'days'
      : 'days';

    detailLines.push(participant.title);
    detailLines.push(
      `${participant.messages} ${participantMessageLabel} / ${participant.days} ${participantDayLabel}`
    );
    detailLines.push(
      `${ROUGH_PREFIX} ${participant.rough.text} text / ${participant.rough.words} words`
    );
    detailLines.push(`${ROUGH_PREFIX} ${participant.rough.images} images`);
    detailLines.push(
      `${ROUGH_PREFIX} ${participant.rough.calls} calls ${formatDurationSeconds(participant.rough.callSeconds)}`
    );
    detailLines.push('');
  });

  detailLines.push('---');
  return detailLines.join('\n') + '\n';
}

function buildSummaryJson(entries = [], options = {}) {
  const summary = buildSummaryData(entries, options);
  return JSON.stringify(summary, null, 2) + '\n';
}

module.exports = {
  buildSummary,
  buildDetailedSummary,
  buildSummaryData,
  buildSummaryJson,
};
