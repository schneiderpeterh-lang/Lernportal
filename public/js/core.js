/*
 * Kern: DOM-Helfer, Datums-Helfer und der Datenspeicher.
 * Bewusst in ES2017 ohne Build-Schritt geschrieben, damit auch ältere Fire-Tablets es ausführen.
 */
(function () {
  'use strict';
  var LP = window.LP = window.LP || {};

  /* ---------------------------------------------------------------- DOM */

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (sk) { if (sk.indexOf('--') === 0) el.style.setProperty(sk, v[sk]); else el.style[sk] = v[sk]; });
        else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'value' || k === 'checked' || k === 'selected' || k === 'disabled' || k === 'indeterminate') el[k] = v;
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    el.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function svg(markup, cls) {
    var span = document.createElement('span');
    span.className = 'ico' + (cls ? ' ' + cls : '');
    span.innerHTML = markup;
    return span;
  }

  // Kleine Strich-Icons (eigene Zeichnung, currentColor)
  var I = {
    today: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.6"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/></svg>',
    dumbbell: '<svg viewBox="0 0 24 24"><path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12"/></svg>',
    trophy: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20h7M10 17h4"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
    unlock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.4-5.4 3.6-7.8.5 1.6 1.4 2.6 2.4 3.1C11.8 7.4 13 5 15 3c.2 3 3.5 5.4 3.5 10.1 0 4.6-2.8 7.9-6.5 7.9z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5V5.5zM12 6v13.5"/></svg>',
    cards: '<svg viewBox="0 0 24 24"><rect x="3.5" y="7" width="13" height="13" rx="2"/><path d="M8 4h10.5a2 2 0 0 1 2 2v10.5"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-1.5-3.5-5.5-4.5-5.5-2S10 9 12 9zm0 0c1.5-3.5 5.5-4.5 5.5-2S14 9 12 9z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M8.5 5.5v13M15.5 5.5v13"/></svg>',
    coffee: '<svg viewBox="0 0 24 24"><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c0 1.5 1.5 1.5 1.5 3M12 3.5c0 1.5 1.5 1.5 1.5 3"/></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 3L5.5 13.5H12L11 21l7.5-10.5H12z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5a1.5 1.5 0 0 0-1.5-1.5h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.4c1.9.8 3 2.9 3 5.6"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-.6c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z"/></svg>'
  };

  /* ---------------------------------------------------------------- Datum */

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function parseDay(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0); }
  function addDays(s, n) { var d = parseDay(s); d.setDate(d.getDate() + n); return iso(d); }
  function daysBetween(a, b) { return Math.round((parseDay(b) - parseDay(a)) / 86400000); }
  var WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  var WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
  function weekday(s) { return parseDay(s).getDay(); }
  function fmtDay(s) { var d = parseDay(s); return WD[d.getDay()] + ', ' + d.getDate() + '. ' + MON[d.getMonth()]; }
  function fmtShort(s) { var d = parseDay(s); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.'; }
  function fmtLong(s) { var d = parseDay(s); return WD_LONG[d.getDay()] + ', ' + d.getDate() + '. ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function relDay(s) {
    var n = daysBetween(today(), s);
    if (n === 0) return 'heute';
    if (n === 1) return 'morgen';
    if (n === 2) return 'übermorgen';
    if (n === -1) return 'gestern';
    if (n < 0) return 'vor ' + (-n) + ' Tagen';
    return 'in ' + n + ' Tagen';
  }
  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ':' + pad(sec % 60);
  }

  /* ---------------------------------------------------------------- Sonstiges */

  function uid(prefix) {
    return (prefix || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lsGet(k, fallback) {
    try { var v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* voll oder gesperrt */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* egal */ } }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { /* egal */ } }

  var toastTimer = null;
  function toast(msg, kind) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 3200);
  }

  function copyText(text) {
    function fallback() {
      var ta = h('textarea', { style: { position: 'fixed', top: '-1000px' } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    }
    return Promise.resolve(fallback());
  }

  /* ---------------------------------------------------------------- Speicher */

  var COLS = ['settings', 'subjects', 'exams', 'decks', 'progress', 'sessions', 'rewards', 'redemptions', 'grades', 'writings'];
  var STUDENT_COLS = { progress: 1, sessions: 1, redemptions: 1, writings: 1 };

  function emptyData() { var d = {}; COLS.forEach(function (c) { d[c] = {}; }); return d; }

  var store = {
    mode: window.LP_DEMO ? 'local' : 'remote',
    data: emptyData(),
    pinSet: false,
    aiCheck: { available: false, reason: 'Demo-Version: Prüfung durch Selbstkontrolle' },
    token: null,
    online: true,
    listeners: [],

    onChange: function (fn) { this.listeners.push(fn); },
    emit: function () { var self = this; this.listeners.forEach(function (fn) { fn(self); }); },

    list: function (col) {
      var o = this.data[col] || {};
      return Object.keys(o).map(function (k) { return o[k]; });
    },
    get: function (col, id) { return (this.data[col] || {})[id] || null; },

    load: function () {
      var self = this;
      if (self.mode === 'local') {
        var saved = lsGet('lp_demo_db', null);
        if (!saved) {
          saved = emptyData();
          var seed = LP.buildSeed({ demo: true });
          COLS.forEach(function (c) { (seed[c] || []).forEach(function (doc) { saved[c][doc.id] = doc; }); });
          lsSet('lp_demo_db', saved);
        }
        COLS.forEach(function (c) { if (!saved[c]) saved[c] = {}; });
        self.data = saved;
        self.pinSet = true;
        self.token = ssGet('lp_token');
        return Promise.resolve();
      }
      self.token = ssGet('lp_token');
      return fetch('api/state', { headers: self.headers(), cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (res) {
          var data = res.data || emptyData();
          COLS.forEach(function (c) { if (!data[c]) data[c] = {}; });
          // Noch nicht übertragene Änderungen wieder anwenden, damit nichts „zurückspringt“
          self.outbox().forEach(function (op) {
            if (op.method === 'PUT') data[op.col][op.id] = op.doc; else delete data[op.col][op.id];
          });
          self.data = data;
          self.pinSet = res.pinSet;
          self.aiCheck = res.aiCheck || { available: false, reason: 'Server zu alt' };
          if (self.token && !res.parent) { self.token = null; ssSet('lp_token', null); }
          self.online = true;
          lsSet('lp_cache', data);
        })
        .catch(function (err) {
          var cached = lsGet('lp_cache', null);
          self.online = false;
          if (cached) { self.data = cached; return; }
          throw err;
        });
    },

    headers: function () {
      var hd = { 'Content-Type': 'application/json' };
      if (this.token) hd['X-Parent-Token'] = this.token;
      return hd;
    },

    isParent: function () { return Boolean(this.token); },

    put: function (col, doc) {
      if (!doc.id) doc.id = uid();
      if (!STUDENT_COLS[col] && !this.isParent()) { toast('Nur im Eltern-Bereich änderbar.', 'warn'); return Promise.resolve(false); }
      this.data[col][doc.id] = doc;
      this.persist({ method: 'PUT', col: col, id: doc.id, doc: doc });
      this.emit();
      return Promise.resolve(true);
    },

    del: function (col, id) {
      if (!STUDENT_COLS[col] && !this.isParent()) return Promise.resolve(false);
      delete this.data[col][id];
      this.persist({ method: 'DELETE', col: col, id: id });
      this.emit();
      return Promise.resolve(true);
    },

    persist: function (op) {
      if (this.mode === 'local') { lsSet('lp_demo_db', this.data); return; }
      lsSet('lp_cache', this.data);
      var box = this.outbox().filter(function (o) { return !(o.col === op.col && o.id === op.id); });
      box.push(op);
      lsSet('lp_outbox', box);
      this.flush();
    },

    outbox: function () { return lsGet('lp_outbox', []); },

    flushing: false,
    flush: function () {
      var self = this;
      if (self.mode === 'local' || self.flushing) return Promise.resolve();
      var box = self.outbox();
      if (!box.length) return Promise.resolve();
      self.flushing = true;
      var op = box[0];
      var url = 'api/c/' + op.col + '/' + encodeURIComponent(op.id);
      return fetch(url, { method: op.method, headers: self.headers(), body: op.method === 'PUT' ? JSON.stringify(op.doc) : undefined })
        .then(function (r) {
          if (r.status === 401) {
            toast('Änderung nicht gespeichert: Eltern-Anmeldung abgelaufen.', 'warn');
            self.token = null; ssSet('lp_token', null);
          } else if (!r.ok) {
            throw new Error('HTTP ' + r.status);
          }
          // erledigt (oder endgültig abgelehnt) -> aus der Warteschlange nehmen
          var rest = self.outbox();
          if (rest.length && rest[0].col === op.col && rest[0].id === op.id) rest.shift();
          lsSet('lp_outbox', rest);
          self.flushing = false;
          if (!self.online) { self.online = true; self.emit(); }
          return self.flush();
        })
        .catch(function () {
          self.flushing = false;
          if (self.online) { self.online = false; self.emit(); }
        });
    },

    api: function (path, body, method) {
      var self = this;
      if (self.mode === 'local') return Promise.reject(new Error('Demo'));
      return fetch('api/' + path, {
        method: method || (body ? 'POST' : 'GET'), headers: self.headers(), body: body ? JSON.stringify(body) : undefined
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) throw new Error(j.error || ('Fehler ' + r.status));
          return j;
        });
      });
    },

    login: function (pin) {
      var self = this;
      if (self.mode === 'local') {
        var demoPin = lsGet('lp_demo_pin', '1234');
        if (String(pin) !== String(demoPin)) return Promise.reject(new Error('PIN falsch. (Demo-PIN: ' + demoPin + ')'));
        self.token = 'demo'; ssSet('lp_token', 'demo');
        return Promise.resolve();
      }
      return self.api(self.pinSet ? 'login' : 'setup', { pin: pin }).then(function (res) {
        self.token = res.token; self.pinSet = true; ssSet('lp_token', res.token);
      });
    },

    logout: function () {
      var self = this;
      var p = self.mode === 'local' ? Promise.resolve() : self.api('logout', {}).catch(function () {});
      self.token = null; ssSet('lp_token', null);
      return p;
    },

    changePin: function (pin) {
      if (this.mode === 'local') { lsSet('lp_demo_pin', String(pin)); return Promise.resolve(); }
      return this.api('pin', { pin: pin });
    },

    exportAll: function () {
      if (this.mode === 'local') return Promise.resolve({ app: 'lernportal', version: 1, exportedAt: new Date().toISOString(), data: this.data });
      return this.api('export');
    },

    importAll: function (json) {
      var self = this;
      var data = json && json.data ? json.data : json;
      if (!data || typeof data !== 'object' || !data.decks) return Promise.reject(new Error('Das ist keine Lernportal-Sicherung.'));
      if (self.mode === 'local') {
        COLS.forEach(function (c) { if (!data[c]) data[c] = {}; });
        self.data = data; lsSet('lp_demo_db', data); self.emit();
        return Promise.resolve();
      }
      return self.api('import', { data: data }).then(function () { return self.load(); }).then(function () { self.emit(); });
    },

    // Schreibrunde: Foto hochladen, Server prüft (KI) oder meldet, dass selbst kontrolliert wird
    uploadWriting: function (dataUrl, items) {
      if (this.mode === 'local') return Promise.resolve({ photoId: null, results: null, reason: 'Demo-Version: Bitte selbst kontrollieren.' });
      return this.api('writing', { image: dataUrl, items: items });
    },
    photoUrl: function (id) { return id && this.token ? 'api/foto/' + encodeURIComponent(id) + '?t=' + encodeURIComponent(this.token) : null; },

    resetDemo: function () { lsDel('lp_demo_db'); lsDel('lp_run'); location.reload(); }
  };

  /* ---------------------------------------------------------------- Einstellungen & Fächer */

  var DEFAULT_SETTINGS = { id: 'main', studentName: '', days: [1, 2, 3, 4, 5], startTime: '16:00', minutes: 45, idleSeconds: 90 };
  function settings() { return Object.assign({}, DEFAULT_SETTINGS, store.get('settings', 'main') || {}); }
  function subjects() { return store.list('subjects').sort(function (a, b) { return (a.order || 99) - (b.order || 99) || a.name.localeCompare(b.name); }); }
  function subject(id) { return store.get('subjects', id) || { id: id, name: id || 'Allgemein', color: '#6b7280', short: '?' }; }

  var EXAM_TYPES = {
    arbeit: { label: 'Klassenarbeit', short: 'Klassenarbeit', prep: 10, weight: 3 },
    test: { label: 'Test / kurze schriftliche Übung', short: 'Test', prep: 4, weight: 2 },
    vokabeltest: { label: 'Vokabeltest', short: 'Vokabeltest', prep: 5, weight: 2 },
    referat: { label: 'Referat / Präsentation', short: 'Referat', prep: 7, weight: 2 },
    sonstiges: { label: 'Sonstiges', short: 'Termin', prep: 4, weight: 1 }
  };
  var DECK_KINDS = {
    vokabeln: { label: 'Vokabeln', hint: 'Fremdwort und Bedeutung – wird geschrieben und abgefragt' },
    karten: { label: 'Karteikarten', hint: 'Frage und Antwort – zum Aufdecken und Selbsteinschätzen' },
    quiz: { label: 'Quiz', hint: 'Frage mit richtiger und falschen Antworten' },
    merkblatt: { label: 'Merkblatt', hint: 'Zusammenfassung zum Lesen' },
    mathe: { label: 'Mathe-Training', hint: 'Automatisch erzeugte Aufgaben mit Lösungsweg' }
  };

  Object.assign(LP, {
    h: h, clear: clear, svg: svg, I: I,
    iso: iso, today: today, parseDay: parseDay, addDays: addDays, daysBetween: daysBetween, weekday: weekday,
    fmtDay: fmtDay, fmtShort: fmtShort, fmtLong: fmtLong, relDay: relDay, fmtClock: fmtClock, WD: WD, WD_LONG: WD_LONG,
    uid: uid, shuffle: shuffle, clamp: clamp, lsGet: lsGet, lsSet: lsSet, lsDel: lsDel, toast: toast, copyText: copyText,
    store: store, settings: settings, subjects: subjects, subject: subject, EXAM_TYPES: EXAM_TYPES, DECK_KINDS: DECK_KINDS
  });
})();
