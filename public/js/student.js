/*
 * Schüler-Ansichten: Heute, Lernzeit (geführte Sitzung), Termine, Training, Fortschritt.
 */
(function () {
  'use strict';
  var LP = window.LP, h = LP.h, svg = LP.svg, I = LP.I, store = LP.store, L = LP.learn, ui = LP.ui;
  var V = LP.views = LP.views || {};

  function pageHead(title, sub, right) {
    return h('header', { class: 'page-head' }, h('div', null, h('h1', null, title), sub ? h('p', { class: 'muted' }, sub) : null), right || null);
  }
  function stepIcon(kind) {
    return { review: I.bolt, focus: I.target, break: I.coffee, test: I.check, write: LP.writing.CAMERA }[kind] || I.target;
  }
  function greeting() {
    var hr = new Date().getHours();
    return hr < 11 ? 'Guten Morgen' : hr < 17 ? 'Hey' : 'Guten Abend';
  }

  /* ================================================================ HEUTE */

  V.today = function (el) {
    var st = LP.settings();
    var t = LP.today();
    var run = LP.lsGet('lp_run', null);
    var running = run && run.date === t && !run.finished && run.type === 'plan';
    var learnDay = L.isLearningDay(t);
    var done = L.doneToday();
    var plan = L.buildPlan(t);
    var xp = L.totalXp(), lv = L.level(xp), streak = L.streak();

    el.appendChild(h('header', { class: 'page-head' },
      h('div', null,
        h('p', { class: 'eyebrow' }, LP.fmtLong(t)),
        h('h1', null, greeting() + (st.studentName ? ', ' + st.studentName : '') + '!')),
      h('div', { class: 'stat-chips' },
        h('span', { class: 'chip strong', title: 'Serie: Lerntage am Stück' }, svg(I.flame), streak + (streak === 1 ? ' Tag' : ' Tage')),
        h('span', { class: 'chip strong', title: 'Level' }, svg(I.star), 'Level ' + lv.n))));

    var grid = h('div', { class: 'today-grid' });
    el.appendChild(grid);

    // ---- Hauptkarte: Lernzeit
    var main = h('section', { class: 'card plan-card' });
    grid.appendChild(main);
    var status;
    if (running) status = h('span', { class: 'pill warn' }, 'Angefangen – weitermachen!');
    else if (done) status = h('span', { class: 'pill good' }, svg(I.check), 'Heute erledigt');
    else if (learnDay) status = h('span', { class: 'pill' }, 'Lernzeit ab ' + st.startTime + ' Uhr');
    else status = h('span', { class: 'pill muted-pill' }, 'Heute lernfrei');

    main.appendChild(h('div', { class: 'plan-head' },
      h('div', null, h('h2', null, 'Deine Lernzeit heute'), h('p', { class: 'muted' }, plan.total + ' Minuten · immer der gleiche Ablauf')),
      status));

    var list = h('ol', { class: 'plan-steps' });
    plan.steps.forEach(function (s, i) {
      var subj = s.subjectId ? LP.subject(s.subjectId) : null;
      var stateCls = running ? (i < run.idx ? ' is-done' : i === run.idx ? ' is-current' : '') : (done ? ' is-done' : '');
      list.appendChild(h('li', { class: 'plan-step k-' + s.kind + stateCls, style: subj ? { '--c': subj.color } : null },
        h('span', { class: 'step-ico' }, svg(stepIcon(s.kind))),
        h('span', { class: 'step-body' }, h('strong', null, s.title), h('span', { class: 'muted small' }, s.sub || '')),
        h('span', { class: 'step-min' }, s.minutes + ' min')));
    });
    main.appendChild(list);

    var cta = h('div', { class: 'row plan-cta' });
    if (running) {
      cta.appendChild(h('a', { class: 'btn primary xl', href: '#/lernzeit' }, svg(I.play), 'Weitermachen'));
    } else if (!done && learnDay) {
      cta.appendChild(h('a', { class: 'btn primary xl', href: '#/lernzeit', onclick: function () { startRun(plan, 'plan'); } }, svg(I.play), 'Lernzeit starten'));
    } else if (done) {
      cta.appendChild(h('p', { class: 'muted' }, 'Stark! Wer heute noch mehr machen will: eine Extra-Runde bringt zusätzliche Punkte.'));
      cta.appendChild(h('a', { class: 'btn ghost', href: '#/lernzeit', onclick: function () { startRun(L.buildPlan(t, 20), 'extra'); } }, 'Extra-Runde (20 min)'));
    } else {
      cta.appendChild(h('p', { class: 'muted' }, 'Kein Pflichtprogramm heute. Freiwillig lernen zählt trotzdem – und bringt Punkte.'));
      cta.appendChild(h('a', { class: 'btn ghost', href: '#/lernzeit', onclick: function () { startRun(L.buildPlan(t, 20), 'extra'); } }, 'Freiwillige Runde (20 min)'));
    }
    main.appendChild(cta);

    // ---- Nächste Termine
    var side = h('div', { class: 'side-col' });
    grid.appendChild(side);
    var up = L.upcomingExams().slice(0, 3);
    var ex = h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Nächste Termine'), h('a', { href: '#/termine', class: 'link' }, 'Alle')));
    if (!up.length) ex.appendChild(h('p', { class: 'muted' }, 'Keine Termine eingetragen. Deine Eltern können Arbeiten und Tests im Eltern-Bereich anlegen.'));
    up.forEach(function (e) { ex.appendChild(examRow(e)); });
    side.appendChild(ex);

    // ---- Woche
    side.appendChild(weekCard());

    // ---- Level
    side.appendChild(h('section', { class: 'card level-card' },
      h('div', { class: 'card-head' }, h('h2', null, lv.name), h('span', { class: 'muted small tabular' }, xp + ' / ' + lv.next + ' Punkte')),
      ui.progressBar(lv.pct, 'var(--accent)', 'Fortschritt zum nächsten Level'),
      h('p', { class: 'muted small' }, 'Punkte-Guthaben für Belohnungen: ', h('strong', { class: 'tabular' }, L.balance()), '  ·  ', h('a', { href: '#/fortschritt', class: 'link' }, 'Belohnungen ansehen'))));
  };

  function examRow(e) {
    var s = LP.subject(e.subjectId);
    var left = LP.daysBetween(LP.today(), e.date);
    var ready = L.examReadiness(e);
    return h('div', { class: 'exam-row', style: { '--c': s.color } },
      h('div', { class: 'exam-count' + (left <= 2 ? ' hot' : '') }, h('strong', { class: 'tabular' }, left), h('span', null, left === 1 ? 'Tag' : 'Tage')),
      h('div', { class: 'exam-info' },
        h('strong', null, e.title || LP.EXAM_TYPES[e.type].short),
        h('span', { class: 'muted small' }, s.name + ' · ' + LP.EXAM_TYPES[e.type].short + ' · ' + LP.fmtDay(e.date)),
        ready === null ? null : h('div', { class: 'ready' }, ui.progressBar(ready, s.color, 'Vorbereitung'), h('span', { class: 'small tabular' }, Math.round(ready * 100) + ' %'))));
  }

  function weekCard() {
    var t = LP.today();
    var dow = (LP.weekday(t) + 6) % 7; // Mo = 0
    var monday = LP.addDays(t, -dow);
    var done = L.doneDays();
    var created = LP.settings().createdAt;
    var startDay = created ? LP.iso(new Date(created)) : '0000-00-00';
    var row = h('div', { class: 'week' });
    for (var i = 0; i < 7; i++) {
      var d = LP.addDays(monday, i);
      var cls = 'wday';
      if (done[d]) cls += ' done';
      else if (d < t && L.isLearningDay(d) && d >= startDay) cls += ' missed';
      if (!L.isLearningDay(d)) cls += ' free';
      if (d === t) cls += ' today';
      row.appendChild(h('div', { class: cls, title: LP.fmtDay(d) }, h('span', null, LP.WD[LP.weekday(d)]), h('i', null, done[d] ? svg(I.check) : null)));
    }
    var minutes = 0;
    for (var j = 0; j < 7; j++) minutes += L.minutesOn(LP.addDays(monday, j));
    return h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Diese Woche'), h('span', { class: 'muted small tabular' }, minutes + ' min gelernt')), row);
  }

  /* ================================================================ LERNZEIT (geführte Sitzung) */

  function startRun(plan, type, label) {
    var run = {
      id: LP.uid('s'), date: LP.today(), type: type, label: label || null, plan: plan, idx: 0,
      remain: plan.steps.map(function (s) { return s.minutes * 60; }),
      active: plan.steps.map(function () { return 0; }),
      stats: plan.steps.map(function () { return { right: 0, wrong: 0 }; }),
      testDone: 0, xp: 0, startedAt: Date.now(), finished: false, blockXp: {}
    };
    LP.lsSet('lp_run', run);
    return run;
  }
  LP.startRun = startRun;

  V.session = function (el) {
    var run = LP.lsGet('lp_run', null);
    if (!run || run.finished) { LP.go('#/heute'); return; }
    var st = LP.settings();
    var idleLimit = (Number(st.idleSeconds) || 90) * 1000;
    var lastInput = Date.now();
    var paused = false;
    var engine = null, engineIdx = -1;
    var timeUpShown = false;
    var awaitingNext = false; // Block-Ende-Bildschirm sichtbar
    var itemOpen = false;

    function save() { LP.lsSet('lp_run', run); }
    function step() { return run.plan.steps[run.idx]; }

    var root = h('div', { class: 'session' });
    el.appendChild(root);

    // Kopfzeile
    var pills = h('ol', { class: 'step-pills' });
    var clock = h('div', { class: 'clock tabular' });
    var clockLabel = h('div', { class: 'clock-label' });
    var bar = h('div', { class: 'clock-bar' }, h('div', { class: 'clock-fill' }));
    var xpChip = h('span', { class: 'chip strong tabular' });
    var head = h('div', { class: 'session-head' },
      h('div', { class: 'session-top' },
        h('button', { class: 'btn ghost small', onclick: abort }, svg(I.x), 'Beenden'),
        pills, xpChip),
      h('div', { class: 'session-clock' }, h('div', null, clockLabel, clock), bar));
    var timeBanner = h('div', { class: 'time-banner', hidden: true }, svg(I.check), 'Zeit für diesen Block ist um – beende die Aufgabe, dann geht’s weiter.');
    var body = h('div', { class: 'session-body' });
    root.appendChild(head);
    root.appendChild(timeBanner);
    root.appendChild(body);
    var pauseOverlay = h('div', { class: 'pause-overlay', hidden: true },
      h('div', { class: 'card' }, svg(I.pause, 'big-ico'), h('h2', null, 'Pausiert'), h('p', { class: 'muted' }, 'Die Uhr läuft nur, wenn du wirklich lernst.'),
        h('button', { class: 'btn primary xl', onclick: resume }, svg(I.play), 'Weiter lernen')));
    root.appendChild(pauseOverlay);

    function renderPills() {
      LP.clear(pills);
      run.plan.steps.forEach(function (s, i) {
        pills.appendChild(h('li', { class: 'spill' + (i < run.idx ? ' done' : i === run.idx ? ' cur' : ''), title: s.title },
          svg(stepIcon(s.kind)), h('span', null, s.kind === 'focus' ? 'Block' : s.title)));
      });
      xpChip.textContent = '+' + run.xp + ' Punkte';
    }

    function renderClock() {
      var s = step();
      if (!s) return;
      var total = s.minutes * 60;
      var rem = run.remain[run.idx];
      if (s.kind === 'write') {
        clockLabel.textContent = s.title + ' · ' + s.sub;
        clock.textContent = '';
        bar.firstChild.style.width = '0%';
        root.style.setProperty('--c', s.subjectId ? LP.subject(s.subjectId).color : 'var(--accent)');
        return;
      }
      if (s.kind === 'test') {
        clockLabel.textContent = s.title + ' · Frage ' + Math.min(run.testDone + 1, s.questions) + ' von ' + s.questions;
        clock.textContent = '';
        bar.firstChild.style.width = Math.round(run.testDone / s.questions * 100) + '%';
        return;
      }
      clockLabel.textContent = s.title + (s.sub ? ' · ' + s.sub : '');
      clock.textContent = LP.fmtClock(rem);
      bar.firstChild.style.width = Math.round((1 - rem / total) * 100) + '%';
      var subj = s.subjectId ? LP.subject(s.subjectId) : null;
      root.style.setProperty('--c', subj ? subj.color : 'var(--accent)');
    }

    function addXp(n) { run.xp += n; xpChip.textContent = '+' + run.xp + ' Punkte'; }

    function onAnswer(item, result) {
      itemOpen = false;
      var s = step();
      if (engine) engine.record(item, result);
      if (item.type !== 'read') {
        if (result === 'right') { run.stats[run.idx].right++; addXp(L.XP.right); }
        else if (result === 'close' || result === 'hard') { run.stats[run.idx].right++; addXp(L.XP.close); }
        else run.stats[run.idx].wrong++;
      } else addXp(3);
      if (s.kind === 'test' && item.type !== 'read') run.testDone++;
      save();
      renderClock();
      if (s.kind === 'test' && run.testDone >= s.questions) return completeStep();
      if (s.kind !== 'test' && run.remain[run.idx] <= 0) return completeStep();
      showItem();
    }

    function showItem() {
      var s = step();
      if (engineIdx !== run.idx || !engine) {
        engine = new L.Engine(s.deckIds, { cram: s.cram || null, test: s.kind === 'test', topics: s.topics || null });
        engineIdx = run.idx;
      }
      var item = engine.hasContent() ? engine.next() : null;
      if (!item) {
        // Ersatz: alle vorhandenen Lernpakete des Fachs bzw. überhaupt
        var fallback = store.list('decks').filter(function (d) { return d.kind !== 'merkblatt' && (!s.subjectId || d.subjectId === s.subjectId); }).map(function (d) { return d.id; });
        if (!fallback.length) fallback = store.list('decks').map(function (d) { return d.id; });
        engine = new L.Engine(fallback, { test: s.kind === 'test' });
        item = engine.hasContent() ? engine.next() : null;
      }
      if (!item) {
        LP.clear(body);
        body.appendChild(h('div', { class: 'card center' }, h('h2', null, 'Keine Lerninhalte vorhanden'),
          h('p', { class: 'muted' }, 'Für diesen Block sind noch keine Inhalte hinterlegt. Bitte deine Eltern, im Eltern-Bereich Lernpakete anzulegen.'),
          h('button', { class: 'btn primary', onclick: completeStep }, 'Block überspringen')));
        return;
      }
      itemOpen = true;
      ui.renderItem(body, item, function (result) { onAnswer(item, result); }, { test: s.kind === 'test' });
    }

    function completeStep() {
      var s = step();
      if (!s) return;
      var bonus = (s.kind === 'review' || s.kind === 'focus' || s.kind === 'write') ? L.XP.block : 0;
      if (bonus && !run.blockXp[run.idx]) { run.blockXp[run.idx] = true; addXp(bonus); }
      run.remain[run.idx] = 0;
      ui.beep('step');
      persistSession(false);
      if (run.idx >= run.plan.steps.length - 1) return finishRun();
      // Block-Ende-Bildschirm
      awaitingNext = true;
      timeBanner.hidden = true;
      var nxt = run.plan.steps[run.idx + 1];
      var stats = run.stats[run.idx];
      LP.clear(body);
      var card = h('div', { class: 'card center step-done' },
        h('div', { class: 'big-check' }, svg(I.check)),
        h('h2', null, s.kind === 'break' ? 'Pause vorbei' : s.title + ' geschafft!'),
        s.kind !== 'break' ? h('p', { class: 'muted tabular' }, stats.right + ' richtig · ' + stats.wrong + ' falsch' + (bonus ? ' · +' + bonus + ' Bonuspunkte' : '')) : null,
        h('p', null, 'Als Nächstes: ', h('strong', null, nxt.title), ' (' + (nxt.kind === 'test' ? nxt.questions + ' Fragen' : nxt.kind === 'write' ? 'Stift und Papier bereitlegen' : nxt.minutes + ' min') + ')'),
        h('button', { class: 'btn primary xl', onclick: function () {
          awaitingNext = false; timeUpShown = false;
          run.idx++; save(); renderPills(); renderClock(); renderStep();
        } }, svg(I.play), nxt.kind === 'break' ? 'Pause starten' : 'Los geht’s'));
      body.appendChild(card);
      card.querySelector('.btn').focus();
    }

    function renderStep() {
      var s = step();
      timeBanner.hidden = true;
      if (s.kind === 'write') {
        LP.writing.render(body, s, function (st) {
          run.stats[run.idx].right += st.right; run.stats[run.idx].wrong += st.wrong;
          addXp(st.right * L.XP.right);
          save();
          completeStep();
        });
        return;
      }
      if (s.kind === 'break') {
        LP.clear(body);
        body.appendChild(h('div', { class: 'card center break-card' },
          svg(I.coffee, 'big-ico'),
          h('h2', null, 'Pause – ' + s.minutes + ' Minuten'),
          h('ul', { class: 'break-tips' }, h('li', null, 'Aufstehen und strecken'), h('li', null, 'Ein Glas Wasser trinken'), h('li', null, 'Fenster auf, frische Luft'), h('li', null, 'Kein Handy – sonst ist die Pause weg')),
          h('p', { class: 'muted small' }, 'Es geht automatisch weiter, wenn die Uhr abgelaufen ist.')));
        return;
      }
      showItem();
    }

    function persistSession(completed) {
      var steps = run.plan.steps.map(function (s, i) {
        return { kind: s.kind, title: s.title, subjectId: s.subjectId || null, examId: s.examId || null, right: run.stats[i].right, wrong: run.stats[i].wrong, seconds: run.active[i] };
      });
      var activeSec = run.active.reduce(function (a, b) { return a + b; }, 0);
      var right = 0, wrong = 0;
      run.stats.forEach(function (x) { right += x.right; wrong += x.wrong; });
      var doc = Object.assign({}, store.get('sessions', run.id) || {}, {
        id: run.id, date: run.date, type: run.type, label: run.label, startedAt: run.startedAt, endedAt: Date.now(),
        minutes: Math.round(activeSec / 60), right: right, wrong: wrong, xp: run.xp, completed: completed, steps: steps
      });
      if (run.mood) doc.mood = run.mood;
      store.put('sessions', doc);
    }

    function finishRun() {
      clearInterval(tick);
      var isPlan = run.type === 'plan';
      var bonus = 0;
      if (isPlan && !run.finished) {
        var s0 = L.streak() + 1; // inkl. heute
        bonus = L.XP.session + Math.min(10, s0) * 2;
        addXp(bonus);
      }
      run.finished = true;
      save();
      persistSession(true);
      ui.beep('done');
      LP.clear(root);
      var right = 0, wrong = 0;
      run.stats.forEach(function (x) { right += x.right; wrong += x.wrong; });
      var acc = right + wrong ? Math.round(right / (right + wrong) * 100) : 0;
      var mins = Math.round(run.active.reduce(function (a, b) { return a + b; }, 0) / 60);
      var testStep = run.plan.steps.length - 1;
      var test = run.plan.steps[testStep].kind === 'test' ? run.stats[testStep] : null;
      var moodRow = h('div', { class: 'mood' });
      [[1, 'Zäh'], [2, 'Ging so'], [3, 'Gut']].forEach(function (m) {
        moodRow.appendChild(h('button', { class: 'btn mood-btn', onclick: function () {
          run.mood = m[0]; save(); persistSession(true);
          Array.prototype.forEach.call(moodRow.children, function (c) { c.classList.remove('sel'); });
          this.classList.add('sel');
        } }, m[1]));
      });
      root.appendChild(h('div', { class: 'summary' },
        h('div', { class: 'card center' },
          h('div', { class: 'confetti', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { return h('i', { style: { left: (i * 8 + 4) + '%', animationDelay: (i % 4) * 0.15 + 's' } }); })),
          h('p', { class: 'eyebrow' }, isPlan ? 'Lernzeit erledigt' : 'Runde erledigt'),
          h('h1', null, '+' + run.xp + ' Punkte'),
          h('div', { class: 'sum-stats' },
            h('div', null, h('strong', { class: 'tabular' }, mins), h('span', null, 'Minuten')),
            h('div', null, h('strong', { class: 'tabular' }, acc + ' %'), h('span', null, 'richtig')),
            test ? h('div', null, h('strong', { class: 'tabular' }, test.right + '/' + (test.right + test.wrong)), h('span', null, 'im Mini-Test')) : null,
            isPlan ? h('div', null, h('strong', { class: 'tabular' }, L.streak()), h('span', null, 'Tage Serie')) : null),
          bonus ? h('p', { class: 'muted small' }, 'Inklusive ' + bonus + ' Bonuspunkte für die erledigte Lernzeit und deine Serie.') : null,
          h('h3', null, 'Wie lief es heute?'),
          moodRow,
          h('a', { class: 'btn primary xl', href: '#/heute', onclick: function () { LP.lsDel('lp_run'); } }, 'Fertig'))));
    }

    function abort() {
      ui.dialog({ title: 'Lernzeit wirklich beenden?', text: 'Dein Fortschritt bis hier wird gespeichert, aber die Lernzeit zählt erst als erledigt, wenn alle Blöcke geschafft sind. Du kannst später weitermachen.', ok: 'Beenden', cancel: 'Weiterlernen', danger: true })
        .then(function (yes) {
          if (!yes) return;
          persistSession(false);
          if (run.type !== 'plan') LP.lsDel('lp_run');
          LP.go('#/heute');
        });
    }

    function resume() { paused = false; lastInput = Date.now(); pauseOverlay.hidden = true; }
    function touch() { lastInput = Date.now(); }
    ['mousedown', 'touchstart', 'keydown'].forEach(function (ev) { document.addEventListener(ev, touch, true); });

    var tick = setInterval(function () {
      var s = step();
      if (!s || awaitingNext) return;
      if (document.hidden) return;
      if (!paused && s.kind !== 'break' && s.kind !== 'write' && Date.now() - lastInput > idleLimit) {
        paused = true; pauseOverlay.hidden = false;
      }
      if (paused) return;
      run.active[run.idx]++;
      if (s.kind === 'test' || s.kind === 'write') { if (run.active[run.idx] % 5 === 0) save(); return; }
      if (run.remain[run.idx] > 0) {
        run.remain[run.idx]--;
        if (run.remain[run.idx] <= 0) {
          if (s.kind === 'break' || !itemOpen) { completeStep(); }
          else if (!timeUpShown) { timeUpShown = true; timeBanner.hidden = false; ui.beep('step'); }
        }
      }
      if (run.remain[run.idx] % 5 === 0) save();
      renderClock();
    }, 1000);

    renderPills();
    renderClock();
    if (run.remain[run.idx] <= 0 && step().kind !== 'test' && step().kind !== 'write') completeStep(); else renderStep();

    return function cleanup() {
      clearInterval(tick);
      ['mousedown', 'touchstart', 'keydown'].forEach(function (ev) { document.removeEventListener(ev, touch, true); });
      if (!run.finished) save();
    };
  };

  /* ================================================================ TERMINE */

  V.exams = function (el) {
    el.appendChild(pageHead('Termine', 'Arbeiten, Tests und was bis dahin geübt wird'));
    var t = LP.today();

    // 14-Tage-Leiste
    var strip = h('div', { class: 'strip' });
    var inRange = L.examList(t, LP.addDays(t, 14));
    for (var i = 0; i < 14; i++) {
      var d = LP.addDays(t, i);
      var exs = inRange.filter(function (e) { return e.date === d && !e.done; });
      var act = L.activeExams(d);
      var focusSubj = act.length ? LP.subject(act[0].exam.subjectId) : null;
      var cell = h('div', { class: 'strip-day' + (i === 0 ? ' today' : '') + (L.isLearningDay(d) ? '' : ' free'), title: LP.fmtDay(d) },
        h('span', { class: 'wd' }, LP.WD[LP.weekday(d)]),
        h('span', { class: 'dn tabular' }, LP.parseDay(d).getDate()),
        h('span', { class: 'marks' },
          exs.map(function (e) { return h('span', { class: 'exam-mark', style: { background: LP.subject(e.subjectId).color }, title: e.title }, LP.subject(e.subjectId).short || '!'); }),
          !exs.length && focusSubj && L.isLearningDay(d) ? h('span', { class: 'focus-mark', style: { background: focusSubj.color }, title: 'Lernschwerpunkt: ' + focusSubj.name }) : null));
      strip.appendChild(cell);
    }
    el.appendChild(h('section', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, 'Die nächsten 14 Tage'),
        h('span', { class: 'legend small muted' }, h('span', { class: 'exam-mark sample' }, 'D'), ' Termin  ', h('span', { class: 'focus-mark sample' }), ' Lernschwerpunkt')),
      h('div', { class: 'strip-wrap' }, strip)));

    var up = L.upcomingExams();
    var listEl = h('div', { class: 'exam-cards' });
    if (!up.length) listEl.appendChild(h('div', { class: 'card' }, h('p', { class: 'muted' }, 'Keine anstehenden Termine.')));
    up.forEach(function (e) {
      var s = LP.subject(e.subjectId);
      var left = LP.daysBetween(t, e.date);
      var ready = L.examReadiness(e);
      var decks = (e.deckIds || []).map(function (id) { return store.get('decks', id); }).filter(Boolean);
      var prepStart = LP.addDays(e.date, -L.examPrepDays(e));
      listEl.appendChild(h('section', { class: 'card exam-card', style: { '--c': s.color } },
        h('div', { class: 'exam-card-top' },
          h('div', { class: 'exam-count big' + (left <= 2 ? ' hot' : '') }, h('strong', { class: 'tabular' }, left), h('span', null, left === 1 ? 'Tag' : 'Tage')),
          h('div', { class: 'exam-info' },
            h('div', null, ui.subjectChip(e.subjectId), ' ', h('span', { class: 'chip' }, LP.EXAM_TYPES[e.type].short)),
            h('h3', null, e.title || LP.EXAM_TYPES[e.type].label),
            h('p', { class: 'muted small' }, LP.fmtLong(e.date) + (e.repeat ? ' · jede Woche' : '') + ' · Vorbereitung ab ' + LP.fmtDay(prepStart)))),
        e.topics ? h('p', { class: 'topics' }, h('strong', null, 'Stoff: '), e.topics) : null,
        ready !== null ? h('div', { class: 'ready big' }, h('span', { class: 'small' }, 'Vorbereitung'), ui.progressBar(ready, s.color, 'Vorbereitung'), h('strong', { class: 'tabular' }, Math.round(ready * 100) + ' %')) : null,
        decks.length ? h('div', { class: 'deck-chips' }, decks.map(function (d) { return h('span', { class: 'chip' }, d.title); })) : h('p', { class: 'muted small' }, 'Noch keine Lerninhalte verknüpft.'),
        decks.length ? h('div', { class: 'row end' }, h('a', { class: 'btn primary', href: '#/lernzeit', onclick: function () {
          LP.startRun({ day: t, total: 15, steps: [{ id: 's0', kind: 'focus', title: s.name + ': ' + (e.title || 'Übung'), sub: 'Freies Üben', subjectId: e.subjectId, examId: e.id, deckIds: e.deckIds, minutes: 15 }] }, 'frei', e.title);
        } }, svg(I.play), '15 min üben'),
          decks.some(function (d) { return d.kind === 'vokabeln' && (d.cards || []).length >= 3; }) ? h('a', { class: 'btn ghost', href: '#/lernzeit', onclick: function () {
            LP.startRun({ day: t, total: 6, steps: [{ id: 's0', kind: 'write', title: 'Schreibrunde', sub: 'Vokabeln auf Papier schreiben', subjectId: e.subjectId, examId: e.id,
              deckIds: decks.filter(function (d) { return d.kind === 'vokabeln'; }).map(function (d) { return d.id; }), words: 10, minutes: 6 }] }, 'frei', 'Schreibrunde');
          } }, svg(LP.writing.CAMERA), 'Schreibrunde') : null) : null));
    });
    el.appendChild(listEl);

    var past = store.list('exams').filter(function (e) { return !e.repeat && (e.date < t || e.done); }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 6);
    if (past.length) {
      var pl = h('section', { class: 'card' }, h('h2', null, 'Vergangene Termine'));
      past.forEach(function (e) {
        var g = store.list('grades').filter(function (x) { return x.examId === e.id; })[0];
        pl.appendChild(h('div', { class: 'list-row' }, ui.subjectChip(e.subjectId), h('span', { class: 'grow' }, e.title || LP.EXAM_TYPES[e.type].short), h('span', { class: 'muted small' }, LP.fmtDay(e.date)), g ? h('span', { class: 'grade g' + g.grade }, g.grade) : null));
      });
      el.appendChild(pl);
    }
  };

  /* ================================================================ TRAINING */

  V.training = function (el) {
    el.appendChild(pageHead('Training', 'Freiwillig üben – jede richtige Antwort bringt Punkte'));
    LP.subjects().forEach(function (s) {
      var decks = store.list('decks').filter(function (d) { return d.subjectId === s.id; }).sort(function (a, b) { return a.title.localeCompare(b.title); });
      if (!decks.length) return;
      var sec = h('section', { class: 'card', style: { '--c': s.color } }, h('div', { class: 'card-head' }, h('h2', null, h('span', { class: 'dot big' }), s.name)));
      var grid = h('div', { class: 'deck-grid' });
      decks.forEach(function (d) {
        var m = L.deckMastery(d), due = L.dueCount(d);
        var count = d.kind === 'mathe' ? (d.topics || []).length + ' Themen' : d.kind === 'merkblatt' ? 'Zum Lesen' : (d.cards || []).length + ' Karten';
        var href = d.kind === 'merkblatt' ? '#/lesen/' + d.id : '#/lernzeit';
        grid.appendChild(h('a', { class: 'deck-tile', href: href, onclick: d.kind === 'merkblatt' ? null : function () {
          LP.startRun({ day: LP.today(), total: 10, steps: [{ id: 's0', kind: 'focus', title: d.title, sub: 'Freies Üben', subjectId: d.subjectId, deckIds: [d.id], minutes: 10 }] }, 'frei', d.title);
        } },
          h('span', { class: 'kind' }, LP.DECK_KINDS[d.kind] ? LP.DECK_KINDS[d.kind].label : d.kind),
          h('strong', null, d.title),
          h('span', { class: 'muted small' }, count + (due ? ' · ' + due + ' fällig' : '')),
          d.kind === 'merkblatt' ? null : ui.progressBar(m, s.color, 'Beherrscht')));
      });
      sec.appendChild(grid);
      if (s.id === 'mathe' || decks.some(function (d) { return d.kind === 'mathe'; })) {
        var topics = {};
        decks.filter(function (d) { return d.kind === 'mathe'; }).forEach(function (d) { (d.topics || []).forEach(function (tp) { topics[tp] = true; }); });
        var tl = h('div', { class: 'topic-list' });
        Object.keys(topics).forEach(function (tp) {
          var rate = L.mathRate(tp);
          tl.appendChild(h('a', { class: 'topic', href: '#/lernzeit', onclick: function () {
            LP.startRun({ day: LP.today(), total: 10, steps: [{ id: 's0', kind: 'focus', title: LP.math.topics[tp].name, sub: 'Mathe-Training', subjectId: s.id, deckIds: ['__math__' + tp], topics: [tp], minutes: 10 }] }, 'frei', LP.math.topics[tp].name);
          } }, h('span', null, LP.math.topics[tp].name), h('span', { class: 'rate tabular' }, Math.round(rate * 100) + ' %')));
        });
        if (Object.keys(topics).length) sec.appendChild(h('div', null, h('h3', { class: 'sub' }, 'Einzelne Mathe-Themen'), tl));
      }
      el.appendChild(sec);
    });
  };

  V.reader = function (el, id) {
    var d = store.get('decks', id);
    if (!d) { el.appendChild(h('p', null, 'Nicht gefunden.')); return; }
    el.appendChild(h('div', { class: 'row' }, h('a', { class: 'btn ghost small', href: '#/training' }, svg(I.back), 'Zurück')));
    var card = h('article', { class: 'card reader', style: { '--c': LP.subject(d.subjectId).color } }, ui.subjectChip(d.subjectId), ui.markdown(d.text));
    el.appendChild(card);
    card.appendChild(h('div', { class: 'row end' }, h('button', { class: 'btn primary', onclick: function () { L.markRead(d.id); LP.toast('Als gelesen markiert'); LP.go('#/training'); } }, svg(I.check), 'Gelesen')));
  };

  /* ================================================================ FORTSCHRITT */

  V.progress = function (el) {
    var xp = L.totalXp(), lv = L.level(xp), bal = L.balance();
    el.appendChild(pageHead('Fortschritt', 'Punkte, Serie und Belohnungen'));

    var top = h('div', { class: 'stats-row' },
      statTile('Level ' + lv.n, lv.name, ui.progressBar(lv.pct, 'var(--accent)', 'Level-Fortschritt'), (lv.next - xp) + ' Punkte bis Level ' + (lv.n + 1)),
      statTile(String(L.streak()), 'Tage Serie', null, 'Lerntage am Stück'),
      statTile(String(bal), 'Punkte-Guthaben', null, xp + ' Punkte insgesamt gesammelt'));
    el.appendChild(top);

    el.appendChild(minutesChart());

    // Fächer
    var subjCard = h('section', { class: 'card' }, h('h2', null, 'Wie gut sitzt der Stoff?'));
    LP.subjects().forEach(function (s) {
      var ds = store.list('decks').filter(function (d) { return d.subjectId === s.id && d.kind !== 'merkblatt'; });
      if (!ds.length) return;
      var m = ds.reduce(function (a, d) { return a + L.deckMastery(d); }, 0) / ds.length;
      subjCard.appendChild(h('div', { class: 'hbar' }, h('span', { class: 'hbar-label' }, s.name), ui.progressBar(m, s.color, s.name), h('span', { class: 'tabular small' }, Math.round(m * 100) + ' %')));
    });
    el.appendChild(subjCard);

    // Belohnungen
    var rw = h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Belohnungen'), h('span', { class: 'chip strong tabular' }, svg(I.star), bal + ' Punkte')));
    var rewards = store.list('rewards').sort(function (a, b) { return a.cost - b.cost; });
    if (!rewards.length) rw.appendChild(h('p', { class: 'muted' }, 'Noch keine Belohnungen festgelegt.'));
    var rgrid = h('div', { class: 'reward-grid' });
    rewards.forEach(function (r) {
      var can = bal >= r.cost;
      rgrid.appendChild(h('div', { class: 'reward' + (can ? ' can' : '') },
        svg(I.gift), h('strong', null, r.title), h('span', { class: 'tabular muted small' }, r.cost + ' Punkte'),
        can ? h('button', { class: 'btn primary small', onclick: function () {
          ui.dialog({ title: '„' + r.title + '“ einlösen?', text: r.cost + ' Punkte werden abgezogen. Deine Eltern bekommen die Anfrage im Eltern-Bereich.', ok: 'Einlösen' }).then(function (y) {
            if (!y) return;
            store.put('redemptions', { id: LP.uid('red'), rewardId: r.id, title: r.title, cost: r.cost, date: LP.today(), status: 'offen' });
            LP.toast('Angefragt! Sag deinen Eltern Bescheid.', 'good');
            LP.rerender();
          });
        } }, 'Einlösen') : ui.progressBar(bal / r.cost, 'var(--accent)', 'Fortschritt zur Belohnung')));
    });
    rw.appendChild(rgrid);
    var reds = store.list('redemptions').sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 5);
    if (reds.length) {
      rw.appendChild(h('h3', { class: 'sub' }, 'Zuletzt eingelöst'));
      reds.forEach(function (r) {
        rw.appendChild(h('div', { class: 'list-row' }, h('span', { class: 'grow' }, r.title || (store.get('rewards', r.rewardId) || {}).title || 'Belohnung'),
          h('span', { class: 'muted small' }, LP.fmtDay(r.date)), h('span', { class: 'pill ' + (r.status === 'eingelöst' ? 'good' : r.status === 'abgelehnt' ? 'bad' : 'warn') }, r.status)));
      });
    }
    el.appendChild(rw);

    el.appendChild(achievements());
  };

  function statTile(value, label, extra, foot) {
    return h('div', { class: 'card stat' }, h('strong', { class: 'stat-value tabular' }, value), h('span', { class: 'stat-label' }, label), extra, foot ? h('span', { class: 'muted small' }, foot) : null);
  }

  // Säulendiagramm: Lernminuten der letzten 14 Tage (eine Reihe, Ziel-Linie = geplante Minuten)
  function minutesChart() {
    var t = LP.today(), st = LP.settings();
    var days = [];
    for (var i = 13; i >= 0; i--) days.push(LP.addDays(t, -i));
    var vals = days.map(function (d) { return L.minutesOn(d); });
    var target = Number(st.minutes) || 45;
    var max = Math.max(target * 1.25, Math.max.apply(null, vals) * 1.1, 10);
    var W = LP.clamp((window.innerWidth || 800) - (window.innerWidth > 860 ? 300 : 70), 340, 900), H = 200, pl = 34, pr = 8, pt = 12, pb = 28;
    var cw = (W - pl - pr) / days.length, bw = Math.min(22, cw * 0.56);
    var y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
    var parts = [];
    var ticks = [0, Math.round(max / 2 / 5) * 5, Math.round(max / 5) * 5].filter(function (v, i, a) { return a.indexOf(v) === i && v <= max; });
    ticks.forEach(function (v) {
      parts.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="grid"/>');
      parts.push('<text x="' + (pl - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" class="axis">' + v + '</text>');
    });
    parts.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(target) + '" y2="' + y(target) + '" class="target"/>');
    parts.push('<text x="' + (W - pr) + '" y="' + (y(target) - 5) + '" text-anchor="end" class="axis">Ziel ' + target + ' min</text>');
    days.forEach(function (d, i) {
      var x = pl + cw * i + (cw - bw) / 2, v = vals[i];
      var bh = Math.max(0, y(0) - y(v));
      var lbl = LP.fmtDay(d) + ': ' + v + ' min';
      if (v > 0) {
        var r = Math.min(4, bh);
        parts.push('<path class="bar' + (d === t ? ' now' : '') + '" d="M' + x + ',' + y(0) + 'V' + (y(v) + r) + 'q0,-' + r + ' ' + r + ',-' + r + 'H' + (x + bw - r) + 'q' + r + ',0 ' + r + ',' + r + 'V' + y(0) + 'Z"><title>' + lbl + '</title></path>');
      }
      parts.push('<rect x="' + (pl + cw * i) + '" y="' + pt + '" width="' + cw + '" height="' + (H - pt - pb) + '" class="hit"><title>' + lbl + '</title></rect>');
      if (i % 2 === 1 || days.length <= 7) parts.push('<text x="' + (x + bw / 2) + '" y="' + (H - 9) + '" text-anchor="middle" class="axis">' + LP.WD[LP.weekday(d)] + ' ' + LP.parseDay(d).getDate() + '.</text>');
    });
    parts.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(0) + '" y2="' + y(0) + '" class="base"/>');
    var total = vals.reduce(function (a, b) { return a + b; }, 0);
    var chart = h('div', { class: 'chart', html: '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Lernminuten der letzten 14 Tage">' + parts.join('') + '</svg>' });
    var tip = h('div', { class: 'chart-tip', hidden: true });
    chart.appendChild(tip);
    Array.prototype.forEach.call(chart.querySelectorAll('.hit'), function (r, i) {
      function show() { tip.hidden = false; tip.textContent = LP.fmtDay(days[i]) + ': ' + vals[i] + ' min'; tip.style.left = ((pl + cw * i + cw / 2) / W * 100) + '%'; }
      r.addEventListener('mouseenter', show); r.addEventListener('click', show);
      r.addEventListener('mouseleave', function () { tip.hidden = true; });
    });
    return h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Lernminuten, letzte 14 Tage'), h('span', { class: 'muted small tabular' }, total + ' min gesamt')), chart);
  }

  function achievements() {
    var ss = store.list('sessions');
    var mastered = store.list('progress').filter(function (p) { return p.box >= 4; }).length;
    var mathRight = store.list('progress').filter(function (p) { return p.topic; }).reduce(function (a, p) { return a + (p.right || 0); }, 0);
    var best = 0; // längste Serie grob über erledigte Tage
    var doneDays = Object.keys(L.doneDays()).length;
    best = L.streak();
    var list = [
      ['Erste Lernzeit', 'Eine Lernzeit komplett geschafft', doneDays >= 1],
      ['Dranbleiber', '5 Lernzeiten erledigt', doneDays >= 5],
      ['Serie 7', '7 Lerntage am Stück', best >= 7],
      ['Wortschatz 50', '50 Karten sicher gelernt (Fach 4+)', mastered >= 50],
      ['Rechenkünstler', '50 Mathe-Aufgaben richtig', mathRight >= 50],
      ['Marathon', '10 Stunden Lernzeit insgesamt', ss.reduce(function (a, s) { return a + (s.minutes || 0); }, 0) >= 600]
    ];
    var grid = h('div', { class: 'ach-grid' });
    list.forEach(function (a) {
      grid.appendChild(h('div', { class: 'ach' + (a[2] ? ' got' : '') }, svg(a[2] ? I.trophy : I.lock), h('strong', null, a[0]), h('span', { class: 'muted small' }, a[1])));
    });
    return h('section', { class: 'card' }, h('h2', null, 'Erfolge'), grid);
  }
})();
