#!/usr/bin/env node
/*
 * Lernportal – kleiner Heimserver ohne externe Abhängigkeiten.
 *
 *  - liefert die Web-App aus (public/)
 *  - speichert alle Daten in data/db.json (atomar, mit täglichem Backup)
 *  - Eltern-Bereich ist per PIN geschützt (scrypt-Hash, Sperre nach Fehlversuchen)
 *  - der Schüler darf nur Lernfortschritt, Sitzungen, Schreibrunden und Belohnungswünsche schreiben
 *  - optional: Schreibrunden-Fotos werden von Claude geprüft (ANTHROPIC_API_KEY setzen, `npm install`)
 *
 * Start:  node server.js        (Port 3000, ändern mit PORT=8080)
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const PUBLIC_DIR = path.join(__dirname, 'public');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const PHOTO_DIR = path.join(DATA_DIR, 'fotos');
const BACKUP_KEEP = 30;
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_BODY = 8 * 1024 * 1024;
const MAX_PHOTO = 4 * 1024 * 1024;

const COLLECTIONS = ['settings', 'subjects', 'exams', 'decks', 'progress', 'sessions', 'rewards', 'redemptions', 'grades', 'writings'];
const STUDENT_WRITABLE = new Set(['progress', 'sessions', 'redemptions', 'writings']);
const ID_RE = /^[A-Za-z0-9_\-]{1,100}$/;

fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.mkdirSync(PHOTO_DIR, { recursive: true });

const writingCheck = require('./lib/writing-check');

/* ------------------------------------------------------------------ Daten */

function emptyDb() {
  const db = {};
  COLLECTIONS.forEach((c) => { db[c] = {}; });
  return db;
}

function normalizeDb(raw) {
  const db = emptyDb();
  if (raw && typeof raw === 'object') {
    COLLECTIONS.forEach((c) => {
      if (raw[c] && typeof raw[c] === 'object' && !Array.isArray(raw[c])) db[c] = raw[c];
    });
  }
  return db;
}

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return normalizeDb(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
    } catch (err) {
      const broken = DB_FILE + '.defekt-' + Date.now();
      fs.renameSync(DB_FILE, broken);
      console.error('db.json war nicht lesbar und wurde nach ' + broken + ' verschoben. Prüfe data/backups/.');
    }
  }
  // Erster Start: Startinhalte (Fächer, Beispiel-Lernkarten, Belohnungen) anlegen
  const db = emptyDb();
  try {
    const seed = require('./public/js/seed.js').buildSeed({ demo: false });
    COLLECTIONS.forEach((c) => { (seed[c] || []).forEach((doc) => { db[c][doc.id] = doc; }); });
    console.log('Erster Start: Startinhalte angelegt.');
  } catch (err) {
    console.error('Startinhalte konnten nicht geladen werden:', err.message);
  }
  writeFileAtomic(DB_FILE, JSON.stringify(db));
  return db;
}

function writeFileAtomic(file, content) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

let db = loadDb();
let saveTimer = null;

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 250);
}

function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    writeFileAtomic(DB_FILE, JSON.stringify(db));
    dailyBackup();
  } catch (err) {
    console.error('Speichern fehlgeschlagen:', err.message);
  }
}

function dailyBackup() {
  const day = new Date().toISOString().slice(0, 10);
  const target = path.join(BACKUP_DIR, 'db-' + day + '.json');
  if (fs.existsSync(target)) return;
  fs.copyFileSync(DB_FILE, target);
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => /^db-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  files.slice(0, Math.max(0, files.length - BACKUP_KEEP)).forEach((f) => fs.unlinkSync(path.join(BACKUP_DIR, f)));
}

/* ------------------------------------------------------------------ PIN / Login */

let auth = {};
try { auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')); } catch (e) { auth = {}; }

if (process.env.PARENT_PIN) {
  const salt = crypto.randomBytes(16).toString('hex');
  auth = { salt, hash: hashPin(String(process.env.PARENT_PIN), salt), fromEnv: true };
}

function hashPin(pin, salt) {
  return crypto.scryptSync(pin, salt, 32).toString('hex');
}

function pinIsSet() { return Boolean(auth.hash); }

function pinMatches(pin) {
  if (!pinIsSet()) return false;
  const a = Buffer.from(hashPin(String(pin), auth.salt), 'hex');
  const b = Buffer.from(auth.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function storePin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  auth = { salt, hash: hashPin(String(pin), salt) };
  writeFileAtomic(AUTH_FILE, JSON.stringify(auth));
}

const tokens = new Map();
function issueToken() {
  const t = crypto.randomBytes(24).toString('hex');
  tokens.set(t, Date.now() + TOKEN_TTL_MS);
  return t;
}
function isParent(req) {
  const t = req.headers['x-parent-token'];
  if (!t || !tokens.has(t)) return false;
  if (tokens.get(t) < Date.now()) { tokens.delete(t); return false; }
  return true;
}

// Schutz gegen Durchprobieren der PIN: nach 5 Fehlversuchen 5 Minuten Sperre (gilt für alle Geräte)
const lock = { fails: 0, until: 0 };
function lockedFor() { return Math.max(0, Math.ceil((lock.until - Date.now()) / 1000)); }
function registerFail() {
  lock.fails += 1;
  if (lock.fails >= 5) { lock.until = Date.now() + 5 * 60 * 1000; lock.fails = 0; }
}

/* ------------------------------------------------------------------ HTTP */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, body, headers) {
  const isObj = body !== null && typeof body === 'object' && !Buffer.isBuffer(body);
  const payload = isObj ? JSON.stringify(body) : body;
  res.writeHead(status, Object.assign({
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }, headers || {}));
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('zu groß')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(new Error('Ungültiges JSON')); }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Verboten');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      // Unbekannte Pfade -> App (Hash-Routing, daher selten nötig)
      if (!path.extname(rel)) return serveStatic(req, res, '/index.html');
      return send(res, 404, 'Nicht gefunden');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(file).pipe(res);
  });
}

async function handleApi(req, res, parts) {
  const method = req.method;
  const route = parts[0];

  if (route === 'state' && method === 'GET') {
    return send(res, 200, { data: db, pinSet: pinIsSet(), parent: isParent(req), serverTime: Date.now(), aiCheck: writingCheck.status() });
  }

  if (route === 'setup' && method === 'POST') {
    if (pinIsSet()) return send(res, 409, { error: 'Es ist bereits eine Eltern-PIN gesetzt.' });
    const body = await readBody(req);
    const pin = String(body.pin || '');
    if (!/^\d{4,12}$/.test(pin)) return send(res, 400, { error: 'Die PIN muss aus 4 bis 12 Ziffern bestehen.' });
    storePin(pin);
    return send(res, 200, { token: issueToken() });
  }

  if (route === 'login' && method === 'POST') {
    const wait = lockedFor();
    if (wait > 0) return send(res, 429, { error: 'Zu viele Fehlversuche. Bitte in ' + Math.ceil(wait / 60) + ' Min. erneut versuchen.', wait });
    const body = await readBody(req);
    if (!pinMatches(body.pin)) {
      registerFail();
      return send(res, 401, { error: 'PIN falsch.' });
    }
    lock.fails = 0;
    return send(res, 200, { token: issueToken() });
  }

  if (route === 'logout' && method === 'POST') {
    tokens.delete(req.headers['x-parent-token']);
    return send(res, 200, { ok: true });
  }

  if (route === 'pin' && method === 'POST') {
    if (!isParent(req)) return send(res, 401, { error: 'Nur für Eltern.' });
    if (auth.fromEnv) return send(res, 409, { error: 'Die PIN ist über PARENT_PIN festgelegt und kann hier nicht geändert werden.' });
    const body = await readBody(req);
    const pin = String(body.pin || '');
    if (!/^\d{4,12}$/.test(pin)) return send(res, 400, { error: 'Die PIN muss aus 4 bis 12 Ziffern bestehen.' });
    storePin(pin);
    return send(res, 200, { ok: true });
  }

  if (route === 'export' && method === 'GET') {
    if (!isParent(req)) return send(res, 401, { error: 'Nur für Eltern.' });
    return send(res, 200, { app: 'lernportal', version: 1, exportedAt: new Date().toISOString(), data: db });
  }

  if (route === 'import' && method === 'POST') {
    if (!isParent(req)) return send(res, 401, { error: 'Nur für Eltern.' });
    const body = await readBody(req);
    if (!body || !body.data) return send(res, 400, { error: 'Keine Daten gefunden.' });
    saveNow();
    db = normalizeDb(body.data);
    saveNow();
    return send(res, 200, { ok: true });
  }

  // Schreibrunde: Foto speichern und (falls eingerichtet) von Claude prüfen lassen
  if (route === 'writing' && method === 'POST') {
    const body = await readBody(req);
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
    if (!m) return send(res, 400, { error: 'Kein gültiges Foto.' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_PHOTO) return send(res, 413, { error: 'Foto ist zu groß.' });
    const items = Array.isArray(body.items) ? body.items.slice(0, 30).map((it, i) => ({
      nr: i + 1, prompt: String(it.prompt || '').slice(0, 200), answer: String(it.answer || '').slice(0, 200)
    })) : [];
    if (!items.length) return send(res, 400, { error: 'Keine Vokabeln übergeben.' });
    const photoId = 'f' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    fs.writeFileSync(path.join(PHOTO_DIR, photoId + '.' + ext), buf);
    if (!writingCheck.status().available) return send(res, 200, { photoId, results: null, reason: writingCheck.status().reason });
    try {
      const check = await writingCheck.check(buf.toString('base64'), 'image/' + m[1], items, body.lenient === true);
      return send(res, 200, { photoId, results: check.results, legible: check.legible, comment: check.comment, model: check.model });
    } catch (err) {
      console.error('KI-Prüfung fehlgeschlagen:', err.message);
      return send(res, 200, { photoId, results: null, reason: 'Die KI-Prüfung hat gerade nicht geklappt. Bitte selbst kontrollieren.' });
    }
  }

  // Fotos nur für Eltern (Token als Parameter, weil <img> keine Header schicken kann)
  if (route === 'foto' && method === 'GET') {
    const id = parts[1] || '';
    const tok = new URL(req.url, 'http://x').searchParams.get('t');
    if (!tok || !tokens.has(tok) || tokens.get(tok) < Date.now()) return send(res, 401, { error: 'Nur für Eltern.' });
    if (!/^f[a-z0-9]{6,40}$/.test(id)) return send(res, 400, { error: 'Ungültig.' });
    const file = ['jpg', 'png', 'webp'].map((e) => path.join(PHOTO_DIR, id + '.' + e)).find((f) => fs.existsSync(f));
    if (!file) return send(res, 404, { error: 'Foto nicht gefunden.' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'image/jpeg', 'Cache-Control': 'private, max-age=86400' });
    return fs.createReadStream(file).pipe(res);
  }

  if (route === 'c') {
    const col = parts[1];
    const id = parts[2];
    if (!COLLECTIONS.includes(col) || !ID_RE.test(id || '')) return send(res, 400, { error: 'Ungültige Adresse.' });
    if (!STUDENT_WRITABLE.has(col) && !isParent(req)) return send(res, 401, { error: 'Nur für Eltern.' });
    if (method === 'PUT') {
      const doc = await readBody(req);
      if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return send(res, 400, { error: 'Ungültiges Dokument.' });
      doc.id = id;
      doc.updatedAt = Date.now();
      db[col][id] = doc;
      scheduleSave();
      return send(res, 200, { ok: true, doc });
    }
    if (method === 'DELETE') {
      delete db[col][id];
      scheduleSave();
      return send(res, 200, { ok: true });
    }
  }

  return send(res, 404, { error: 'Unbekannte Anfrage.' });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const parts = url.pathname.slice(5).split('/').filter(Boolean);
    handleApi(req, res, parts).catch((err) => send(res, 400, { error: err.message || 'Fehler' }));
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Methode nicht erlaubt');
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  const nets = require('os').networkInterfaces();
  const ips = [];
  Object.keys(nets).forEach((k) => (nets[k] || []).forEach((n) => { if (n.family === 'IPv4' && !n.internal) ips.push(n.address); }));
  console.log('Lernportal läuft.');
  console.log('  Auf diesem Rechner:  http://localhost:' + PORT);
  ips.forEach((ip) => console.log('  Im Heimnetz/Tablet:  http://' + ip + ':' + PORT));
  if (!pinIsSet()) console.log('  Hinweis: Noch keine Eltern-PIN gesetzt – beim ersten Öffnen des Eltern-Bereichs festlegen.');
  const ai = writingCheck.status();
  console.log('  KI-Prüfung der Schreibrunden: ' + (ai.available ? 'aktiv (' + ai.model + ')' : 'aus – ' + ai.reason));
});

function shutdown() { saveNow(); process.exit(0); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
