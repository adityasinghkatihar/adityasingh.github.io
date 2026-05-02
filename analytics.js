// ============================================================
// analytics.js - Aditya Singh Portfolio
// Owns: cookie consent UI, session tracking, click tracking,
//       section dwell time, visit events, time-spent beacon
//
// Privacy model (GDPR / UK ICO compliant):
//   • Collects: timezone, language, referrer, section dwell
//     times, CV downloads, click targets — all anonymised
//   • Does NOT collect: GPS, persistent user IDs, IP address
//   • Session ID is fresh every page load — never stored
//   • Respects Do Not Track signal
//   • No data fires until explicit consent is given
// ============================================================

(function () {

  // ── Config ─────────────────────────────────────────────────
  const ENDPOINT    = 'https://script.google.com/macros/s/AKfycbzXd2YEhhiWsNH5LT9AwR3XM83Nh1L5P9wihdBdmHfbt4qR8VpsS3bT-88sSMWyPuT9ew/exec';
  const CONSENT_KEY = 'cookie-consent';
  const PAGE        = location.pathname || document.title || 'unknown';
  const DNT         = navigator.doNotTrack === '1' || window.doNotTrack === '1';

  // ── Session ID — generated fresh every page load, never persisted ──
  const SESSION_ID = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  // ── State ───────────────────────────────────────────────────
  let initialized    = false;
  let timeSent       = false;
  let trackingStart  = Date.now();
  let sectionStart   = Date.now();
  let currentSection = 'hero';
  const sectionTimes = {};

  // ── Passive location (timezone + language only, no GPS) ─────
  const locationData = (function () {
    const lang = navigator.language || '';
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      language: lang,
      country : lang.includes('-') ? lang.split('-')[1] : ''
    };
  })();

  // ── Guards ──────────────────────────────────────────────────
  function hasConsent()    { return localStorage.getItem(CONSENT_KEY) === 'accepted'; }
  function canTrack()      { return !DNT && hasConsent(); }
  function endpointReady() { return ENDPOINT && !ENDPOINT.includes('YOUR_'); }

  // ── Payload builder ─────────────────────────────────────────
  // Every event shares this flat shape so the Sheet columns are
  // always consistent. Action-specific fields default to '' when
  // not applicable to a given event type.
  function payload(action, extra) {
    return Object.assign({
      sessionId        : SESSION_ID,
      page             : PAGE,
      action           : action,
      locationTimezone : locationData.timezone,
      locationLanguage : locationData.language,
      locationCountry  : locationData.country,
      referrer         : '',
      timeSpent        : '',
      sectionTimes     : '',
      clickTarget      : '',
      clickHref        : '',
      isCvDownload     : ''
    }, extra);
  }

  // ── Transport ────────────────────────────────────────────────
  function sendEvent(data, useBeacon) {
    if (!canTrack() || !endpointReady()) return;
    const body = JSON.stringify(data);
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=utf-8' }));
      return;
    }
    fetch(ENDPOINT, {
      method   : 'POST',
      mode     : 'no-cors',
      headers  : { 'Content-Type': 'text/plain;charset=utf-8' },
      body     : body,
      keepalive: true
    }).catch(function () {});
  }

  // ── Section dwell time ───────────────────────────────────────
  function recordSection(next) {
    const now = Date.now();
    sectionTimes[currentSection] = (sectionTimes[currentSection] || 0) + (now - sectionStart);
    currentSection = next || 'unknown';
    sectionStart   = now;
  }

  function initSectionTracking() {
    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) recordSection(entry.target.id || 'unknown');
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('section[id]').forEach(function (s) { obs.observe(s); });
  }

  // ── Click tracking ───────────────────────────────────────────
  function initClickTracking() {
    document.addEventListener('click', function (event) {
      const raw = event.target;
      const el  = (raw && raw.nodeType === Node.ELEMENT_NODE) ? raw : (raw && raw.parentElement);
      if (!el) return;
      const target = el.closest('a, button');
      if (!target) return;

      const label = target.id
        || target.getAttribute('data-track')
        || target.textContent.trim().slice(0, 80)
        || 'unknown';
      const href = target.getAttribute('href') || '';

      sendEvent(payload('click', {
        clickTarget : label,
        clickHref   : href,
        isCvDownload: /cv|resume/i.test(label) || /cv|resume/i.test(href)
      }));
    });
  }

  // ── Time-spent beacon (fires on tab close / hide) ────────────
  function sendTimeSpent() {
    if (timeSent) return;
    timeSent = true;
    recordSection(currentSection);

    const roundedSections = {};
    Object.keys(sectionTimes).forEach(function (k) {
      roundedSections[k] = Math.round(sectionTimes[k] / 1000);
    });

    sendEvent(payload('time_spent', {
      referrer    : document.referrer || 'direct',
      timeSpent   : Math.round((Date.now() - trackingStart) / 1000),
      sectionTimes: JSON.stringify(roundedSections)
    }), true);
  }

  // ── Core init ────────────────────────────────────────────────
  function initAnalytics() {
    if (initialized || !canTrack()) return;
    initialized   = true;
    trackingStart = Date.now();
    sectionStart  = trackingStart;

    sendEvent(payload('visit', { referrer: document.referrer || 'direct' }));

    initSectionTracking();
    initClickTracking();

    window.addEventListener('beforeunload', sendTimeSpent);
    window.addEventListener('pagehide',     sendTimeSpent);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') sendTimeSpent();
    });
  }

  // ── Cookie consent ───────────────────────────────────────────
  // Called by inline onclick on the banner buttons in index.html.
  function setCookieConsent(val) {
    localStorage.setItem(CONSENT_KEY, val);
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = 'none';
    if (val === 'accepted') initAnalytics();
  }
  window.setCookieConsent = setCookieConsent;

  // ── On load: honour a previously stored consent choice ───────
  (function checkExistingConsent() {
    var stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return;
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = 'none';
    if (stored === 'accepted') initAnalytics();
  })();

})();
