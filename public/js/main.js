/*
 * Start, Navigation (Hash-Routing) und regelmäßiges Nachladen neuer Daten.
 */
(function () {
  'use strict';
  var LP = window.LP, h = LP.h, svg = LP.svg, I = LP.I, store = LP.store, V = LP.views;

  var app = document.getElementById('app');
  var cleanup = null;

  var NAV = [
    ['heute', 'Heute', I.today], ['termine', 'Termine', I.calendar], ['training', 'Training', I.dumbbell], ['fortschritt', 'Fortschritt', I.trophy]
  ];

  // In der Demo (eingebettet) wird intern navigiert, sonst über den Hash in der Adresszeile
  var current = '#/heute';
  LP.go = function (target) {
    if (store.mode === 'local') { current = target; render(); window.scrollTo(0, 0); }
    else if (location.hash === target) render();
    else location.hash = target;
  };
  if (store.mode === 'local') {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      var a = e.target.closest ? e.target.closest('a[href^="#/"]') : null;
      if (!a) return;
      e.preventDefault();
      LP.go(a.getAttribute('href'));
    });
  }

  function route() {
    var raw = ((store.mode === 'local' ? current : location.hash) || '#/heute').replace(/^#\/?/, '');
    var parts = raw.split('/');
    return { name: parts[0] || 'heute', sub: parts[1] || '', arg: parts.slice(2).join('/') || '' };
  }

  function render() {
    if (cleanup) { try { cleanup(); } catch (e) { /* egal */ } cleanup = null; }
    var r = route();
    LP.clear(app);
    var focusMode = r.name === 'lernzeit';
    document.body.classList.toggle('focus-mode', focusMode);

    if (!focusMode) {
      var nav = h('nav', { class: 'nav', 'aria-label': 'Hauptnavigation' },
        h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, 'L'), h('span', { class: 'brand-name' }, 'Lernportal')),
        h('div', { class: 'nav-links' }, NAV.map(function (n) {
          return h('a', { href: '#/' + n[0], class: 'nav-link' + (r.name === n[0] ? ' active' : '') }, svg(n[2]), h('span', null, n[1]));
        })),
        h('a', { href: '#/eltern', class: 'nav-link parent-link' + (r.name === 'eltern' ? ' active' : ''), title: 'Eltern-Bereich' }, svg(store.isParent() ? I.unlock : I.gear), h('span', null, 'Eltern')));
      app.appendChild(nav);
    }
    var main = h('main', { class: 'view', id: 'view' });
    app.appendChild(main);
    if (!store.online && store.mode === 'remote') {
      main.appendChild(h('div', { class: 'offline' }, 'Keine Verbindung zum Lernportal-Server. Du kannst weiterlernen – alles wird übertragen, sobald die Verbindung wieder da ist.'));
    }
    if (LP.LP_DEMO_BANNER) main.appendChild(LP.LP_DEMO_BANNER());

    var res;
    try {
      switch (r.name) {
        case 'heute': res = V.today(main); break;
        case 'lernzeit': res = V.session(main); break;
        case 'termine': res = V.exams(main); break;
        case 'training': res = V.training(main); break;
        case 'lesen': res = V.reader(main, r.sub); break;
        case 'fortschritt': res = V.progress(main); break;
        case 'eltern': res = V.parentGate(main, r.sub, r.arg); break;
        default: LP.go('#/heute'); return;
      }
    } catch (err) {
      console.error(err);
      main.appendChild(h('div', { class: 'card' }, h('h2', null, 'Da ist etwas schiefgelaufen'), h('p', { class: 'muted' }, String(err && err.message || err)), h('a', { class: 'btn primary', href: '#/heute' }, 'Zur Startseite')));
    }
    if (typeof res === 'function') cleanup = res;
    if (!focusMode) window.scrollTo(0, 0);
  }
  LP.rerender = render;

  window.addEventListener('hashchange', render);

  // Neue Daten (z. B. ein neuer Termin von den Eltern) regelmäßig holen – nicht während einer Lernzeit oder beim Bearbeiten
  function refresh() {
    var r = route();
    if (store.mode !== 'remote' || r.name === 'lernzeit' || (r.name === 'eltern' && r.arg)) return;
    if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    store.flush().then(function () {
      if (store.outbox().length) return;
      return store.load().then(render);
    });
  }
  setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  window.addEventListener('online', function () { store.flush(); });
  setInterval(function () { store.flush(); }, 15000);

  store.load().then(render, function () {
    LP.clear(app);
    app.appendChild(h('div', { class: 'gate' }, h('div', { class: 'card center' },
      h('h1', null, 'Server nicht erreichbar'),
      h('p', { class: 'muted' }, 'Das Lernportal konnte nicht geladen werden. Läuft der Rechner mit dem Lernportal, und ist das Tablet im WLAN?'),
      h('button', { class: 'btn primary', onclick: function () { location.reload(); } }, 'Erneut versuchen'))));
  });
})();
