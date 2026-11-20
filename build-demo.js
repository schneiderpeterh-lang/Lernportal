#!/usr/bin/env node
/*
 * Baut eine eigenständige Demo-/Offline-Version als EINE HTML-Datei (dist/lernportal-standalone.html).
 * Alle Daten liegen dann nur im Browser (localStorage) – ideal zum Ausprobieren oder
 * als Notlösung ohne Heimserver. Eltern-PIN in dieser Version: 1234 (änderbar).
 *
 *   node build-demo.js            -> dist/lernportal-standalone.html
 *   node build-demo.js --fragment -> zusätzlich dist/lernportal-demo-fragment.html (ohne <html>-Gerüst)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const pub = path.join(__dirname, 'public');
const out = path.join(__dirname, 'dist');
fs.mkdirSync(out, { recursive: true });

const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(pub, 'app.css'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((s) => '/* ' + s + ' */\n' + fs.readFileSync(path.join(pub, s), 'utf8')).join('\n');

const banner = `
window.LP_DEMO = true;
window.LP = window.LP || {};
window.LP.LP_DEMO_BANNER = function () {
  var LP = window.LP, h = LP.h;
  return h('div', { class: 'demo-banner' },
    h('strong', null, 'Demo-Version'),
    h('span', null, 'Beispieldaten, gespeichert nur in diesem Browser. Eltern-PIN: 1234.'),
    h('button', { class: 'btn ghost small', onclick: function () { LP.store.resetDemo(); } }, 'Zurücksetzen'));
};
`;

const body = `<div id="app"><p style="padding:24px">Lernportal wird geladen …</p></div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script>${banner}</script>
<script>
${js.replace(/<\/script/gi, '<\\/script')}
</script>`;

const head = `<title>Lernportal</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>`;

const full = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'lernportal-standalone.html'), full);
console.log('geschrieben: dist/lernportal-standalone.html (' + Math.round(full.length / 1024) + ' KB)');

if (process.argv.includes('--fragment')) {
  fs.writeFileSync(path.join(out, 'lernportal-demo-fragment.html'), head + '\n' + body + '\n');
  console.log('geschrieben: dist/lernportal-demo-fragment.html');
}
