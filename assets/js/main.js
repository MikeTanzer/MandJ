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
     3. Hero reel — the three clips play in order, crossfade
        into each other, then loop back to the first.

        The hand-off starts slightly BEFORE the outgoing clip
        ends, so both are still moving during the fade. Waiting
        for 'ended' would fade out of a frozen last frame.

        Nothing here is load-bearing: if a clip 404s, is
        blocked by autoplay policy, or the visitor prefers
        reduced motion, the procedural desert background just
        stays visible underneath.
  --------------------------------------------------------- */
  var CROSSFADE = 1.0;   // seconds of overlap; matches the CSS transition

  var clips = $$('#heroReel .hero__video');

  if (clips.length && !reduced) {
    var current  = -1;
    var handing  = false;
    var dead     = {};   // clips that failed to load — skipped on later passes

    var alive = function () {
      return clips.some(function (c, i) { return !dead[i]; });
    };

    var nextIndex = function (from) {
      for (var step = 1; step <= clips.length; step++) {
        var i = (from + step) % clips.length;
        if (!dead[i]) return i;
      }
      return -1;
    };

    var play = function (video) {
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function () {}); }
    };

    var show = function (i) {
      if (i < 0) return;
      var incoming = clips[i];
      var outgoing = current >= 0 ? clips[current] : null;

      current = i;
      handing = false;

      incoming.currentTime = 0;
      play(incoming);

      if (!outgoing || outgoing === incoming) {
        // First clip of the session: fade up out of the desert background.
        incoming.classList.add('is-live');
      } else {
        incoming.classList.remove('is-out');
        incoming.classList.add('is-under');   // instantly opaque, underneath
        outgoing.classList.add('is-out');     // lifted on top
        outgoing.classList.remove('is-live'); // ...and dissolved away

        setTimeout(function () {
          outgoing.classList.remove('is-out');
          outgoing.classList.remove('is-under');
          outgoing.pause();
          outgoing.currentTime = 0;
          // Both are opaque, so this swap is invisible.
          incoming.classList.remove('is-under');
          incoming.classList.add('is-live');
        }, CROSSFADE * 1000 + 120);
      }

      // Pull the following clip down now so the hand-off isn't a stall.
      var upcoming = clips[nextIndex(i)];
      if (upcoming && upcoming !== incoming && upcoming.preload !== 'auto') {
        upcoming.preload = 'auto';
        upcoming.load();
      }
    };

    clips.forEach(function (video, i) {
      video.addEventListener('error', function () {
        dead[i] = true;
        if (i === current) { show(nextIndex(i)); }
      });

      // Start the hand-off a beat before this clip runs out.
      video.addEventListener('timeupdate', function () {
        if (handing || i !== current) return;
        if (!isFinite(video.duration) || video.duration <= 0) return;
        if (video.duration - video.currentTime > CROSSFADE) return;

        handing = true;
        show(nextIndex(i));
      });

      // Backstop: if timeupdate never fires late enough, 'ended' still advances.
      video.addEventListener('ended', function () {
        if (i !== current) return;
        show(nextIndex(i));
      });
    });

    if (alive()) { show(0); }

    // Autoplay is often denied until the visitor interacts; retry then.
    var kick = function () {
      if (current >= 0 && clips[current].paused) { play(clips[current]); }
    };
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) kick();
    });
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
      document.addEventListener(evt, kick, { once: true, passive: true });
    });
  }

  /* ---------------------------------------------------------
     4. Section film plates

        Services / Process / Work / Contact each sit on a dimmed
        video. These are decoration, so they cost nothing until
        they are nearly on screen: the <video> is created only
        when the section approaches the viewport, and paused
        again once it leaves. Under reduced motion none of them
        are ever created.
  --------------------------------------------------------- */
  var films = $$('[data-film]');

  // Four section clips is another ~7.5 MB on top of the hero. Decoration is
  // not worth that to someone who has asked to save data — they get the scrim
  // alone, which is what the sections looked like before the film.
  //
  // Deliberately NOT gated on effectiveType '3g': that value is inferred from
  // observed latency, and an ordinary connection with a slow round trip reports
  // 3g routinely — including a local dev server. Gating on it silently strips
  // the film from people who could load it fine. Only saveData (an explicit
  // choice) and the genuinely unusable 2g tiers opt out.
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var thrifty = !!conn && (conn.saveData === true || /^(slow-)?2g$/.test(conn.effectiveType || ''));

  if (films.length && 'IntersectionObserver' in window && !reduced && !thrifty) {
    var onScreen = new WeakMap();

    var build = function (section) {
      var mount = $('.film', section);
      if (!mount || mount.querySelector('video')) return;

      var video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'auto';
      video.src = section.getAttribute('data-film');

      // Optional per-section pacing, e.g. data-film-rate="0.67" for a third
      // slower. Browsers reset playbackRate on some load transitions, so it is
      // re-applied rather than set once.
      var rate = parseFloat(section.getAttribute('data-film-rate'));
      if (rate > 0) {
        var pace = function () { video.playbackRate = rate; };
        pace();
        video.addEventListener('loadedmetadata', pace);
        video.addEventListener('play', pace);
        video.addEventListener('ratechange', function () {
          if (video.playbackRate !== rate) pace();
        });
      }

      video.addEventListener('playing', function () { video.classList.add('is-live'); });
      // A missing file just leaves the section as it was.
      video.addEventListener('error', function () { video.remove(); });

      mount.insertBefore(video, mount.firstChild);
    };

    // Loading and visibility are tracked separately and can settle in either
    // order, so both funnel through here rather than acting directly. A clip
    // built while its section is still off screen must not start playing, and
    // one whose section was already on screen when it finished building will
    // never get another intersection event to start it.
    var sync = function (section) {
      var video = $('.film video', section);
      if (!video) return;

      if (onScreen.get(section)) {
        var p = video.play();
        if (p && typeof p.catch === 'function') { p.catch(function () {}); }
      } else {
        video.pause();
      }
    };

    // Wide margin: start fetching well before the section is reached.
    var loader = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        build(entry.target);
        sync(entry.target);
        loader.unobserve(entry.target);
      });
    }, { rootMargin: '60% 0px' });

    // Narrow margin: only actually run a clip while it is on screen.
    var player = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        onScreen.set(entry.target, entry.isIntersecting);
        sync(entry.target);
      });
    }, { rootMargin: '10% 0px' });

    films.forEach(function (section) {
      loader.observe(section);
      player.observe(section);
    });
  }

  /* ---------------------------------------------------------
     5. Reveal on scroll
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
     6. Stat count-up
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
     7. Contact form
        Validates client-side, then hands the message to the
        visitor's mail app. Nothing is transmitted anywhere
        else. See README for wiring up a real backend.
  --------------------------------------------------------- */
  var INBOX = 'matt@mandjconst.com';

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
      '— Sent from mandjconst.com'
    ].join('\n');

    var href = 'mailto:' + INBOX +
      '?subject=' + encodeURIComponent('Quote request — ' + $('#type').value + ' — ' + $('#name').value.trim()) +
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
     8. Footer year
  --------------------------------------------------------- */
  $('#yr').textContent = new Date().getFullYear();
})();
