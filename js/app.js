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
    if (window.APP_VERSION) {
      document.getElementById('version-label').textContent = t('versionLabel', { version: window.APP_VERSION });
      document.getElementById('version').hidden = false;
    }
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
    { fill: '#b8262f', text: '#fff7ea' }, // cranberry
    { fill: '#1d6646', text: '#fff7ea' }, // pine
    { fill: '#e8b44f', text: '#4a230f' }, // gold
    { fill: '#fbf1de', text: '#a01e25' }  // cream
  ];
  var LABEL_FONT = '"Figtree", system-ui, -apple-system, "Segoe UI", sans-serif';

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

  // Icon buttons hold <svg><use href="#icon-id"></svg>; swap the icon and its label.
  function setIcon(btn, id, label) {
    btn.querySelector('use').setAttribute('href', '#' + id);
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }

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

  // Find the largest font size where the label fits in the slice, then even out the
  // line lengths ("Everyone / Pass Left" rather than "Everyone Pass / Left").
  function fitLabel(text, maxWidth, maxHeight, maxSize, minSize) {
    for (var size = maxSize; size >= minSize; size -= 1) {
      ctx.font = '800 ' + size + 'px ' + LABEL_FONT;
      var lines = wrap(text, maxWidth);
      var widest = Math.max.apply(null, lines.map(function (l) { return ctx.measureText(l).width; }));
      if (widest <= maxWidth && lines.length * size * 1.12 <= maxHeight) {
        return { size: size, lines: balance(text, lines.length, maxWidth) };
      }
    }
    ctx.font = '800 ' + minSize + 'px ' + LABEL_FONT;
    return { size: minSize, lines: wrap(text, maxWidth) };
  }

  // The narrowest wrap that still uses the same number of lines.
  function balance(text, count, maxWidth) {
    if (count < 2) return wrap(text, maxWidth);
    var lo = 0;
    var hi = maxWidth;
    for (var k = 0; k < 14; k++) {
      var mid = (lo + hi) / 2;
      if (wrap(text, mid).length <= count) hi = mid;
      else lo = mid;
    }
    return wrap(text, hi);
  }

  // ---------- drawing ----------
  // The wheel is drawn in a fixed 800 × 800 space (radius 400) and scaled to fit,
  // so the label layout only needs measuring when the actions change.
  var WHEEL = {
    outer: 393,  // brass rim
    rimIn: 355,  // dark edge inside the rim
    R: 352,      // slices
    bulbs: 374,  // marquee lights on the rim
    hub: 80
  };
  var labelCache = null;
  var wheelWrap = canvas.parentNode;

  function resize() {
    var rect = stageEl.getBoundingClientRect();
    // Leave room above the wheel for the pointer, which sticks out 3.6% of the wheel's size.
    var size = Math.floor(Math.max(200, Math.min((rect.height - 8) / 1.04, rect.width)));
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    wheelWrap.style.marginTop = Math.round(size * 0.036) + 'px';
    draw();
  }

  function slicePath(start, end) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, WHEEL.R, start, end);
    ctx.closePath();
  }

  function circle(r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
  }

  function draw() {
    var W = canvas.width;
    var R = WHEEL.R;
    var n = actions.length;
    var seg = TAU / n;
    var i;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.translate(W / 2, W / 2);
    ctx.scale(W / 800, W / 800);

    // Brass rim, lit from the upper left (the lighting doesn't turn with the wheel)
    var brass = ctx.createLinearGradient(-WHEEL.outer, -WHEEL.outer, WHEEL.outer, WHEEL.outer);
    brass.addColorStop(0, '#f8e3a3');
    brass.addColorStop(0.35, '#e2b65a');
    brass.addColorStop(0.7, '#a9782a');
    brass.addColorStop(1, '#e8c46e');
    circle(WHEEL.outer);
    ctx.fillStyle = brass;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#5e3f10';
    ctx.stroke();
    circle(WHEEL.rimIn);
    ctx.fillStyle = '#5e3f10';
    ctx.fill();

    // Labels are measured once per action list, then reused every frame.
    if (!labelCache) {
      var inner = R * 0.27;
      var textOuter = R * 0.9;
      var maxWidth = textOuter - inner;
      var mid = (textOuter + inner) / 2;
      var maxHeight = Math.min(2 * Math.sin(Math.min(seg, Math.PI) / 2) * mid * 0.92, R * 0.5);
      if (n === 1) maxHeight = R * 0.5;
      labelCache = actions.map(function (a) {
        return fitLabel(a.title, maxWidth, maxHeight, Math.round(R * 0.1), 10);
      });
      labelCache.x = textOuter;
    }

    // Slices
    for (i = 0; i < n; i++) {
      slicePath(rotation + i * seg, rotation + (i + 1) * seg);
      ctx.fillStyle = sliceColor(i, n).fill;
      ctx.fill();
    }

    // Soft shading so the face looks rounded, like an ornament
    var shade = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    shade.addColorStop(0, 'rgba(255, 255, 255, .16)');
    shade.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    shade.addColorStop(1, 'rgba(0, 0, 0, .3)');
    circle(R);
    ctx.fillStyle = shade;
    ctx.fill();

    // Gold dividers
    if (n > 1) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#f3d58a';
      for (i = 0; i < n; i++) {
        var a0 = rotation + i * seg;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a0) * R, Math.sin(a0) * R);
        ctx.stroke();
      }
    }

    // Labels, reading from the hub out to the rim
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (i = 0; i < n; i++) {
      var label = labelCache[i];
      ctx.save();
      ctx.rotate(rotation + (i + 0.5) * seg);
      ctx.font = '800 ' + label.size + 'px ' + LABEL_FONT;
      ctx.fillStyle = sliceColor(i, n).text;
      var lh = label.size * 1.1;
      for (var l = 0; l < label.lines.length; l++) {
        ctx.fillText(label.lines[l], labelCache.x, (l - (label.lines.length - 1) / 2) * lh);
      }
      ctx.restore();
    }

    // Once the wheel stops, dim the other slices and outline the winner
    if (winner !== -1 && n > 1) {
      ctx.fillStyle = 'rgba(5, 13, 9, .55)';
      for (i = 0; i < n; i++) {
        if (i === winner) continue;
        slicePath(rotation + i * seg, rotation + (i + 1) * seg);
        ctx.fill();
      }
      slicePath(rotation + winner * seg, rotation + (winner + 1) * seg);
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#fff3c4';
      ctx.stroke();
    }

    // Marquee lights on the rim. They turn with the wheel and chase while it spins.
    var chase = spinning ? Math.floor(performance.now() / 110) % 2 : -1;
    for (var b = 0; b < 24; b++) {
      var ba = rotation + (b / 24) * TAU;
      var bx = Math.cos(ba) * WHEEL.bulbs;
      var by = Math.sin(ba) * WHEEL.bulbs;
      ctx.globalAlpha = b % 2 === chase ? 0.4 : 1;
      ctx.fillStyle = b % 2 ? '#fff4cf' : '#ffc447';
      ctx.beginPath();
      ctx.arc(bx, by, 17, 0, TAU);
      ctx.globalAlpha *= 0.25;
      ctx.fill();
      ctx.globalAlpha = b % 2 === chase ? 0.4 : 1;
      ctx.beginPath();
      ctx.arc(bx, by, 8.5, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawHub(brass);
  }

  // Cream hub with a brass ring and a wrapped gift that stays upright.
  function drawHub(brass) {
    circle(WHEEL.hub);
    ctx.fillStyle = '#5e3f10';
    ctx.fill();
    circle(74);
    ctx.fillStyle = '#fbf1de';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = brass;
    ctx.stroke();

    ctx.save();
    ctx.translate(0, 8);
    ctx.fillStyle = '#b8262f';
    roundRect(-30, -12, 60, 42, 4);
    ctx.fill();
    ctx.fillStyle = '#d13a43';
    roundRect(-35, -26, 70, 17, 3);
    ctx.fill();
    ctx.fillStyle = '#e8b44f';
    ctx.fillRect(-6, -26, 12, 56);
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#e8b44f';
    [-1, 1].forEach(function (side) {
      ctx.beginPath();
      ctx.moveTo(0, -27);
      ctx.bezierCurveTo(side * 6, -44, side * 28, -46, side * 26, -34);
      ctx.bezierCurveTo(side * 24, -26, side * 10, -27, 0, -27);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.arc(0, -27, 5.5, 0, TAU);
    ctx.fillStyle = '#f3cf72';
    ctx.fill();
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
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

  // ---------- game-over jingle ----------
  // A bouncy bell tune over sleigh bells and an oom-pah bass (C – F – G7 – C), landing
  // on a big ringing chord. finale(ctx, out) schedules everything from ctx.currentTime,
  // so it can also be rendered offline.
  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  // Struck-instrument envelope: near-instant attack, then an exponential fade to silence.
  function strike(param, t0, vol, len) {
    param.setValueAtTime(0.0001, t0);
    param.exponentialRampToValueAtTime(vol, t0 + 0.004);
    param.exponentialRampToValueAtTime(0.0001, t0 + len);
  }

  function voice(a, out, type, freq, t0, len, vol) {
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    strike(g.gain, t0, vol, len);
    o.connect(g).connect(out);
    o.start(t0);
    o.stop(t0 + len + 0.05);
  }

  // Glockenspiel-like bell: FM gives a bright metallic strike that mellows as it rings.
  function bell(a, out, freq, t0, len, vol) {
    var car = a.createOscillator();
    var mod = a.createOscillator();
    var depth = a.createGain();
    var amp = a.createGain();
    car.frequency.value = freq;
    mod.frequency.value = freq * 3.5;
    depth.gain.setValueAtTime(freq * 2.5, t0);
    depth.gain.exponentialRampToValueAtTime(freq * 0.1, t0 + 0.3);
    strike(amp.gain, t0, vol, len);
    mod.connect(depth).connect(car.frequency);
    car.connect(amp).connect(out);
    mod.start(t0);
    car.start(t0);
    mod.stop(t0 + len + 0.05);
    car.stop(t0 + len + 0.05);
  }

  // One shake of sleigh bells: a burst of high hiss plus a few tiny, quick bells.
  var noiseBuf = null;
  function jingle(a, out, t0, vol) {
    if (!noiseBuf || noiseBuf.sampleRate !== a.sampleRate) {
      noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); // 1 second
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var hiss = a.createBufferSource();
    var hp = a.createBiquadFilter();
    var g = a.createGain();
    hiss.buffer = noiseBuf;
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    strike(g.gain, t0, vol, 0.12);
    hiss.connect(hp).connect(g).connect(out);
    hiss.start(t0, Math.random() * 0.8); // a different stretch of noise each shake
    hiss.stop(t0 + 0.15);
    for (var j = 0; j < 4; j++) {
      voice(a, out, 'sine', 3000 + Math.random() * 4000, t0 + Math.random() * 0.025, 0.09, vol * 0.25);
    }
  }

  var FINALE_STEP = 0.15; // seconds per eighth note
  // Melody: [eighth note it starts on, MIDI note, length in eighths]
  var FINALE_TUNE = [
    [0, 79, 1], [1, 76, 1], [2, 79, 1], [3, 84, 1],   // G E G C
    [4, 88, 2], [6, 86, 1], [7, 84, 1],               // E– D C
    [8, 81, 1], [9, 84, 1], [10, 89, 1], [11, 88, 1], // A C F E
    [12, 89, 2], [14, 86, 1], [15, 83, 1],            // F– D B
    [16, 84, 18]                                      // C, left to ring
  ];
  // One per bar: [bass note on the downbeat, short chord on the second beat]
  var FINALE_BARS = [
    [48, [64, 67, 72]], // C
    [43, [64, 67, 72]], // C over G
    [41, [65, 69, 72]], // F
    [43, [65, 67, 71]]  // G7
  ];

  function finale(a, out) {
    var s = FINALE_STEP;
    var t = a.currentTime + 0.05;
    var land = t + 16 * s; // where the final chord lands
    FINALE_TUNE.forEach(function (n) {
      bell(a, out, hz(n[1]), t + n[0] * s, n[2] * s + 0.3, 0.2);
    });
    FINALE_BARS.forEach(function (bar, i) {
      var b = t + i * 4 * s;
      voice(a, out, 'triangle', hz(bar[0]), b, 0.25, 0.22);
      bar[1].forEach(function (m) { voice(a, out, 'triangle', hz(m), b + 2 * s, 0.14, 0.05); });
    });
    for (var i = 0; i < 16; i++) jingle(a, out, t + i * s, i % 2 ? 0.075 : 0.135); // accent the beats
    // The landing: a ringing C chord with a twinkle on top and a fading sleigh-bell shake.
    [72, 76, 79].forEach(function (m) { bell(a, out, hz(m), land, 3, 0.09); });
    [48, 36].forEach(function (m) { voice(a, out, 'triangle', hz(m), land, 1.5, 0.2); });
    [88, 91, 96].forEach(function (m, k) { bell(a, out, hz(m), land + (k + 1) * s / 2, 1, 0.07); });
    for (var k = 0; k < 10; k++) jingle(a, out, land + k * 0.04, 0.18 * Math.pow(0.75, k));
  }

  function playFinale() {
    var a = audioCtx();
    if (a) finale(a, a.destination);
  }

  function setMuted(m) {
    muted = m;
    store(STORAGE_MUTED, m ? '1' : null);
    setIcon(soundBtn, m ? 'i-mute' : 'i-sound', t(m ? 'soundOff' : 'soundOn'));
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

  var CONFETTI_COLORS = ['#b8262f', '#1d6646', '#e2b65a', '#fbf3e4', '#e86a5f', '#3fbf7f'];
  var SNOW_COLORS = ['#ffffff', '#eef6ff', '#dceeff', '#bfe3ff'];

  // snow: true for a flurry of snowflakes (game over) instead of paper confetti.
  function confetti(snow) {
    if (reduceMotion) return;
    var dpr = window.devicePixelRatio || 1;
    confettiCanvas.width = window.innerWidth * dpr;
    confettiCanvas.height = window.innerHeight * dpr;
    var colors = snow ? SNOW_COLORS : CONFETTI_COLORS;
    for (var i = 0; i < 180; i++) {
      var round = snow || i % 5 === 0;
      var w = (round ? 5 + Math.random() * 7 : 6 + Math.random() * 8) * dpr;
      pieces.push({
        x: Math.random() * confettiCanvas.width,
        y: -Math.random() * confettiCanvas.height * 0.5,
        w: w,
        h: round ? w : (10 + Math.random() * 10) * dpr,
        round: round,
        vx: (Math.random() - 0.5) * (snow ? 1.5 : 3) * dpr,
        vy: (snow ? 1 + Math.random() * 2 : 2 + Math.random() * 4) * dpr,
        grav: snow ? 0.01 : 0.04,
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
      p.vy += p.grav;
      p.rot += p.vr;
      cctx.fillStyle = p.color;
      if (p.round) {
        cctx.beginPath();
        cctx.arc(p.x, p.y, p.w / 2, 0, TAU);
        cctx.fill();
        return;
      }
      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate(p.rot);
      cctx.scale(1, Math.cos(p.rot * 2)); // flutter
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
    setIcon(timerToggle, running ? 'i-pause' : 'i-play', t(running ? 'timerPause' : 'timerStart'));
    timerToggle.disabled = timer.over;
  }

  function tickTimer() {
    if (!timerRunning()) return;
    var left = timeLeft();
    if (left <= 0) { endGame(false); return; }
    var secs = Math.ceil(left / 1000);
    if (secs <= 10 && secs !== lastBeep) {
      lastBeep = secs;
      // A beep each second for the last 10; the final 3 are higher and a touch longer.
      if (secs <= 3) tone(1174.66, 0, 0.18, 'sine', 0.14);
      else tone(880, 0, 0.12, 'sine', 0.12);
    }
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
    playFinale();
  }

  function showGameOver() {
    hideResult();
    gameoverEl.hidden = false;
    confetti(true);
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
  // The version links to the repo in a new tab; drop focus so it doesn't keep a focus ring.
  document.getElementById('version').addEventListener('click', function (e) { e.currentTarget.blur(); });

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
  // The wheel labels and clock are measured in the bundled fonts; redo both once they load.
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('800 40px "Figtree"'),
      document.fonts.load('700 40px "Fraunces"')
    ]).then(function () {
      labelCache = null;
      draw();
      fittedLength = 0;
      fitTimerTime();
    }, function () { /* keep the fallback fonts */ });
  }
  if (timerRunning() && timeLeft() <= 0) endGame(true); // expired while the page was closed
  renderTimer();
  setInterval(tickTimer, 200);
})();
