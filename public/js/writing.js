/*
 * Schreibrunde: Vokabeln auf Papier schreiben, Blatt fotografieren, prüfen lassen.
 * Ablauf: Wörter anzeigen -> Foto -> KI-Prüfung (Server) oder Selbstkontrolle -> Fehler 3x abschreiben.
 */
(function () {
  'use strict';
  var LP = window.LP, h = LP.h, svg = LP.svg, I = LP.I, store = LP.store, L = LP.learn;

  var CAMERA = '<svg viewBox="0 0 24 24"><path d="M4 8.5h3l1.5-2.5h7L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>';
  var PEN = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>';

  // Foto verkleinern (spart Upload-Zeit und KI-Kosten), Ergebnis als JPEG-Data-URL
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Foto konnte nicht gelesen werden.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Das ist kein Foto.')); };
        img.onload = function () {
          var max = 1600, w = img.naturalWidth, hgt = img.naturalHeight;
          var f = Math.min(1, max / Math.max(w, hgt));
          var c = document.createElement('canvas');
          c.width = Math.round(w * f); c.height = Math.round(hgt * f);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function cameraButton(label, onPhoto, cls) {
    var input = h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'visually-hidden', 'aria-label': label });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      input.value = '';
      if (f) onPhoto(f);
    });
    return h('label', { class: 'btn ' + (cls || 'primary big') + ' file-btn' }, svg(CAMERA), label, input);
  }

  function render(host, step, done) {
    var picks = L.writingCards(step.deckIds, step.words || 10);
    var items = picks.map(function (p, i) {
      return { nr: i + 1, deck: p.deck, card: p.card, prompt: p.card.b, answer: p.card.a };
    });
    var subj = LP.subject(step.subjectId || (picks[0] && picks[0].deck.subjectId));
    var photo = null, photoId = null;

    function card() {
      LP.clear(host);
      var c = h('div', { class: 'task write-task', style: { '--c': subj.color } });
      host.appendChild(c);
      c.appendChild(h('div', { class: 'task-meta' }, h('span', { class: 'dot' }), subj.name + ' · Schreibrunde'));
      return c;
    }

    if (!items.length) {
      var c0 = card();
      c0.appendChild(h('p', null, 'Keine Vokabeln zum Schreiben gefunden.'));
      c0.appendChild(h('div', { class: 'row end' }, h('button', { class: 'btn primary', onclick: function () { done({ right: 0, wrong: 0 }); } }, 'Weiter')));
      return;
    }

    /* ---------- 1. Aufschreiben */
    function phaseWrite() {
      var c = card();
      c.appendChild(h('div', { class: 'label' }, svg(PEN), 'Nimm ein Blatt Papier und einen Stift'));
      c.appendChild(h('p', { class: 'lead' }, 'Schreib zu jeder Nummer das ', h('strong', null, 'englische'), ' Wort auf – mit Nummer davor. Die Lösungen siehst du erst nach dem Foto.'));
      var ol = h('ol', { class: 'write-list' });
      items.forEach(function (it) { ol.appendChild(h('li', null, h('span', { class: 'nr tabular' }, it.nr + '.'), h('span', null, it.prompt))); });
      c.appendChild(ol);
      c.appendChild(h('p', { class: 'muted small' }, 'Tipp: deutlich schreiben, Blatt flach hinlegen, gutes Licht. Fotografiere nur das Blatt.'));
      c.appendChild(h('div', { class: 'row end' }, cameraButton('Fertig – Blatt fotografieren', phasePreview)));
    }

    /* ---------- 2. Vorschau */
    function phasePreview(file) {
      var c = card();
      c.appendChild(h('p', { class: 'muted' }, 'Foto wird vorbereitet …'));
      shrink(file).then(function (dataUrl) {
        photo = dataUrl;
        c = card();
        c.appendChild(h('div', { class: 'label' }, 'Ist alles gut lesbar?'));
        c.appendChild(h('img', { class: 'write-photo', src: dataUrl, alt: 'Foto deines Blattes' }));
        c.appendChild(h('div', { class: 'row end' },
          cameraButton('Neu aufnehmen', phasePreview, 'ghost'),
          h('button', { class: 'btn primary big', onclick: phaseCheck }, svg(I.check), 'Foto verwenden')));
      }, function (err) {
        LP.toast(err.message, 'warn');
        phaseWrite();
      });
    }

    /* ---------- 3. Prüfen */
    function phaseCheck() {
      var c = card();
      c.appendChild(h('div', { class: 'checking' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }),
        h('span', null, store.aiCheck && store.aiCheck.available ? 'Dein Blatt wird geprüft …' : 'Foto wird gespeichert …')));
      store.uploadWriting(photo, items.map(function (it) { return { prompt: it.prompt, answer: it.answer }; }))
        .then(function (res) {
          photoId = res.photoId || null;
          if (res.results && res.legible === false) return phaseUnreadable(res.comment);
          if (res.results) return phaseAiResult(res);
          phaseSelfCheck(res.reason);
        }, function () {
          phaseSelfCheck('Keine Verbindung zum Server – bitte selbst kontrollieren.');
        });
    }

    var retried = false;
    function phaseUnreadable(comment) {
      var c = card();
      c.appendChild(h('div', { class: 'fb mid' }, 'Das Foto ist nicht gut lesbar.' + (comment ? ' ' + comment : '')));
      if (!retried) {
        retried = true;
        c.appendChild(h('div', { class: 'row end' }, cameraButton('Noch einmal fotografieren', phasePreview)));
      } else {
        phaseSelfCheck('Auch das zweite Foto war nicht lesbar – bitte selbst kontrollieren.');
      }
    }

    /* ---------- 4a. Ergebnis der KI */
    function phaseAiResult(res) {
      items.forEach(function (it, i) { var r = res.results[i] || {}; it.read = r.read || ''; it.ok = Boolean(r.correct); it.note = r.note || ''; });
      var c = card();
      var right = items.filter(function (it) { return it.ok; }).length;
      c.appendChild(h('h2', null, right + ' von ' + items.length + ' richtig'));
      if (res.comment) c.appendChild(h('p', { class: 'muted' }, res.comment));
      c.appendChild(resultTable(false));
      c.appendChild(h('p', { class: 'muted small' }, 'Geprüft von einer KI. Deine Eltern sehen dein Blatt.'));
      c.appendChild(h('div', { class: 'row end' }, h('button', { class: 'btn primary big', onclick: function () { finish('ki', res.model); } }, 'Weiter')));
    }

    /* ---------- 4b. Selbstkontrolle */
    function phaseSelfCheck(reason) {
      items.forEach(function (it) { it.ok = null; it.read = ''; });
      var c = card();
      c.appendChild(h('h2', null, 'Jetzt selbst kontrollieren'));
      c.appendChild(h('p', { class: 'muted' }, (reason ? reason + ' ' : '') + 'Vergleiche dein Blatt mit den Lösungen und sei ehrlich – ein Rechtschreibfehler zählt als falsch.'));
      var table = resultTable(true);
      c.appendChild(table);
      var go = h('button', { class: 'btn primary big', disabled: true, onclick: function () { finish('selbst'); } }, 'Auswerten');
      table.addEventListener('click', function () {
        setTimeout(function () { go.disabled = items.some(function (it) { return it.ok === null; }); }, 0);
      });
      c.appendChild(h('div', { class: 'row end' }, go));
    }

    function resultTable(selfMode) {
      var t = h('div', { class: 'write-results' });
      items.forEach(function (it) {
        var row = h('div', { class: 'wr-row' + (it.ok === true ? ' ok' : it.ok === false ? ' bad' : '') });
        var mark = h('span', { class: 'wr-mark' }, it.ok === true ? svg(I.check) : it.ok === false ? svg(I.x) : null);
        var body = h('div', { class: 'wr-body' },
          h('span', { class: 'muted small' }, it.nr + '. ' + it.prompt),
          selfMode ? h('strong', null, it.answer) :
            h('span', null, h('strong', { class: it.ok ? '' : 'strike' }, it.read || '(nichts gefunden)'), it.ok ? null : h('span', null, '  →  ', h('strong', null, it.answer))),
          it.note && !selfMode ? h('span', { class: 'small wr-note' }, it.note) : null);
        row.appendChild(mark);
        row.appendChild(body);
        if (selfMode) {
          var yes = h('button', { class: 'btn small rate good-outline', 'aria-label': 'Richtig geschrieben' }, svg(I.check));
          var no = h('button', { class: 'btn small rate bad', 'aria-label': 'Falsch geschrieben' }, svg(I.x));
          yes.addEventListener('click', function () { it.ok = true; row.className = 'wr-row ok'; LP.clear(mark).appendChild(svg(I.check)); });
          no.addEventListener('click', function () { it.ok = false; row.className = 'wr-row bad'; LP.clear(mark).appendChild(svg(I.x)); });
          row.appendChild(h('div', { class: 'wr-buttons' }, no, yes));
        }
        t.appendChild(row);
      });
      return t;
    }

    /* ---------- 5. Fehler verbessern und abschließen */
    function finish(mode, model) {
      var wrong = items.filter(function (it) { return !it.ok; });
      items.forEach(function (it) { L.grade(it.deck.id, it.card.id, it.ok ? 'right' : 'wrong'); });
      store.put('writings', {
        id: LP.uid('w'), date: LP.today(), at: Date.now(), photoId: photoId, mode: mode, model: model || null,
        examId: step.examId || null, right: items.length - wrong.length, wrong: wrong.length,
        items: items.map(function (it) { return { prompt: it.prompt, answer: it.answer, read: it.read || '', ok: Boolean(it.ok), note: it.note || '' }; })
      });
      var stats = { right: items.length - wrong.length, wrong: wrong.length };
      if (!wrong.length) {
        var c1 = card();
        c1.appendChild(h('div', { class: 'big-check' }, svg(I.check)));
        c1.appendChild(h('h2', null, 'Alles richtig geschrieben!'));
        c1.appendChild(h('div', { class: 'row end' }, h('button', { class: 'btn primary big', onclick: function () { done(stats); } }, 'Weiter')));
        return;
      }
      var c = card();
      c.appendChild(h('h2', null, 'Jetzt verbessern'));
      c.appendChild(h('p', null, 'Schreib diese Wörter ', h('strong', null, 'je dreimal richtig'), ' unter deine Liste:'));
      c.appendChild(h('ul', { class: 'write-fix' }, wrong.map(function (it) { return h('li', null, h('span', { class: 'muted' }, it.prompt + ' – '), h('strong', null, it.answer)); })));
      var wait = Math.min(60, wrong.length * 8), btn = h('button', { class: 'btn primary big', disabled: true, onclick: function () { done(stats); } }, 'Erledigt (' + wait + ')');
      c.appendChild(h('div', { class: 'row end' }, btn));
      var iv = setInterval(function () {
        wait--;
        if (!document.body.contains(btn)) { clearInterval(iv); return; }
        if (wait <= 0) { clearInterval(iv); btn.disabled = false; btn.textContent = 'Erledigt'; } else btn.textContent = 'Erledigt (' + wait + ')';
      }, 1000);
    }

    phaseWrite();
  }

  LP.writing = { render: render, CAMERA: CAMERA };
})();
