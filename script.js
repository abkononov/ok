/* abkononov.com — shared scripts */

/* ---------- Отправка заявок на бэкенд (send.php) ---------- */
function sendLead(payload) {
  return fetch('send.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function (res) {
    return res.json().then(function (j) {
      return { ok: res.ok && j && j.ok === true, error: j && j.error };
    }, function () {
      return { ok: false };
    });
  }).catch(function () {
    return { ok: false };
  });
}

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
    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
    show('', '');

    sendLead({
      type: 'Консультация (форма)',
      name: val('name'),
      email: val('email'),
      phone: val('phone'),
      message: val('message'),
      company: val('company') // honeypot
    }).then(function (r) {
      if (r.ok) {
        show('Спасибо! Ваш запрос отправлен. Мы отвечаем в течение 24 часов.', 'ok');
        form.reset();
      } else {
        show(r.error || 'Не удалось отправить. Попробуйте позже или напишите на e-mail.', 'err');
      }
      if (btn) { btn.disabled = false; btn.textContent = label; }
    });
  });

  function val(id) { var el = form.querySelector('#' + id); return el ? el.value.trim() : ''; }

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

/* ---------- Quiz ---------- */
(function () {
  var root = document.getElementById('quiz');
  if (!root) return;
  var steps  = Array.prototype.slice.call(root.querySelectorAll('.quiz-step'));
  var bar    = document.getElementById('quiz-bar');
  var label  = document.getElementById('quiz-step-label');
  var back   = document.getElementById('quiz-back');
  var submit = document.getElementById('quiz-submit');
  var msg    = document.getElementById('quiz-msg');
  var current = 0;
  var QUESTIONS = 3, FORM = 3, DONE = 4;
  var answers = [];

  function render() {
    steps.forEach(function (s) {
      s.classList.toggle('is-active', parseInt(s.getAttribute('data-step'), 10) === current);
    });
    if (current <= FORM) {
      bar.parentElement.style.display = '';
      bar.style.width = (((current + 1) / (FORM + 1)) * 100) + '%';
    }
    if (current < QUESTIONS) {
      label.style.display = '';
      label.textContent = 'Вопрос ' + (current + 1) + ' из ' + QUESTIONS;
    } else if (current === FORM) {
      label.style.display = '';
      label.textContent = 'Последний шаг';
    } else {
      label.style.display = 'none';
      bar.parentElement.style.display = 'none';
    }
    back.hidden = !(current > 0 && current < DONE);
  }

  root.querySelectorAll('.quiz-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      var stepEl = opt.closest('.quiz-step');
      var qi = parseInt(stepEl.getAttribute('data-step'), 10);
      answers[qi] = opt.getAttribute('data-value');
      stepEl.querySelectorAll('.quiz-option').forEach(function (o) { o.classList.remove('is-selected'); });
      opt.classList.add('is-selected');
      setTimeout(function () { current = Math.min(current + 1, FORM); render(); }, 180);
    });
  });

  back.addEventListener('click', function () { if (current > 0) { current--; render(); } });

  if (submit) {
    submit.addEventListener('click', function () {
      var name = document.getElementById('quiz-name');
      var contact = document.getElementById('quiz-contact');
      var consent = document.getElementById('quiz-consent');
      var hp = document.getElementById('quiz-company');
      if (!name.value.trim() || !contact.value.trim()) { showMsg('Пожалуйста, заполните имя и контакт.', 'err'); return; }
      if (!consent.checked) { showMsg('Пожалуйста, дайте согласие на обработку данных.', 'err'); return; }

      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Отправляем…';
      showMsg('', '');

      sendLead({
        type: 'Квиз',
        name: name.value.trim(),
        contact: contact.value.trim(),
        budget: answers[0] || '',
        urgency: answers[1] || '',
        experience: answers[2] || '',
        company: hp ? hp.value : '' // honeypot
      }).then(function (r) {
        if (r.ok) {
          var t = 'Мы свяжемся с вами в течение 24 часов с расчётом под ваши ответы.';
          if ((answers[1] || '').indexOf('Срочно') === 0) t += ' Раз клиенты нужны срочно — возьмём вас в приоритет.';
          if ((answers[2] || '') === 'Да, есть опыт запуска') t += ' С опытом запуска стартуем быстрее.';
          var thanks = document.getElementById('quiz-thanks');
          if (thanks) thanks.textContent = t;
          current = DONE; render();
        } else {
          showMsg(r.error || 'Не удалось отправить. Попробуйте позже.', 'err');
          submit.disabled = false;
          submit.textContent = label;
        }
      });
    });
  }

  function showMsg(text, type) { if (msg) { msg.textContent = text; msg.className = 'form-msg show ' + type; } }

  render();
})();
