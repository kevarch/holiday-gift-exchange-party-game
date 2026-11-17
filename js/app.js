// Holiday Gift Exchange: spin wheel.
// See docs/spin-wheel.md for behavior. Default actions live in js/actions.js;
// all on-screen wording lives in js/strings.js.
(function () {
  'use strict';

  // ---------- wording ----------
  var TEXT = window.TEXT || {};
  // t('key', { name: value }) looks up a phrase and fills in any {name} placeholders.
  function t(key, vars) {
    var s = TEXT[key];
    if (typeof s !== 'string') return key;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars && k in vars ? vars[k] : m; });
  }
  function applyText() {
    document.title = t('pageTitle');
    [].forEach.call(document.querySelectorAll('[data-text]'), function (el) { el.textContent = t(el.dataset.text); });
    [].forEach.call(document.querySelectorAll('[data-html]'), function (el) { el.innerHTML = t(el.dataset.html); });
    [].forEach.call(document.querySelectorAll('[data-title]'), function (el) { el.title = t(el.dataset.title); });
    [].forEach.call(document.querySelectorAll('[data-aria-label]'), function (el) { el.setAttribute('aria-label', t(el.dataset.ariaLabel)); });
  }
  applyText();

  var STORAGE_ACTIONS = 'giftExchange.actions';
  var STORAGE_MUTED = 'giftExchange.muted';
  var STORAGE_CLEAN = 'giftExchange.cleanDisplay';
  var NEXT_KEYS = ['PageDown', 'ArrowRight', 'ArrowDown', ' ', 'Enter'];
  var BACK_KEYS = ['PageUp', 'ArrowLeft', 'ArrowUp', 'Backspace', 'Escape'];
  var TAU = Math.PI * 2;
  var POINTER_ANGLE = Math.PI * 1.5; // straight up, in canvas angle terms

  var SLICE_COLORS = [
    { fill: '#c0392b', text: '#fff7ec' }, // red
    { fill: '#1e7a4f', text: '#fff7ec' }, // green
    { fill: '#f2c14e', text: '#3a1d0e' }, // gold
    { fill: '#f6efe2', text: '#8c1c13' }  // cream
  ];

  // Each action is { title, details }. A plain string is accepted as a title with no details.
  function normalize(a) {
    if (typeof a === 'string') return { title: a.trim(), details: '' };
    if (a && typeof a.title === 'string') {
      return { title: a.title.trim(), details: typeof a.details === 'string' ? a.details.trim() : '' };
    }
    return null;
  }
  function validList(list) {
    if (!Array.isArray(list) || !list.length) return null;
    var out = list.map(normalize);
    return out.every(function (a) { return a && a.title; }) ? out : null;
  }
  function sameList(a, b) {
    return a.length === b.length && a.every(function (x, i) {
      return x.title === b[i].title && x.details === b[i].details;
    });
  }

  var defaults = validList(window.DEFAULT_ACTIONS) || [];
  var DETAIL_SEP = ' | ';

  // ---------- storage ----------
  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) { /* storage unavailable; keep in memory */ }
  }
  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function loadActions() {
    try {
      var saved = validList(JSON.parse(load(STORAGE_ACTIONS)));
      if (saved) return saved;
    } catch (e) { /* fall through */ }
    return defaults.slice();
  }

  // ---------- state ----------
  var actions = loadActions();
  var rotation = 0;
  var spinning = false;
  var winner = -1;
  var editorOpen = false;
  var muted = load(STORAGE_MUTED) === '1';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- elements ----------
  var canvas = document.getElementById('wheel');
  var ctx = canvas.getContext('2d');
  var pointerEl = document.getElementById('pointer');
  var stageEl = document.getElementById('stage');
  var resultEl = document.getElementById('result');
  var resultText = document.getElementById('result-text');
  var resultDetails = document.getElementById('result-details');
  var editorEl = document.getElementById('editor');
  var editorForm = document.getElementById('editor-form');
  var editorText = document.getElementById('editor-text');
  var editorError = document.getElementById('editor-error');
  var soundBtn = document.getElementById('sound-btn');

  // ---------- helpers ----------
  function mod(a, n) { return ((a % n) + n) % n; }

  function sliceColor(i, n) {
    var c = i % SLICE_COLORS.length;
    // Keep the last slice from matching its neighbor, the first slice.
    // (When that happens the slice before it is the last color, so 1 is safe.)
    if (n > 1 && i === n - 1 && c === 0) c = 1;
    return SLICE_COLORS[c];
  }

  function sliceUnderPointer(rot) {
    var seg = TAU / actions.length;
    return Math.floor(mod(POINTER_ANGLE - rot, TAU) / seg) % actions.length;
  }

  // Wrap words into lines no wider than maxWidth at the current ctx font.
  function wrap(text, maxWidth) {
    var words = text.split(/\s+/);
    var lines = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // Find the largest font size where the label fits in the slice.
  function fitLabel(text, maxWidth, maxHeight, maxSize, minSize) {
    for (var size = maxSize; size >= minSize; size -= 1) {
      ctx.font = '800 ' + size + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
      var lines = wrap(text, maxWidth);
      var widest = Math.max.apply(null, lines.map(function (l) { return ctx.measureText(l).width; }));
      if (widest <= maxWidth && lines.length * size * 1.12 <= maxHeight) return { size: size, lines: lines };
    }
    ctx.font = '800 ' + minSize + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
    return { size: minSize, lines: wrap(text, maxWidth) };
  }

  // ---------- drawing ----------
  var labelCache = null;

  function resize() {
    var rect = stageEl.getBoundingClientRect();
    var size = Math.floor(Math.max(200, Math.min(rect.height - 24, rect.width)));
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    labelCache = null;
    draw();
  }

  function draw() {
    var W = canvas.width;
    var c = W / 2;
    var outer = c * 0.98;
    var R = c * 0.9;
    var n = actions.length;
    var seg = TAU / n;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.translate(c, c);

    // Rim
    ctx.beginPath();
    ctx.arc(0, 0, outer, 0, TAU);
    ctx.fillStyle = '#8c1c13';
    ctx.fill();
    ctx.lineWidth = c * 0.012;
    ctx.strokeStyle = '#f2c14e';
    ctx.stroke();

    // Rim lights (rotate with the wheel)
    var bulbs = 24;
    for (var b = 0; b < bulbs; b++) {
      var a = rotation + (b / bulbs) * TAU;
      var br = (outer + R) / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * br, Math.sin(a) * br, c * 0.022, 0, TAU);
      ctx.fillStyle = b % 2 ? '#fff3c4' : '#f2c14e';
      ctx.fill();
    }

    // Labels are measured once per size/action list, then reused every frame.
    if (!labelCache) {
      var inner = R * 0.2;
      var textOuter = R * 0.92;
      var maxWidth = textOuter - inner;
      var mid = (textOuter + inner) / 2;
      var maxHeight = Math.min(2 * Math.sin(Math.min(seg, Math.PI) / 2) * mid * 0.92, R * 0.5);
      if (n === 1) maxHeight = R * 0.5;
      labelCache = actions.map(function (a) {
        return fitLabel(a.title, maxWidth, maxHeight, Math.round(R * 0.1), Math.max(8, Math.round(R * 0.03)));
      });
      labelCache.x = textOuter;
    }

    for (var i = 0; i < n; i++) {
      var start = rotation + i * seg;
      var color = sliceColor(i, n);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, start, start + seg);
      ctx.closePath();
      ctx.fillStyle = color.fill;
      ctx.fill();
      if (n > 1) {
        ctx.lineWidth = c * 0.008;
        ctx.strokeStyle = 'rgba(58, 29, 14, .35)';
        ctx.stroke();
      }

      // Label, reading from the hub out to the rim
      var label = labelCache[i];
      ctx.save();
      ctx.rotate(start + seg / 2);
      ctx.font = '800 ' + label.size + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillStyle = color.text;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      var lh = label.size * 1.12;
      for (var l = 0; l < label.lines.length; l++) {
        ctx.fillText(label.lines[l], labelCache.x, (l - (label.lines.length - 1) / 2) * lh);
      }
      ctx.restore();

      // Dim the losing slices once the wheel stops
      if (winner !== -1 && i !== winner) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, start, start + seg);
        ctx.closePath();
        ctx.fillStyle = 'rgba(8, 16, 12, .55)';
        ctx.fill();
      }
    }

    // Winning slice outline
    if (winner !== -1 && n > 1) {
      var ws = rotation + winner * seg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, ws, ws + seg);
      ctx.closePath();
      ctx.lineWidth = c * 0.02;
      ctx.strokeStyle = '#fff3c4';
      ctx.stroke();
    }

    // Hub
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.16, 0, TAU);
    ctx.fillStyle = '#f2c14e';
    ctx.fill();
    ctx.lineWidth = c * 0.014;
    ctx.strokeStyle = '#8c1c13';
    ctx.stroke();
    ctx.font = Math.round(R * 0.15) + 'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁', 0, R * 0.01);
  }

  // ---------- sound (generated, no files) ----------
  var audio = null;
  var lastTick = 0;

  function audioCtx() {
    if (muted) return null;
    if (!audio) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }

  function tone(freq, startAt, dur, type, vol) {
    var a = audioCtx();
    if (!a) return;
    var osc = a.createOscillator();
    var gain = a.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, a.currentTime + startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + startAt + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(a.currentTime + startAt);
    osc.stop(a.currentTime + startAt + dur + 0.02);
  }

  function playTick() {
    var now = performance.now();
    if (now - lastTick < 35) return;
    lastTick = now;
    tone(1400, 0, 0.035, 'square', 0.05);
    pointerEl.classList.remove('tick');
    void pointerEl.offsetWidth; // restart the animation
    pointerEl.classList.add('tick');
  }

  function playWin() {
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      tone(f, i * 0.11, 0.5, 'triangle', 0.18);
    });
  }

  function setMuted(m) {
    muted = m;
    store(STORAGE_MUTED, m ? '1' : null);
    soundBtn.textContent = m ? '🔇' : '🔊';
    soundBtn.title = t(m ? 'soundOff' : 'soundOn');
  }

  // ---------- spinning ----------
  function spin() {
    if (spinning || modalOpen() || !actions.length) return;
    if (timer.over) { showGameOver(); return; }
    hideResult();
    audioCtx(); // unlock audio on this user gesture

    var n = actions.length;
    var seg = TAU / n;
    var target = Math.floor(Math.random() * n);
    var within = 0.15 + Math.random() * 0.7; // never land on a divider
    var finalAngle = POINTER_ANGLE - (target + within) * seg;
    var turns = 5 + Math.floor(Math.random() * 3);
    var from = rotation;
    var delta = mod(finalAngle - from, TAU) + turns * TAU;
    var duration = 5200 + Math.random() * 1200;
    var t0 = performance.now();
    var lastSlice = sliceUnderPointer(from);

    spinning = true;
    winner = -1;

    function frame(now) {
      var p = Math.min(1, (now - t0) / duration);
      var eased = 1 - Math.pow(1 - p, 4);
      rotation = from + delta * eased;
      var s = sliceUnderPointer(rotation);
      if (s !== lastSlice) { lastSlice = s; playTick(); }
      draw();
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        rotation = mod(rotation, TAU);
        spinning = false;
        if (timer.over) {
          // Time ran out mid-spin: the game is over, so this spin doesn't count.
          draw();
          showGameOver();
        } else {
          winner = sliceUnderPointer(rotation);
          draw();
          showResult(actions[winner]);
        }
      }
    }
    requestAnimationFrame(frame);
  }

  function showResult(action) {
    resultText.textContent = action.title;
    resultDetails.textContent = action.details;
    resultDetails.hidden = !action.details;
    resultEl.hidden = false;
    playWin();
    confetti();
  }

  function hideResult() {
    resultEl.hidden = true;
  }

  function dismiss() {
    if (spinning) return;
    hideResult();
    gameoverEl.hidden = true;
    if (winner !== -1) { winner = -1; draw(); }
  }

  // ---------- confetti ----------
  var confettiCanvas = document.getElementById('confetti');
  var cctx = confettiCanvas.getContext('2d');
  var pieces = [];
  var confettiRunning = false;

  function confetti() {
    if (reduceMotion) return;
    var dpr = window.devicePixelRatio || 1;
    confettiCanvas.width = window.innerWidth * dpr;
    confettiCanvas.height = window.innerHeight * dpr;
    var colors = ['#c0392b', '#1e7a4f', '#f2c14e', '#f6efe2', '#e86a5f', '#3fbf7f'];
    for (var i = 0; i < 180; i++) {
      pieces.push({
        x: Math.random() * confettiCanvas.width,
        y: -Math.random() * confettiCanvas.height * 0.5,
        w: (6 + Math.random() * 8) * dpr,
        h: (10 + Math.random() * 10) * dpr,
        vx: (Math.random() - 0.5) * 3 * dpr,
        vy: (2 + Math.random() * 4) * dpr,
        rot: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[i % colors.length]
      });
    }
    if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(confettiFrame); }
  }

  function confettiFrame() {
    var H = confettiCanvas.height;
    cctx.clearRect(0, 0, confettiCanvas.width, H);
    pieces = pieces.filter(function (p) { return p.y < H + 40; });
    pieces.forEach(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.rot += p.vr;
      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot);
      cctx.scale(1, Math.cos(p.rot * 2)); // flutter
      cctx.fillStyle = p.color;
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cctx.restore();
    });
    if (pieces.length) requestAnimationFrame(confettiFrame);
    else confettiRunning = false;
  }

  // ---------- editor ----------
  function openEditor() {
    if (spinning) return;
    dismiss();
    editorOpen = true;
    editorText.value = serialize(actions);
    editorError.textContent = '';
    editorEl.hidden = false;
    editorText.focus();
  }

  function closeEditor() {
    editorOpen = false;
    editorEl.hidden = true;
    editorText.blur();
  }

  // Editor format: one action per line, "Title | Details" (details optional).
  function serialize(list) {
    return list.map(function (a) {
      return a.details ? a.title + DETAIL_SEP + a.details : a.title;
    }).join('\n');
  }

  function parseEditor() {
    return editorText.value.split('\n')
      .map(function (line) {
        var i = line.indexOf('|');
        if (i === -1) return { title: line.trim(), details: '' };
        return { title: line.slice(0, i).trim(), details: line.slice(i + 1).trim() };
      })
      .filter(function (a) { return a.title || a.details; });
  }

  editorForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var list = parseEditor();
    if (!list.length) {
      editorError.textContent = t('actionsEditorErrorEmpty');
      return;
    }
    var missing = list.filter(function (a) { return !a.title; });
    if (missing.length) {
      editorError.textContent = t('actionsEditorErrorTitle');
      return;
    }
    actions = list;
    store(STORAGE_ACTIONS, sameList(list, defaults) ? null : JSON.stringify(list));
    winner = -1;
    rotation = 0;
    labelCache = null;
    draw();
    closeEditor();
  });

  document.getElementById('editor-reset').addEventListener('click', function () {
    editorText.value = serialize(defaults);
    editorError.textContent = '';
    editorText.focus();
  });
  document.getElementById('editor-cancel').addEventListener('click', closeEditor);
  editorEl.addEventListener('mousedown', function (e) { if (e.target === editorEl) closeEditor(); });

  // ---------- game timer ----------
  // Counts down the length of the game. At zero the game is over: all gifts are
  // frozen and the wheel stops spinning until the timer is reset.
  // Saved to localStorage (with an end time while running) so a reload doesn't lose the clock.
  var STORAGE_TIMER = 'giftExchange.timer';
  var DEFAULT_MINUTES = 30;
  var MAX_MINUTES = 600;

  var timerEl = document.getElementById('timer');
  var timerTime = document.getElementById('timer-time');
  var timerStatus = document.getElementById('timer-status');
  var timerToggle = document.getElementById('timer-toggle');
  var timerEditorEl = document.getElementById('timer-editor');
  var timerForm = document.getElementById('timer-form');
  var timerMinutes = document.getElementById('timer-minutes');
  var timerError = document.getElementById('timer-error');
  var gameoverEl = document.getElementById('gameover');
  var timerEditorOpen = false;
  var lastBeep = -1;

  // { minutes, remaining (ms, used while stopped), endsAt (epoch ms while running, else null), over }
  function freshTimer(minutes) {
    return { minutes: minutes, remaining: minutes * 60000, endsAt: null, over: false };
  }
  function loadTimer() {
    try {
      var t = JSON.parse(load(STORAGE_TIMER));
      if (t && t.minutes >= 1 && t.minutes <= MAX_MINUTES && typeof t.remaining === 'number') {
        return {
          minutes: t.minutes,
          remaining: Math.max(0, t.remaining),
          endsAt: typeof t.endsAt === 'number' ? t.endsAt : null,
          over: !!t.over
        };
      }
    } catch (e) { /* fall through */ }
    return freshTimer(DEFAULT_MINUTES);
  }
  var timer = loadTimer();

  function saveTimer() { store(STORAGE_TIMER, JSON.stringify(timer)); }
  function timerRunning() { return timer.endsAt !== null; }
  function timeLeft() { return timerRunning() ? Math.max(0, timer.endsAt - Date.now()) : timer.remaining; }
  function timerStarted() { return timerRunning() || timer.remaining < timer.minutes * 60000; }
  function modalOpen() { return editorOpen || timerEditorOpen; }

  function formatTime(ms) {
    var s = Math.ceil(ms / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return h ? h + ':' + pad(m) + ':' + pad(sec) : m + ':' + pad(sec);
  }

  // Times of an hour or more ("1:00:00") are wider than the timer box allows, so shrink
  // the clock's font just enough to fit. Digits are fixed-width, so this only needs
  // re-measuring when the text length or the window size changes.
  var fittedLength = 0;
  function fitTimerTime() {
    var len = timerTime.textContent.length;
    if (len === fittedLength) return;
    timerTime.style.fontSize = '';
    var box = getComputedStyle(timerEl);
    var room = timerEl.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight);
    if (room <= 0) return; // not laid out yet; try again next render
    fittedLength = len;
    var need = timerTime.scrollWidth;
    if (need > room) {
      var size = parseFloat(getComputedStyle(timerTime).fontSize);
      timerTime.style.fontSize = Math.floor(size * room / need) + 'px';
    }
  }
  window.addEventListener('resize', function () { fittedLength = 0; fitTimerTime(); });

  function renderTimer() {
    var left = timeLeft();
    var running = timerRunning();
    timerTime.textContent = formatTime(left);
    fitTimerTime();
    var status = '';
    if (timer.over) status = t('timerOver');
    else if (!running && timerStarted()) status = t('timerPaused');
    timerStatus.textContent = status;
    timerEl.classList.toggle('paused', !running && timerStarted() && !timer.over);
    timerEl.classList.toggle('over', timer.over);
    timerEl.classList.toggle('low', !timer.over && timerStarted() && left <= 60000);
    timerEl.classList.toggle('final', running && left <= 10000);
    document.body.classList.toggle('frozen', timer.over);
    timerToggle.textContent = running ? '⏸' : '▶';
    timerToggle.title = t(running ? 'timerPause' : 'timerStart');
    timerToggle.disabled = timer.over;
  }

  function tickTimer() {
    if (!timerRunning()) return;
    var left = timeLeft();
    if (left <= 0) { endGame(false); return; }
    var secs = Math.ceil(left / 1000);
    if (secs <= 5 && secs !== lastBeep) { lastBeep = secs; tone(880, 0, 0.12, 'sine', 0.12); }
    renderTimer();
  }

  function startTimer() {
    if (timer.over || timerRunning() || modalOpen()) return;
    audioCtx(); // unlock audio on this user gesture so the end sound can play
    timer.endsAt = Date.now() + timer.remaining;
    saveTimer();
    renderTimer();
  }

  function pauseTimer() {
    if (!timerRunning()) return;
    timer.remaining = timeLeft();
    timer.endsAt = null;
    saveTimer();
    renderTimer();
  }

  function toggleTimer() {
    if (timerRunning()) pauseTimer();
    else startTimer();
  }

  function resetTimer(minutes) {
    if (modalOpen()) return;
    if (!minutes && !timer.over && timerStarted() && !window.confirm(t('timerResetConfirm', { minutes: timer.minutes }))) return;
    timer = freshTimer(minutes || timer.minutes);
    lastBeep = -1;
    saveTimer();
    gameoverEl.hidden = true;
    renderTimer();
  }

  // quiet: true when restoring a timer that ran out while the page was closed.
  function endGame(quiet) {
    timer.over = true;
    timer.remaining = 0;
    timer.endsAt = null;
    saveTimer();
    renderTimer();
    if (quiet) return;
    if (!spinning) {
      hideResult();
      winner = -1;
      draw();
      showGameOver();
    } // else the spin finishes, then shows the game-over card
    [1046.5, 783.99, 659.25, 523.25].forEach(function (f, i) {
      tone(f, i * 0.22, 0.9, 'triangle', 0.2);
    });
  }

  function showGameOver() {
    hideResult();
    gameoverEl.hidden = false;
    confetti();
  }

  function openTimerEditor() {
    if (spinning || modalOpen()) return;
    timerEditorOpen = true;
    timerMinutes.value = timer.minutes;
    timerError.textContent = '';
    timerEditorEl.hidden = false;
    timerMinutes.focus();
    timerMinutes.select();
  }

  function closeTimerEditor() {
    timerEditorOpen = false;
    timerEditorEl.hidden = true;
    timerMinutes.blur();
  }

  timerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = Number(timerMinutes.value);
    if (!(m >= 1 && m <= MAX_MINUTES && Math.floor(m) === m)) {
      timerError.textContent = t('timerEditorError', { max: MAX_MINUTES });
      return;
    }
    closeTimerEditor();
    resetTimer(m);
  });
  timerForm.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') closeTimerEditor(); });
  document.getElementById('timer-cancel').addEventListener('click', closeTimerEditor);
  timerEditorEl.addEventListener('mousedown', function (e) { if (e.target === timerEditorEl) closeTimerEditor(); });

  function onButton(id, fn) {
    document.getElementById(id).addEventListener('click', function (e) { e.currentTarget.blur(); fn(); });
  }
  onButton('timer-toggle', toggleTimer);
  onButton('timer-reset', function () { resetTimer(); });
  onButton('timer-edit', openTimerEditor);
  onButton('timer-time', function () {
    // While controls are hidden the clock is display-only.
    if (!document.body.classList.contains('clean')) openTimerEditor();
  });
  gameoverEl.addEventListener('click', function () { gameoverEl.hidden = true; });

  // ---------- clean display (hide controls) ----------
  var uiToggleLabel = document.getElementById('ui-toggle-label');
  function setClean(on) {
    document.body.classList.toggle('clean', on);
    store(STORAGE_CLEAN, on ? '1' : null);
    uiToggleLabel.textContent = t(on ? 'showControls' : 'hideControls');
  }
  function toggleClean() { setClean(!document.body.classList.contains('clean')); }
  document.getElementById('ui-toggle').addEventListener('click', function (e) { e.currentTarget.blur(); toggleClean(); });

  // ---------- input ----------
  document.addEventListener('keydown', function (e) {
    if (editorOpen || timerEditorOpen) {
      if (e.key === 'Escape') { e.preventDefault(); closeEditor(); closeTimerEditor(); }
      return; // let typing through
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (NEXT_KEYS.indexOf(e.key) !== -1) {
      e.preventDefault();
      if (!e.repeat) spin();
    } else if (BACK_KEYS.indexOf(e.key) !== -1) {
      e.preventDefault();
      if (!e.repeat) dismiss();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      if (!e.repeat) toggleTimer();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      if (!e.repeat) resetTimer();
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      openEditor();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      setMuted(!muted);
    } else if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      if (!e.repeat) toggleClean();
    }
  });

  canvas.addEventListener('click', spin);
  resultEl.addEventListener('click', spin);
  document.getElementById('edit-btn').addEventListener('click', function (e) { e.currentTarget.blur(); openEditor(); });
  soundBtn.addEventListener('click', function (e) { e.currentTarget.blur(); setMuted(!muted); });

  window.addEventListener('resize', resize);
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) setClean(true); // going fullscreen = presenting
    setTimeout(resize, 50);
  });

  setMuted(muted);
  setClean(load(STORAGE_CLEAN) === '1');
  resize();
  if (timerRunning() && timeLeft() <= 0) endGame(true); // expired while the page was closed
  renderTimer();
  setInterval(tickTimer, 200);
})();
