// ==UserScript==
// @name         Chat Exporter
// @namespace    http://tampermonkey.net/
// @version      5.4.0
// @description  Export chat conversations to text file
// @match        https://www.facebook.com/messages/*
// @grant        none
// ==/UserScript==


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

  // src/shared/rules/selectors.js
  var require_selectors = __commonJS({
    "src/shared/rules/selectors.js"(exports, module) {
      module.exports = {
        message: '[aria-roledescription="message"]',
        messageLabel: "[aria-label]",
        messageText: ".html-div",
        boldText: ".html-b",
        italicText: ".html-i",
        image: ".html-img"
      };
    }
  });

  // src/shared/rules/message-rules.js
  var require_message_rules = __commonJS({
    "src/shared/rules/message-rules.js"(exports, module) {
      module.exports = [
        {
          type: "unsent",
          matchFile: /^deleted\.html$/i,
          matchLabel: /deleted/i
        },
        {
          type: "audio-call",
          matchFile: /^audio-call\.html$/i,
          matchLabel: /audio call/i
        },
        {
          type: "image",
          matchFile: /^image\.html$/i,
          matchLabel: /image/i
        },
        {
          type: "link",
          matchFile: /^link-embed-no-text\.html$/i,
          matchLabel: /open attachment|href|https?:\/\/|open link|view link|download|attachment|pinned location/i
        },
        {
          type: "link",
          matchFile: /^link-text\.html$/i,
          matchLabel: /open attachment|href|https?:\/\/|open link|view link|download|attachment|pinned location/i
        },
        {
          type: "missed-call",
          matchFile: /^missed-audio-call\.html$/i,
          matchLabel: /missed[- ]call/i
        },
        {
          type: "missed-call",
          matchFile: /^missed-video-call\.html$/i,
          matchLabel: /missed[- ]call/i
        },
        {
          type: "text",
          matchFile: /^text-image-replied\.html$/i,
          matchLabel: /reply/i
        },
        {
          type: "text",
          matchFile: /^text-replied\.html$/i,
          matchLabel: /reply/i
        },
        {
          type: "video-call",
          matchFile: /^video-call\.html$/i,
          matchLabel: /video[- ]call/i
        },
        {
          type: "voice-message",
          matchFile: /^voice-note\.html$/i,
          matchLabel: /voice(?:[- ]message|[- ]note)|audio(?:[- ]message|[- ]note)/i
        },
        {
          type: "sticker",
          matchFile: /^sticker\.html$/i,
          matchLabel: /sticker/i
        },
        {
          type: "gif",
          matchFile: /^(?:animated-)?gif\.html$/i,
          matchLabel: /\bgif\b/i
        },
        {
          type: "poll",
          matchFile: /^poll\.html$/i,
          matchLabel: /\bpoll\b/i
        },
        {
          type: "reaction",
          matchFile: /^reaction\.html$/i,
          matchLabel: /👍|❤|😂|😮|😢|👏|😠|like button|thumbs up/i
        },
        {
          type: "you-text",
          matchFile: /you - text message/i,
          matchLabel: /you:/i
        },
        {
          type: "text",
          matchFile: /^text\.html$/i,
          matchLabel: /^(?!.*\b(?:link|reply|unsent|video call|voice message|voice note|missed call)\b).*/i
        }
      ];
    }
  });

  // src/shared/rules/index.js
  var require_rules = __commonJS({
    "src/shared/rules/index.js"(exports, module) {
      var selectors = require_selectors();
      var messageRules = require_message_rules();
      module.exports = {
        selectors,
        messageRules
      };
    }
  });

  // src/shared/aria-label-parser.js
  var require_aria_label_parser = __commonJS({
    "src/shared/aria-label-parser.js"(exports, module) {
      function normalizeLabel(text) {
        return String(text || "").replace(/\s+/g, " ").trim();
      }
      function isValidSender(value) {
        if (!/^[A-Za-z][A-Za-z .'-]{0,80}$/i.test(value)) return false;
        if (/\d/.test(value)) return false;
        return value.trim().split(/\s+/).length <= 2;
      }
      function splitSenderAndMessage(value) {
        const text = normalizeLabel(value);
        const firstWordMatch = text.match(/^([A-Za-z][A-Za-z .'-]{0,80}?)(?:\s+([\s\S]*))?$/);
        if (!firstWordMatch) return null;
        const sender = normalizeLabel(firstWordMatch[1]);
        const message = normalizeLabel(firstWordMatch[2] || "");
        if (!isValidSender(sender)) return null;
        return { sender, message };
      }
      function findValidDatePrefix(text) {
        const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
        let candidate = "";
        for (let i = 0; i < Math.min(parts.length, 3); i += 1) {
          candidate = candidate ? `${candidate}, ${parts[i]}` : parts[i];
          if (normalizeDateToIso3(candidate)) return candidate;
        }
        return null;
      }
      function parseAriaLabel2(ariaLabel) {
        const label = normalizeLabel(ariaLabel).replace(/\s*,\s*/g, ", ");
        let match;
        match = label.match(/^At\s+(.+?),\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+[-–—]\s*([\s\S]*)$/i);
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
            const hasInlineSenderColon = tailParts.slice(1, -1).some((p) => /^[A-Za-z][A-Za-z .'-]{0,40}:\s/.test(p));
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
            const inlineMatch = rest.match(/^([A-Za-z][A-Za-z .'-]{0,40}):\s*([\s\S]*)$/);
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
        match = label.match(/^(.+?),\s*([^:]+):\s*([\s\S]*)$/i);
        if (match && isValidSender(match[2])) {
          return {
            date: match[1].trim(),
            sender: match[2].trim(),
            message: match[3].trim()
          };
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
        const colonIndex = label.indexOf(":");
        return {
          date: null,
          sender: null,
          message: colonIndex >= 0 ? label.slice(colonIndex + 1).trim() : label
        };
      }
      function normalizeDateToSimple(dateString) {
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
        const now = /* @__PURE__ */ new Date();
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
      function normalizeDateToIso3(dateString) {
        if (!dateString) return null;
        const normalized = normalizeDateToSimple(dateString);
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
      module.exports = {
        parseAriaLabel: parseAriaLabel2,
        normalizeDateToSimple,
        normalizeDateToIso: normalizeDateToIso3,
        normalizeLabel,
        isValidSender,
        findValidDatePrefix
      };
    }
  });

  // src/shared/message-metadata.js
  var require_message_metadata = __commonJS({
    "src/shared/message-metadata.js"(exports, module) {
      var { messageRules } = require_rules();
      var { parseAriaLabel: parseAriaLabel2, normalizeDateToSimple, normalizeLabel } = require_aria_label_parser();
      function normalizeDuration2(text) {
        if (!text) return null;
        const normalized = String(text).trim();
        const suffix = normalized.match(/\b(?:am|pm)\b/i);
        const formatFromSeconds = (totalSeconds) => {
          const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
          const hours = Math.floor(safeSeconds / 3600);
          const minutes = Math.floor(safeSeconds % 3600 / 60);
          const seconds = safeSeconds % 60;
          if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} mins`;
          }
          return `${minutes}:${String(seconds).padStart(2, "0")} mins`;
        };
        const hhmmss = normalized.match(/^(\d+):(\d{2}):(\d{2})(?!\s*(?:am|pm)\b)/i);
        if (hhmmss && !suffix) {
          const totalSeconds = Number(hhmmss[1]) * 3600 + Number(hhmmss[2]) * 60 + Number(hhmmss[3]);
          return formatFromSeconds(totalSeconds);
        }
        const hhmm = normalized.match(/^(\d+):(\d{2})(?!\s*(?:am|pm)\b)/i);
        if (hhmm && !suffix) {
          const totalSeconds = Number(hhmm[1]) * 60 + Number(hhmm[2]);
          return formatFromSeconds(totalSeconds);
        }
        const minMatch = normalized.match(/(\d+(?:\.\d+)?)\s*min(?:s)?/i);
        if (minMatch) {
          const totalSeconds = parseFloat(minMatch[1]) * 60;
          return formatFromSeconds(totalSeconds);
        }
        const secMatch = normalized.match(/(\d+)\s*sec/i);
        if (secMatch) {
          return formatFromSeconds(parseInt(secMatch[1], 10));
        }
        return null;
      }
      function normalizeFacebookRedirect(url) {
        try {
          const parsed = new URL(url);
          const host = parsed.hostname.toLowerCase();
          const path = parsed.pathname.toLowerCase();
          const isFacebookRedirectHost = /(^|\.)facebook\.com$|(^|\.)messenger\.com$/.test(host);
          const isRedirectPath = path.includes("/l.php") || path.includes("/flx/warn/");
          if (!isFacebookRedirectHost || !isRedirectPath) return url;
          const candidate = parsed.searchParams.get("u") || parsed.searchParams.get("url") || parsed.searchParams.get("q");
          if (!candidate) return url;
          const decoded = decodeURIComponent(candidate);
          return /^https?:\/\//i.test(decoded) ? decoded : url;
        } catch {
          const redirectMatch = url.match(
            /https?:\/\/(?:l\.facebook\.com|l\.m\.facebook\.com|l\.messenger\.com|l\.m\.messenger\.com)\/l\.php\?(?:[^#]*?)(?:u|url|q)=([^&#]+)/i
          );
          if (!redirectMatch) return url;
          try {
            const decoded = decodeURIComponent(redirectMatch[1]);
            return /^https?:\/\//i.test(decoded) ? decoded : url;
          } catch {
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
        return normalizeFacebookRedirect(rawUrl);
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
        let type = normalizeContentType(rule.type || "text");
        const rawLink = rawMeta.link || extractLink(normalizedText) || extractLink(normalizedLabel) || null;
        const link = rawLink ? normalizeFacebookRedirect(rawLink) : null;
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
        const imageMatch = hasImage && (imageKeyword.test(normalizedText) || imageKeyword.test(normalizedLabel)) || imageKeyword.test(normalizedText) || imageKeyword.test(normalizedLabel);
        if (!fileTypeLocked) {
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
              type = "voice-message";
            }
          } else if (explicitLink) {
            type = "link";
          } else if (voiceMatch) {
            type = "voice-message";
          } else if (imageMatch) {
            type = "image";
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
        } else if (type === "voice-message") {
          contentText = "voice message";
        } else if (type === "sticker") {
          contentText = "sticker";
        } else if (type === "gif") {
          contentText = "gif";
        } else if (type === "reaction") {
          contentText = contentText;
        } else if (type === "image") {
          contentText = "image sent";
        } else if (type === "video-call" || type === "audio-call" || type === "missed-call") {
          const hasCallPhrase = /\bcall\b/i.test(normalizedText);
          contentText = hasCallPhrase ? normalizedText : type.replace(/-/g, " ");
        }
        const timedTypes = /* @__PURE__ */ new Set(["voice-message", "video-call", "audio-call"]);
        const noLengthTypes = /* @__PURE__ */ new Set(["image", "missed-call", "unsent", "sticker", "gif", "reaction", ...timedTypes]);
        const duration = timedTypes.has(type) ? rawDuration : null;
        const linkHasTextContent = type === "link" && (isLinkTextFile || isLinkTextLikeLive) && Boolean(normalizedText) && !linkOnlyText;
        const shouldOmitLength = noLengthTypes.has(type) || type === "link" && !linkHasTextContent;
        const contentLength = shouldOmitLength ? void 0 : `${contentText.length} chars`;
        return {
          type,
          text: contentText,
          contentLength,
          link: resolvedLink || void 0,
          voiceDurationSource: rawMeta.duration ? "timer" : timerText ? "label" : void 0,
          isCall: type === "video-call" || type === "missed-call" || type === "audio-call",
          isImage: type === "image" || type === "sticker" || type === "gif",
          duration
        };
      }
      module.exports = {
        parseAriaLabel: parseAriaLabel2,
        normalizeDateToSimple,
        normalizeLabel,
        normalizeDuration: normalizeDuration2,
        extractLink,
        extractPinnedLocationLink,
        chooseRule,
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
          "link-embed-no-text",
          "link-text",
          "missed-audio-call",
          "missed-video-call",
          "text-image-replied",
          "text-replied",
          "text",
          "video-call",
          "voice-note"
        ],
        patterns: {
          entryLine: "^\\[\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}\\]\\s[^:]+:\\s[^/]+(?:\\s/\\s.*)?$",
          duration: "\\d+:\\d{2}(?::\\d{2})?\\s+mins",
          totalSummaryTitle: "^Total Summary$",
          totalLine: "^\\d+\\s+(?:message|messages)\\s*/\\s*\\d+\\s+(?:day|days)$",
          roughTextLine: "^~\\s+\\d+\\s+text;$",
          roughImagesLine: "^~\\s+\\d+\\s+images$",
          roughCallsLine: "^~\\s+\\d+\\s+calls\\s+\\d+\\s+mins$",
          personSummaryTitle: "^(Alpha|Youghurt) Summary$"
        },
        summaryConcept: {
          totalSummaryTitle: "Total Summary",
          roughPrefix: "~",
          personSummarySuffix: " Summary"
        },
        exports: [
          {
            fileName: "fb-chats-export-content-on.txt",
            includeContent: true,
            includeSummary: true
          },
          {
            fileName: "fb-chats-export-content-off.txt",
            includeContent: false,
            includeSummary: false
          }
        ]
      };
    }
  });

  // src/shared/export-summary.js
  var require_export_summary = __commonJS({
    "src/shared/export-summary.js"(exports, module) {
      function formatDayKey(date) {
        if (!(date instanceof Date) || isNaN(date)) return "unknown";
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      }
      var { summaryConcept } = require_export_config();
      var TOTAL_SUMMARY_TITLE = summaryConcept.totalSummaryTitle || "Total Summary";
      var ROUGH_PREFIX = summaryConcept.roughPrefix || "~";
      var PERSON_SUMMARY_SUFFIX = summaryConcept.personSummarySuffix || " Summary";
      function isIgnoredForIndividualCount(entry) {
        const type = String(entry.type || entry.fileType || "").toLowerCase();
        return ["unsent", "deleted", "missed-call", "missed-audio-call", "missed-video-call"].includes(
          type
        );
      }
      function isMissedCall(entry) {
        const type = String(entry.type || entry.fileType || "").toLowerCase();
        return ["missed-call", "missed-audio-call", "missed-video-call"].includes(type);
      }
      function isCountedCall(entry) {
        const type = String(entry.type || entry.fileType || "").toLowerCase();
        return ["audio-call", "video-call", "voice-note", "voice-message"].includes(type);
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
                callMinutes: 0
              }
            },
            participants: []
          };
        }
        const totals = /* @__PURE__ */ new Map();
        const allDays = /* @__PURE__ */ new Set();
        entries.forEach((entry) => {
          const sender = entry.sender || "Unknown";
          const dayKey = formatDayKey(entry.date);
          allDays.add(dayKey);
          const data = totals.get(sender) || {
            count: 0,
            days: /* @__PURE__ */ new Set(),
            calls: 0,
            minutes: 0,
            images: 0
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
          selectedParticipants = options.fixedParticipants.slice(0, 2);
          while (selectedParticipants.length < 2) {
            selectedParticipants.push(`Unknown ${selectedParticipants.length + 1}`);
          }
        } else {
          const participantNames = [];
          entries.forEach((entry) => {
            if (!participantNames.includes(entry.sender)) {
              participantNames.push(entry.sender);
            }
          });
          selectedParticipants = participantNames.slice(0, 2);
          while (selectedParticipants.length < 2) {
            selectedParticipants.push(`Unknown ${selectedParticipants.length + 1}`);
          }
        }
        const participantSummaries = selectedParticipants.map((name) => {
          const participantEntries = entries.filter((entry) => (entry.sender || "Unknown") === name);
          const includedEntries = participantEntries.filter(
            (entry) => !isIgnoredForIndividualCount(entry)
          );
          const participantDays = /* @__PURE__ */ new Set();
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
            participantMinutes
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
              callMinutes: totalCallMinutes
            }
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
              callMinutes: summary.participantMinutes
            }
          }))
        };
      }
      function buildSummary2(entries = [], options = {}) {
        if (!entries.length) return "";
        const summary = buildSummaryData(entries, options);
        const useMessageLabel = Boolean(options.useMessageLabel);
        const totalMessageLabel = useMessageLabel ? summary.total.messages === 1 ? "message" : "messages" : summary.total.messages === 1 ? "post" : "posts";
        const totalDayLabel = useMessageLabel ? summary.total.days === 1 ? "day" : "days" : "days";
        const roughTextLabel = "text;";
        const detailLines = [
          summary.total.title,
          `${summary.total.messages} ${totalMessageLabel} / ${summary.total.days} ${totalDayLabel}`,
          `${ROUGH_PREFIX} ${summary.total.rough.text} ${roughTextLabel}`,
          `${ROUGH_PREFIX} ${summary.total.rough.images} images`,
          `${ROUGH_PREFIX} ${summary.total.rough.calls} calls ${summary.total.rough.callMinutes} mins`,
          ""
        ];
        summary.participants.forEach((participant) => {
          const participantMessageLabel = useMessageLabel ? participant.messages === 1 ? "message" : "messages" : participant.messages === 1 ? "post" : "posts";
          const participantDayLabel = useMessageLabel ? participant.days === 1 ? "day" : "days" : "days";
          const participantRoughTextLabel = "text;";
          detailLines.push(participant.title);
          detailLines.push(
            `${participant.messages} ${participantMessageLabel} / ${participant.days} ${participantDayLabel}`
          );
          detailLines.push(`${ROUGH_PREFIX} ${participant.rough.text} ${participantRoughTextLabel}`);
          detailLines.push(`${ROUGH_PREFIX} ${participant.rough.images} images`);
          detailLines.push(
            `${ROUGH_PREFIX} ${participant.rough.calls} calls ${participant.rough.callMinutes} mins`
          );
          detailLines.push("");
        });
        detailLines.push("---");
        return detailLines.join("\n") + "\n";
      }
      module.exports = {
        buildSummary: buildSummary2,
        buildSummaryData
      };
    }
  });

  // src/shared/export-formatter.js
  var require_export_formatter = __commonJS({
    "src/shared/export-formatter.js"(exports, module) {
      var { normalizeDuration: normalizeDuration2 } = require_message_metadata();
      var { normalizeDateToIso: normalizeDateToIso3 } = require_aria_label_parser();
      var { buildSummary: buildSummary2, buildSummaryData } = require_export_summary();
      function formatExportHeader2({ method, messageTypes }) {
        const types = messageTypes.map((type) => `- ${type}`).join("\n");
        return `Method: ${method}
Message types:
${types}
---

`;
      }
      function buildExportText(lines, headerLines = "") {
        return `${headerLines}${lines.join("")}`;
      }
      function formatDate(raw) {
        let dateValue = raw;
        if (typeof raw === "string") {
          try {
            dateValue = normalizeDateToIso3(raw) || raw;
          } catch {
            dateValue = raw;
          }
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
        const dateText = entry.dateText || "unknown";
        const sender = entry.sender || "Unknown";
        const parts = [entry.fileType];
        if (entry.duration) {
          const ensureNormalized = normalizeDuration2(entry.duration) || entry.duration;
          parts.push(ensureNormalized);
        }
        if (includeLength && entry.contentLength) parts.push(entry.contentLength);
        const base = `[${dateText}] ${sender}: ${parts.join(" ")}`;
        const contentTypes = /* @__PURE__ */ new Set(["text", "link"]);
        const shouldShowTextContent = includeContent && contentTypes.has(entry.semanticType) && entry.content;
        if (shouldShowTextContent) {
          return `${base} / ${entry.content}
`;
        }
        return `${base}
`;
      }
      function formatSummarySection(entries = [], options = {}) {
        const summaryEntries = entries.map((entry) => {
          const fileType = String(entry.fileType || "").toLowerCase();
          const isCall = [
            "audio-call",
            "video-call",
            "voice-note",
            "missed-audio-call",
            "missed-video-call"
          ].includes(fileType);
          const isTimedCall = ["audio-call", "video-call", "voice-note"].includes(fileType);
          return {
            sender: entry.sender,
            date: Number.isFinite(entry.ts) ? new Date(entry.ts) : /* @__PURE__ */ new Date(NaN),
            type: fileType,
            isCall,
            isImage: fileType === "image",
            callMinutes: isTimedCall ? durationToMinutes(entry.duration) : 0
          };
        });
        return buildSummary2(summaryEntries, {
          fixedParticipants: options.fixedParticipants || ["Alpha", "Youghurt"],
          useMessageLabel: Boolean(options.useMessageLabel)
        });
      }
      function durationToMinutes(duration) {
        if (!duration) return 0;
        const normalized = normalizeDuration2(duration) || duration;
        const hms = String(normalized).match(/^(\d+):(\d{2}):(\d{2})\s+mins$/i);
        const ms = String(normalized).match(/^(\d+):(\d{2})\s+mins$/i);
        const mins = String(normalized).match(/^(\d+)\s+mins$/i);
        if (hms) {
          return Number(hms[1]) * 60 + Number(hms[2]) + Math.ceil(Number(hms[3]) / 60);
        }
        if (ms) {
          return Number(ms[1]) + Math.ceil(Number(ms[2]) / 60);
        }
        if (mins) {
          return Number(mins[1]);
        }
        return 0;
      }
      module.exports = {
        formatExportHeader: formatExportHeader2,
        buildExportText,
        formatDate,
        formatLine: formatLine2,
        formatSummarySection,
        buildSummaryData
      };
    }
  });

  // src/frontend/src/index.js
  var import_message_metadata = __toESM(require_message_metadata());
  var import_aria_label_parser2 = __toESM(require_aria_label_parser());
  var import_export_summary = __toESM(require_export_summary());
  var import_export_formatter = __toESM(require_export_formatter());

  // src/shared/frontend-utils.js
  var import_aria_label_parser = __toESM(require_aria_label_parser());
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
  function formatExportFileName() {
    const base = sanitizeFileNamePart(getConversationName());
    const shortName = base.replace(/[^a-z0-9]/g, "").slice(0, 3).padEnd(3, "_");
    return `chat-export-${shortName}.txt`;
  }

  // src/frontend/src/ui.js
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
  function createCheckboxToggleWithInput(labelText, selfValue, otherValue) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "display: flex; align-items: center; gap: 4px; color: #555; font-size: 12px;";
    const checkboxLabel = document.createElement("label");
    checkboxLabel.style.cssText = "display: flex; align-items: center; gap: 6px; cursor: pointer;";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = false;
    input.style.cssText = "cursor: pointer;";
    const text = document.createElement("span");
    text.textContent = labelText;
    checkboxLabel.appendChild(input);
    checkboxLabel.appendChild(text);
    const makeNameInput = (value, ariaLabel) => {
      const el = document.createElement("input");
      el.type = "text";
      el.value = value;
      el.placeholder = value;
      el.setAttribute("aria-label", ariaLabel);
      el.style.cssText = "border: 1px solid #ccc; border-radius: 4px; padding: 4px 6px; font-size: 12px; width: 72px; outline: none;";
      return el;
    };
    const textInput = makeNameInput(selfValue, "Your replacement name");
    const textInput2 = makeNameInput(otherValue, "Other person replacement name");
    wrap.appendChild(checkboxLabel);
    wrap.appendChild(textInput);
    wrap.appendChild(textInput2);
    return { wrap, input, textInput, textInput2 };
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
  (function() {
    "use strict";
    const panel = document.createElement("details");
    panel.style.cssText = "position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #fff; border: 1px solid #ddd; border-radius: 0 0 10px 10px; font-family: sans-serif; font-size: 13px; box-shadow: 0 2px 10px rgba(0,0,0,0.12); min-width: 420px; max-width: calc(100% - 40px);";
    panel.open = localStorage.getItem("fbExportPanelOpen") !== "false";
    const panelSummary = document.createElement("summary");
    panelSummary.style.cssText = "cursor: pointer; padding: 6px 10px; font-size: 12px; color: #555; background: #fafafa; display: flex; align-items: center; gap: 6px; user-select: none;";
    const panelArrow = document.createElement("span");
    panelArrow.textContent = "\u25B2";
    panelArrow.setAttribute("aria-hidden", "true");
    panelArrow.style.cssText = "font-size: 10px; color: #aaa;";
    const panelTitle = document.createElement("span");
    panelTitle.textContent = "Export Chat";
    panelSummary.appendChild(panelArrow);
    panelSummary.appendChild(panelTitle);
    panel.addEventListener("toggle", () => {
      panelArrow.textContent = panel.open ? "\u25B2" : "\u25BC";
      panelSummary.setAttribute("aria-expanded", String(panel.open));
      localStorage.setItem("fbExportPanelOpen", String(panel.open));
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
    panelSummary.setAttribute("aria-expanded", String(panel.open));
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
    notice.appendChild(noticeMsg);
    notice.appendChild(downloadBtn);
    notice.appendChild(saveAgainLink);
    const body = document.createElement("div");
    body.style.cssText = "display: flex; gap: 10px; padding: 8px 10px; align-items: flex-end;";
    const leftCol = document.createElement("div");
    leftCol.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
    const { wrap: fromWrap, input: fromInput } = createLabelInput(
      "From:",
      "YYYY-MM-DD",
      sessionStorage.getItem("fbExportFrom") || (() => {
        const d = /* @__PURE__ */ new Date();
        d.setDate(d.getDate() - 3);
        return d.toISOString().slice(0, 10);
      })()
    );
    const { wrap: toWrap, input: toInput } = createLabelInput(
      "To:",
      "YYYY-MM-DD",
      sessionStorage.getItem("fbExportTo") || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
    );
    const actionBtn = createButton("Scan Messages", "#0084ff");
    const rightCol = document.createElement("div");
    rightCol.style.cssText = "display: flex; flex-direction: column; gap: 8px; min-width: 160px; padding-left: 10px;";
    const { wrap: includeCallsWrap, input: includeCallsChk } = createCheckboxToggle("Calls");
    const {
      wrap: anonymizeWrap,
      input: anonymizeChk,
      textInput: anonymizeInput,
      textInput2: anonymizeOtherInput
    } = createCheckboxToggleWithInput("Anonymize", "Youghurt", "Alpha");
    const { wrap: summaryWrap, input: summaryChk } = createCheckboxToggle("Summary");
    const { wrap: includeContentWrap, input: includeContentChk } = createCheckboxToggle("Content");
    const { wrap: lengthWrap, input: lengthChk } = createCheckboxToggle("Length");
    function setAllChecked(state) {
      includeCallsChk.checked = state;
      anonymizeChk.checked = state;
      summaryChk.checked = state;
      includeContentChk.checked = state;
      lengthChk.checked = state;
      selectAllLink.textContent = state ? "Uncheck all" : "Check all";
    }
    const selectAllLink = createLinkAction("Check all", () => {
      const allChecked = includeCallsChk.checked && anonymizeChk.checked && summaryChk.checked && includeContentChk.checked && lengthChk.checked;
      setAllChecked(!allChecked);
    });
    leftCol.appendChild(fromWrap);
    leftCol.appendChild(toWrap);
    leftCol.appendChild(actionBtn);
    rightCol.appendChild(includeCallsWrap);
    rightCol.appendChild(anonymizeWrap);
    rightCol.appendChild(summaryWrap);
    rightCol.appendChild(includeContentWrap);
    rightCol.appendChild(lengthWrap);
    rightCol.appendChild(selectAllLink);
    setAllChecked(true);
    body.appendChild(leftCol);
    body.appendChild(rightCol);
    panel.appendChild(panelSummary);
    panel.appendChild(instructions);
    panel.appendChild(notice);
    panel.appendChild(body);
    const termsNote = document.createElement("div");
    termsNote.style.cssText = "padding: 6px 10px 10px; font-size: 11px; color: #777;";
    const termsLabel = document.createTextNode("Terms: ");
    const termsLink = document.createElement("a");
    termsLink.href = "https://github.com/klipolis/fb-chat-export/blob/main/docs/terms-and-conditions.md";
    termsLink.target = "_blank";
    termsLink.rel = "noreferrer noopener";
    termsLink.textContent = "docs/terms-and-conditions.md";
    termsNote.appendChild(termsLabel);
    termsNote.appendChild(termsLink);
    panel.appendChild(termsNote);
    document.body.appendChild(panel);
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
      const hasImage = Boolean(el.querySelector("img"));
      const hasPlayButton = Boolean(el.querySelector('[aria-label="Play"]'));
      const hasLink = Boolean(el.querySelector("a[href]")) || /\b(?:https?:\/\/|www\.|\blink\b)/i.test(normalizedText) || /\b(?:https?:\/\/|www\.|\blink\b)/i.test(normalizedLabel);
      const durationText = timerEl ? timerEl.innerText : normalizedText;
      const contentMeta = (0, import_message_metadata.getContentMeta)({
        fileName: "",
        ariaLabel: label,
        message: normalizedText,
        rawMeta: { duration: durationText },
        hasImage,
        hasPlayButton,
        hasLink,
        timerText: durationText
      });
      return {
        rawDate,
        sender,
        text: contentMeta.text,
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
    let downloadRevokeTimeout = null;
    let scrollTimeout = null;
    let downloadHandler = null;
    let stopRequested = false;
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
      fromInput.style.borderColor = toInput.style.borderColor = "#ccc";
      if (downloadRevokeTimeout !== null) {
        clearTimeout(downloadRevokeTimeout);
        downloadRevokeTimeout = null;
      }
      stopRequested = false;
      sessionStorage.setItem("fbExportFrom", fromInput.value.trim());
      sessionStorage.setItem("fbExportTo", toInput.value.trim());
      setScanState("scanning");
      downloadBtn.style.display = "none";
      saveAgainLink.style.display = "none";
      noticeMsg.textContent = "Scanning: 0";
      const collected = /* @__PURE__ */ new Map();
      let reachedFromDate = false;
      function collectVisible() {
        const allMessages = document.querySelectorAll('[aria-roledescription="message"]');
        allMessages.forEach((el) => {
          const ariaLabel = el.getAttribute("aria-label");
          const timeEl = el.querySelector("time[datetime]");
          const timeStamp = timeEl ? timeEl.getAttribute("datetime") : "";
          const key = ariaLabel ? `${ariaLabel}|${timeStamp}` : null;
          if (!key || collected.has(key)) return;
          const { rawDate, sender, text, type, isCall, isImage, duration, contentLength } = extractMessageParts(el);
          if (!rawDate || !sender) return;
          const resolvedRaw = timeEl ? timeEl.getAttribute("datetime") : resolveRelativeDate(rawDate);
          const msgDate = /^\d{4}-\d{2}-\d{2}$/.test(resolvedRaw) ? (() => {
            const [y, m, d] = resolvedRaw.split("-").map(Number);
            return new Date(y, m - 1, d);
          })() : new Date(resolvedRaw);
          const displayDate = formatDate(resolvedRaw);
          const authorLabel = (() => {
            if (!anonymizeChk.checked) return sender;
            const selfName = anonymizeInput.value.trim() || "Youghurt";
            const otherName = anonymizeOtherInput.value.trim() || "Alpha";
            const senderLower = String(sender).toLowerCase();
            if (senderLower === "you") {
              return selfName.toLowerCase() === "you" ? sender : selfName;
            }
            return senderLower === otherName.toLowerCase() ? sender : otherName;
          })();
          const callMinutes = (() => {
            const timer = el.querySelector('[role="timer"], time');
            const src = timer ? timer.textContent || "" : el.getAttribute("aria-label") || "";
            const m = src.match(/(\d+)\s*min/i);
            return m ? Number(m[1]) : 0;
          })();
          if (!includeCallsChk.checked && isCall) return;
          if (fromDate && !isNaN(msgDate) && msgDate < fromDate) {
            reachedFromDate = true;
            return;
          }
          if (toDate && !isNaN(msgDate) && msgDate > toDate) return;
          const lineEntry = {
            fileType: type,
            semanticType: type,
            dateText: displayDate,
            sender: authorLabel,
            duration,
            content: text,
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
      const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      if (toDate) {
        const latestVisible = getLatestVisibleMessageDate();
        if (latestVisible && latestVisible > toDate) {
          scroller.scrollTop = maxScrollTop;
        }
      } else {
        scroller.scrollTop = maxScrollTop;
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
              function triggerDownload(url) {
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
              }
              downloadBtn.style.display = "";
              saveAgainLink.style.display = "none";
              saveAgainLink.onclick = null;
              if (downloadHandler) downloadBtn.removeEventListener("click", downloadHandler);
              downloadHandler = () => {
                if (downloadBtn.getAttribute("aria-disabled") === "true") return;
                downloadBtn.setAttribute("aria-disabled", "true");
                downloadBtn.style.opacity = "0.5";
                downloadBtn.style.cursor = "not-allowed";
                downloadBtn.textContent = "Downloaded";
                saveAgainLink.style.display = "";
                saveAgainLink.onclick = (e) => {
                  e.preventDefault();
                  triggerDownload(downloadUrl);
                };
                triggerDownload(downloadUrl);
                if (downloadUrl.startsWith("blob:")) {
                  if (downloadRevokeTimeout) clearTimeout(downloadRevokeTimeout);
                  downloadRevokeTimeout = setTimeout(() => {
                    URL.revokeObjectURL(downloadUrl);
                    downloadRevokeTimeout = null;
                  }, 6e4);
                }
              };
              downloadBtn.addEventListener("click", downloadHandler);
              setScanState("idle");
            };
            actionBtn.dataset.scanning = "false";
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
            const headerText = (0, import_export_formatter.formatExportHeader)({ method: "browser", messageTypes });
            const blob = new Blob([headerText + summaryText + messages.join("")], {
              type: "text/plain"
            });
            const fromLabel = fromInput.value.trim() || "start";
            const toLabel = toInput.value.trim() || "end";
            const elapsedMs = Date.now() - scanStartedAt;
            const elapsed = elapsedMs < 6e4 ? `${(elapsedMs / 1e3).toFixed(1)} seconds` : `${(elapsedMs / 6e4).toFixed(2)} minutes`;
            const displayPersonName = getDisplayPersonName();
            const fileName = formatExportFileName();
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
          throw err;
        }
      }
      scanStep();
    });
  })();
})();
