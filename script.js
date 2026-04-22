const heroPhrases = [
  'a biologist. Mostly.',
  'still in the lab. Technically.',
  'somewhere between a pipette and a Python script.'
];
const lockedPhrases = [
  'a biologist. Mostly.',
  'still in the lab. Technically.',
  'somewhere between a pipette and a Python script.',
  'a generalist in a world of specialists.',
  'convinced the answer is in the data.',
  'unconvinced by clean answers.'
];
const finalPhrase = 'working on it.';

function typeWriter(el, text, onDone) {
  el.textContent = '';
  let i = 0;
  function type() {
    if (i < text.length) {
      el.textContent += text[i++];
      const ch = text[i - 1];
      const d = ch === '.' || ch === ',' || ch === '–' ? 180 + Math.random() * 120 : 55 + Math.random() * 65;
      setTimeout(type, d);
    } else {
      setTimeout(onDone, 2000);
    }
  }
  type();
}
function eraseWriter(el, onDone) {
  function erase() {
    if (el.textContent.length > 0) {
      el.textContent = el.textContent.slice(0, -1);
      setTimeout(erase, 32 + Math.random() * 18);
    } else {
      setTimeout(onDone, 350);
    }
  }
  erase();
}
function startCycle(el, phrases) {
  let i = 0;
  el.classList.add('on');
  function next() {
    typeWriter(el, phrases[i], () => eraseWriter(el, () => {
      i = (i + 1) % phrases.length;
      next();
    }));
  }
  next();
}
function startFinal(el, phrase) {
  el.classList.add('on');
  (function loop() {
    typeWriter(el, phrase, () => setTimeout(() => eraseWriter(el, loop), 2500));
  })();
}

startCycle(document.getElementById('hero-rt'), heroPhrases);
startCycle(document.getElementById('locked-rt'), lockedPhrases);
startFinal(document.getElementById('final-rt'), finalPhrase);

const navbar = document.getElementById('navbar');
const lockedBar = document.getElementById('locked-bar');
const scrollHint = document.getElementById('scroll-hint');
const heroEl = document.getElementById('hero');
let heroH = heroEl.offsetHeight;
window.addEventListener('resize', () => {
  heroH = heroEl.offsetHeight;
});

window.addEventListener('scroll', () => {
  const past = window.scrollY > heroH * 0.8;
  navbar.classList.toggle('visible', past);
  scrollHint.style.opacity = past ? '0' : '1';
  const contactTop = document.getElementById('contact').getBoundingClientRect().top;
  const showLocked = past && contactTop > 100;
  lockedBar.classList.toggle('visible', showLocked);
});

const supportsIO = 'IntersectionObserver' in window;

const secIds = ['about', 'research', 'publication', 'skills', 'credentials', 'contact'];
const navAs = document.querySelectorAll('.nav-links a');
if (supportsIO) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        navAs.forEach((a) => a.classList.remove('active'));
        const a = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { threshold: 0.3 });
  secIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
}

document.querySelectorAll('.exp-header').forEach((header) => {
  header.addEventListener('click', () => {
    header.closest('.exp-card').classList.toggle('open');
  });
});

const banner = document.getElementById('cookie-banner');
function setCookieConsent(val) {
  localStorage.setItem('cookie-consent', val);
  banner.style.display = 'none';
  if (val === 'accepted') initAnalytics();
}
window.setCookieConsent = setCookieConsent;

(() => {
  const s = localStorage.getItem('cookie-consent');
  if (s) {
    banner.style.display = 'none';
    if (s === 'accepted') initAnalytics();
  }
})();

const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
document.querySelectorAll('.cred-img-wrap').forEach((wrap) => {
  wrap.addEventListener('click', () => {
    lbImg.src = wrap.dataset.full;
    lb.classList.add('active');
  });
});
document.getElementById('lb-close').addEventListener('click', () => lb.classList.remove('active'));
document.getElementById('lb-overlay').addEventListener('click', () => lb.classList.remove('active'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') lb.classList.remove('active');
});
document.addEventListener('contextmenu', (e) => {
  if (e.target.classList.contains('cred-img') || e.target.id === 'lb-img') e.preventDefault();
});

if (supportsIO) {
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
}

const SHEETS_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_ENDPOINT_HERE';
const sessionStart = Date.now();
const secTimes = {};
let curSec = 'hero';
let secStart = Date.now();
let analyticsOn = false;

function initAnalytics() {
  analyticsOn = true;
  if (supportsIO) {
    const tObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const now = Date.now();
          secTimes[curSec] = (secTimes[curSec] || 0) + (now - secStart);
          curSec = e.target.id || 'unknown';
          secStart = now;
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('section').forEach((s) => tObs.observe(s));
  }
  window.addEventListener('beforeunload', () => {
    if (!analyticsOn || SHEETS_ENDPOINT.includes('YOUR_')) return;
    const now = Date.now();
    secTimes[curSec] = (secTimes[curSec] || 0) + (now - secStart);
    navigator.sendBeacon(SHEETS_ENDPOINT, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalTime: Math.round((now - sessionStart) / 1000),
      referrer: document.referrer || 'direct',
      sectionTimes: Object.fromEntries(Object.entries(secTimes).map(([k, v]) => [k, Math.round(v / 1000)]))
    }));
  });
}
