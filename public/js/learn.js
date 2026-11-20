/*
 * Lernlogik: Antwortprüfung, Karteikasten (Leitner), Übungs-Engine, Lernplan, Punkte & Statistik.
 */
(function () {
  'use strict';
  var LP = window.LP;
  var store = LP.store;

  /* ---------------------------------------------------------------- Textantworten prüfen */

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[’‘`´]/g, '\'')
      .replace(/[–—\-]/g, ' ')
      .replace(/[.,!?;:"„“”()…]/g, ' ')
      .replace(/'/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length, prev = [], cur, i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }
  // Varianten einer Lösung: „/“ trennt Alternativen, Klammerinhalte sind optional, „to “ bei Verben optional
  function variants(expected) {
    var out = [];
    String(expected).split('/').forEach(function (alt) {
      var full = norm(alt.replace(/[()]/g, ''));
      var noParen = norm(alt.replace(/\([^)]*\)/g, ''));
      [full, noParen].forEach(function (v) {
        if (!v) return;
        out.push(v);
        if (v.indexOf('to ') === 0) out.push(v.slice(3));
      });
    });
    return out;
  }
  function checkText(input, expected) {
    var given = norm(input);
    if (!given) return { result: 'wrong' };
    var vs = variants(expected);
    var withoutTo = given.indexOf('to ') === 0 ? given.slice(3) : given;
    for (var i = 0; i < vs.length; i++) {
      if (vs[i] === given || vs[i] === withoutTo) return { result: 'right' };
    }
    for (var k = 0; k < vs.length; k++) {
      var allowed = vs[k].length >= 10 ? 2 : vs[k].length >= 5 ? 1 : 0;
      if (allowed && lev(vs[k], given) <= allowed) return { result: 'close' };
    }
    return { result: 'wrong' };
  }

  /* ---------------------------------------------------------------- Karteikasten (Leitner, 5 Fächer) */

  var BOX_DAYS = [0, 0, 1, 2, 4, 8];
  function progKey(deckId, cardId) { return deckId + '__' + cardId; }
  function prog(deckId, cardId) {
    return store.get('progress', progKey(deckId, cardId)) || { id: progKey(deckId, cardId), deckId: deckId, cardId: cardId, box: 0, right: 0, wrong: 0, due: null };
  }
  function grade(deckId, cardId, result) {
    var p = Object.assign({}, prog(deckId, cardId));
    var t = LP.today();
    if (result === 'right') { p.box = Math.min(5, (p.box || 0) + 1); p.right = (p.right || 0) + 1; }
    else if (result === 'hard' || result === 'close') { p.box = Math.max(1, p.box || 1); p.right = (p.right || 0) + 1; }
    else { p.box = 1; p.wrong = (p.wrong || 0) + 1; }
    p.due = LP.addDays(t, result === 'hard' || result === 'close' ? 1 : BOX_DAYS[p.box]);
    p.last = Date.now();
    store.put('progress', p);
    return p;
  }

  function mathStat(topic) {
    return store.get('progress', 'math__' + topic) || { id: 'math__' + topic, topic: topic, recent: [], right: 0, wrong: 0 };
  }
  function gradeMath(topic, ok) {
    var s = Object.assign({}, mathStat(topic));
    s.recent = (s.recent || []).concat([ok ? 1 : 0]).slice(-10);
    if (ok) s.right = (s.right || 0) + 1; else s.wrong = (s.wrong || 0) + 1;
    s.last = Date.now();
    store.put('progress', s);
  }
  function mathRate(topic) {
    var r = mathStat(topic).recent || [];
    if (!r.length) return 0;
    // erst ab 5 Aufgaben voll aussagekräftig
    var sum = r.reduce(function (a, b) { return a + b; }, 0);
    return (sum / r.length) * Math.min(1, r.length / 5);
  }

  function markRead(deckId) {
    var p = store.get('progress', deckId + '__read') || { id: deckId + '__read', deckId: deckId, reads: 0 };
    p = Object.assign({}, p, { reads: (p.reads || 0) + 1, lastRead: LP.today(), last: Date.now() });
    store.put('progress', p);
  }
  function lastRead(deckId) { var p = store.get('progress', deckId + '__read'); return p ? p.lastRead : null; }

  // Wie gut sitzt ein Lernpaket? 0..1
  function deckMastery(deck) {
    if (!deck) return 0;
    if (deck.kind === 'merkblatt') return lastRead(deck.id) ? 1 : 0;
    if (deck.kind === 'mathe') {
      var tops = deck.topics || [];
      if (!tops.length) return 0;
      return tops.reduce(function (a, t) { return a + mathRate(t); }, 0) / tops.length;
    }
    var cs = deck.cards || [];
    if (!cs.length) return 0;
    var score = cs.reduce(function (a, c) {
      var b = prog(deck.id, c.id).box || 0;
      return a + (b >= 4 ? 1 : b === 3 ? 0.75 : b === 2 ? 0.4 : b === 1 ? 0.1 : 0);
    }, 0);
    return score / cs.length;
  }
  function examReadiness(exam) {
    var ds = (exam.deckIds || []).map(function (id) { return store.get('decks', id); }).filter(Boolean);
    if (!ds.length) return null;
    // Merkblätter zählen weniger als Übungen
    var w = 0, s = 0;
    ds.forEach(function (d) { var wt = d.kind === 'merkblatt' ? 0.3 : 1; w += wt; s += wt * deckMastery(d); });
    return w ? s / w : 0;
  }
  function dueCount(deck) {
    if (!deck || !deck.cards) return 0;
    var t = LP.today();
    return deck.cards.filter(function (c) { var p = prog(deck.id, c.id); return p.box > 0 && p.due && p.due <= t; }).length;
  }

  /* ---------------------------------------------------------------- Übungs-Engine */

  // Liefert endlos die nächste sinnvolle Aufgabe aus einer Menge von Lernpaketen.
  function Engine(deckIds, opts) {
    this.opts = opts || {};
    this.deckIds = (deckIds || []).filter(function (id) { return store.get('decks', id); });
    this.count = 0;
    this.recent = [];
    this.retry = {};
    this.readDone = {};
    this.mathTopicsOverride = this.opts.topics || null;
  }
  Engine.prototype.decks = function () {
    return this.deckIds.map(function (id) { return store.get('decks', id); }).filter(Boolean);
  };
  Engine.prototype.hasContent = function () {
    if (this.mathTopicsOverride && this.mathTopicsOverride.length) return true;
    return this.decks().some(function (d) {
      return d.kind === 'mathe' ? (d.topics || []).length : d.kind === 'merkblatt' ? Boolean(d.text) : (d.cards || []).length;
    });
  };
  Engine.prototype.next = function () {
    var self = this;
    self.count++;
    var t = LP.today();
    var decks = self.decks();

    // 1) Merkblätter zuerst, wenn sie seit 2 Tagen nicht gelesen wurden
    if (!self.opts.test) {
      for (var i = 0; i < decks.length; i++) {
        var d = decks[i];
        if (d.kind === 'merkblatt' && d.text && !self.readDone[d.id]) {
          var lr = lastRead(d.id);
          if (!lr || LP.daysBetween(lr, t) >= 2 || self.opts.forceRead) { self.readDone[d.id] = true; return { type: 'read', deck: d }; }
        }
      }
    }

    var cardDecks = decks.filter(function (d) { return ['vokabeln', 'karten', 'quiz'].indexOf(d.kind) >= 0 && (d.cards || []).length; });
    var mathDecks = decks.filter(function (d) { return d.kind === 'mathe' && (d.topics || []).length; });
    if (self.mathTopicsOverride && !mathDecks.length) mathDecks = [{ id: '__math', subjectId: 'mathe', title: 'Mathe-Training', kind: 'mathe', topics: self.mathTopicsOverride }];
    if (self.opts.test) {
      // Im Mini-Test lieber Aufgaben, die automatisch geprüft werden können
      var checkable = cardDecks.filter(function (d) { return d.kind !== 'karten'; });
      if (checkable.length) cardDecks = checkable;
    }

    var useMath = mathDecks.length && (!cardDecks.length || self.count % 2 === 0);
    if (useMath) {
      var topics = self.mathTopicsOverride || [];
      if (!topics.length) mathDecks.forEach(function (md) { topics = topics.concat(md.topics); });
      // schwache Themen öfter
      var weighted = [];
      topics.forEach(function (tp) { var w = 1 + Math.round((1 - mathRate(tp)) * 3); for (var k = 0; k < w; k++) weighted.push(tp); });
      var topic = weighted[Math.floor(Math.random() * weighted.length)];
      return { type: 'math', deck: mathDecks[0], task: LP.math.generate(topic) };
    }
    if (!cardDecks.length) return null;

    // 2) Karten bewerten: falsch beantwortete kommen nach 3 Aufgaben zurück, dann fällige, dann niedrige Fächer
    var best = null, bestScore = Infinity;
    cardDecks.forEach(function (deck) {
      var cram = self.opts.cram && self.opts.cram[deck.id];
      deck.cards.forEach(function (c) {
        var key = progKey(deck.id, c.id);
        var p = prog(deck.id, c.id);
        var score = (p.box || 0) * 3;
        if (p.box > 0 && p.due && p.due <= t) score -= 6;
        if (!p.box) score -= 2;
        if (cram && (p.box || 0) < 4) score -= 4;
        if (self.retry[key] && self.retry[key] <= self.count) score -= 20;
        var idx = self.recent.indexOf(key);
        if (idx >= 0) score += 40 - idx * 5;
        score += Math.random() * 2;
        if (score < bestScore) { bestScore = score; best = { deck: deck, card: c, key: key, prog: p }; }
      });
    });
    if (!best) return null;
    self.recent.unshift(best.key);
    self.recent = self.recent.slice(0, Math.min(5, Math.max(1, self.totalCards() - 1)));
    delete self.retry[best.key];

    var deck = best.deck, item = { deck: deck, card: best.card, key: best.key, prog: best.prog };
    if (deck.kind === 'quiz') { item.type = 'quiz'; item.options = LP.shuffle([best.card.b].concat(best.card.x || [])); return item; }
    if (deck.kind === 'karten') { item.type = 'flip'; return item; }
    // Vokabeln
    var dir = deck.direction || 'b2a';
    if (dir === 'mix') dir = Math.random() < 0.5 ? 'a2b' : 'b2a';
    item.type = 'vocab';
    item.prompt = dir === 'b2a' ? best.card.b : best.card.a;
    item.answer = dir === 'b2a' ? best.card.a : best.card.b;
    item.dir = dir;
    var fresh = !best.prog.right && !self.opts.test;
    if (fresh && deck.cards.length >= 4) {
      item.mode = 'mc';
      var others = LP.shuffle(deck.cards.filter(function (c) { return c.id !== best.card.id; })).slice(0, 3);
      item.options = LP.shuffle([item.answer].concat(others.map(function (c) { return dir === 'b2a' ? c.a : c.b; })));
    } else {
      item.mode = 'type';
    }
    return item;
  };
  Engine.prototype.totalCards = function () {
    return this.decks().reduce(function (a, d) { return a + ((d.cards || []).length); }, 0);
  };
  Engine.prototype.record = function (item, result) {
    if (!item) return;
    if (item.type === 'math') { gradeMath(item.task.topic, result === 'right'); return; }
    if (item.type === 'read') { markRead(item.deck.id); return; }
    grade(item.deck.id, item.card.id, result);
    if (result === 'wrong' || result === 'again') this.retry[item.key] = this.count + 3;
  };

  /* ---------------------------------------------------------------- Lernplan */

  function examPrepDays(exam) {
    return Number(exam.prepDays) || (LP.EXAM_TYPES[exam.type] || LP.EXAM_TYPES.sonstiges).prep;
  }
  function upcomingExams() {
    var t = LP.today();
    return store.list('exams').filter(function (e) { return !e.done && e.date >= t; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }
  // Prüfungen, auf die an einem Tag gelernt werden soll – nach Dringlichkeit sortiert
  function activeExams(day) {
    return store.list('exams').filter(function (e) {
      if (e.done || !e.date) return false;
      var left = LP.daysBetween(day, e.date);
      return left >= 0 && left <= examPrepDays(e);
    }).map(function (e) {
      var left = Math.max(0.5, LP.daysBetween(day, e.date));
      var ready = examReadiness(e);
      var w = (LP.EXAM_TYPES[e.type] || LP.EXAM_TYPES.sonstiges).weight;
      return { exam: e, left: LP.daysBetween(day, e.date), prio: (w / left) * (1.3 - (ready === null ? 0.3 : ready)) };
    }).sort(function (a, b) { return b.prio - a.prio; });
  }

  // Schwächstes Fach anhand der Noten (für Tage ohne anstehende Prüfung)
  function weakestSubject(day) {
    var subs = LP.subjects();
    if (!subs.length) return null;
    var avg = {};
    store.list('grades').forEach(function (g) {
      if (!avg[g.subjectId]) avg[g.subjectId] = { s: 0, n: 0 };
      avg[g.subjectId].s += Number(g.grade) || 0; avg[g.subjectId].n++;
    });
    var ranked = subs.slice().sort(function (a, b) {
      var A = avg[a.id] ? avg[a.id].s / avg[a.id].n : 3.5, B = avg[b.id] ? avg[b.id].s / avg[b.id].n : 3.5;
      return B - A;
    });
    // Abwechseln: an geraden Tagen das schwächste, an ungeraden das zweitschwächste Fach
    var d = LP.parseDay(day).getDate();
    return ranked[d % 2 === 0 || ranked.length < 2 ? 0 : 1];
  }
  function practiceDecksFor(subjectId) {
    return store.list('decks').filter(function (d) { return d.subjectId === subjectId && d.kind !== 'merkblatt'; }).map(function (d) { return d.id; });
  }
  function allDueDeckIds() {
    return store.list('decks').filter(function (d) { return dueCount(d) > 0; }).map(function (d) { return d.id; });
  }

  function buildPlan(day, minutesOverride) {
    var st = LP.settings();
    var total = Number(minutesOverride || st.minutes) || 45;
    var act = activeExams(day);
    var warm = Math.max(3, Math.round(total * 0.12));
    var test = Math.max(3, Math.round(total * 0.12));
    var brk = total >= 35 ? 5 : 0;
    var main = total - warm - test - brk;
    var blocks = brk ? [Math.ceil(main / 2), Math.floor(main / 2)] : [main];

    var focus = [];
    function examBlock(a) {
      var e = a.exam;
      var cram = {};
      if (a.left <= 3) (e.deckIds || []).forEach(function (id) { cram[id] = true; });
      return { kind: 'focus', title: LP.subject(e.subjectId).name + ': ' + (e.title || LP.EXAM_TYPES[e.type].short), subjectId: e.subjectId,
        examId: e.id, deckIds: (e.deckIds || []).slice(), cram: cram, reason: (LP.EXAM_TYPES[e.type] || {}).short + ' ' + LP.relDay(e.date) };
    }
    function basicsBlock(sub) {
      return { kind: 'focus', title: sub.name + ': Grundlagen', subjectId: sub.id, deckIds: practiceDecksFor(sub.id), reason: 'Grundlagen festigen' };
    }
    if (act.length) focus.push(examBlock(act[0]));
    if (blocks.length > 1) {
      if (act.length > 1) focus.push(examBlock(act[1]));
      else if (act.length === 1) {
        var other = weakestSubject(day);
        if (other && other.id === act[0].exam.subjectId) {
          var subs = LP.subjects().filter(function (s) { return s.id !== other.id; });
          other = subs.length ? subs[LP.parseDay(day).getDate() % subs.length] : null;
        }
        focus.push(other ? basicsBlock(other) : examBlock(act[0]));
      }
    }
    while (focus.length < blocks.length) {
      var w = weakestSubject(LP.addDays(day, focus.length));
      if (!w) break;
      if (focus.length && focus[0].subjectId === w.id) {
        var rest = LP.subjects().filter(function (s) { return s.id !== w.id; });
        if (rest.length) w = rest[0];
      }
      focus.push(basicsBlock(w));
    }

    var due = allDueDeckIds();
    var warmDecks = due.length ? due : (focus[0] ? focus[0].deckIds.slice() : []);
    var steps = [];
    steps.push({ kind: 'review', title: 'Aufwärmen', sub: due.length ? 'Fällige Wiederholungen' : 'Schnellrunde', minutes: warm, deckIds: warmDecks });
    focus.forEach(function (f, i) {
      f.minutes = blocks[i];
      f.sub = f.reason;
      steps.push(f);
      if (i === 0 && brk) steps.push({ kind: 'break', title: 'Pause', sub: 'Aufstehen, trinken, durchatmen', minutes: brk });
    });
    var testDecks = [];
    focus.forEach(function (f) { testDecks = testDecks.concat(f.deckIds); });
    steps.push({ kind: 'test', title: 'Mini-Test', sub: '5 Fragen zu heute', minutes: test, deckIds: testDecks, questions: 5 });
    steps.forEach(function (s, i) { s.id = 's' + i; });
    return { day: day, total: total, steps: steps, focusExams: act.map(function (a) { return a.exam.id; }) };
  }

  function isLearningDay(day) {
    return LP.settings().days.indexOf(LP.weekday(day)) >= 0;
  }

  /* ---------------------------------------------------------------- Punkte, Serie, Level */

  function sessions() { return store.list('sessions'); }
  function totalXp() { return sessions().reduce(function (a, s) { return a + (Number(s.xp) || 0); }, 0); }
  function spentXp() {
    return store.list('redemptions').filter(function (r) { return r.status !== 'abgelehnt'; })
      .reduce(function (a, r) { return a + (Number(r.cost) || 0); }, 0);
  }
  function balance() { return totalXp() - spentXp(); }
  var LEVELS = ['Einsteiger', 'Starter', 'Durchstarter', 'Aufsteiger', 'Könner', 'Profi', 'Ass', 'Meister', 'Champion', 'Legende'];
  function level(xp) {
    // Level n braucht 100·n·(n+1)/2 Punkte: 0, 100, 300, 600, 1000 …
    var n = 0;
    while (100 * (n + 1) * (n + 2) / 2 <= xp) n++;
    var cur = 100 * n * (n + 1) / 2, nxt = 100 * (n + 1) * (n + 2) / 2;
    return { n: n + 1, name: LEVELS[Math.min(n, LEVELS.length - 1)], cur: cur, next: nxt, pct: (xp - cur) / (nxt - cur) };
  }
  function doneDays() {
    var d = {};
    sessions().forEach(function (s) { if (s.type === 'plan' && s.completed) d[s.date] = true; });
    return d;
  }
  function doneToday() { return Boolean(doneDays()[LP.today()]); }
  // Serie: aufeinanderfolgende Lerntage mit erledigter Lernzeit (lernfreie Tage unterbrechen nicht)
  function streak() {
    var done = doneDays(), day = LP.today(), n = 0;
    if (!done[day]) day = LP.addDays(day, -1);
    for (var i = 0; i < 400; i++) {
      if (done[day]) n++;
      else if (isLearningDay(day)) break;
      day = LP.addDays(day, -1);
    }
    return n;
  }
  function minutesOn(day) {
    return sessions().filter(function (s) { return s.date === day; }).reduce(function (a, s) { return a + (Number(s.minutes) || 0); }, 0);
  }

  var XP = { right: 2, close: 1, block: 10, session: 20 };

  LP.learn = {
    norm: norm, checkText: checkText, lev: lev,
    prog: prog, grade: grade, deckMastery: deckMastery, examReadiness: examReadiness, dueCount: dueCount,
    mathRate: mathRate, markRead: markRead, lastRead: lastRead,
    Engine: Engine,
    examPrepDays: examPrepDays, upcomingExams: upcomingExams, activeExams: activeExams, buildPlan: buildPlan, isLearningDay: isLearningDay,
    totalXp: totalXp, balance: balance, level: level, streak: streak, doneToday: doneToday, doneDays: doneDays, minutesOn: minutesOn,
    XP: XP
  };
})();
