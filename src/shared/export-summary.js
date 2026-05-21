function formatDayKey(date) {
  if (!(date instanceof Date) || isNaN(date)) return 'unknown';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const { summaryConcept } = require('./export-config.json');
const TOTAL_SUMMARY_TITLE = summaryConcept.totalSummaryTitle || 'Total Summary';
const ROUGH_PREFIX = summaryConcept.roughPrefix || '~';
const PERSON_SUMMARY_SUFFIX = summaryConcept.personSummarySuffix || ' Summary';

function isIgnoredForIndividualCount(entry) {
  const type = String(entry.type || entry.fileType || '').toLowerCase();
  return ['unsent', 'deleted', 'missed-call', 'missed-audio-call', 'missed-video-call'].includes(
    type
  );
}

function isMissedCall(entry) {
  const type = String(entry.type || entry.fileType || '').toLowerCase();
  return ['missed-call', 'missed-audio-call', 'missed-video-call'].includes(type);
}

function isCountedCall(entry) {
  const type = String(entry.type || entry.fileType || '').toLowerCase();
  return ['audio-call', 'video-call', 'voice-note'].includes(type);
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
          images: 0,
          calls: 0,
          callMinutes: 0,
        },
      },
      participants: [],
    };
  }

  const totals = new Map();
  const allDays = new Set();

  entries.forEach((entry) => {
    const sender = entry.sender || 'Unknown';
    const dayKey = formatDayKey(entry.date);
    allDays.add(dayKey);

    const data = totals.get(sender) || {
      count: 0,
      days: new Set(),
      calls: 0,
      minutes: 0,
      images: 0,
    };
    data.count += 1;
    data.days.add(dayKey);
    if (isCountedCall(entry)) {
      data.calls += 1;
      data.minutes += Number(entry.callMinutes || 0);
    }
    if (entry.isImage) {
      data.images += 1;
    }
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
    let participantCalls = 0;
    let participantMinutes = 0;
    participantEntries.forEach((entry) => {
      const dayKey = formatDayKey(entry.date);
      participantDays.add(dayKey);
    });
    includedEntries.forEach((entry) => {
      if (entry.isImage) participantImages += 1;
      if (isCountedCall(entry) && !isMissedCall(entry)) {
        participantCalls += 1;
        participantMinutes += Number(entry.callMinutes || 0);
      }
    });

    const participantText = Math.max(
      0,
      includedEntries.length - participantCalls - participantImages
    );
    return {
      name,
      participantEntries,
      includedEntries,
      participantDays,
      participantText,
      participantImages,
      participantCalls,
      participantMinutes,
    };
  });

  const totalText = participantSummaries.reduce((sum, item) => sum + item.participantText, 0);
  const totalImages = participantSummaries.reduce((sum, item) => sum + item.participantImages, 0);
  const totalCalls = participantSummaries.reduce((sum, item) => sum + item.participantCalls, 0);
  const totalCallMinutes = participantSummaries.reduce(
    (sum, item) => sum + item.participantMinutes,
    0
  );

  return {
    total: {
      title: TOTAL_SUMMARY_TITLE,
      messages: entries.length,
      // Total-day count must always use all messages, not filtered subsets.
      days: allDays.size,
      rough: {
        text: totalText,
        images: totalImages,
        calls: totalCalls,
        callMinutes: totalCallMinutes,
      },
    },
    participants: participantSummaries.map((summary) => ({
      title: `${summary.name}${PERSON_SUMMARY_SUFFIX}`,
      name: summary.name,
      messages: summary.participantEntries.length,
      days: summary.participantDays.size,
      rough: {
        text: summary.participantText,
        images: summary.participantImages,
        calls: summary.participantCalls,
        callMinutes: summary.participantMinutes,
      },
    })),
  };
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

  const roughTextLabel = 'text;';
  const detailLines = [
    summary.total.title,
    `${summary.total.messages} ${totalMessageLabel} / ${summary.total.days} ${totalDayLabel}`,
    `${ROUGH_PREFIX} ${summary.total.rough.text} ${roughTextLabel}`,
    `${ROUGH_PREFIX} ${summary.total.rough.images} images`,
    `${ROUGH_PREFIX} ${summary.total.rough.calls} calls ${summary.total.rough.callMinutes} mins`,
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

    const participantRoughTextLabel = 'text;';
    detailLines.push(participant.title);
    detailLines.push(
      `${participant.messages} ${participantMessageLabel} / ${participant.days} ${participantDayLabel}`
    );
    detailLines.push(`${ROUGH_PREFIX} ${participant.rough.text} ${participantRoughTextLabel}`);
    detailLines.push(`${ROUGH_PREFIX} ${participant.rough.images} images`);
    detailLines.push(
      `${ROUGH_PREFIX} ${participant.rough.calls} calls ${participant.rough.callMinutes} mins`
    );
    detailLines.push('');
  });

  detailLines.push('---');
  return detailLines.join('\n') + '\n';
}

module.exports = {
  buildSummary,
  buildSummaryData,
};
