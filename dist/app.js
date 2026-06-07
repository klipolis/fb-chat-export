// ==UserScript==
// @name         Chat Exporter
// @namespace    http://tampermonkey.net/
// @version      5.4.0
// @description  Export chat conversations to text file
// @match        https://www.facebook.com/messages/*
// @match        https://www.messenger.com/*
// @grant        none
// ==/UserScript==


"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // data-config/frontend_shared.json
  var require_frontend_shared = __commonJS({
    "data-config/frontend_shared.json"(exports, module) {
      module.exports = {
        aliasNames: {
          You: "Youghurt",
          Rob: "Barnabas",
          any: "ABC"
        },
        reactionOptions: {
          asciiSmileyPattern: "^[:;=8Xx][-~]?[)DdpP(/\\\\]$"
        },
        relativeDateRules: [
          {
            name: "relativeDay",
            pattern: "^(today|yesterday)(?:\\s+at\\s+)?(\\d{1,2}):(\\d{2})\\s*(am|pm)?$",
            window: "24h",
            description: "time-only relative labels are resolved relative to the current day or yesterday"
          },
          {
            name: "weekday",
            pattern: "^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)?)?$",
            window: "7d",
            description: "weekday labels resolve to the most recent matching day within the last 7 days"
          },
          {
            name: "timeOnly",
            pattern: "^(?:at\\s*)?(\\d{1,2}):(\\d{2})\\s*(am|pm)?$",
            window: "24h",
            description: "time-only labels are resolved to the current day if within the last 24 hours"
          }
        ]
      };
    }
  });

  // src/shared/rules/message-rules.js
  var require_message_rules = __commonJS({
    "src/shared/rules/message-rules.js"(exports, module) {
      "use strict";
      var FILE_SUFFIX = "(?:-[^.]+)?\\.html$";
      var OPTIONAL_PREFIX = "(?:you-)?";
      var rules = [
        {
          type: "unsent",
          prefixes: [
            "deleted"
          ],
          matchLabel: /(?:deleted|unsent)/i
        },
        {
          type: "missed-call",
          prefixes: [
            "missed-audio-call",
            "missed-video-call",
            "missed-call-audio",
            "missed-call-video"
          ],
          matchLabel: /missed[\s-]*(?:audio|video)?\s*call/i
        },
        {
          type: "audio-call",
          prefixes: [
            "audio-call"
          ],
          matchLabel: /\baudio call\b/i
        },
        {
          type: "image",
          prefixes: [
            "image"
          ],
          matchLabel: /\bimage\b|\bphoto\b|\bpicture\b/i
        },
        //
        // LINK (merged with video-link)
        //
        {
          type: "link",
          prefixes: [
            "link-embed-no-text",
            "link-text",
            "link-video",
            "video-link"
          ],
          matchLabel: /(?:open attachment|href|https?:\/\/|open link|view link|download|attachment|pinned location|\b(?:youtube|youtu\.be|vimeo|dailymotion|tiktok|instagram|twitter|x\.com|twitch|fb\.watch|facebook\.com\/.*(?:video|watch|reel)|video|watch|reel|shorts)\b)/i
        },
        {
          type: "video-call",
          prefixes: [
            "video-call",
            "call-video"
          ],
          matchLabel: /\bvideo call\b/i
        },
        {
          type: "voice-note",
          prefixes: [
            "voice-note"
          ],
          matchLabel: /\bvoice(?:[- ]message|[- ]note)?\b|\baudio(?:[- ]message|[- ]note)?\b/i
        },
        {
          type: "sticker",
          prefixes: [
            "sticker"
          ],
          matchLabel: /\bsticker\b/i
        },
        //
        // GIFs merged into reaction
        //
        {
          type: "reaction",
          prefixes: [
            "gif",
            "animated-gif",
            "reaction",
            "reaction-emoji"
          ],
          matchLabel: /\bgif\b|👍|❤|😂|😮|😢|👏|😠|: \p{Extended_Pictographic}\uFE0F?\s*$|like button|thumbs up/iu
        },
        {
          type: "poll",
          prefixes: [
            "poll"
          ],
          matchLabel: /\bpoll\b/i
        },
        {
          type: "text",
          prefixes: [
            "text",
            "text-replied",
            "text-image-replied"
          ],
          matchLabel: /\byou:|\breply\b|\breplied\b|^(?!.*\b(?:link|unsent|video call|voice message|voice note|missed call|sticker|gif|reaction|poll|audio call)\b).*/i
        }
      ];
      var addMatchFile = (rule) => ({
        ...rule,
        matchFile: new RegExp(
          `^${OPTIONAL_PREFIX}(?:${rule.prefixes.join("|")})${FILE_SUFFIX}`,
          "i"
        )
      });
      var messageRules = rules.map(addMatchFile);
      function chooseRule(fileName, ariaLabel) {
        const loweredFile = String(fileName || "").toLowerCase();
        const loweredLabel = String(ariaLabel || "").toLowerCase();
        const fileRule = messageRules.find((rule) => rule.matchFile && rule.matchFile.test(loweredFile));
        if (fileRule) return fileRule;
        const labelRule = messageRules.find(
          (rule) => rule.matchLabel && rule.matchLabel.test(loweredLabel)
        );
        if (labelRule) return labelRule;
        return messageRules.find((rule) => rule.type === "text") || messageRules[0];
      }
      module.exports = { messageRules, chooseRule };
    }
  });

  // src/shared/rules/index.js
  var require_rules = __commonJS({
    "src/shared/rules/index.js"(exports, module) {
      "use strict";
      var { messageRules, chooseRule } = require_message_rules();
      module.exports = {
        messageRules,
        chooseRule
      };
    }
  });

  // src/shared/sender-constants.js
  var require_sender_constants = __commonJS({
    "src/shared/sender-constants.js"(exports, module) {
      "use strict";
      var SENDER_PATTERN_SOURCE = "\\p{L}[\\p{L} .'\\-_]{0,49}";
      var SENDER_RE = new RegExp(`^${SENDER_PATTERN_SOURCE}$`, "u");
      var SENDER_MAX_WORDS = 5;
      function isValidSender(value) {
        if (!SENDER_RE.test(value)) return false;
        if (/\d/.test(value)) return false;
        return value.trim().split(/\s+/).length <= SENDER_MAX_WORDS;
      }
      module.exports = {
        SENDER_PATTERN_SOURCE,
        SENDER_RE,
        SENDER_MAX_WORDS,
        isValidSender
      };
    }
  });

  // src/shared/aria-label-parser.js
  var require_aria_label_parser = __commonJS({
    "src/shared/aria-label-parser.js"(exports, module) {
      "use strict";
      var { isValidSender, SENDER_PATTERN_SOURCE } = require_sender_constants();
      function normalizeLabel(text) {
        return String(text || "").replace(/\s+/g, " ").trim();
      }
      var SENDER_LAZY_RE = new RegExp(`^(${SENDER_PATTERN_SOURCE}?)(?:\\s+([\\s\\S]*))?$`, "u");
      var SENDER_COLON_INLINE_RE = new RegExp(`^${SENDER_PATTERN_SOURCE}:\\s`, "u");
      var SENDER_COLON_CAPTURE_RE = new RegExp(`^(${SENDER_PATTERN_SOURCE}):\\s*([\\s\\S]*)$`, "u");
      function splitSenderAndMessage(value) {
        const text = normalizeLabel(value);
        const firstWordMatch = text.match(SENDER_LAZY_RE);
        if (!firstWordMatch) return null;
        const sender = normalizeLabel(firstWordMatch[1]);
        const message = normalizeLabel(firstWordMatch[2] || "");
        if (!isValidSender(sender)) return null;
        return { sender, message };
      }
      var sharedRelativeDateRules = [];
      try {
        sharedRelativeDateRules = require_frontend_shared().relativeDateRules || [];
      } catch (err) {
        console.warn("aria-label-parser: failed to load shared relative date rules", err);
        sharedRelativeDateRules = [];
      }
      function findValidDatePrefix(text, referenceDate) {
        const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
        let candidate = "";
        for (let i = 0; i < Math.min(parts.length, 3); i += 1) {
          candidate = candidate ? `${candidate}, ${parts[i]}` : parts[i];
          if (normalizeDateToIso3(candidate, referenceDate)) return candidate;
        }
        return null;
      }
      function parseRelativeRuleMatch(match, ruleName, now) {
        if (!match) return null;
        if (ruleName === "relativeDay") {
          const [, when, hourPart, minute, meridiem] = match;
          const date = new Date(now);
          if (when.toLowerCase() === "yesterday") date.setDate(date.getDate() - 1);
          let hour = Number(hourPart);
          if (meridiem) {
            if (meridiem.toLowerCase() === "pm" && hour < 12) hour += 12;
            if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;
          }
          date.setHours(hour, Number(minute), 0, 0);
          return date;
        }
        if (ruleName === "weekday") {
          const [, dayName, hourPart = "0", minute = "00", meridiem] = match;
          const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const targetDow = days.indexOf(dayName.toLowerCase());
          if (targetDow < 0) return null;
          const diff = (now.getDay() - targetDow + 7) % 7;
          const date = new Date(now);
          date.setDate(date.getDate() - diff);
          let hour = Number(hourPart);
          if (meridiem) {
            if (meridiem.toLowerCase() === "pm" && hour < 12) hour += 12;
            if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;
          }
          date.setHours(hour, Number(minute), 0, 0);
          return date;
        }
        if (ruleName === "timeOnly") {
          const [, hourPart, minute, meridiem] = match;
          const date = new Date(now);
          let hour = Number(hourPart);
          if (meridiem) {
            if (meridiem.toLowerCase() === "pm" && hour < 12) hour += 12;
            if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;
          }
          date.setHours(hour, Number(minute), 0, 0);
          return date;
        }
        return null;
      }
      function normalizeSharedRelativeDate(text, referenceDate) {
        if (!Array.isArray(sharedRelativeDateRules) || sharedRelativeDateRules.length === 0) {
          return null;
        }
        const now = parseReferenceDate(referenceDate);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        for (const rule of sharedRelativeDateRules) {
          if (!rule || !rule.pattern) continue;
          const regex = new RegExp(rule.pattern, "i");
          const match = text.match(regex);
          if (!match) continue;
          const date = parseRelativeRuleMatch(match, rule.name, today);
          if (!date) continue;
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${year}.${month}.${day} ${hours}:${minutes}`;
        }
        return null;
      }
      function parseAriaLabel2(ariaLabel) {
        const label = normalizeLabel(ariaLabel).replace(/\s*,\s*/g, ", ");
        let match;
        match = label.match(/^At\s+(.+?),\s*([\p{L}]+(?:\s+[\p{L}]+){0,2})\s+[-–—]\s*([\s\S]*)$/iu);
        if (match) {
          let sender = match[2].trim();
          let message = match[3].trim();
          const conversationalToken = sender.match(/\s(Yep|Yes|No|Ok|Okay)$/i);
          if (conversationalToken) {
            sender = sender.slice(0, -conversationalToken[0].length).trim();
            message = `${conversationalToken[1]} - ${message}`;
          }
          return {
            date: match[1].trim(),
            sender,
            message
          };
        }
        const atPrefix = label.match(/^At\s+([\s\S]*)$/i);
        if (atPrefix) {
          const tailParts = atPrefix[1].split(",").map((part) => part.trim()).filter(Boolean);
          if (tailParts.length >= 3) {
            const maybeSender = tailParts[tailParts.length - 1];
            const maybeDate = tailParts.slice(0, -1).join(", ");
            const hasInlineSenderColon = tailParts.slice(1, -1).some((p) => SENDER_COLON_INLINE_RE.test(p));
            if (!hasInlineSenderColon && isValidSender(maybeSender)) {
              return {
                date: maybeDate.trim(),
                sender: maybeSender.trim(),
                message: ""
              };
            }
          }
          if (tailParts.length >= 2) {
            const maybeDate = tailParts[0];
            const rest = tailParts.slice(1).join(", ");
            const inlineMatch = rest.match(SENDER_COLON_CAPTURE_RE);
            if (inlineMatch && isValidSender(inlineMatch[1])) {
              return {
                date: maybeDate.trim(),
                sender: inlineMatch[1].trim(),
                message: inlineMatch[2].trim()
              };
            }
            const senderAndMessage = splitSenderAndMessage(rest);
            if (senderAndMessage) {
              return {
                date: maybeDate.trim(),
                sender: senderAndMessage.sender,
                message: senderAndMessage.message
              };
            }
          }
        }
        match = label.match(/^At\s+(.+),\s*([^:]+):\s*([\s\S]*)$/i);
        if (match) {
          const dateValue = match[1].trim();
          const normalizedDate = normalizeDateToIso3(dateValue);
          if (normalizedDate || findValidDatePrefix(dateValue)) {
            return {
              date: dateValue,
              sender: match[2].trim(),
              message: match[3].trim()
            };
          }
        }
        {
          const labelParts = label.split(",");
          for (let i = 1; i < labelParts.length; i++) {
            const datePart = labelParts.slice(0, i).join(",").trim();
            const senderRest = labelParts.slice(i).join(",").trim();
            const colonIdx = senderRest.indexOf(":");
            if (colonIdx < 0) continue;
            const potentialSender = senderRest.slice(0, colonIdx).trim();
            if (isValidSender(potentialSender)) {
              return {
                date: datePart,
                sender: potentialSender,
                message: senderRest.slice(colonIdx + 1).trim()
              };
            }
          }
        }
        match = label.match(/^Enter,\s*([^:]+?)\s+sent\s+(.+?)\s+by\s+([^:]+):\s*([\s\S]*)$/i);
        if (match) {
          return {
            date: match[2].trim(),
            sender: match[3].trim(),
            message: match[4].trim()
          };
        }
        match = label.match(/^At\s+(.+),\s*([^:]+)$/i);
        if (match) {
          const senderAndMessage = splitSenderAndMessage(match[2]);
          if (senderAndMessage) {
            return {
              date: match[1].trim(),
              sender: senderAndMessage.sender,
              message: senderAndMessage.message
            };
          }
          return {
            date: match[1].trim(),
            sender: match[2].trim(),
            message: ""
          };
        }
        match = label.match(/^Enter,\s*([^:]+?)\s+sent\s+(.+?)\s+by\s+([^:]+)$/i);
        if (match) {
          return {
            date: match[2].trim(),
            sender: match[3].trim(),
            message: ""
          };
        }
        {
          const parts = label.split(":");
          const potentialSender = parts.pop().trim();
          if (isValidSender(potentialSender)) {
            const datePart = parts.join(":").trim();
            if (normalizeDateToIso3(datePart) || findValidDatePrefix(datePart)) {
              return { date: datePart, sender: potentialSender, message: "" };
            }
          }
        }
        const colonIndex = label.indexOf(":");
        return {
          date: null,
          sender: null,
          message: colonIndex >= 0 ? label.slice(colonIndex + 1).trim() : label
        };
      }
      function parseReferenceDate(value) {
        if (value instanceof Date) return new Date(value.getTime());
        if (typeof value === "string") {
          const match = value.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})$/);
          if (match) {
            return new Date(
              Number(match[1]),
              Number(match[2]) - 1,
              Number(match[3]),
              Number(match[4]),
              Number(match[5]),
              0,
              0
            );
          }
          const parsed = new Date(value);
          if (!Number.isNaN(parsed.getTime())) return parsed;
        }
        return /* @__PURE__ */ new Date();
      }
      function normalizeDateToSimple(dateString, referenceDate = /* @__PURE__ */ new Date()) {
        if (!dateString) return null;
        let text = normalizeLabel(dateString).replace(/^At\s+/i, "");
        const parsed = Date.parse(text);
        if (!isNaN(parsed)) {
          const date = new Date(parsed);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${year}.${month}.${day} ${hours}:${minutes}`;
        }
        const sharedNormalized = normalizeSharedRelativeDate(text, referenceDate);
        if (sharedNormalized) return sharedNormalized;
        const now = parseReferenceDate(referenceDate);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const relativeMatch = text.match(/^(today|yesterday)(?:\s+at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
        if (relativeMatch) {
          const [, when, hourPart, minute, meridiem] = relativeMatch;
          const date = new Date(today);
          if (when.toLowerCase() === "yesterday") date.setDate(date.getDate() - 1);
          let hour = Number(hourPart);
          if (meridiem) {
            if (meridiem.toLowerCase() === "pm" && hour < 12) hour += 12;
            if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;
          }
          date.setHours(hour, Number(minute), 0, 0);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          return `${year}.${month}.${day} ${hours}:${minute}`;
        }
        const dayOfWeekMatch = text.match(
          /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:\s+(\d{1,2}):(\d{2})\s*(am|pm)?)?$/i
        );
        if (dayOfWeekMatch) {
          const [, dayName, hourPart = "0", minute = "00", meridiem] = dayOfWeekMatch;
          const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const targetDow = days.indexOf(dayName.toLowerCase());
          const diff = (today.getDay() - targetDow + 7) % 7;
          const date = new Date(today);
          date.setDate(date.getDate() - diff);
          let hour = Number(hourPart);
          if (meridiem) {
            if (meridiem.toLowerCase() === "pm" && hour < 12) hour += 12;
            if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;
          }
          date.setHours(hour, Number(minute), 0, 0);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          return `${year}.${month}.${day} ${hours}:${minute}`;
        }
        const timeOnlyMatch = text.match(/^(?:at\s*)?(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
        if (timeOnlyMatch) {
          const [, hourPart, minute, meridiem] = timeOnlyMatch;
          const date = new Date(today);
          let hour = Number(hourPart);
          if (meridiem) {
            if (meridiem.toLowerCase() === "pm" && hour < 12) hour += 12;
            if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;
          }
          date.setHours(hour, Number(minute), 0, 0);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          return `${year}.${month}.${day} ${hours}:${minute}`;
        }
        const fullMatch = text.match(
          /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4}),\s*(\d{1,2}):(\d{2})\s*(am|pm)?$/i
        );
        if (fullMatch) {
          const [, monthName, day, year, hourPart, minute, meridiem] = fullMatch;
          let hour = Number(hourPart);
          if (meridiem) {
            if (meridiem.toLowerCase() === "pm" && hour < 12) hour += 12;
            if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;
          }
          const monthIndex = (/* @__PURE__ */ new Date(`${monthName} 1, ${year}`)).getMonth() + 1;
          return `${year}.${String(monthIndex).padStart(2, "0")}.${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${minute}`;
        }
        return text;
      }
      function normalizeDateToIso3(dateString, referenceDate) {
        if (!dateString) return null;
        const normalized = normalizeDateToSimple(dateString, referenceDate);
        if (!normalized) return null;
        const [dayPart, timePart] = normalized.split(" ");
        if (!dayPart || !timePart) return null;
        const [year, month, day] = dayPart.split(".").map(Number);
        const [hour, minute] = timePart.split(":").map(Number);
        if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
        const date = new Date(year, month - 1, day, hour, minute, 0, 0);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
      }
      function normalizeDateToIsoSafe(dateString, referenceDate, sourceLabel) {
        try {
          return normalizeDateToIso3(dateString, referenceDate) || dateString;
        } catch (err) {
          console.warn(`${sourceLabel}: normalizeDateToIso failed for`, dateString, err);
          return dateString;
        }
      }
      module.exports = {
        parseAriaLabel: parseAriaLabel2,
        parseReferenceDate,
        normalizeDateToSimple,
        normalizeDateToIso: normalizeDateToIso3,
        normalizeDateToIsoSafe,
        normalizeLabel,
        isValidSender,
        findValidDatePrefix
      };
    }
  });

  // src/shared/duration-utils.js
  var require_duration_utils = __commonJS({
    "src/shared/duration-utils.js"(exports, module) {
      "use strict";
      var { normalizeLabel } = require_aria_label_parser();
      function formatDurationSeconds(totalSeconds) {
        const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor(safeSeconds % 3600 / 60);
        const seconds = safeSeconds % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      }
      function normalizeDuration2(text) {
        if (!text) return null;
        const normalized = String(text).trim();
        const suffix = normalized.match(/\b(?:am|pm)\b/i);
        const hhmmss = normalized.match(/^(\d+):(\d{2}):(\d{2})(?!\s*(?:am|pm)\b)/i);
        if (hhmmss && !suffix) {
          const totalSeconds = Number(hhmmss[1]) * 3600 + Number(hhmmss[2]) * 60 + Number(hhmmss[3]);
          return formatDurationSeconds(totalSeconds);
        }
        const hhmm = normalized.match(/^(\d+):(\d{2})(?!\s*(?:am|pm)\b)/i);
        if (hhmm && !suffix) {
          const totalSeconds = Number(hhmm[1]) * 60 + Number(hhmm[2]);
          return formatDurationSeconds(totalSeconds);
        }
        const minMatch = normalized.match(/(\d+(?:\.\d+)?)\s*min(?:s)?/i);
        if (minMatch) {
          const totalSeconds = parseFloat(minMatch[1]) * 60;
          return formatDurationSeconds(totalSeconds);
        }
        const secMatch = normalized.match(/(\d+)\s*sec/i);
        if (secMatch) {
          return formatDurationSeconds(parseInt(secMatch[1], 10));
        }
        return null;
      }
      function extractRawDuration(text) {
        if (!text) return null;
        const normalized = normalizeLabel(text);
        const hhmmss = normalized.match(/(\d+:\d{2}:\d{2})/i);
        if (hhmmss) return hhmmss[1];
        const mmss = normalized.match(/(\d+:\d{2})(?!\s*(?:am|pm)\b)/i);
        if (mmss) return mmss[1];
        const mins = normalized.match(/(\d+(?:\.\d+)?\s*min(?:s)?)/i);
        if (mins) return mins[1];
        const secs = normalized.match(/(\d+\s*sec(?:ond)?s?)/i);
        if (secs) return secs[1];
        return null;
      }
      function durationToMinutes2(duration) {
        if (!duration) return 0;
        const normalized = normalizeDuration2(duration) || duration;
        const hms = String(normalized).match(/^(\d+):(\d{2}):(\d{2})$/);
        if (hms) {
          return Number(hms[1]) * 60 + Number(hms[2]) + Math.ceil(Number(hms[3]) / 60);
        }
        return 0;
      }
      function durationToSeconds(duration) {
        if (!duration) return 0;
        const normalized = normalizeDuration2(duration) || duration;
        const hms = String(normalized).match(/^(\d+):(\d{2}):(\d{2})$/);
        if (hms) {
          return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]);
        }
        return 0;
      }
      module.exports = {
        normalizeDuration: normalizeDuration2,
        extractRawDuration,
        formatDurationSeconds,
        durationToMinutes: durationToMinutes2,
        durationToSeconds
      };
    }
  });

  // src/shared/message-metadata.js
  var require_message_metadata = __commonJS({
    "src/shared/message-metadata.js"(exports, module) {
      "use strict";
      var { messageRules, chooseRule } = require_rules();
      var { parseAriaLabel: parseAriaLabel2, normalizeDateToSimple, normalizeLabel } = require_aria_label_parser();
      var { normalizeDuration: normalizeDuration2 } = require_duration_utils();
      var sharedFrontendConfig;
      try {
        sharedFrontendConfig = require_frontend_shared() || {};
      } catch (err) {
        console.warn("message-metadata: failed to load shared frontend config", err);
        sharedFrontendConfig = {};
      }
      var asciiReactionPattern = sharedFrontendConfig.reactionOptions?.asciiSmileyPattern ? new RegExp(sharedFrontendConfig.reactionOptions.asciiSmileyPattern, "u") : /^[:;=8Xx][-~]?[)DdpP(/\\\]]$/u;
      function isAsciiReactionText(text) {
        return asciiReactionPattern.test(String(text || "").trim());
      }
      function stripTrackingParams2(url) {
        if (!url) return url;
        try {
          const parsed = new URL(url);
          for (const key of Array.from(parsed.searchParams.keys())) {
            if (key.toLowerCase().startsWith("utm_") || ["fbclid", "gclid", "dclid", "msclkid", "ref", "ref_src", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].includes(key.toLowerCase())) {
              parsed.searchParams.delete(key);
            }
          }
          parsed.hash = "";
          return parsed.toString();
        } catch (err) {
          console.warn("message-metadata: stripTrackingParams failed for", url, err);
          return url;
        }
      }
      function normalizeRedirectUrl(url) {
        try {
          const parsed = new URL(url);
          const host = parsed.hostname.toLowerCase();
          const path = parsed.pathname.toLowerCase();
          const isRedirectHost = /(^|\.)facebook\.com$|(^|\.)messenger\.com$/.test(host);
          const isRedirectPath = path.includes("/l.php") || path.includes("/flx/warn/");
          if (!isRedirectHost || !isRedirectPath) return url;
          const candidate = parsed.searchParams.get("u") || parsed.searchParams.get("url") || parsed.searchParams.get("q");
          if (!candidate) return url;
          const decoded = decodeURIComponent(candidate);
          return /^https?:\/\//i.test(decoded) ? decoded : url;
        } catch (err) {
          console.warn("message-metadata: resolveRedirectUrl outer failed for", url, err);
          const redirectMatch = url.match(
            /https?:\/\/(?:l\.facebook\.com|l\.m\.facebook\.com|l\.messenger\.com|l\.m\.messenger\.com)\/l\.php\?(?:[^#]*?)(?:u|url|q)=([^&#]+)/i
          );
          if (!redirectMatch) return url;
          try {
            const decoded = decodeURIComponent(redirectMatch[1]);
            return /^https?:\/\//i.test(decoded) ? decoded : url;
          } catch (err2) {
            console.warn("message-metadata: resolveRedirectUrl inner failed for", url, err2);
            return redirectMatch[1];
          }
        }
      }
      function extractLink(text) {
        if (!text) return null;
        const urlMatch = String(text).match(/(https?:\/\/[^\s"'<]+)/i);
        const wwwMatch = String(text).match(/\b(www\.[^\s"'<]+)/i);
        const rawUrl = urlMatch ? urlMatch[0] : wwwMatch ? `https://${wwwMatch[1]}` : null;
        if (!rawUrl) return null;
        return normalizeRedirectUrl(rawUrl);
      }
      function extractPinnedLocationLink(text) {
        const normalized = normalizeLabel(text);
        const locationMatch = normalized.match(/\bPinned Location\s*(.+)$/i);
        if (!locationMatch) return null;
        const locationText = locationMatch[1].trim();
        if (!locationText) return null;
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`;
      }
      function isLinkOnlyText(text, link) {
        if (!text || !link) return false;
        const normalizedText = normalizeLabel(text).replace(/[.,;:!?]+$/g, "").trim();
        const normalizedLink = normalizeLabel(link).replace(/[.,;:!?]+$/g, "").trim();
        return normalizedText === normalizedLink;
      }
      function normalizeContentType(type) {
        if (type === "you-text") return "text";
        return type;
      }
      function getContentMeta2({
        fileName = "",
        ariaLabel = "",
        message = "",
        rawMeta = {},
        hasImage = false,
        imageCount = 0,
        hasPlayButton = false,
        hasLink = false,
        timerText = ""
      } = {}) {
        const normalizedText = normalizeLabel(message).replace(/[\r\n]+/g, " ");
        const normalizedLabel = normalizeLabel(ariaLabel);
        const loweredFileName = String(fileName || "").toLowerCase();
        const isLinkTextFile = /(?:^|[\\/])link-text\.html$/i.test(loweredFileName) || loweredFileName === "link-text.html";
        const rule = chooseRule(fileName, ariaLabel);
        const fileTypeLocked = Boolean(
          rule && rule.matchFile && rule.matchFile.test(String(fileName || "").toLowerCase())
        );
        const labelTypeLocked = !fileTypeLocked && Boolean(
          rule && rule.matchLabel && rule.matchLabel.test(String(ariaLabel || "").toLowerCase()) && rule.type !== "text" && rule.type !== "you-text"
        );
        let type = normalizeContentType(rule.type || "text");
        const rawLink = rawMeta.link || extractLink(normalizedText) || extractLink(normalizedLabel) || null;
        const link = rawLink ? normalizeRedirectUrl(rawLink) : null;
        const pinnedLocationLink = extractPinnedLocationLink(normalizedText) || extractPinnedLocationLink(normalizedLabel);
        const resolvedLink = link || pinnedLocationLink || null;
        const isLinkTextLikeLive = !loweredFileName && Boolean(normalizedText) && !/^\b(?:pinned\s+location|open\s+attachment|view\s+attachment|attachment|open\s+link|view\s+link)\b/i.test(
          normalizedText
        );
        const normalizedRawDuration = normalizeDuration2(rawMeta.duration);
        const fallbackDuration = normalizeDuration2(timerText) || normalizeDuration2(normalizedText);
        const rawDuration = normalizedRawDuration || fallbackDuration;
        const unsent = /(?:unsent|deleted)/i.test(normalizedText) || /(?:unsent|deleted)/i.test(normalizedLabel);
        const callMatch = normalizedText.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i) || normalizedLabel.match(/\b(?:missed\s+)?(?:video|audio)?\s*call\b/i);
        const voiceMatch = /\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i.test(normalizedText) || /\b(?:voice\s+message|voice\s+note|audio\s+message|audio\s+note)\b/i.test(normalizedLabel) || Boolean(timerText);
        const explicitLink = Boolean(rawLink) || hasLink || /https?:\/\/|www\.|fbcdn\.|fbsbx\.|facebook\.com|fb\.me|m\.me|l\.facebook\.com\/l\.php|l\.messenger\.com\/l\.php|href\b/i.test(
          normalizedText
        ) || /https?:\/\/|www\.|fbcdn\.|fbsbx\.|facebook\.com|fb\.me|m\.me|l\.facebook\.com\/l\.php|l\.messenger\.com\/l\.php|href\b/i.test(
          normalizedLabel
        ) || /\b(?:attachment|open attachment|download|view attachment|open link|view link|pinned location)\b/i.test(
          normalizedText
        ) || /\b(?:attachment|open attachment|download|view attachment|open link|view link|pinned location)\b/i.test(
          normalizedLabel
        );
        const imageKeyword = /\b(?:image sent|photo sent|picture sent|sent image|sent photo|sent picture)\b/i;
        const imageMatch = imageCount > 0 || hasImage && (imageKeyword.test(normalizedText) || imageKeyword.test(normalizedLabel) || !normalizedText) || imageKeyword.test(normalizedText) || imageKeyword.test(normalizedLabel);
        if (!fileTypeLocked && !labelTypeLocked) {
          if (unsent) {
            type = "unsent";
          } else if (callMatch) {
            const callText = callMatch[0].toLowerCase();
            if (/missed/.test(callText)) {
              type = "missed-call";
            } else if (/video/.test(callText)) {
              type = "video-call";
            } else if (/audio/.test(callText)) {
              type = "audio-call";
            } else {
              type = "voice-note";
            }
          } else if (explicitLink) {
            type = "link";
          } else if (voiceMatch) {
            type = "voice-note";
          } else if (imageMatch) {
            type = "image";
          }
          if (type === "text" && isAsciiReactionText(normalizedText)) {
            type = "reaction";
          }
        }
        const linkOnlyText = type === "link" && Boolean(resolvedLink) && isLinkOnlyText(normalizedText, resolvedLink);
        let contentText = normalizedText;
        if (type === "unsent") {
          contentText = "message unsent";
        } else if (type === "link") {
          if ((isLinkTextFile || isLinkTextLikeLive) && normalizedText) {
            if (linkOnlyText) {
              contentText = resolvedLink || normalizedText;
            } else if (resolvedLink && normalizedText.includes(resolvedLink)) {
              contentText = normalizedText;
            } else {
              contentText = resolvedLink ? `${resolvedLink} ${normalizedText}` : normalizedText;
            }
          } else {
            contentText = resolvedLink || "link";
          }
        } else if (type === "voice-note") {
          const trimmed = normalizeLabel(normalizedText || "");
          const isUINoise = !trimmed || /^play\s*\d{1,2}:\d{2}/i.test(trimmed) || /^audio\s+scrubber/i.test(trimmed) || /^(voice\s+(message|note)|audio\s+(message|note))$/i.test(trimmed);
          contentText = isUINoise ? "voice note" : normalizedText;
        } else if (type === "sticker") {
          contentText = "sticker";
        } else if (type === "reaction") {
          const reactionOnlyTextMatch = /^[:;=8Xx][-~]?[)DdpP(/\\\]]$/u;
          const normalizedReaction = normalizedText.trim();
          const isAsciiReaction = reactionOnlyTextMatch.test(normalizedReaction);
          const isEmojiReaction = /\p{Extended_Pictographic}/u.test(normalizedReaction);
          contentText = isAsciiReaction || isEmojiReaction ? normalizedReaction : null;
        } else if (type === "image") {
          contentText = "image sent";
        } else if (type === "video-call" || type === "audio-call" || type === "missed-call") {
          const hasCallPhrase = /\bcall\b/i.test(normalizedText);
          contentText = hasCallPhrase ? normalizedText : type.replace(/-/g, " ");
        }
        const timedTypes = /* @__PURE__ */ new Set(["voice-note", "video-call", "audio-call"]);
        const noLengthTypes = /* @__PURE__ */ new Set(["image", "missed-call", "unsent", "sticker", ...timedTypes]);
        const duration = timedTypes.has(type) ? rawDuration : null;
        const linkHasTextContent = type === "link" && (isLinkTextFile || isLinkTextLikeLive) && Boolean(normalizedText) && !linkOnlyText;
        const shouldOmitLength = noLengthTypes.has(type) || type === "link" && !linkHasTextContent;
        const wordCount = shouldOmitLength || contentText == null ? void 0 : (contentText.match(/\S+/g) || []).length;
        const contentLength = shouldOmitLength || contentText == null ? void 0 : `${wordCount} words`;
        return {
          type,
          text: contentText,
          words: wordCount,
          contentLength,
          link: resolvedLink || void 0,
          voiceDurationSource: rawMeta.duration ? "timer" : timerText ? "label" : void 0,
          isCall: type === "video-call" || type === "missed-call" || type === "audio-call",
          isImage: type === "image",
          imageCount: imageCount || (type === "image" ? 1 : 0),
          duration
        };
      }
      module.exports = {
        stripTrackingParams: stripTrackingParams2,
        getContentMeta: getContentMeta2
      };
    }
  });

  // src/shared/export-config.json
  var require_export_config = __commonJS({
    "src/shared/export-config.json"(exports, module) {
      module.exports = {
        method: "server",
        messageTypes: [
          "audio-call",
          "deleted",
          "image",
          "link",
          "link-embed-no-text",
          "link-text",
          "link-video",
          "missed-audio-call",
          "missed-call",
          "missed-video-call",
          "poll",
          "reaction-emoji",
          "reaction",
          "sticker",
          "text-image-replied",
          "text-replied",
          "text",
          "unsent",
          "video-call",
          "voice-note"
        ],
        patterns: {
          entryLine: "^\\[\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}\\](?:\\s\\([^)]*\\))?\\s[^:]+:\\s[^/]+(?:\\s/\\s.*)?$",
          duration: "\\d{2}:\\d{2}:\\d{2}",
          totalSummaryTitle: "^Total Summary$",
          totalLine: "^\\d+\\s+(?:message|messages|post|posts)\\s*/\\s*\\d+\\s+(?:day|days)$",
          roughTextLine: "^~\\s+\\d+\\s+text\\s*/\\s*\\d+\\s+words$",
          roughWordsLine: "^~\\s+\\d+\\s+words$",
          roughImagesLine: "^~\\s+\\d+\\s+images$",
          roughCallsLine: "^~\\s+\\d+\\s+calls\\s+\\d{2}:\\d{2}:\\d{2}$",
          personSummaryTitle: "^.{1,80} Summary$"
        },
        summaryConcept: {
          totalSummaryTitle: "Total Summary",
          roughPrefix: "~",
          personSummarySuffix: " Summary"
        },
        exports: [
          {
            fileName: "export-max.txt",
            includeContent: true,
            includeSummary: true
          },
          {
            fileName: "export-minimal.txt",
            includeContent: false,
            includeSummary: false
          },
          {
            fileName: "export-summary-combined.txt",
            includeContent: false,
            includeSummary: true,
            includeLength: false,
            skipBodyValidation: true
          },
          {
            fileName: "export-summary-detailed.txt",
            includeContent: false,
            includeSummary: true,
            includeLength: false,
            skipBodyValidation: true
          },
          {
            fileName: "export-summary-json.txt",
            includeContent: false,
            includeSummary: false,
            format: "json"
          },
          {
            fileName: "export-raw-date.txt",
            includeContent: true,
            includeSummary: true,
            includeRawDate: true
          }
        ]
      };
    }
  });

  // src/shared/constants.js
  var require_constants = __commonJS({
    "src/shared/constants.js"(exports, module) {
      "use strict";
      var TIMED_CALL_TYPES = ["audio-call", "video-call", "voice-note"];
      var MISSED_CALL_TYPES = ["missed-call", "missed-audio-call", "missed-video-call"];
      var CALL_TYPES = [...TIMED_CALL_TYPES, ...MISSED_CALL_TYPES];
      var CONTENT_TYPES = /* @__PURE__ */ new Set(["text", "link", "reaction"]);
      module.exports = {
        TIMED_CALL_TYPES,
        MISSED_CALL_TYPES,
        CALL_TYPES,
        CONTENT_TYPES
      };
    }
  });

  // src/shared/export-summary.js
  var require_export_summary = __commonJS({
    "src/shared/export-summary.js"(exports, module) {
      "use strict";
      function formatDayKey(date) {
        if (!(date instanceof Date) || isNaN(date)) return "unknown";
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      }
      var { summaryConcept } = require_export_config();
      var { TIMED_CALL_TYPES, MISSED_CALL_TYPES } = require_constants();
      var { formatDurationSeconds } = require_duration_utils();
      var TOTAL_SUMMARY_TITLE = summaryConcept.totalSummaryTitle || "Total Summary";
      var ROUGH_PREFIX = summaryConcept.roughPrefix || "~";
      var PERSON_SUMMARY_SUFFIX = summaryConcept.personSummarySuffix || " Summary";
      function isIgnoredForIndividualCount(entry) {
        const type = String(entry.type || entry.fileType || "").toLowerCase();
        return ["unsent", "deleted", ...MISSED_CALL_TYPES].includes(type);
      }
      function isMissedCall(entry) {
        const type = String(entry.type || entry.fileType || "").toLowerCase();
        return MISSED_CALL_TYPES.includes(type);
      }
      function isCountedCall(entry) {
        const type = String(entry.type || entry.fileType || "").toLowerCase();
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
                callSeconds: 0
              }
            },
            participants: []
          };
        }
        const totals = /* @__PURE__ */ new Map();
        const allDays = /* @__PURE__ */ new Set();
        let totalCalls = 0;
        let totalCallSeconds = 0;
        let totalImages = 0;
        let totalImageEntries = 0;
        let totalWords = 0;
        let totalTextEntries = 0;
        entries.forEach((entry) => {
          const sender = entry.sender || "Unknown";
          const dayKey = formatDayKey(entry.date);
          allDays.add(dayKey);
          const data = totals.get(sender) || {
            count: 0,
            days: /* @__PURE__ */ new Set(),
            calls: 0,
            callSeconds: 0,
            images: 0
          };
          data.count += 1;
          data.days.add(dayKey);
          if (isCountedCall(entry)) {
            data.calls += 1;
            data.callSeconds += Number(entry.callSeconds || 0);
            totalCalls += 1;
            totalCallSeconds += Number(entry.callSeconds || 0);
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
          const participantEntries = entries.filter((entry) => (entry.sender || "Unknown") === name);
          const includedEntries = participantEntries.filter(
            (entry) => !isIgnoredForIndividualCount(entry)
          );
          const participantDays = /* @__PURE__ */ new Set();
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
            participantSeconds
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
              callSeconds: totalCallSeconds
            }
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
              callSeconds: summary.participantSeconds
            }
          }))
        };
      }
      function collectTypeCounts(entries = []) {
        const counts = {};
        entries.forEach((entry) => {
          const type = String(entry.type || entry.fileType || "").toLowerCase();
          counts[type] = (counts[type] || 0) + 1;
        });
        return counts;
      }
      function formatTypeCount(type, count) {
        const label = String(type || "").replace(/-/g, " ");
        return `${ROUGH_PREFIX} ${count} ${label}`;
      }
      var DETAILED_TYPE_ORDER = [
        "text",
        "reaction",
        "link",
        "image",
        "sticker",
        "poll",
        "audio-call",
        "video-call",
        "voice-note",
        "missed-call",
        "deleted",
        "unsent"
      ];
      function renderTypeCounts(typeCounts) {
        const orderedTypes = DETAILED_TYPE_ORDER.filter((type) => typeCounts[type] != null);
        const extraTypes = Object.keys(typeCounts).filter((type) => !DETAILED_TYPE_ORDER.includes(type)).sort();
        return orderedTypes.concat(extraTypes).map((type) => formatTypeCount(type, typeCounts[type]));
      }
      function buildDetailedSummary(entries = [], options = {}) {
        if (!entries.length) {
          return buildSummary2(entries, options);
        }
        const totals = /* @__PURE__ */ new Map();
        const allDays = /* @__PURE__ */ new Set();
        entries.forEach((entry) => {
          const sender = entry.sender || "Unknown";
          const dayKey = formatDayKey(entry.date);
          allDays.add(dayKey);
          const type = String(entry.type || entry.fileType || "").toLowerCase();
          const data = totals.get(sender) || {
            count: 0,
            days: /* @__PURE__ */ new Set(),
            calls: 0,
            callSeconds: 0,
            images: 0,
            words: 0,
            typeCounts: {}
          };
          const isTimedCall = TIMED_CALL_TYPES.includes(type);
          const isCall = isTimedCall || type === "missed-call";
          if (isTimedCall) {
            data.calls += 1;
            data.callSeconds += Number(entry.callSeconds || 0);
          }
          if (type === "image") {
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
          const participantEntries = entries.filter((entry) => (entry.sender || "Unknown") === name);
          const participantDays = /* @__PURE__ */ new Set();
          const participantTypeCounts = {};
          let participantWords = 0;
          let participantCalls = 0;
          let participantSeconds = 0;
          participantEntries.forEach((entry) => {
            const dayKey = formatDayKey(entry.date);
            participantDays.add(dayKey);
            const type = String(entry.type || entry.fileType || "").toLowerCase();
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
            participantMessages: participantEntries.length
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
              callSeconds: totalCallSeconds
            },
            typeCounts: totalTypeCounts
          },
          participants: participantSummaries.map((summary2) => ({
            title: `${summary2.name}${PERSON_SUMMARY_SUFFIX}`,
            name: summary2.name,
            messages: summary2.participantMessages,
            days: summary2.participantDays.size,
            rough: {
              words: summary2.participantWords,
              calls: summary2.participantCalls,
              callSeconds: summary2.participantSeconds
            },
            typeCounts: summary2.participantTypeCounts
          }))
        };
        const useMessageLabel = Boolean(options.useMessageLabel);
        const totalMessageLabel = useMessageLabel ? summary.total.messages === 1 ? "message" : "messages" : summary.total.messages === 1 ? "post" : "posts";
        const totalDayLabel = useMessageLabel ? summary.total.days === 1 ? "day" : "days" : "days";
        const detailLines = [
          summary.total.title,
          `${summary.total.messages} ${totalMessageLabel} / ${summary.total.days} ${totalDayLabel}`,
          `${ROUGH_PREFIX} ${summary.total.rough.words} words`,
          ...renderTypeCounts(summary.total.typeCounts)
        ];
        if (summary.total.rough.calls || summary.total.typeCounts["audio-call"] || summary.total.typeCounts["video-call"] || summary.total.typeCounts["voice-note"]) {
          detailLines.push(
            `${ROUGH_PREFIX} ${summary.total.rough.calls} calls ${formatDurationSeconds(summary.total.rough.callSeconds)}`
          );
        }
        detailLines.push("");
        summary.participants.forEach((participant) => {
          const participantMessageLabel = useMessageLabel ? participant.messages === 1 ? "message" : "messages" : participant.messages === 1 ? "post" : "posts";
          const participantDayLabel = useMessageLabel ? participant.days === 1 ? "day" : "days" : "days";
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
          detailLines.push("");
        });
        detailLines.push("---");
        return detailLines.join("\n") + "\n";
      }
      function buildSummary2(entries = [], options = {}) {
        if (!entries.length) return "";
        const summary = buildSummaryData(entries, options);
        const useMessageLabel = Boolean(options.useMessageLabel);
        const totalMessageLabel = useMessageLabel ? summary.total.messages === 1 ? "message" : "messages" : summary.total.messages === 1 ? "post" : "posts";
        const totalDayLabel = useMessageLabel ? summary.total.days === 1 ? "day" : "days" : "days";
        const detailLines = [
          summary.total.title,
          `${summary.total.messages} ${totalMessageLabel} / ${summary.total.days} ${totalDayLabel}`,
          `${ROUGH_PREFIX} ${summary.total.rough.text} text / ${summary.total.rough.words} words`,
          `${ROUGH_PREFIX} ${summary.total.rough.images} images`,
          `${ROUGH_PREFIX} ${summary.total.rough.calls} calls ${formatDurationSeconds(summary.total.rough.callSeconds)}`,
          ""
        ];
        summary.participants.forEach((participant) => {
          const participantMessageLabel = useMessageLabel ? participant.messages === 1 ? "message" : "messages" : participant.messages === 1 ? "post" : "posts";
          const participantDayLabel = useMessageLabel ? participant.days === 1 ? "day" : "days" : "days";
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
          detailLines.push("");
        });
        detailLines.push("---");
        return detailLines.join("\n") + "\n";
      }
      function buildSummaryJson(entries = [], options = {}) {
        const summary = buildSummaryData(entries, options);
        return JSON.stringify(summary, null, 2) + "\n";
      }
      module.exports = {
        buildSummary: buildSummary2,
        buildDetailedSummary,
        buildSummaryData,
        buildSummaryJson
      };
    }
  });

  // src/shared/export-formatter.js
  var require_export_formatter = __commonJS({
    "src/shared/export-formatter.js"(exports, module) {
      "use strict";
      var { normalizeDuration: normalizeDuration2, durationToMinutes: durationToMinutes2, durationToSeconds } = require_duration_utils();
      var { normalizeDateToIsoSafe } = require_aria_label_parser();
      var { buildSummary: buildSummary2, buildDetailedSummary, buildSummaryData } = require_export_summary();
      var { TIMED_CALL_TYPES, CALL_TYPES, CONTENT_TYPES } = require_constants();
      function formatExportHeader2({ method, messageTypes, exportOptions = {}, aliasMap = {} }) {
        const types = messageTypes.map((type) => `- ${type}`).join("\n");
        const optionKeys = Object.keys(exportOptions).sort();
        const activeOptions = optionKeys.filter((key) => exportOptions[key]);
        const inactiveOptions = optionKeys.filter((key) => !exportOptions[key]);
        const aliasLines = Object.entries(aliasMap).filter(([key]) => key && aliasMap[key]).map(([key, value]) => `  ${key} : ${value}`).join("\n");
        let header = `Method: ${method}
Message types:
${types}

`;
        if (optionKeys.length) {
          header += `Options: ${activeOptions.length ? activeOptions.join(", ") : "none"}
`;
          header += `Unused: ${inactiveOptions.length ? inactiveOptions.join(", ") : "none"}

`;
        }
        if (aliasLines) {
          header += `Aliases:
${aliasLines}

`;
        }
        return `${header}---

`;
      }
      function buildExportText(lines, headerLines = "") {
        return `${headerLines}${lines.join("")}`;
      }
      function formatDate(raw, referenceDate) {
        let dateValue = raw;
        if (typeof raw === "string") {
          dateValue = normalizeDateToIsoSafe(raw, referenceDate, "export-formatter");
        }
        const date = new Date(dateValue);
        if (isNaN(date)) return String(raw || "");
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
      }
      function formatLine2(entry, options = {}) {
        const includeContent = options.includeContent === true;
        const includeLength = options.includeLength !== false;
        const includeRawDate = options.includeRawDate === true;
        const dateText = entry.dateText || "unknown";
        const sender = entry.sender || "Unknown";
        const displayType = /^image(?:-\d+)?$/i.test(entry.fileType || "") ? "image" : entry.fileType;
        const parts = [displayType];
        if (entry.duration) {
          const ensureNormalized = normalizeDuration2(entry.duration) || entry.duration;
          parts.push(ensureNormalized);
        }
        if (includeLength && entry.contentLength) parts.push(entry.contentLength);
        const rawDatePart = includeRawDate && entry.rawDate ? ` (${entry.rawDate})` : "";
        const base = `[${dateText}]${rawDatePart} ${sender}: ${parts.join(" ")}`;
        const shouldShowTextContent = includeContent && CONTENT_TYPES.has(entry.semanticType) && entry.content;
        if (shouldShowTextContent) {
          return `${base} / ${entry.content}
`;
        }
        return `${base}
`;
      }
      function buildEntryFromEntry(entry) {
        const semanticType = String(entry.semanticType || entry.fileType || "").toLowerCase();
        const isTimedCall = TIMED_CALL_TYPES.includes(semanticType);
        const contentText = String(entry.content || "").trim();
        const textWords = contentText ? contentText.split(/\s+/).filter(Boolean).length : 0;
        const callSeconds = isTimedCall ? durationToSeconds(entry.duration) : 0;
        return {
          sender: entry.sender,
          date: Number.isFinite(entry.ts) ? new Date(entry.ts) : /* @__PURE__ */ new Date(NaN),
          type: semanticType,
          isCall: CALL_TYPES.includes(semanticType),
          isImage: semanticType === "image",
          callSeconds,
          wordCount: isTimedCall || semanticType === "image" ? 0 : entry.words || textWords,
          imageCount: Number(entry.imageCount || 0)
        };
      }
      function formatSummarySection(entries = [], options = {}) {
        const summaryEntries = entries.map(buildEntryFromEntry);
        if (options.detailed) {
          return buildDetailedSummary(summaryEntries, {
            fixedParticipants: options.fixedParticipants || null,
            useMessageLabel: Boolean(options.useMessageLabel)
          });
        }
        return buildSummary2(summaryEntries, {
          fixedParticipants: options.fixedParticipants || null,
          useMessageLabel: Boolean(options.useMessageLabel)
        });
      }
      module.exports = {
        formatExportHeader: formatExportHeader2,
        buildExportText,
        formatDate,
        formatLine: formatLine2,
        buildEntryFromEntry,
        formatSummarySection,
        buildSummaryData,
        durationToMinutes: durationToMinutes2
      };
    }
  });

  // src/shared/string-utils.js
  var require_string_utils = __commonJS({
    "src/shared/string-utils.js"(exports, module) {
      "use strict";
      function escapeRegExp(value) {
        return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      function replaceWholeWord(text, name, replacement) {
        const escaped = escapeRegExp(name);
        const pattern = new RegExp(`(^|[^\\p{L}])${escaped}(?=[^\\p{L}]|$)`, "giu");
        return String(text || "").replace(pattern, (match, prefix) => {
          const originalWord = match.slice(prefix.length);
          if (name.toLowerCase() === "you" && originalWord === "you") {
            return match;
          }
          return `${prefix}${replacement}`;
        });
      }
      module.exports = { escapeRegExp, replaceWholeWord };
    }
  });

  // src/shared/alias-utils.js
  var require_alias_utils = __commonJS({
    "src/shared/alias-utils.js"(exports, module) {
      "use strict";
      var { escapeRegExp, replaceWholeWord } = require_string_utils();
      function applyAliasToText2(text, aliasMap = {}, sender) {
        let result = String(text || "");
        for (const [from, to] of Object.entries(aliasMap || {})) {
          if (!from || !to || from === "any") continue;
          result = replaceWholeWord(result, from, to);
        }
        if (sender && aliasMap?.any) {
          result = replaceWholeWord(result, sender, aliasMap.any);
        }
        return result;
      }
      module.exports = {
        applyAliasToText: applyAliasToText2
      };
    }
  });

  // src/frontend/src/index.js
  var import_frontend_shared = __toESM(require_frontend_shared(), 1);
  var import_message_metadata = __toESM(require_message_metadata(), 1);
  var import_duration_utils = __toESM(require_duration_utils(), 1);
  var import_aria_label_parser2 = __toESM(require_aria_label_parser(), 1);
  var import_export_summary = __toESM(require_export_summary(), 1);
  var import_export_formatter = __toESM(require_export_formatter(), 1);

  // src/shared/frontend-utils.mjs
  var import_aria_label_parser = __toESM(require_aria_label_parser(), 1);
  function parseLocalDate(str) {
    if (!str) return NaN;
    const s = str.trim();
    const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    const dmy = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
    if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
    return NaN;
  }
  function resolveRelativeDate(raw) {
    return (0, import_aria_label_parser.normalizeDateToIso)(raw) || raw;
  }
  function sanitizeFileNamePart(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return normalized.slice(0, 40) || "chat";
  }
  function getConversationName() {
    const title = document.title || "";
    const cleaned = title.replace(/\s*[|\-•]\s*messenger.*$/i, "").replace(/\s*messenger\s*$/i, "").trim();
    if (cleaned) return cleaned;
    const h1 = document.querySelector("h1");
    if (h1 && h1.textContent.trim()) return h1.textContent.trim();
    return "chat";
  }
  function getDisplayPersonName() {
    const name = getConversationName();
    const parts = name.split(/\s*(?:,|&|\band\b|\+|\/)\s*/i).map((part) => part.trim()).filter(Boolean);
    const firstNonYou = parts.find((part) => !/^you$/i.test(part));
    if (firstNonYou) return firstNonYou;
    const withoutYou = name.replace(/\byou\b/gi, "").replace(/\s{2,}/g, " ").trim();
    return withoutYou || "chat";
  }
  function formatExportFileName(mode, { fromDate, toDate } = {}) {
    const conversationName = getConversationName();
    const base = sanitizeFileNamePart(conversationName);
    const shortName = base.replace(/[^a-z0-9]/g, "").slice(0, 3).padEnd(3, "_");
    if (fromDate || toDate) {
      const from = (fromDate || "").slice(0, 10).replace(/-/g, "");
      const to = (toDate || "").slice(0, 10).replace(/-/g, "");
      const range = `${from || "start"}--${to || "end"}`;
      return `chat-export-${range}-${shortName}.txt`;
    }
    return `chat-export-${shortName}.txt`;
  }

  // src/frontend/src/ui.js
  function createDetailsPanel(titleText) {
    const panel = document.createElement("details");
    panel.style.cssText = "position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #fff; border: 1px solid #ddd; border-radius: 0 0 10px 10px; font-family: sans-serif; font-size: 13px; box-shadow: 0 2px 10px rgba(0,0,0,0.12); min-width: 420px; max-width: calc(100% - 40px); max-height: calc(100vh - 20px); overflow-y: auto;";
    panel.open = true;
    const summary = document.createElement("summary");
    summary.style.cssText = "cursor: pointer; padding: 6px 10px; font-size: 12px; color: #555; background: #fafafa; display: flex; align-items: center; gap: 6px; user-select: none;";
    const arrow = document.createElement("span");
    arrow.textContent = "\u25B2";
    arrow.setAttribute("aria-hidden", "true");
    arrow.style.cssText = "font-size: 10px; color: #aaa;";
    const title = document.createElement("span");
    title.textContent = titleText;
    summary.appendChild(arrow);
    summary.appendChild(title);
    panel.appendChild(summary);
    panel.addEventListener("toggle", () => {
      arrow.textContent = panel.open ? "\u25B2" : "\u25BC";
    });
    return { panel, summary, arrow, title };
  }
  function createLabelInput(labelText, placeholder, value) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "display: flex; align-items: center; gap: 6px;";
    const inputId = `lbl-${labelText.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`;
    const label = document.createElement("label");
    label.textContent = labelText;
    label.htmlFor = inputId;
    label.style.cssText = "color: #777; font-size: 12px; width: 32px;";
    const input = document.createElement("input");
    input.type = "text";
    input.id = inputId;
    input.placeholder = placeholder;
    input.value = value;
    input.style.cssText = "border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 12px; width: 100px; outline: none;";
    wrap.appendChild(label);
    wrap.appendChild(input);
    return { wrap, input };
  }
  function createCheckboxToggle(labelText) {
    const wrap = document.createElement("label");
    wrap.style.cssText = "display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px; cursor: pointer;";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = false;
    input.style.cssText = "cursor: pointer;";
    const text = document.createElement("span");
    text.textContent = labelText;
    wrap.appendChild(input);
    wrap.appendChild(text);
    return { wrap, input };
  }
  function createAliasRows(initialRows = { You: "Youghurt", any: "Alpha" }) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
    const header = document.createElement("div");
    header.style.cssText = "display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px;";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.style.cssText = "cursor: pointer;";
    const label = document.createElement("span");
    label.textContent = "Alias";
    header.appendChild(checkbox);
    header.appendChild(label);
    const rows = document.createElement("div");
    rows.style.cssText = "display: flex; flex-direction: column; gap: 4px; padding-left: 22px;";
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "Add";
    addButton.style.cssText = "border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 12px; cursor: pointer; background: #f7f7f7;";
    const makeTextInput = (value, ariaLabel, disabled) => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.placeholder = value;
      input.setAttribute("aria-label", ariaLabel);
      input.disabled = Boolean(disabled);
      input.style.cssText = "border: 1px solid #ccc; border-radius: 4px; padding: 4px 6px; font-size: 12px; width: 100px; outline: none;";
      return input;
    };
    const validateName = (name) => {
      const cleaned = String(name || "").trim();
      if (!cleaned) return false;
      if (cleaned.length > 25) return false;
      if (/\d/.test(cleaned)) return false;
      const parts = cleaned.split(/\s+/);
      if (parts.length > 3) return false;
      return /^\p{L}[\p{L} .'\-_]{0,24}$/u.test(cleaned);
    };
    const createRow = (orig, alias, fixed) => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; align-items: center; gap: 4px;";
      row.className = "alias-row";
      const originalInput = makeTextInput(orig, "Original sender name", fixed);
      const aliasInput = makeTextInput(alias, "Alias name", false);
      const error = document.createElement("span");
      error.style.cssText = "color: red; font-size: 11px; display: none;";
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "\xD7";
      removeBtn.title = "Remove alias row";
      removeBtn.style.cssText = "border: none; background: transparent; color: #888; font-size: 14px; cursor: pointer; padding: 0;";
      if (fixed) removeBtn.style.display = "none";
      const validateRow = () => {
        const originalValue = originalInput.value.trim();
        const aliasValue = aliasInput.value.trim();
        const validOriginal = Boolean(originalValue && validateName(originalValue));
        const validAlias = Boolean(aliasValue && validateName(aliasValue));
        const valid = validOriginal && validAlias;
        originalInput.style.borderColor = validOriginal ? "#ccc" : "red";
        aliasInput.style.borderColor = validAlias ? "#ccc" : "red";
        if (!valid) {
          error.textContent = "Names must be 1-3 words, max 25 chars, no numbers.";
          error.style.display = "block";
        } else {
          error.style.display = "none";
        }
        return valid;
      };
      originalInput.addEventListener("blur", validateRow);
      aliasInput.addEventListener("blur", validateRow);
      removeBtn.addEventListener("click", () => {
        row.remove();
      });
      row.appendChild(originalInput);
      row.appendChild(aliasInput);
      row.appendChild(removeBtn);
      row.appendChild(error);
      rows.appendChild(row);
      return row;
    };
    const addRow = (orig, alias, fixed) => createRow(orig, alias, fixed);
    Object.entries(initialRows).forEach(([orig, alias]) => addRow(orig, alias, true));
    addButton.addEventListener("click", () => {
      addRow("", "", false);
    });
    checkbox.addEventListener("change", () => {
      rows.style.opacity = checkbox.checked ? "1" : "0.6";
    });
    const getAliasMap = () => {
      const map = {};
      Array.from(rows.querySelectorAll(".alias-row")).forEach((row) => {
        const inputs = row.querySelectorAll('input[type="text"]');
        if (inputs.length < 2) return;
        const original = inputs[0].value.trim();
        const aliasValue = inputs[1].value.trim();
        if (!original || !aliasValue) return;
        map[original] = aliasValue;
      });
      return map;
    };
    const validateAll = () => {
      let valid = true;
      Array.from(rows.querySelectorAll(".alias-row")).forEach((row) => {
        const inputs = row.querySelectorAll('input[type="text"]');
        if (inputs.length < 2) return;
        const originalValue = inputs[0].value.trim();
        const aliasValue = inputs[1].value.trim();
        const rowValid = Boolean(originalValue && aliasValue && validateName(originalValue) && validateName(aliasValue));
        if (!rowValid) {
          valid = false;
          inputs[0].style.borderColor = originalValue && validateName(originalValue) ? "#ccc" : "red";
          inputs[1].style.borderColor = aliasValue && validateName(aliasValue) ? "#ccc" : "red";
        }
      });
      return valid;
    };
    const setDetectedNames = (names) => {
      const nameSet = new Set(Array.from(names).map((n) => String(n).trim()).filter(Boolean));
      const existingRows = Array.from(rows.querySelectorAll(".alias-row"));
      existingRows.forEach((row) => {
        const inputs = row.querySelectorAll('input[type="text"]');
        if (inputs.length < 2) return;
        const rowName = inputs[0].value.trim();
        const isFixed = inputs[0].disabled;
        if (!isFixed && rowName && !nameSet.has(rowName)) {
          row.remove();
        }
      });
      nameSet.forEach((name) => {
        const found = Array.from(rows.querySelectorAll(".alias-row")).some((row) => {
          const inputs = row.querySelectorAll('input[type="text"]');
          return inputs.length >= 2 && inputs[0].value.trim() === name;
        });
        if (!found) {
          addRow(name, "", false);
        }
      });
    };
    const groupChatWrap = document.createElement("label");
    groupChatWrap.style.cssText = "display: flex; align-items: center; gap: 6px; color: #888; font-size: 11px; cursor: pointer; padding-left: 22px; margin-top: 4px;";
    groupChatWrap.title = "When checked, new names detected during scan are added as alias rows";
    const groupChatChk = document.createElement("input");
    groupChatChk.type = "checkbox";
    groupChatChk.checked = false;
    groupChatChk.style.cssText = "cursor: pointer;";
    const groupChatLabel = document.createElement("span");
    groupChatLabel.textContent = "Group chat";
    groupChatWrap.appendChild(groupChatChk);
    groupChatWrap.appendChild(groupChatLabel);
    wrap.appendChild(header);
    wrap.appendChild(rows);
    wrap.appendChild(addButton);
    wrap.appendChild(groupChatWrap);
    return { wrap, input: checkbox, getAliasMap, validateAll, setDetectedNames, groupChatChk };
  }
  function createLinkAction(labelText, onClick) {
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = labelText;
    link.style.cssText = "color: #0084ff; text-decoration: underline; font-size: 12px; cursor: pointer;";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      onClick(event);
    });
    return link;
  }
  function createButton(labelText, backgroundColor) {
    const button = document.createElement("button");
    button.textContent = labelText;
    button.style.cssText = `color: #fff; border: none; padding: 6px 12px; border-radius: 5px; font-size: 12px; cursor: pointer; background: ${backgroundColor};`;
    return button;
  }

  // src/frontend/src/index.js
  var import_alias_utils = __toESM(require_alias_utils(), 1);
  (function() {
    "use strict";
    const cleanupPending = sessionStorage.getItem("cleanupPending");
    if (cleanupPending === "true") {
      sessionStorage.removeItem("exportFrom");
      sessionStorage.removeItem("exportTo");
      sessionStorage.removeItem("exportFileName");
      sessionStorage.removeItem("cleanupPending");
    }
    const { panel, summary: panelSummary, arrow: panelArrow } = createDetailsPanel("Export Chat");
    panel.open = localStorage.getItem("chatExportPanelOpen") !== "false";
    panelSummary.setAttribute("aria-expanded", String(panel.open));
    panel.addEventListener("toggle", () => {
      panelArrow.textContent = panel.open ? "\u25B2" : "\u25BC";
      panelSummary.setAttribute("aria-expanded", String(panel.open));
      localStorage.setItem("chatExportPanelOpen", String(panel.open));
      if (!panel.open && actionBtn.dataset.scanning === "true") {
        stopRequested = true;
        if (scrollTimeout !== null) {
          clearTimeout(scrollTimeout);
          scrollTimeout = null;
        }
        setScanState("idle");
        noticeMsg.textContent = "Scan cancelled.";
      }
    });
    const instructions = document.createElement("div");
    instructions.style.cssText = "padding: 6px 10px; font-size: 11px; color: #666; background: #fafafa;";
    instructions.textContent = "Start at the bottom of the conversation";
    const notice = document.createElement("div");
    notice.style.cssText = "padding: 6px 10px; font-size: 12px; color: #333;";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    const noticeMsg = document.createElement("span");
    noticeMsg.textContent = "Ready.";
    const downloadBtn = createButton("Download .txt", "#27ae60");
    downloadBtn.style.cssText += " display: none; margin-left: 10px; vertical-align: middle;";
    const saveAgainLink = document.createElement("a");
    saveAgainLink.textContent = "Save again";
    saveAgainLink.href = "#";
    saveAgainLink.style.cssText = "display: none; margin-left: 8px; font-size: 11px; color: #27ae60; vertical-align: middle;";
    const cleanupLine = document.createElement("div");
    cleanupLine.style.cssText = "display: none; margin-top: 4px; font-size: 11px; color: #888;";
    notice.appendChild(noticeMsg);
    notice.appendChild(downloadBtn);
    notice.appendChild(saveAgainLink);
    notice.appendChild(cleanupLine);
    const body = document.createElement("div");
    body.style.cssText = "display: flex; gap: 10px; padding: 8px 10px; align-items: flex-end;";
    const leftCol = document.createElement("div");
    leftCol.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
    const { wrap: fromWrap, input: fromInput } = createLabelInput(
      "From:",
      "YYYY-MM-DD",
      sessionStorage.getItem("exportFrom") || (() => {
        const d = /* @__PURE__ */ new Date();
        d.setDate(d.getDate() - 3);
        return d.toISOString().slice(0, 10);
      })()
    );
    const { wrap: toWrap, input: toInput } = createLabelInput(
      "To:",
      "YYYY-MM-DD",
      sessionStorage.getItem("exportTo") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
    );
    const { wrap: fileNameWrap, input: fileNameInput } = createLabelInput(
      "File:",
      "Optional custom name",
      sessionStorage.getItem("exportFileName") || ""
    );
    const { wrap: startAtBottomWrap, input: startAtBottomChk } = createCheckboxToggle("Start at bottom");
    startAtBottomChk.checked = true;
    const actionBtn = createButton("Scan Messages", "#0084ff");
    const rightCol = document.createElement("div");
    rightCol.style.cssText = "display: flex; flex-direction: column; gap: 8px; min-width: 160px; padding-left: 10px;";
    const { wrap: includeCallsWrap, input: includeCallsChk } = createCheckboxToggle("Calls");
    const aliasDefaults = import_frontend_shared.default.aliasNames || { You: "Youghurt", any: "Alpha" };
    const { wrap: aliasWrap, input: aliasChk, getAliasMap, validateAll: validateAliasRows, setDetectedNames, groupChatChk } = createAliasRows(aliasDefaults);
    const { wrap: summaryWrap, input: summaryChk } = createCheckboxToggle("Summary");
    const { wrap: includeContentWrap, input: includeContentChk } = createCheckboxToggle("Content");
    const { wrap: rawLinkWrap, input: rawLinkChk } = createCheckboxToggle("Raw link");
    const { wrap: lengthWrap, input: lengthChk } = createCheckboxToggle("Length");
    function setAllChecked(state) {
      includeCallsChk.checked = state;
      aliasChk.checked = state;
      summaryChk.checked = state;
      includeContentChk.checked = state;
      rawLinkChk.checked = state;
      lengthChk.checked = state;
      selectAllLink.textContent = state ? "Uncheck all" : "Check all";
    }
    const selectAllLink = createLinkAction("Check all", () => {
      const allChecked = includeCallsChk.checked && aliasChk.checked && summaryChk.checked && includeContentChk.checked && rawLinkChk.checked && lengthChk.checked;
      setAllChecked(!allChecked);
    });
    leftCol.appendChild(fromWrap);
    leftCol.appendChild(toWrap);
    leftCol.appendChild(fileNameWrap);
    leftCol.appendChild(startAtBottomWrap);
    leftCol.appendChild(actionBtn);
    rightCol.appendChild(includeCallsWrap);
    rightCol.appendChild(aliasWrap);
    rightCol.appendChild(summaryWrap);
    rightCol.appendChild(includeContentWrap);
    rightCol.appendChild(rawLinkWrap);
    rightCol.appendChild(lengthWrap);
    rightCol.appendChild(selectAllLink);
    setAllChecked(true);
    body.appendChild(leftCol);
    body.appendChild(rightCol);
    panel.appendChild(panelSummary);
    panel.appendChild(notice);
    panel.appendChild(body);
    const termsNote = document.createElement("div");
    termsNote.style.cssText = "padding: 6px 10px 10px; font-size: 11px; color: #777;";
    const termsLabel = document.createTextNode("Terms: ");
    const termsLink = document.createElement("a");
    termsLink.href = "https://github.com/klipolis/fb-chat-export/blob/main/docs/user-guide/terms-and-conditions.md";
    termsLink.target = "_blank";
    termsLink.rel = "noreferrer noopener";
    termsLink.textContent = "docs/user-guide/terms-and-conditions.md";
    termsNote.appendChild(termsLabel);
    termsNote.appendChild(termsLink);
    panel.appendChild(termsNote);
    document.body.appendChild(panel);
    document.body.appendChild(instructions);
    function formatDate(raw) {
      const d = new Date(raw);
      if (isNaN(d)) return raw;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }
    function extractMessageParts(el) {
      const label = el.getAttribute("aria-label") || "";
      const parsedLabel = (0, import_aria_label_parser2.parseAriaLabel)(label);
      const rawDate = parsedLabel.date || "";
      const sender = parsedLabel.sender || "";
      const labelText = parsedLabel.message || "";
      const normalizedText = (labelText || el.innerText).replace(/\s+/g, " ").trim();
      const normalizedLabel = label.replace(/\s+/g, " ").trim().toLowerCase();
      const timerEl = el.querySelector('[role="timer"]');
      const timerText = timerEl ? timerEl.innerText : "";
      const hasImage = Boolean(el.querySelector("img"));
      const hasPlayButton = Boolean(el.querySelector('[aria-label="Play"]'));
      const anchor = el.querySelector("a[href]");
      const originalHref = anchor ? anchor.getAttribute("href") : null;
      const hasLink = Boolean(originalHref) || /https?:\/\/|www\./i.test(normalizedText) || /https?:\/\/|www\./i.test(normalizedLabel);
      const contentMeta = (0, import_message_metadata.getContentMeta)({
        fileName: "",
        ariaLabel: label,
        message: normalizedText,
        rawMeta: { duration: timerText || normalizedText, link: originalHref },
        hasImage,
        hasPlayButton,
        hasLink,
        timerText
      });
      return {
        rawDate,
        sender,
        text: contentMeta.text,
        link: contentMeta.link,
        originalHref,
        type: contentMeta.type,
        isCall: contentMeta.isCall,
        isImage: contentMeta.isImage,
        duration: contentMeta.duration,
        contentLength: contentMeta.contentLength
      };
    }
    fromInput.addEventListener("input", () => {
      fromInput.style.borderColor = "#ccc";
    });
    toInput.addEventListener("input", () => {
      toInput.style.borderColor = "#ccc";
    });
    [fromInput, toInput].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") actionBtn.click();
      });
    });
    includeContentChk.addEventListener("change", () => {
      rawLinkChk.disabled = !includeContentChk.checked;
      rawLinkChk.checked = rawLinkChk.checked && includeContentChk.checked;
      rawLinkWrap.style.opacity = includeContentChk.checked ? "1" : "0.6";
    });
    rawLinkChk.disabled = !includeContentChk.checked;
    rawLinkWrap.style.opacity = includeContentChk.checked ? "1" : "0.6";
    fileNameInput.addEventListener("input", () => {
      fileNameInput.style.borderColor = "#ccc";
    });
    let downloadRevokeTimeout = null;
    let scrollTimeout = null;
    let downloadHandler = null;
    let stopRequested = false;
    let countdownInterval = null;
    let cleanupCountdownInterval = null;
    function setScanState(state) {
      if (state === "scanning") {
        actionBtn.textContent = "Stop Scan";
        actionBtn.style.background = "#e74c3c";
        actionBtn.dataset.scanning = "true";
        fromInput.disabled = toInput.disabled = true;
      } else {
        actionBtn.textContent = "Scan Messages";
        actionBtn.style.background = "#0084ff";
        actionBtn.dataset.scanning = "false";
        fromInput.disabled = toInput.disabled = false;
      }
    }
    actionBtn.addEventListener("click", () => {
      if (actionBtn.dataset.scanning === "true") {
        stopRequested = true;
        return;
      }
      const fromDate = fromInput.value.trim() ? parseLocalDate(fromInput.value.trim()) : null;
      const toDate = (() => {
        if (!toInput.value.trim()) return null;
        const d = parseLocalDate(toInput.value.trim());
        if (!isNaN(d)) d.setHours(23, 59, 59);
        return d;
      })();
      if (fromDate !== null && isNaN(fromDate)) {
        fromInput.style.borderColor = "red";
        noticeMsg.textContent = "Invalid \u201CFrom\u201D date \u2014 use YYYY-MM-DD format.";
        fromInput.focus();
        return;
      }
      if (toDate !== null && isNaN(toDate)) {
        toInput.style.borderColor = "red";
        noticeMsg.textContent = 'Invalid "To" date \u2014 use YYYY-MM-DD format.';
        toInput.focus();
        return;
      }
      if (aliasChk.checked && !validateAliasRows()) {
        noticeMsg.textContent = "Alias fields contain invalid names.";
        return;
      }
      const customBaseName = fileNameInput.value.trim();
      let customFileName = "";
      if (customBaseName) {
        const sanitized = sanitizeFileNamePart(customBaseName);
        customFileName = `${sanitized}.txt`;
        sessionStorage.setItem("exportFileName", customBaseName);
      }
      fromInput.style.borderColor = toInput.style.borderColor = "#ccc";
      if (downloadRevokeTimeout !== null) {
        clearTimeout(downloadRevokeTimeout);
        downloadRevokeTimeout = null;
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      if (cleanupCountdownInterval) {
        clearInterval(cleanupCountdownInterval);
        cleanupCountdownInterval = null;
      }
      stopRequested = false;
      sessionStorage.setItem("exportFrom", fromInput.value.trim());
      sessionStorage.setItem("exportTo", toInput.value.trim());
      setScanState("scanning");
      downloadBtn.style.display = "none";
      saveAgainLink.style.display = "none";
      noticeMsg.textContent = "Scanning: 0";
      const collected = /* @__PURE__ */ new Map();
      const detectedSenders = /* @__PURE__ */ new Set();
      let reachedFromDate = false;
      function collectVisible() {
        const allMessages = document.querySelectorAll('[aria-roledescription="message"]');
        allMessages.forEach((el) => {
          const ariaLabel = el.getAttribute("aria-label");
          const timeEl = el.querySelector("time[datetime]");
          const timeStamp = timeEl ? timeEl.getAttribute("datetime") : "";
          const key = ariaLabel ? `${ariaLabel}|${timeStamp}` : null;
          if (!key || collected.has(key)) return;
          const {
            rawDate,
            sender,
            text,
            link,
            originalHref,
            type,
            isCall,
            isImage,
            duration,
            contentLength
          } = extractMessageParts(el);
          if (!rawDate || !sender) return;
          detectedSenders.add(sender);
          const resolvedRaw = timeEl ? timeEl.getAttribute("datetime") : resolveRelativeDate(rawDate);
          const msgDate = /^\d{4}-\d{2}-\d{2}$/.test(resolvedRaw) ? (() => {
            const [y, m, d] = resolvedRaw.split("-").map(Number);
            return new Date(y, m - 1, d);
          })() : new Date(resolvedRaw);
          const displayDate = formatDate(resolvedRaw);
          const authorLabel = (() => {
            if (!aliasChk.checked) return sender;
            const aliasMap2 = getAliasMap();
            const normalizedSender = String(sender).trim();
            return aliasMap2[normalizedSender] || aliasMap2[normalizedSender.toLowerCase()] || aliasMap2[normalizedSender.toUpperCase()] || aliasMap2.any || sender;
          })();
          const callMinutes = (0, import_export_formatter.durationToMinutes)(duration);
          if (!includeCallsChk.checked && isCall) return;
          if (fromDate && !isNaN(msgDate) && msgDate < fromDate) {
            reachedFromDate = true;
            return;
          }
          if (toDate && !isNaN(msgDate) && msgDate > toDate) return;
          const aliasMap = aliasChk.checked ? getAliasMap() : {};
          const aliasedText = aliasChk.checked ? (0, import_alias_utils.applyAliasToText)(text, aliasMap, sender) : text;
          const aliasedContent = aliasChk.checked ? (0, import_alias_utils.applyAliasToText)(
            includeContentChk.checked ? rawLinkChk.checked && type === "link" ? (0, import_message_metadata.stripTrackingParams)(link || originalHref || aliasedText) || aliasedText : originalHref || aliasedText : aliasedText,
            aliasMap,
            sender
          ) : includeContentChk.checked ? rawLinkChk.checked && type === "link" ? (0, import_message_metadata.stripTrackingParams)(link || originalHref || text) || text : originalHref || text : text;
          const displayType = type === "reaction" && text ? "text" : type;
          const lineEntry = {
            fileType: displayType,
            semanticType: type,
            dateText: displayDate,
            sender: authorLabel,
            duration,
            content: aliasedContent,
            contentLength
          };
          const finalLine = (0, import_export_formatter.formatLine)(lineEntry, {
            includeContent: includeContentChk.checked,
            includeLength: lengthChk.checked
          });
          collected.set(key, {
            ts: isNaN(msgDate) ? 0 : msgDate.getTime(),
            sender: authorLabel,
            date: msgDate,
            type,
            isCall,
            isImage,
            callMinutes,
            wordCount: isCall || isImage ? 0 : text ? text.split(/\s+/).filter(Boolean).length : 0,
            line: finalLine,
            exportEntry: lineEntry
          });
        });
      }
      function findScrollContainer() {
        const firstMsg = document.querySelector('[aria-roledescription="message"]');
        if (!firstMsg) return null;
        let el = firstMsg.parentElement;
        while (el) {
          if (el.scrollHeight > el.clientHeight + 10) return el;
          el = el.parentElement;
        }
        return null;
      }
      function getLatestVisibleMessageDate() {
        const dates = Array.from(document.querySelectorAll('[aria-roledescription="message"]')).map((el) => {
          const { rawDate } = extractMessageParts(el);
          const timeEl = el.querySelector("time[datetime]");
          const resolvedRaw = timeEl ? timeEl.getAttribute("datetime") : resolveRelativeDate(rawDate);
          const date = new Date(resolvedRaw);
          return isNaN(date) ? null : date;
        }).filter(Boolean);
        if (!dates.length) return null;
        return new Date(Math.max(...dates.map((d) => d.getTime())));
      }
      collectVisible();
      const scroller = findScrollContainer();
      if (!scroller) {
        noticeMsg.textContent = "Could not find the message list. Make sure a conversation is open.";
        setScanState("idle");
        return;
      }
      if (startAtBottomChk.checked) {
        const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        if (toDate) {
          const latestVisible = getLatestVisibleMessageDate();
          if (latestVisible && latestVisible > toDate) {
            scroller.scrollTop = maxScrollTop;
          }
        } else {
          scroller.scrollTop = maxScrollTop;
        }
      }
      const scanStartedAt = Date.now();
      let stableCount = 0;
      function scanStep() {
        try {
          collectVisible();
          const elapsedSec = Math.round((Date.now() - scanStartedAt) / 1e3);
          const scrollPct = scroller.scrollHeight > 0 ? Math.round((1 - scroller.scrollTop / scroller.scrollHeight) * 100) : 0;
          noticeMsg.textContent = `Scanning... ${collected.size} collected (${elapsedSec}s, ~${scrollPct}% back).`;
          if (stopRequested || reachedFromDate || scroller.scrollTop <= 0 && stableCount >= 3) {
            let setupDownload = function(downloadUrl) {
              noticeMsg.textContent = `${doneLabel}: ${messages.length} messages | ${displayPersonName} | ${fromLabel} - ${toLabel} | ${elapsed}`;
              let downloadedOnce = false;
              let cleanupCountdown = 180;
              function triggerDownload(url) {
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
              }
              function cleanupExport() {
                if (downloadUrl && downloadUrl.startsWith("blob:")) {
                  URL.revokeObjectURL(downloadUrl);
                }
                downloadUrl = null;
                if (countdownInterval) {
                  clearInterval(countdownInterval);
                  countdownInterval = null;
                }
                saveAgainLink.style.display = "none";
                downloadBtn.style.display = "none";
                cleanupLine.style.display = "none";
                noticeMsg.textContent = "Ready.";
                if (downloadHandler) downloadBtn.removeEventListener("click", downloadHandler);
                downloadHandler = null;
                setScanState("idle");
              }
              downloadBtn.style.display = "";
              downloadBtn.removeAttribute("aria-disabled");
              downloadBtn.style.opacity = "";
              downloadBtn.style.cursor = "";
              downloadBtn.textContent = "Download";
              saveAgainLink.style.display = "none";
              saveAgainLink.onclick = null;
              cleanupLine.style.display = "";
              if (downloadHandler) downloadBtn.removeEventListener("click", downloadHandler);
              if (countdownInterval) clearInterval(countdownInterval);
              countdownInterval = setInterval(() => {
                cleanupCountdown--;
                if (cleanupCountdown <= 0) {
                  clearInterval(countdownInterval);
                  countdownInterval = null;
                  cleanupLine.textContent = "Cleaning...";
                  setTimeout(cleanupExport, 800);
                } else {
                  cleanupLine.textContent = `Cleanup in ${cleanupCountdown}s`;
                }
              }, 1e3);
              downloadHandler = () => {
                if (downloadBtn.getAttribute("aria-disabled") === "true") return;
                downloadBtn.setAttribute("aria-disabled", "true");
                downloadBtn.style.opacity = "0.5";
                downloadBtn.style.cursor = "not-allowed";
                downloadBtn.textContent = "Downloaded";
                triggerDownload(downloadUrl);
                if (!downloadedOnce) {
                  downloadedOnce = true;
                  if (cleanupCountdown > 70) cleanupCountdown = 70;
                } else {
                  if (cleanupCountdown > 60) cleanupCountdown = 60;
                }
                saveAgainLink.style.display = "";
                saveAgainLink.textContent = "Download again";
                saveAgainLink.onclick = (e) => {
                  e.preventDefault();
                  triggerDownload(downloadUrl);
                  if (cleanupCountdown > 60) cleanupCountdown = 60;
                  saveAgainLink.textContent = "Download again";
                };
              };
              downloadBtn.addEventListener("click", downloadHandler);
              setScanState("idle");
            };
            actionBtn.dataset.scanning = "false";
            if (aliasChk.checked && groupChatChk.checked) {
              setDetectedNames(detectedSenders);
            }
            const sortedEntries = Array.from(collected.values()).sort((a, b) => a.ts - b.ts);
            const messages = sortedEntries.map((e) => e.line);
            if (messages.length === 0) {
              noticeMsg.textContent = "No messages found.";
              downloadBtn.style.display = "none";
              saveAgainLink.style.display = "none";
              setScanState("idle");
              return;
            }
            const summaryText = summaryChk.checked ? (0, import_export_summary.buildSummary)(sortedEntries, { useMessageLabel: true }) : "";
            const messageTypes = Array.from(
              new Set(sortedEntries.map((entry) => entry.type).filter(Boolean))
            ).sort();
            const headerText = (0, import_export_formatter.formatExportHeader)({
              method: "browser",
              messageTypes,
              exportOptions: {
                calls: includeCallsChk.checked,
                alias: aliasChk.checked,
                summary: summaryChk.checked,
                content: includeContentChk.checked,
                rawLink: rawLinkChk.checked,
                length: lengthChk.checked
              },
              aliasMap: getAliasMap()
            });
            const blob = new Blob([headerText + summaryText + messages.join("")], {
              type: "text/plain"
            });
            const fromLabel = fromInput.value.trim() || "start";
            const toLabel = toInput.value.trim() || "end";
            const elapsedMs = Date.now() - scanStartedAt;
            const elapsed = elapsedMs < 6e4 ? `${(elapsedMs / 1e3).toFixed(1)} seconds` : `${(elapsedMs / 6e4).toFixed(2)} minutes`;
            const displayPersonName = getDisplayPersonName();
            const fileName = customFileName || formatExportFileName(void 0, {
              fromDate: fromInput.value.trim() || "",
              toDate: toInput.value.trim() || ""
            });
            const doneLabel = stopRequested ? "Stopped" : "Done";
            try {
              setupDownload(URL.createObjectURL(blob));
            } catch (_) {
              const reader = new FileReader();
              reader.onload = (e) => setupDownload(e.target.result);
              reader.onerror = () => {
                noticeMsg.textContent = "Could not prepare download.";
                setScanState("idle");
              };
              reader.readAsDataURL(blob);
            }
            return;
          }
          const nextTop = Math.max(0, scroller.scrollTop - Math.max(800, scroller.clientHeight - 100));
          if (Math.abs(nextTop - scroller.scrollTop) < 5) {
            stableCount += 1;
          } else {
            stableCount = 0;
            scroller.scrollTop = nextTop;
          }
          const delay = 500 + Math.random() * 500;
          scrollTimeout = setTimeout(scanStep, delay);
        } catch (err) {
          noticeMsg.textContent = "An unexpected error occurred. Please try again.";
          setScanState("idle");
          console.error(err);
        }
      }
      scanStep();
    });
  })();
})();
