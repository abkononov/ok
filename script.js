/* abkononov.com — shared scripts */

/* ---------- Mobile nav ---------- */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
  }
})();

/* ---------- Scroll reveal ---------- */
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(function (e) { e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(function (e) { io.observe(e); });
})();

/* ---------- Cookie consent (EU / DSGVO) ---------- */
(function () {
  var KEY = 'abk_cookie_consent_v1';
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(val) {
    try { localStorage.setItem(KEY, val); } catch (e) {}
  }
  function loadAnalytics() {
    /* Nicht-notwendige Skripte (z. B. Analytics) erst NACH Einwilligung laden.
       Hier einbinden, sobald ein Analyse-Tool genutzt wird. */
    // console.log('Analytics-Einwilligung erteilt');
  }

  if (!stored()) {
    setTimeout(function () { banner.classList.add('show'); }, 700);
  } else if (stored() === 'all') {
    loadAnalytics();
  }

  var acc = document.getElementById('cookie-accept');
  var rej = document.getElementById('cookie-reject');
  if (acc) acc.addEventListener('click', function () {
    save('all'); banner.classList.remove('show'); loadAnalytics();
  });
  if (rej) rej.addEventListener('click', function () {
    save('essential'); banner.classList.remove('show');
  });
})();

/* ---------- Lead form ---------- */
(function () {
  var form = document.getElementById('lead-form');
  if (!form) return;
  var msg = document.getElementById('form-msg');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var consent = form.querySelector('#consent');
    if (consent && !consent.checked) {
      show('Пожалуйста, дайте согласие на обработку ваших данных.', 'err');
      return;
    }
    /* Demo: kein Backend angebunden. Hier später an E-Mail-Dienst,
       CRM oder Formular-Endpoint koppeln. */
    show('Спасибо! Ваш запрос отправлен. Обычно я отвечаю в течение 24 часов.', 'ok');
    form.reset();
  });

  function show(text, type) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'form-msg show ' + type;
  }
})();

/* ---------- Footer year ---------- */
(function () {
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
