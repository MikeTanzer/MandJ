/* ============================================================
   MNJ Construction — site behavior
   No dependencies. Everything degrades gracefully.
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Sticky nav
  --------------------------------------------------------- */
  var nav = $('#nav');
  var onScroll = function () {
    nav.classList.toggle('is-stuck', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     2. Mobile menu
  --------------------------------------------------------- */
  var toggle = $('#navToggle');
  var links  = $('#navLinks');

  var closeMenu = function () {
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };

  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  $$('#navLinks a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------------------------------------------------------
     3. Hero video — only fade it in once it is genuinely
        playing. If the file is missing or the browser blocks
        autoplay, the procedural desert background stays put.
  --------------------------------------------------------- */
  var video = $('#heroVideo');

  if (video) {
    if (reduced) {
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      var live = function () { video.classList.add('is-live'); };

      video.addEventListener('playing', live, { once: true });
      video.addEventListener('timeupdate', function tu () {
        if (video.currentTime > 0.05) { live(); video.removeEventListener('timeupdate', tu); }
      });
      video.addEventListener('error', function () { video.classList.remove('is-live'); });

      // Some browsers need a nudge; ignore rejection (fallback already showing).
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function () {}); }

      // Re-try once the tab becomes visible again.
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && video.paused) {
          var r = video.play();
          if (r && typeof r.catch === 'function') { r.catch(function () {}); }
        }
      });
    }
  }

  /* ---------------------------------------------------------
     4. Reveal on scroll
  --------------------------------------------------------- */
  var revealables = $$('.reveal');

  if (!('IntersectionObserver' in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add('is-in'); }, i * 70);
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     5. Stat count-up
  --------------------------------------------------------- */
  var stats = $$('.stat b[data-count]').filter(function (el) {
    return parseFloat(el.getAttribute('data-count')) > 0;
  });

  var countUp = function (el) {
    var target   = parseFloat(el.getAttribute('data-count'));
    var suffix   = el.getAttribute('data-suffix') || '';
    var decimals = (String(target).split('.')[1] || '').length;
    var start    = null;
    var DURATION = 1400;

    var step = function (ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / DURATION, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window && !reduced) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        sio.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    stats.forEach(function (el) { sio.observe(el); });
  }

  /* ---------------------------------------------------------
     6. Contact form
        Validates client-side, then hands the message to the
        visitor's mail app. Nothing is transmitted anywhere
        else. See README for wiring up a real backend.
  --------------------------------------------------------- */
  var INBOX = 'build@mnjconstruction.com';

  var form    = $('#bidForm');
  var sentMsg = $('#sentMsg');

  var setError = function (name, msg) {
    var field = $('#' + name).closest('.field');
    var slot  = $('.err[data-for="' + name + '"]');
    field.classList.toggle('is-bad', !!msg);
    if (slot) slot.textContent = msg || '';
  };

  var validate = function () {
    var problems = [];
    var name    = $('#name').value.trim();
    var email   = $('#email').value.trim();
    var phone   = $('#phone').value.trim();
    var message = $('#message').value.trim();

    setError('name',    name    ? '' : (problems.push('name'),    'Please tell us who you are.'));
    setError('email',   /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : (problems.push('email'), 'Enter a valid email address.'));
    setError('message', message.length >= 10 ? '' : (problems.push('message'), 'A sentence or two about the project, please.'));
    setError('phone',   (!phone || phone.replace(/\D/g, '').length >= 10) ? '' : (problems.push('phone'), 'That phone number looks short.'));

    return problems;
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot — bots fill hidden fields, people don't.
    if (form.company_website.value) return;

    var problems = validate();
    if (problems.length) {
      var first = $('#' + problems[0]);
      first.focus();
      first.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      return;
    }

    var body = [
      'Name: '     + $('#name').value.trim(),
      'Email: '    + $('#email').value.trim(),
      'Phone: '    + ($('#phone').value.trim() || '—'),
      'Type: '     + $('#type').value,
      'Location: ' + ($('#location').value.trim() || '—'),
      '',
      'Project details',
      '---------------',
      $('#message').value.trim(),
      '',
      '— Sent from mnjconstruction.com'
    ].join('\n');

    var href = 'mailto:' + INBOX +
      '?subject=' + encodeURIComponent('Bid request — ' + $('#type').value + ' — ' + $('#name').value.trim()) +
      '&body='    + encodeURIComponent(body);

    window.location.href = href;

    form.hidden    = true;
    sentMsg.hidden = false;
    sentMsg.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  });

  // Clear an error as soon as the visitor starts fixing it.
  $$('#bidForm input, #bidForm textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      var f = el.closest('.field');
      if (f && f.classList.contains('is-bad')) setError(el.id, '');
    });
  });

  $('#againBtn').addEventListener('click', function () {
    form.reset();
    form.hidden    = false;
    sentMsg.hidden = true;
    $('#name').focus();
  });

  /* ---------------------------------------------------------
     7. Footer year
  --------------------------------------------------------- */
  $('#yr').textContent = new Date().getFullYear();
})();
