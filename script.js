// ============================================================
// script.js - Aditya Singh Portfolio
// UI only: typewriter, scroll/nav, accordions, lightbox, reveal
// Cookie consent + analytics live entirely in analytics.js
// ============================================================

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

// ── Navbar + scroll behaviour ────────────────────────────────
const navbar    = document.getElementById('navbar');
const lockedBar = document.getElementById('locked-bar');
const scrollHint = document.getElementById('scroll-hint');
const heroEl    = document.getElementById('hero');
let heroH = heroEl.offsetHeight;
window.addEventListener('resize', () => { heroH = heroEl.offsetHeight; });

window.addEventListener('scroll', () => {
  const past = window.scrollY > heroH * 0.8;
  navbar.classList.toggle('visible', past);
  scrollHint.style.opacity = past ? '0' : '1';
  const contactTop = document.getElementById('contact').getBoundingClientRect().top;
  lockedBar.classList.toggle('visible', past && contactTop > 100);
});

// ── Active nav link highlighting ─────────────────────────────
const supportsIO = 'IntersectionObserver' in window;
const secIds = ['about', 'research', 'publication', 'skills', 'credentials', 'contact'];
const navAs  = document.querySelectorAll('.nav-links a');

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

// ── Experience card accordions ───────────────────────────────
document.querySelectorAll('.exp-header').forEach((header) => {
  header.addEventListener('click', () => {
    header.closest('.exp-card').classList.toggle('open');
  });
});

// ── Lightbox ─────────────────────────────────────────────────
const lb    = document.getElementById('lightbox');
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

// ── Scroll-reveal ────────────────────────────────────────────
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
// ── Analytics (in analytics.js) ───────────────────────────────
// Handles consent, pageview, section view time, and click tracking
// ==================================