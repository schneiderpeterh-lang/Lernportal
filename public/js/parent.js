/*
 * Eltern-Bereich: Übersicht, Termine, Lerninhalte, Noten, Belohnungen, Einstellungen.
 */
(function () {
  'use strict';
  var LP = window.LP, h = LP.h, svg = LP.svg, I = LP.I, store = LP.store, L = LP.learn, ui = LP.ui;
  var V = LP.views = LP.views || {};

  var TABS = [
    ['uebersicht', 'Übersicht'], ['termine', 'Termine'], ['inhalte', 'Lerninhalte'],
    ['noten', 'Noten'], ['belohnungen', 'Belohnungen'], ['einstellungen', 'Einstellungen']
  ];

  function field(label, control, hint) {
    return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), control, hint ? h('span', { class: 'field-hint' }, hint) : null);
  }
  function select(id, options, value) {
    return h('select', { id: id }, options.map(function (o) { return h('option', { value: o[0], selected: String(o[0]) === String(value) }, o[1]); }));
  }
  function subjectOptions() { return LP.subjects().map(function (s) { return [s.id, s.name]; }); }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }

  /* ---------------------------------------------------------------- Login */

  V.parentGate = function (el, sub, arg) {
    if (store.isParent()) return V.parent(el, sub, arg);
    var first = !store.pinSet;
    var input = h('input', { id: 'pin', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', autocomplete: 'off', class: 'pin-input', maxlength: 12, 'aria-label': 'PIN' });
    var input2 = first ? h('input', { id: 'pin2', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', autocomplete: 'off', class: 'pin-input', maxlength: 12, 'aria-label': 'PIN wiederholen' }) : null;
    var err = h('p', { class: 'error', hidden: true });
    function submit(e) {
      if (e) e.preventDefault();
      err.hidden = true;
      if (first) {
        if (!/^\d{4,12}$/.test(input.value)) { err.textContent = 'Bitte 4 bis 12 Ziffern verwenden (6 sind sicherer).'; err.hidden = false; return; }
        if (input.value !== input2.value) { err.textContent = 'Die beiden PINs stimmen nicht überein.'; err.hidden = false; return; }
      }
      store.login(input.value).then(function () { LP.rerender(); }, function (ex) { err.textContent = ex.message; err.hidden = false; input.value = ''; input.focus(); });
    }
    el.appendChild(h('div', { class: 'gate' }, h('form', { class: 'card center', onsubmit: submit },
      svg(I.lock, 'big-ico'),
      h('h1', null, first ? 'Eltern-PIN festlegen' : 'Eltern-Bereich'),
      h('p', { class: 'muted' }, first ? 'Hier legen Sie Termine und Lerninhalte an. Wählen Sie eine PIN, die Ihr Kind nicht kennt.' : 'Bitte PIN eingeben.'),
      field(first ? 'Neue PIN' : 'PIN', input),
      input2 ? field('PIN wiederholen', input2) : null,
      err,
      LP.store.mode === 'local' ? h('p', { class: 'muted small' }, 'Demo-Version: Die PIN ist 1234.') : null,
      h('div', { class: 'row end' }, h('a', { class: 'btn ghost', href: '#/heute' }, 'Zurück'), h('button', { class: 'btn primary', type: 'submit' }, first ? 'PIN speichern' : 'Entsperren')))));
    setTimeout(function () { input.focus(); }, 50);
  };

  V.parent = function (el, sub, arg) {
    sub = sub || 'uebersicht';
    var nav = h('nav', { class: 'tabs', 'aria-label': 'Eltern-Bereich' },
      TABS.map(function (t) { return h('a', { href: '#/eltern/' + t[0], class: 'tab' + (sub === t[0] ? ' active' : '') }, t[1]); }));
    el.appendChild(h('header', { class: 'page-head' },
      h('div', null, h('p', { class: 'eyebrow' }, 'Eltern-Bereich'), h('h1', null, (TABS.filter(function (t) { return t[0] === sub; })[0] || TABS[0])[1])),
      h('button', { class: 'btn ghost', onclick: function () { store.logout().then(function () { LP.go('#/heute'); }); } }, svg(I.lock), 'Sperren')));
    el.appendChild(nav);
    var body = h('div', { class: 'parent-body' });
    el.appendChild(body);
    var fn = { uebersicht: overview, termine: exams, inhalte: decks, noten: grades, belohnungen: rewards, einstellungen: settingsView }[sub] || overview;
    fn(body, arg);
  };

  /* ---------------------------------------------------------------- Übersicht */

  function overview(el) {
    var t = LP.today(), st = LP.settings();
    var dow = (LP.weekday(t) + 6) % 7, monday = LP.addDays(t, -dow);
    var weekMin = 0, planned = 0, doneCount = 0;
    var done = L.doneDays();
    var startDay = st.createdAt ? LP.iso(new Date(st.createdAt)) : '0000-00-00';
    for (var i = 0; i < 7; i++) {
      var d = LP.addDays(monday, i);
      weekMin += L.minutesOn(d);
      if (L.isLearningDay(d) && d <= t && (d >= startDay || done[d])) { planned++; if (done[d]) doneCount++; }
    }
    var sess = store.list('sessions').sort(function (a, b) { return (b.endedAt || 0) - (a.endedAt || 0) || (a.date < b.date ? 1 : -1); });
    var recent = sess.slice(0, 8);
    var right = 0, wrong = 0;
    sess.filter(function (s) { return LP.daysBetween(s.date, t) < 14; }).forEach(function (s) { right += s.right || 0; wrong += s.wrong || 0; });

    var pending = store.list('redemptions').filter(function (r) { return r.status === 'offen'; });

    el.appendChild(h('div', { class: 'stats-row' },
      tile(doneCount + ' / ' + planned, 'Lernzeiten diese Woche', planned ? (doneCount >= planned ? 'Alles erledigt' : (planned - doneCount) + ' verpasst oder offen') : 'Noch keine Lerntage'),
      tile(weekMin + ' min', 'Lernzeit diese Woche', 'Ziel: ' + st.minutes + ' min pro Lerntag'),
      tile(right + wrong ? Math.round(right / (right + wrong) * 100) + ' %' : '–', 'Trefferquote (14 Tage)', right + wrong + ' Antworten'),
      tile(String(L.streak()), 'Tage Serie', 'Level ' + L.level(L.totalXp()).n + ' · ' + L.balance() + ' Punkte')));

    if (pending.length) {
      var pc = h('section', { class: 'card attention' }, h('h2', null, svg(I.gift), 'Offene Belohnungswünsche'));
      pending.forEach(function (r) { pc.appendChild(redemptionRow(r)); });
      el.appendChild(pc);
    }

    var grid = h('div', { class: 'two-col' });
    el.appendChild(grid);

    var up = L.upcomingExams();
    var ec = h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Anstehende Termine'), h('a', { class: 'btn small primary', href: '#/eltern/termine/neu' }, svg(I.plus), 'Termin')));
    if (!up.length) ec.appendChild(h('p', { class: 'muted' }, 'Noch keine Termine. Tragen Sie die nächste Arbeit oder den nächsten Vokabeltest ein – der Lernplan richtet sich danach.'));
    up.forEach(function (e) {
      var r = L.examReadiness(e), s = LP.subject(e.subjectId);
      ec.appendChild(h('a', { class: 'list-row link-row', href: '#/eltern/termine/' + (e.baseId || e.id) },
        ui.subjectChip(e.subjectId), h('span', { class: 'grow' }, h('strong', null, e.title || LP.EXAM_TYPES[e.type].short), h('br'), h('span', { class: 'muted small' }, LP.fmtDay(e.date) + ' · ' + LP.relDay(e.date) + (e.repeat ? ' · wöchentlich' : ''))),
        r === null ? h('span', { class: 'pill warn' }, 'Keine Inhalte') : h('span', { class: 'ready mini' }, ui.progressBar(r, s.color, 'Vorbereitung'), h('span', { class: 'small tabular' }, Math.round(r * 100) + ' %'))));
    });
    grid.appendChild(ec);

    var sc = h('section', { class: 'card' }, h('h2', null, 'Letzte Lerneinheiten'));
    if (!recent.length) sc.appendChild(h('p', { class: 'muted' }, 'Noch keine Lerneinheiten.'));
    var moods = { 1: 'zäh', 2: 'ging so', 3: 'gut' };
    recent.forEach(function (s) {
      var acc = (s.right || 0) + (s.wrong || 0) ? Math.round((s.right || 0) / ((s.right || 0) + (s.wrong || 0)) * 100) + ' %' : '–';
      var subjects = (s.steps || []).filter(function (x) { return x.subjectId; }).map(function (x) { return LP.subject(x.subjectId).name; });
      subjects = subjects.filter(function (v, i, a) { return a.indexOf(v) === i; });
      sc.appendChild(h('div', { class: 'list-row' },
        h('span', { class: 'pill ' + (s.completed ? 'good' : 'warn') }, s.completed ? 'fertig' : 'abgebrochen'),
        h('span', { class: 'grow' }, h('strong', null, LP.fmtDay(s.date)), ' · ' + (s.type === 'plan' ? 'Lernzeit' : s.type === 'extra' ? 'Extra-Runde' : 'Freies Üben' + (s.label ? ': ' + s.label : '')),
          h('br'), h('span', { class: 'muted small' }, (subjects.join(', ') || '–') + (s.mood ? ' · Stimmung: ' + moods[s.mood] : ''))),
        h('span', { class: 'small tabular right' }, (s.minutes || 0) + ' min', h('br'), h('span', { class: 'muted' }, acc + ' richtig'))));
    });
    grid.appendChild(sc);

    // Schwachstellen: häufig falsch beantwortete Karten
    var weak = store.list('progress').filter(function (p) { return p.cardId && (p.wrong || 0) >= 2; })
      .sort(function (a, b) { return (b.wrong - (b.right || 0) / 2) - (a.wrong - (a.right || 0) / 2); }).slice(0, 8);
    var wc = h('section', { class: 'card' }, h('h2', null, 'Daran hakt es gerade'), h('p', { class: 'muted small' }, 'Karten, die öfter falsch beantwortet wurden – gut zum gemeinsamen Abfragen.'));
    if (!weak.length) wc.appendChild(h('p', { class: 'muted' }, 'Noch keine auffälligen Karten.'));
    weak.forEach(function (p) {
      var d = store.get('decks', p.deckId); if (!d) return;
      var c = (d.cards || []).filter(function (x) { return x.id === p.cardId; })[0]; if (!c) return;
      wc.appendChild(h('div', { class: 'list-row' }, ui.subjectChip(d.subjectId), h('span', { class: 'grow' }, h('strong', null, c.a), ' → ' + c.b), h('span', { class: 'small muted tabular' }, p.wrong + '× falsch')));
    });
    var mt = LP.math.list().map(function (t2) { return { t: t2, s: store.get('progress', 'math__' + t2.id) }; }).filter(function (x) { return x.s && (x.s.recent || []).length >= 3; });
    if (mt.length) {
      wc.appendChild(h('h3', { class: 'sub' }, 'Mathe-Themen (letzte 10 Aufgaben)'));
      mt.sort(function (a, b) { return L.mathRate(a.t.id) - L.mathRate(b.t.id); }).forEach(function (x) {
        wc.appendChild(h('div', { class: 'hbar' }, h('span', { class: 'hbar-label' }, x.t.name), ui.progressBar(L.mathRate(x.t.id), LP.subject('mathe').color, x.t.name), h('span', { class: 'small tabular' }, Math.round(L.mathRate(x.t.id) * 100) + ' %')));
      });
    }
    grid.appendChild(wc);

    grid.appendChild(writingsCard());

    // Noten-Schnitt
    var gc = h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Notenschnitt'), h('a', { class: 'link', href: '#/eltern/noten' }, 'Noten verwalten')));
    LP.subjects().forEach(function (s) {
      var gs = store.list('grades').filter(function (g) { return g.subjectId === s.id; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      if (!gs.length) return;
      var avg = gs.reduce(function (a, g) { return a + Number(g.grade); }, 0) / gs.length;
      gc.appendChild(h('div', { class: 'list-row' }, ui.subjectChip(s.id), h('span', { class: 'grow grade-trail' }, gs.map(function (g) { return h('span', { class: 'grade g' + Math.round(g.grade), title: (g.note || '') + ' ' + LP.fmtShort(g.date) }, String(g.grade).replace('.', ',')); })),
        h('strong', { class: 'tabular' }, 'Ø ' + avg.toFixed(1).replace('.', ','))));
    });
    if (!store.list('grades').length) gc.appendChild(h('p', { class: 'muted' }, 'Noch keine Noten eingetragen. Mit Noten erkennt der Lernplan, welches Fach an freien Tagen Vorrang hat.'));
    grid.appendChild(gc);
  }

  function writingsCard() {
    var ws = store.list('writings').sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).slice(0, 6);
    var ai = store.aiCheck || {};
    var c = h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Schreibrunden'),
      h('span', { class: 'pill ' + (ai.available ? 'good' : 'muted-pill') }, ai.available ? 'KI-Prüfung aktiv' : 'Selbstkontrolle')));
    if (!ws.length) c.appendChild(h('p', { class: 'muted' }, 'Noch keine Schreibrunde. Sie kommt automatisch in die Lernzeit, sobald ein Vokabeltest ansteht.'));
    var grid = h('div', { class: 'write-thumbs' });
    ws.forEach(function (w) {
      var url = store.photoUrl(w.photoId);
      grid.appendChild(h('button', { class: 'write-thumb', onclick: function () { showWriting(w); } },
        url ? h('img', { src: url, alt: 'Blatt vom ' + LP.fmtDay(w.date), loading: 'lazy' }) : h('span', { class: 'no-photo' }, 'kein Foto'),
        h('span', { class: 'small' }, h('strong', null, LP.fmtDay(w.date)), h('br'), w.right + '/' + (w.right + w.wrong) + ' richtig · ' + (w.mode === 'ki' ? 'KI' : 'selbst'))));
    });
    if (ws.length) c.appendChild(grid);
    return c;
  }

  function showWriting(w) {
    var url = store.photoUrl(w.photoId);
    var body = h('div', { class: 'write-detail' },
      url ? h('a', { href: url, target: '_blank', rel: 'noopener' }, h('img', { class: 'write-photo', src: url, alt: 'Foto des Blattes' })) : h('p', { class: 'muted' }, 'Kein Foto gespeichert.'),
      h('p', { class: 'muted small' }, w.mode === 'ki' ? 'Von der KI geprüft' + (w.model ? ' (' + w.model + ')' : '') + '. Bei Zweifeln bitte selbst aufs Foto schauen.' : 'Vom Kind selbst kontrolliert.'),
      h('div', { class: 'write-results' }, (w.items || []).map(function (it) {
        return h('div', { class: 'wr-row ' + (it.ok ? 'ok' : 'bad') }, h('span', { class: 'wr-mark' }, svg(it.ok ? I.check : I.x)),
          h('div', { class: 'wr-body' }, h('span', { class: 'muted small' }, it.prompt), h('span', null, it.read ? h('strong', null, it.read) : null, it.ok ? null : '  →  ' + it.answer), it.note ? h('span', { class: 'small wr-note' }, it.note) : null));
      })));
    ui.dialog({ title: 'Schreibrunde vom ' + LP.fmtDay(w.date), body: body, cancel: false, ok: 'Schließen' });
  }

  function tile(value, label, foot) {
    return h('div', { class: 'card stat' }, h('strong', { class: 'stat-value tabular' }, value), h('span', { class: 'stat-label' }, label), foot ? h('span', { class: 'muted small' }, foot) : null);
  }

  function redemptionRow(r) {
    return h('div', { class: 'list-row' },
      h('span', { class: 'grow' }, h('strong', null, r.title || 'Belohnung'), h('span', { class: 'muted small' }, ' · ' + r.cost + ' Punkte · ' + LP.fmtDay(r.date))),
      h('button', { class: 'btn small ghost', onclick: function () { store.put('redemptions', Object.assign({}, r, { status: 'abgelehnt' })); LP.rerender(); } }, 'Ablehnen'),
      h('button', { class: 'btn small primary', onclick: function () { store.put('redemptions', Object.assign({}, r, { status: 'eingelöst' })); LP.toast('Als eingelöst markiert', 'good'); LP.rerender(); } }, 'Erfüllt'));
  }

  /* ---------------------------------------------------------------- Termine */

  function exams(el, arg) {
    if (arg) return examEdit(el, arg === 'neu' ? null : store.get('exams', arg));
    el.appendChild(h('div', { class: 'row end' }, h('a', { class: 'btn primary', href: '#/eltern/termine/neu' }, svg(I.plus), 'Neuer Termin')));
    var all = store.list('exams').sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var t = LP.today();
    var upcoming = all.filter(function (e) { return (e.repeat || e.date >= t) && !e.done; });
    var past = all.filter(function (e) { return !e.repeat && (e.date < t || e.done); }).reverse();
    [['Anstehend', upcoming], ['Vergangen', past]].forEach(function (grp) {
      var c = h('section', { class: 'card' }, h('h2', null, grp[0]));
      if (!grp[1].length) c.appendChild(h('p', { class: 'muted' }, grp[0] === 'Anstehend' ? 'Keine anstehenden Termine.' : 'Noch nichts.'));
      grp[1].forEach(function (e) {
        var g = store.list('grades').filter(function (x) { return x.examId === e.id; })[0];
        var n = (e.deckIds || []).length;
        c.appendChild(h('a', { class: 'list-row link-row', href: '#/eltern/termine/' + e.id },
          ui.subjectChip(e.subjectId),
          h('span', { class: 'grow' }, h('strong', null, e.title || LP.EXAM_TYPES[e.type].short), h('br'), h('span', { class: 'muted small' }, LP.EXAM_TYPES[e.type].label + ' · ' + (e.repeat ? 'jeden ' + LP.WD_LONG[LP.weekday(e.date)] + (L.nextOccurrence(e) ? ', nächster: ' + LP.fmtDay(L.nextOccurrence(e)) : ', beendet') : LP.fmtDay(e.date)) + ' · ' + n + ' Lernpaket' + (n === 1 ? '' : 'e'))),
          g ? h('span', { class: 'grade g' + Math.round(g.grade) }, String(g.grade).replace('.', ',')) : (n ? null : h('span', { class: 'pill warn' }, 'Keine Inhalte')),
          svg(I.edit)));
      });
      el.appendChild(c);
    });
  }

  function examEdit(el, exam) {
    var isNew = !exam;
    exam = exam || { id: LP.uid('ex'), subjectId: (LP.subjects()[0] || {}).id, type: 'arbeit', date: LP.addDays(LP.today(), 7), title: '', topics: '', deckIds: [] };
    var chosen = {};
    (exam.deckIds || []).forEach(function (id) { chosen[id] = true; });

    var form = h('form', { class: 'card form', onsubmit: function (e) { e.preventDefault(); save(); } });
    var deckBox = h('div', { class: 'deck-pick' });
    function renderDecks() {
      LP.clear(deckBox);
      var sid = val('ex-subject') || exam.subjectId;
      var ds = store.list('decks').sort(function (a, b) { return (a.subjectId === sid ? 0 : 1) - (b.subjectId === sid ? 0 : 1) || a.title.localeCompare(b.title); });
      ds.forEach(function (d) {
        if (d.subjectId !== sid && !chosen[d.id]) return;
        var cb = h('input', { type: 'checkbox', checked: !!chosen[d.id], onchange: function () { if (this.checked) chosen[d.id] = true; else delete chosen[d.id]; } });
        deckBox.appendChild(h('label', { class: 'check' }, cb, h('span', null, d.title, h('span', { class: 'muted small' }, ' · ' + LP.DECK_KINDS[d.kind].label))));
      });
      if (!deckBox.children.length) deckBox.appendChild(h('p', { class: 'muted small' }, 'Für dieses Fach gibt es noch keine Lernpakete.'));
    }
    var subjSel = select('ex-subject', subjectOptions(), exam.subjectId);
    subjSel.addEventListener('change', renderDecks);
    var typeSel = select('ex-type', Object.keys(LP.EXAM_TYPES).map(function (k) { return [k, LP.EXAM_TYPES[k].label]; }), exam.type);
    var prepInput = h('input', { id: 'ex-prep', type: 'number', min: 1, max: 30, value: exam.prepDays || '', placeholder: String(LP.EXAM_TYPES[exam.type].prep) });
    typeSel.addEventListener('change', function () { prepInput.placeholder = String(LP.EXAM_TYPES[typeSel.value].prep); });

    form.appendChild(h('div', { class: 'form-grid' },
      field('Fach', subjSel),
      field('Art', typeSel),
      field('Datum', h('input', { id: 'ex-date', type: 'date', value: exam.date, required: true })),
      field('Titel', h('input', { id: 'ex-title', type: 'text', value: exam.title || '', placeholder: 'z. B. 2. Klassenarbeit' })),
      field('Vorbereitung (Tage vorher)', prepInput, 'Leer lassen für den Standardwert. Ab dann taucht der Termin im Lernplan auf.')));
    form.appendChild(field('Stoff / Themen', h('textarea', { id: 'ex-topics', rows: 3, placeholder: 'z. B. Unit 3 Vokabeln S. 186–188, Present Perfect vs. Simple Past' }, exam.topics || '')));
    form.appendChild(h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Lerninhalte zum Termin'),
      deckBox,
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn small ghost', onclick: function () {
        // Termin speichern und direkt ein passendes Lernpaket anlegen
        save(true);
      } }, svg(I.plus), 'Neues Lernpaket für diesen Termin anlegen'))));
    // Wiederholung (z. B. Vokabeltest jeden Donnerstag)
    var skip = (exam.skipDates || []).slice();
    var skipBox = h('div', { class: 'deck-pick' });
    function renderSkips() {
      LP.clear(skipBox);
      var start = val('ex-date') || exam.date;
      if (!start) return;
      var d = start, t0 = LP.today();
      if (d < t0) d = LP.addDays(d, Math.ceil(LP.daysBetween(d, t0) / 7) * 7);
      for (var i = 0; i < 8; i++) {
        (function (day) {
          skipBox.appendChild(h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: skip.indexOf(day) < 0, onchange: function () {
            if (this.checked) skip = skip.filter(function (x) { return x !== day; }); else if (skip.indexOf(day) < 0) skip.push(day);
          } }), h('span', null, LP.fmtDay(day))));
        })(d);
        d = LP.addDays(d, 7);
      }
    }
    var repeatCb = h('input', { id: 'ex-repeat', type: 'checkbox', checked: !!exam.repeat });
    var repeatBox = h('div', { class: 'field', hidden: !exam.repeat },
      field('Wiederholen bis (optional)', h('input', { id: 'ex-until', type: 'date', value: exam.until || '' }), 'z. B. letzter Schultag vor den Ferien oder Schuljahresende.'),
      h('span', { class: 'field-label' }, 'Findet statt am (Haken entfernen = fällt aus, z. B. Ferien oder Feiertag)'),
      skipBox);
    repeatCb.addEventListener('change', function () { repeatBox.hidden = !repeatCb.checked; gradeField.hidden = repeatCb.checked; renderSkips(); });
    form.appendChild(h('label', { class: 'check' }, repeatCb, h('span', null, 'Jede Woche am gleichen Wochentag wiederholen (Datum = erster Termin)')));
    form.appendChild(repeatBox);
    setTimeout(function () { var di = document.getElementById('ex-date'); if (di) di.addEventListener('change', renderSkips); renderSkips(); }, 0);
    form.appendChild(h('label', { class: 'check' }, h('input', { id: 'ex-done', type: 'checkbox', checked: !!exam.done }), h('span', null, 'Erledigt (taucht nicht mehr im Lernplan auf)')));

    var g = store.list('grades').filter(function (x) { return x.examId === exam.id; })[0];
    var gradeField = field('Note (nach Rückgabe)', select('ex-grade', [['', '–']].concat([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map(function (n) { return [n, String(n).replace('.', ',')]; })), g ? g.grade : ''), 'Wird automatisch in die Notenübersicht übernommen.');
    gradeField.hidden = !!exam.repeat;
    form.appendChild(gradeField);

    form.appendChild(h('div', { class: 'row end' },
      isNew ? null : h('button', { type: 'button', class: 'btn danger ghost', onclick: function () {
        ui.dialog({ title: 'Termin löschen?', text: 'Die Lernpakete bleiben erhalten.', ok: 'Löschen', danger: true }).then(function (y) {
          if (!y) return; store.del('exams', exam.id); LP.go('#/eltern/termine');
        });
      } }, svg(I.trash), 'Löschen'),
      h('a', { class: 'btn ghost', href: '#/eltern/termine' }, 'Abbrechen'),
      h('button', { class: 'btn primary', type: 'submit' }, 'Speichern')));

    function save(thenNewDeck) {
      var doc = Object.assign({}, exam, {
        subjectId: val('ex-subject'), type: val('ex-type'), date: val('ex-date'), title: val('ex-title').trim(),
        topics: val('ex-topics').trim(), deckIds: Object.keys(chosen), done: document.getElementById('ex-done').checked,
        prepDays: val('ex-prep') ? Number(val('ex-prep')) : null,
        repeat: document.getElementById('ex-repeat').checked ? 'weekly' : null,
        until: val('ex-until') || null, skipDates: skip
      });
      if (!doc.date) { LP.toast('Bitte ein Datum wählen.', 'warn'); return; }
      store.put('exams', doc);
      var gv = doc.repeat ? '' : val('ex-grade');
      if (gv) store.put('grades', Object.assign({}, g || { id: LP.uid('g') }, { subjectId: doc.subjectId, date: doc.date, type: doc.type, grade: Number(gv), note: doc.title || LP.EXAM_TYPES[doc.type].short, examId: doc.id }));
      else if (g && !doc.repeat) store.del('grades', g.id);
      LP.toast('Gespeichert', 'good');
      LP.go(thenNewDeck ? '#/eltern/inhalte/neu?exam=' + doc.id : '#/eltern/termine');
    }

    el.appendChild(h('div', { class: 'row' }, h('a', { class: 'btn ghost small', href: '#/eltern/termine' }, svg(I.back), 'Alle Termine')));
    el.appendChild(h('h2', null, isNew ? 'Neuer Termin' : 'Termin bearbeiten'));
    el.appendChild(form);
    renderDecks();
  }

  /* ---------------------------------------------------------------- Lerninhalte */

  function decks(el, arg) {
    if (arg) {
      var parts = arg.split('?'), id = parts[0], q = parts[1] || '';
      var examId = (q.match(/exam=([^&]+)/) || [])[1];
      return deckEdit(el, id === 'neu' ? null : store.get('decks', id), examId);
    }
    el.appendChild(h('div', { class: 'row end' }, h('a', { class: 'btn primary', href: '#/eltern/inhalte/neu' }, svg(I.plus), 'Neues Lernpaket')));
    LP.subjects().forEach(function (s) {
      var ds = store.list('decks').filter(function (d) { return d.subjectId === s.id; }).sort(function (a, b) { return a.title.localeCompare(b.title); });
      var c = h('section', { class: 'card', style: { '--c': s.color } }, h('h2', null, h('span', { class: 'dot big' }), s.name));
      if (!ds.length) c.appendChild(h('p', { class: 'muted' }, 'Noch keine Lernpakete.'));
      ds.forEach(function (d) {
        var count = d.kind === 'mathe' ? (d.topics || []).length + ' Themen' : d.kind === 'merkblatt' ? 'Text' : (d.cards || []).length + ' Karten';
        var usedBy = store.list('exams').filter(function (e) { return (e.deckIds || []).indexOf(d.id) >= 0 && !e.done; });
        c.appendChild(h('a', { class: 'list-row link-row', href: '#/eltern/inhalte/' + d.id },
          h('span', { class: 'chip' }, LP.DECK_KINDS[d.kind].label),
          h('span', { class: 'grow' }, h('strong', null, d.title), h('br'), h('span', { class: 'muted small' }, count + (usedBy.length ? ' · für: ' + usedBy.map(function (e) { return e.title || LP.EXAM_TYPES[e.type].short; }).join(', ') : ''))),
          d.kind === 'merkblatt' ? null : h('span', { class: 'ready mini' }, ui.progressBar(L.deckMastery(d), s.color, 'Beherrscht'), h('span', { class: 'small tabular' }, Math.round(L.deckMastery(d) * 100) + ' %')),
          svg(I.edit)));
      });
      el.appendChild(c);
    });
  }

  var IMPORT_HELP = {
    vokabeln: { fmt: 'englisch ; deutsch', ex: 'environment ; Umwelt\nto improve ; verbessern\nexperience ; Erfahrung / Erlebnis',
      prompt: 'Erstelle aus dem Bild/Text eine Vokabelliste. Gib NUR Zeilen im Format "englisch ; deutsch" aus, eine Vokabel pro Zeile, ohne Nummerierung und ohne Überschriften. Mehrere deutsche Bedeutungen trennst du mit " / ". Verben mit "to". Gibt es eine Spalte mit Beispielsätzen oder Lautschrift, lass sie weg.' },
    karten: { fmt: 'Vorderseite ; Rückseite', ex: 'Metapher ; Bildhafter Ausdruck ohne „wie“\nHyperbel ; Starke Übertreibung',
      prompt: 'Erstelle aus dem Bild/Text Lernkarteikarten für eine 9. Klasse Realschule. Gib NUR Zeilen im Format "Frage ; Antwort" aus, eine Karte pro Zeile, ohne Nummerierung. Antworten kurz und prüfungsnah. Verwende im Text kein Semikolon.' },
    quiz: { fmt: 'Frage | richtige Antwort | falsch | falsch | falsch', ex: 'If it rains, we ___ at home. | will stay | would stay | stayed | would have stayed',
      prompt: 'Erstelle aus dem Bild/Text 10 Multiple-Choice-Fragen für eine 9. Klasse Realschule. Gib NUR Zeilen im Format "Frage | richtige Antwort | falsche Antwort | falsche Antwort | falsche Antwort" aus, eine Frage pro Zeile, ohne Nummerierung. Optional als letztes Feld nach "||" eine kurze Erklärung.' }
  };

  function parseImport(kind, text) {
    var out = [];
    String(text).split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      if (kind === 'quiz') {
        var note = '';
        if (line.indexOf('||') >= 0) { note = line.split('||')[1].trim(); line = line.split('||')[0]; }
        var p = line.split('|').map(function (x) { return x.trim(); }).filter(Boolean);
        if (p.length >= 3) out.push({ a: p[0], b: p[1], x: p.slice(2), n: note || undefined });
      } else {
        var sep = line.indexOf(';') >= 0 ? ';' : line.indexOf('\t') >= 0 ? '\t' : line.indexOf(' - ') >= 0 ? ' - ' : line.indexOf(' = ') >= 0 ? ' = ' : null;
        if (!sep) return;
        var i = line.indexOf(sep);
        var a = line.slice(0, i).trim(), b = line.slice(i + sep.length).trim();
        if (a && b) out.push({ a: a, b: b });
      }
    });
    return out;
  }

  function deckEdit(el, deck, examId) {
    var isNew = !deck;
    var exam = examId ? store.get('exams', examId) : null;
    deck = deck ? JSON.parse(JSON.stringify(deck)) : { id: LP.uid('d'), subjectId: exam ? exam.subjectId : (LP.subjects()[0] || {}).id, kind: exam && exam.type === 'vokabeltest' ? 'vokabeln' : 'karten', title: exam ? (exam.title || '') : '', cards: [], direction: 'b2a', topics: [], text: '' };
    if (!deck.cards) deck.cards = [];
    var dirty = false;

    el.appendChild(h('div', { class: 'row' }, h('a', { class: 'btn ghost small', href: exam ? '#/eltern/termine/' + exam.id : '#/eltern/inhalte' }, svg(I.back), exam ? 'Zurück zum Termin' : 'Alle Lernpakete')));
    el.appendChild(h('h2', null, isNew ? 'Neues Lernpaket' + (exam ? ' für „' + (exam.title || 'Termin') + '“' : '') : 'Lernpaket bearbeiten'));

    var form = h('div', { class: 'card form' });
    el.appendChild(form);
    var kindSel = select('dk-kind', Object.keys(LP.DECK_KINDS).map(function (k) { return [k, LP.DECK_KINDS[k].label]; }), deck.kind);
    form.appendChild(h('div', { class: 'form-grid' },
      field('Titel', h('input', { id: 'dk-title', type: 'text', value: deck.title, placeholder: 'z. B. Unit 3 – Vokabeln', oninput: function () { dirty = true; } })),
      field('Fach', select('dk-subject', subjectOptions(), deck.subjectId)),
      field('Art', kindSel, null)));
    var kindHint = h('p', { class: 'muted small' });
    form.appendChild(kindHint);
    var content = h('div', { class: 'deck-content' });
    form.appendChild(content);

    function collectCards() {
      // Werte aus der Tabelle übernehmen
      var rows = content.querySelectorAll('.card-row:not(.head)');
      if (!rows.length) return;
      var cardsNew = [];
      Array.prototype.forEach.call(rows, function (r) {
        var a = r.querySelector('[data-f=a]').value.trim(), b = r.querySelector('[data-f=b]').value.trim();
        var xEl = r.querySelector('[data-f=x]'), nEl = r.querySelector('[data-f=n]');
        if (!a && !b) return;
        var c = { id: r.getAttribute('data-id'), a: a, b: b };
        if (xEl && xEl.value.trim()) c.x = xEl.value.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
        if (nEl && nEl.value.trim()) c.n = nEl.value.trim();
        cardsNew.push(c);
      });
      deck.cards = cardsNew;
    }

    function renderContent() {
      LP.clear(content);
      var kind = kindSel.value;
      kindHint.textContent = LP.DECK_KINDS[kind].hint;
      if (kind === 'merkblatt') {
        var ta = h('textarea', { id: 'dk-text', rows: 16, class: 'mono', oninput: function () { deck.text = ta.value; dirty = true; preview(); } }, deck.text || '');
        var pv = h('div', { class: 'md-preview' });
        function preview() { LP.clear(pv); pv.appendChild(ui.markdown(ta.value)); }
        content.appendChild(h('p', { class: 'muted small' }, 'Formatierung: „# Überschrift“, „## Zwischenüberschrift“, „- Aufzählung“, **fett**, *kursiv*.'));
        content.appendChild(h('div', { class: 'two-col' }, ta, pv));
        preview();
        return;
      }
      if (kind === 'mathe') {
        var box = h('div', { class: 'topic-pick' });
        LP.math.list().forEach(function (t) {
          box.appendChild(h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: (deck.topics || []).indexOf(t.id) >= 0, onchange: function () {
            var set = deck.topics || [];
            if (this.checked) { if (set.indexOf(t.id) < 0) set.push(t.id); } else set = set.filter(function (x) { return x !== t.id; });
            deck.topics = set; dirty = true;
          } }), h('span', null, t.name)));
        });
        content.appendChild(h('p', null, 'Welche Themen sollen geübt werden? Aufgaben werden automatisch mit Zufallszahlen erzeugt und mit Lösungsweg erklärt.'));
        content.appendChild(box);
        content.appendChild(h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn ghost small', onclick: function () {
          var t = (deck.topics || [])[0] || 'prozent';
          var task = LP.math.generate(t);
          var pv = h('div', { class: 'card' }, h('p', null, ui.mathText(task.q)), h('ol', { class: 'small' }, task.steps.map(function (s) { return h('li', null, ui.mathText(s)); })));
          ui.dialog({ title: 'Beispielaufgabe: ' + task.topicName, body: pv, cancel: false, ok: 'Schließen' });
        } }, 'Beispielaufgabe ansehen')));
        return;
      }
      // Karten-Tabelle
      if (kind === 'vokabeln') {
        content.appendChild(field('Abfragerichtung', select('dk-dir', [['b2a', 'Deutsch → Englisch (wie im Test)'], ['a2b', 'Englisch → Deutsch'], ['mix', 'Gemischt']], deck.direction || 'b2a')));
      }
      var labels = kind === 'vokabeln' ? ['Englisch (Fremdsprache)', 'Deutsch'] : kind === 'quiz' ? ['Frage', 'Richtige Antwort'] : ['Vorderseite / Frage', 'Rückseite / Antwort'];
      var table = h('div', { class: 'card-table' });
      table.appendChild(h('div', { class: 'card-row head k-' + kind }, h('span', null, labels[0]), h('span', null, labels[1]), kind === 'quiz' ? h('span', null, 'Falsche Antworten (mit | trennen)') : null, h('span', null, 'Merkhilfe (optional)'), h('span', null, '')));
      function addRow(c) {
        var row = h('div', { class: 'card-row k-' + kind, 'data-id': c.id },
          h('input', { 'data-f': 'a', type: 'text', value: c.a || '', 'aria-label': labels[0], oninput: function () { dirty = true; } }),
          h('input', { 'data-f': 'b', type: 'text', value: c.b || '', 'aria-label': labels[1], oninput: function () { dirty = true; } }),
          kind === 'quiz' ? h('input', { 'data-f': 'x', type: 'text', value: (c.x || []).join(' | '), 'aria-label': 'Falsche Antworten' }) : null,
          h('input', { 'data-f': 'n', type: 'text', value: c.n || '', 'aria-label': 'Merkhilfe', placeholder: '' }),
          h('button', { type: 'button', class: 'icon-btn', title: 'Zeile löschen', onclick: function () { row.parentNode.removeChild(row); dirty = true; } }, svg(I.trash)));
        table.appendChild(row);
        return row;
      }
      deck.cards.forEach(addRow);
      content.appendChild(table);
      content.appendChild(h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn ghost small', onclick: function () {
        var r = addRow({ id: LP.uid('c') }); r.querySelector('input').focus();
      } }, svg(I.plus), 'Zeile hinzufügen'), h('span', { class: 'muted small' }, deck.cards.length + ' Einträge. Alternativen mit „/“ trennen (z. B. „Erfahrung / Erlebnis“), Optionales in Klammern.')));

      // Massen-Import
      var help = IMPORT_HELP[kind];
      var imp = h('textarea', { id: 'dk-import', rows: 6, class: 'mono', placeholder: help.ex });
      var promptBox = h('div', { class: 'ai-help' },
        h('p', { class: 'small' }, svg(I.bulb), h('strong', null, 'Zeit sparen mit KI: '), 'Buchseite oder Vokabelliste fotografieren, zusammen mit diesem Text an Claude (oder einen anderen KI-Assistenten) schicken und die Antwort hier einfügen:'),
        h('pre', { class: 'prompt-text' }, help.prompt),
        h('button', { type: 'button', class: 'btn ghost small', onclick: function () {
          LP.copyText(help.prompt).then(function (ok) { LP.toast(ok ? 'Text kopiert' : 'Bitte Text markieren und kopieren', ok ? 'good' : 'warn'); });
        } }, svg(I.copy), 'Text kopieren'));
      content.appendChild(h('details', { class: 'import', open: !deck.cards.length },
        h('summary', null, svg(I.upload), 'Viele Einträge auf einmal einfügen'),
        h('p', { class: 'muted small' }, 'Eine Zeile pro Eintrag im Format: ', h('code', null, help.fmt)),
        imp,
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn primary small', onclick: function () {
          collectCards();
          var rows = parseImport(kind, imp.value);
          if (!rows.length) { LP.toast('Keine passenden Zeilen gefunden – Format prüfen.', 'warn'); return; }
          rows.forEach(function (r) { r.id = LP.uid('c'); deck.cards.push(r); });
          dirty = true;
          LP.toast(rows.length + ' Einträge übernommen', 'good');
          renderContent();
        } }, 'Übernehmen')),
        promptBox));
    }

    kindSel.addEventListener('change', function () { collectCards(); deck.kind = kindSel.value; renderContent(); });
    renderContent();

    form.appendChild(h('div', { class: 'row end' },
      isNew ? null : h('button', { type: 'button', class: 'btn danger ghost', onclick: function () {
        ui.dialog({ title: 'Lernpaket löschen?', text: 'Der Lernfortschritt dazu geht verloren.', ok: 'Löschen', danger: true }).then(function (y) {
          if (!y) return;
          store.del('decks', deck.id);
          store.list('exams').forEach(function (e) { if ((e.deckIds || []).indexOf(deck.id) >= 0) store.put('exams', Object.assign({}, e, { deckIds: e.deckIds.filter(function (x) { return x !== deck.id; }) })); });
          LP.go('#/eltern/inhalte');
        });
      } }, svg(I.trash), 'Löschen'),
      h('button', { type: 'button', class: 'btn primary', onclick: save }, 'Speichern')));

    function save() {
      collectCards();
      var title = val('dk-title').trim();
      if (!title) { LP.toast('Bitte einen Titel eingeben.', 'warn'); document.getElementById('dk-title').focus(); return; }
      var kind = kindSel.value;
      var doc = { id: deck.id, title: title, subjectId: val('dk-subject'), kind: kind, createdAt: deck.createdAt || Date.now() };
      if (kind === 'merkblatt') doc.text = deck.text || '';
      else if (kind === 'mathe') { doc.topics = deck.topics || []; if (!doc.topics.length) { LP.toast('Bitte mindestens ein Thema wählen.', 'warn'); return; } }
      else {
        doc.cards = deck.cards;
        if (kind === 'vokabeln') doc.direction = val('dk-dir') || 'b2a';
        if (kind === 'quiz') {
          var bad = doc.cards.filter(function (c) { return !c.x || !c.x.length; }).length;
          if (bad) { LP.toast(bad + ' Quizfrage(n) ohne falsche Antworten – bitte ergänzen.', 'warn'); return; }
        }
      }
      store.put('decks', doc);
      if (exam && (exam.deckIds || []).indexOf(doc.id) < 0) store.put('exams', Object.assign({}, exam, { deckIds: (exam.deckIds || []).concat([doc.id]) }));
      dirty = false;
      LP.toast('Gespeichert', 'good');
      LP.go(exam ? '#/eltern/termine/' + exam.id : '#/eltern/inhalte');
    }
  }

  /* ---------------------------------------------------------------- Noten */

  function grades(el) {
    var form = h('form', { class: 'card form', onsubmit: function (e) {
      e.preventDefault();
      var g = Number(val('gr-grade'));
      store.put('grades', { id: LP.uid('g'), subjectId: val('gr-subject'), date: val('gr-date'), type: val('gr-type'), grade: g, note: val('gr-note').trim() });
      LP.toast('Note eingetragen', 'good');
      LP.rerender();
    } },
    h('h2', null, 'Note eintragen'),
    h('div', { class: 'form-grid' },
      field('Fach', select('gr-subject', subjectOptions())),
      field('Art', select('gr-type', Object.keys(LP.EXAM_TYPES).map(function (k) { return [k, LP.EXAM_TYPES[k].short]; }))),
      field('Datum', h('input', { id: 'gr-date', type: 'date', value: LP.today() })),
      field('Note', select('gr-grade', [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map(function (n) { return [n, String(n).replace('.', ',')]; }), 3)),
      field('Notiz', h('input', { id: 'gr-note', type: 'text', placeholder: 'z. B. Ex Present Perfect' }))),
    h('div', { class: 'row end' }, h('button', { class: 'btn primary', type: 'submit' }, 'Eintragen')));
    el.appendChild(form);

    LP.subjects().forEach(function (s) {
      var gs = store.list('grades').filter(function (g) { return g.subjectId === s.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var avg = gs.length ? gs.reduce(function (a, g) { return a + Number(g.grade); }, 0) / gs.length : null;
      var c = h('section', { class: 'card', style: { '--c': s.color } }, h('div', { class: 'card-head' }, h('h2', null, h('span', { class: 'dot big' }), s.name), avg ? h('strong', { class: 'tabular' }, 'Ø ' + avg.toFixed(2).replace('.', ',')) : null));
      if (!gs.length) c.appendChild(h('p', { class: 'muted' }, 'Keine Noten.'));
      gs.forEach(function (g) {
        c.appendChild(h('div', { class: 'list-row' }, h('span', { class: 'grade g' + Math.round(g.grade) }, String(g.grade).replace('.', ',')),
          h('span', { class: 'grow' }, g.note || (LP.EXAM_TYPES[g.type] || {}).short || ''), h('span', { class: 'muted small' }, LP.fmtDay(g.date)),
          h('button', { class: 'icon-btn', title: 'Löschen', onclick: function () { store.del('grades', g.id); LP.rerender(); } }, svg(I.trash))));
      });
      el.appendChild(c);
    });
  }

  /* ---------------------------------------------------------------- Belohnungen */

  function rewards(el) {
    var pending = store.list('redemptions').filter(function (r) { return r.status === 'offen'; });
    if (pending.length) {
      var pc = h('section', { class: 'card attention' }, h('h2', null, 'Offene Wünsche'));
      pending.forEach(function (r) { pc.appendChild(redemptionRow(r)); });
      el.appendChild(pc);
    }
    var c = h('section', { class: 'card' }, h('h2', null, 'Belohnungen'),
      h('p', { class: 'muted small' }, 'Pro richtiger Antwort gibt es 2 Punkte, pro geschafftem Block 10, für eine komplette Lernzeit 20 plus Serien-Bonus. Eine Lernzeit von 45 Minuten bringt meist 80–150 Punkte.'));
    store.list('rewards').sort(function (a, b) { return a.cost - b.cost; }).forEach(function (r) {
      c.appendChild(h('div', { class: 'list-row' },
        h('input', { type: 'text', value: r.title, class: 'grow', 'aria-label': 'Belohnung', onchange: function () { store.put('rewards', Object.assign({}, r, { title: this.value })); } }),
        h('input', { type: 'number', value: r.cost, min: 1, class: 'num-sm', 'aria-label': 'Punkte', onchange: function () { store.put('rewards', Object.assign({}, r, { cost: Number(this.value) || r.cost })); } }),
        h('span', { class: 'muted small' }, 'Punkte'),
        h('button', { class: 'icon-btn', title: 'Löschen', onclick: function () { store.del('rewards', r.id); LP.rerender(); } }, svg(I.trash))));
    });
    c.appendChild(h('form', { class: 'list-row', onsubmit: function (e) {
      e.preventDefault();
      var t = val('rw-title').trim(); if (!t) return;
      store.put('rewards', { id: LP.uid('r'), title: t, cost: Number(val('rw-cost')) || 100 });
      LP.rerender();
    } }, h('input', { id: 'rw-title', type: 'text', class: 'grow', placeholder: 'Neue Belohnung, z. B. Freund übernachten lassen' }), h('input', { id: 'rw-cost', type: 'number', class: 'num-sm', value: 300, min: 1 }), h('button', { class: 'btn primary small', type: 'submit' }, svg(I.plus), 'Hinzufügen')));
    el.appendChild(c);

    var hist = store.list('redemptions').filter(function (r) { return r.status !== 'offen'; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 15);
    if (hist.length) {
      var hc = h('section', { class: 'card' }, h('h2', null, 'Verlauf'));
      hist.forEach(function (r) { hc.appendChild(h('div', { class: 'list-row' }, h('span', { class: 'grow' }, r.title), h('span', { class: 'muted small' }, LP.fmtDay(r.date)), h('span', { class: 'pill ' + (r.status === 'eingelöst' ? 'good' : 'bad') }, r.status))); });
      el.appendChild(hc);
    }
  }

  /* ---------------------------------------------------------------- Einstellungen */

  function settingsView(el) {
    var st = LP.settings();
    var days = st.days.slice();
    var dayBox = h('div', { class: 'day-pick' });
    [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
      dayBox.appendChild(h('label', { class: 'day-toggle' }, h('input', { type: 'checkbox', checked: days.indexOf(d) >= 0, onchange: function () {
        if (this.checked) days.push(d); else days = days.filter(function (x) { return x !== d; });
      } }), h('span', null, LP.WD[d])));
    });
    var form = h('form', { class: 'card form', onsubmit: function (e) {
      e.preventDefault();
      store.put('settings', Object.assign({}, store.get('settings', 'main') || {}, {
        id: 'main', studentName: val('st-name').trim(), days: days, startTime: val('st-time') || '16:00',
        minutes: LP.clamp(Number(val('st-min')) || 45, 15, 120), idleSeconds: LP.clamp(Number(val('st-idle')) || 90, 30, 600),
        lrsSubjects: Array.prototype.slice.call(document.querySelectorAll('[data-lrs]')).filter(function (cb) { return cb.checked; }).map(function (cb) { return cb.getAttribute('data-lrs'); }), lrs: undefined, readable: document.getElementById('st-readable').checked
      }));
      LP.toast('Einstellungen gespeichert', 'good');
      LP.applyReadable();
    } },
    h('h2', null, 'Feste Lernzeit'),
    h('p', { class: 'muted small' }, 'Feste Tage, feste Uhrzeit, fester Ablauf: Aufwärmen → Block 1 → Pause → Block 2 → Mini-Test. Die Inhalte richten sich automatisch nach den nächsten Terminen.'),
    h('div', { class: 'form-grid' },
      field('Name des Kindes', h('input', { id: 'st-name', type: 'text', value: st.studentName })),
      field('Beginn', h('input', { id: 'st-time', type: 'time', value: st.startTime })),
      field('Dauer (Minuten)', h('input', { id: 'st-min', type: 'number', min: 15, max: 120, step: 5, value: st.minutes }), '30–45 Minuten sind für Klasse 9 ein guter Wert.'),
      field('Pause bei Untätigkeit nach (Sek.)', h('input', { id: 'st-idle', type: 'number', min: 30, max: 600, value: st.idleSeconds }), 'Die Uhr stoppt, wenn nichts getan wird.')),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Lerntage'), dayBox),
    h('h2', null, 'Rechtschreibschwäche'),
    h('p', { class: 'muted small' }, 'Rechtschreibung nicht bewerten in (wie beim Nachteilsausgleich der Schule): Ein erkennbar richtiges Wort zählt als richtig, die Schreibweise wird nur gezeigt. In den übrigen Fächern zählt die Schreibweise; ist hier mindestens ein Fach angehakt, übt Ihr Kind falsch geschriebene Wörter dort zusätzlich durch einmaliges Abtippen.'),
    h('div', { class: 'day-pick' }, LP.subjects().map(function (sub) {
      return h('label', { class: 'check lrs-subj' }, h('input', { type: 'checkbox', 'data-lrs': sub.id, checked: LP.lenientFor(sub.id) }), h('span', null, sub.name));
    })),
    h('label', { class: 'check' }, h('input', { id: 'st-readable', type: 'checkbox', checked: !!st.readable }),
      h('span', null, h('strong', null, 'Lesefreundliche Darstellung'), h('br'), h('span', { class: 'muted small' }, 'Größere Schrift, mehr Abstand zwischen Buchstaben und Zeilen, keine Kursivschrift.'))),
    h('div', { class: 'row end' }, h('button', { class: 'btn primary', type: 'submit' }, 'Speichern')));
    el.appendChild(form);

    var ai = store.aiCheck || {};
    el.appendChild(h('section', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Schreibrunden prüfen lassen'),
      h('span', { class: 'pill ' + (ai.available ? 'good' : 'muted-pill') }, ai.available ? 'KI-Prüfung aktiv' : 'Aus')),
      h('p', { class: 'muted small' }, ai.available
        ? 'Fotos der Schreibrunden werden von Claude gelesen und geprüft' + (ai.model ? ' (' + ai.model + ')' : '') + '. Klappt das nicht, kontrolliert Ihr Kind selbst.'
        : 'Ihr Kind kontrolliert die Schreibrunde selbst; Sie sehen jedes Blatt in der Übersicht. ' + (ai.reason || '') + ' Anleitung: README, Abschnitt „KI-Prüfung“.')));

    // Vorschau des heutigen Plans
    var plan = L.buildPlan(LP.today());
    el.appendChild(h('section', { class: 'card' }, h('h2', null, 'So sieht der Plan heute aus'),
      h('ol', { class: 'plan-steps compact' }, plan.steps.map(function (s) {
        return h('li', { class: 'plan-step k-' + s.kind, style: s.subjectId ? { '--c': LP.subject(s.subjectId).color } : null },
          h('span', { class: 'step-body' }, h('strong', null, s.title), h('span', { class: 'muted small' }, s.sub || '')), h('span', { class: 'step-min' }, s.minutes + ' min'));
      }))));

    // PIN
    var pinIn = h('input', { id: 'st-pin', type: 'password', inputmode: 'numeric', maxlength: 12, placeholder: 'Neue PIN (4–12 Ziffern)' });
    el.appendChild(h('form', { class: 'card form', onsubmit: function (e) {
      e.preventDefault();
      if (!/^\d{4,12}$/.test(pinIn.value)) { LP.toast('Bitte 4 bis 12 Ziffern.', 'warn'); return; }
      store.changePin(pinIn.value).then(function () { pinIn.value = ''; LP.toast('PIN geändert', 'good'); }, function (ex) { LP.toast(ex.message, 'warn'); });
    } }, h('h2', null, 'Eltern-PIN ändern'), h('div', { class: 'row' }, pinIn, h('button', { class: 'btn primary', type: 'submit' }, 'Ändern'))));

    // Sicherung
    var out = h('textarea', { id: 'st-backup', rows: 4, class: 'mono', readonly: true, hidden: true });
    var inp = h('input', { type: 'file', accept: '.json,application/json', id: 'st-file' });
    el.appendChild(h('section', { class: 'card form' }, h('h2', null, 'Datensicherung'),
      h('p', { class: 'muted small' }, store.mode === 'remote' ? 'Der Server legt täglich automatisch eine Sicherung im Ordner data/backups an. Zusätzlich können Sie hier alles herunterladen oder wiederherstellen.' : 'Demo-Version: Daten liegen nur in diesem Browser.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', type: 'button', onclick: function () {
          store.exportAll().then(function (json) {
            var text = JSON.stringify(json, null, 1);
            try {
              var blob = new Blob([text], { type: 'application/json' });
              var a = h('a', { href: URL.createObjectURL(blob), download: 'lernportal-sicherung-' + LP.today() + '.json' });
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
            } catch (e2) { /* Download blockiert */ }
            out.value = text; out.hidden = false;
          });
        } }, svg(I.download), 'Sicherung herunterladen'),
        h('label', { class: 'btn ghost file-btn' }, svg(I.upload), 'Sicherung einspielen', inp)),
      out));
    inp.addEventListener('change', function () {
      var f = inp.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var json;
        try { json = JSON.parse(r.result); } catch (e) { LP.toast('Datei ist kein gültiges JSON.', 'warn'); return; }
        ui.dialog({ title: 'Sicherung einspielen?', text: 'Alle aktuellen Daten werden durch die Sicherung ersetzt.', ok: 'Einspielen', danger: true }).then(function (y) {
          if (!y) return;
          store.importAll(json).then(function () { LP.toast('Sicherung eingespielt', 'good'); LP.rerender(); }, function (ex) { LP.toast(ex.message, 'warn'); });
        });
      };
      r.readAsText(f);
    });

    if (store.mode === 'local') {
      el.appendChild(h('section', { class: 'card' }, h('h2', null, 'Demo zurücksetzen'), h('p', { class: 'muted small' }, 'Stellt die Beispieldaten wieder her.'),
        h('button', { class: 'btn danger ghost', onclick: function () { store.resetDemo(); } }, 'Zurücksetzen')));
    }
  }
})();
