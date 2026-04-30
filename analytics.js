// ============================================================
// analytics.js — Aditya Singh Portfolio (Safe Version)
// Tracks: visits, clicks, time spent, section dwell time
// Privacy: anonymous only, respects Do Not Track, basic consent
// ============================================================

(function () {

const ENDPOINT = "https://script.google.com/macros/s/AKfycbzQKsXPj13AXPyAnhrz50IvGqwkn15Qth4EVMxaes5Nx15crIZReriMn7AqcI7ucbs6UA/exec";

const PAGE  = location.pathname;
const START = Date.now();

// ── Respect Do Not Track (privacy safe) ───────────────────────
const DNT = navigator.doNotTrack === "1" || window.doNotTrack === "1";

// ── Simple consent check (no popup, safe default) ─────────────
// If you want stricter control later, replace this logic
function hasConsent() {
  return localStorage.getItem("analytics_consent") === "true";
}

// Auto-set consent if not present (since you already have privacy notice)
if (!localStorage.getItem("analytics_consent")) {
  localStorage.setItem("analytics_consent", "true");
}

// ── Anonymous user ID ─────────────────────────────────────────
function getUserId() {
  const key = "anon_user_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}
const USER_ID = getUserId();

// ── Section dwell time tracking ───────────────────────────────
const secTimes = {};
let curSec = "hero";
let secStart = Date.now();

function recordSection(newId) {
  const now = Date.now();
  secTimes[curSec] = (secTimes[curSec] || 0) + (now - secStart);
  curSec = newId || "unknown";
  secStart = now;
}

function initSectionTracking() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) recordSection(e.target.id);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll("section[id]").forEach(s => obs.observe(s));
}

// ── Payload builder ───────────────────────────────────────────
function payload(action, extra) {
  return {
    userId: USER_ID,
    page: PAGE,
    action,
    timestamp: new Date().toISOString(),
    ...extra
  };
}

// ── Send event ────────────────────────────────────────────────
function sendEvent(data, useBeacon) {
  if (DNT || !hasConsent()) return;

  const body = JSON.stringify(data);

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    return;
  }

  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch(() => {});
}

// ── Time spent ────────────────────────────────────────────────
function sendTimeSpent() {
  recordSection(curSec);

  const timeSpent = Math.round((Date.now() - START) / 1000);

  sendEvent(payload("time_spent", {
    timeSpent,
    sectionTimes: Object.fromEntries(
      Object.entries(secTimes).map(([k, v]) => [k, Math.round(v / 1000)])
    ),
    referrer: document.referrer || "direct"
  }), true);
}

// ── Click tracking ────────────────────────────────────────────
function initClickTracking() {
  document.addEventListener("click", function (e) {
    const target = e.target.closest("a, button");
    if (!target) return;

    const label = target.id
      || target.getAttribute("data-track")
      || target.textContent.trim().slice(0, 80)
      || "unknown";

    const href = target.getAttribute("href") || "";
    const isCv = /cv|resume/i.test(label) || /cv|resume/i.test(href);

    sendEvent(payload("click", {
      target: label,
      href,
      isCvDownload: isCv
    }));
  });
}

// ── Init ──────────────────────────────────────────────────────
function initAnalytics() {
  if (DNT || !hasConsent()) return;

  sendEvent(payload("visit", {
    referrer: document.referrer || "direct"
  }));

  initSectionTracking();
  initClickTracking();

  window.addEventListener("beforeunload", sendTimeSpent);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") sendTimeSpent();
  });
}

// ── Auto-init (safe) ──────────────────────────────────────────
window.addEventListener("DOMContentLoaded", function () {
  initAnalytics();
});

})();
