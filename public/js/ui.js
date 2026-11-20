/*
 * Gemeinsame Bausteine: Text-Formatierung, Merkblatt-Darstellung, Skizzen, Aufgaben-Karten, Dialoge.
 */
(function () {
  'use strict';
  var LP = window.LP, h = LP.h, svg = LP.svg, I = LP.I;

  // „x^{2}“ -> hochgestellt; Zeilenumbrüche bleiben erhalten
  function mathText(str) {
    var frag = document.createDocumentFragment();
    String(str).split('\n').forEach(function (line, li) {
      if (li) frag.appendChild(h('br'));
      var re = /\^\{([^}]*)\}/g, last = 0, m;
      while ((m = re.exec(line))) {
        if (m.index > last) frag.appendChild(document.createTextNode(line.slice(last, m.index)));
        frag.appendChild(h('sup', null, m[1]));
        last = re.lastIndex;
      }
      if (last < line.length) frag.appendChild(document.createTextNode(line.slice(last)));
    });
    return frag;
  }

  // **fett** und *kursiv* – ohne innerHTML
  function inline(text) {
    var frag = document.createDocumentFragment();
    var re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var t = m[0];
      frag.appendChild(t.indexOf('**') === 0 ? h('strong', null, t.slice(2, -2)) : h('em', null, t.slice(1, -1)));
      last = re.lastIndex;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function markdown(text) {
    var root = h('div', { class: 'md' });
    var list = null;
    String(text || '').split('\n').forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      if (/^\s*[-•]\s+/.test(line)) {
        if (!list) { list = h('ul'); root.appendChild(list); }
        list.appendChild(h('li', null, inline(line.replace(/^\s*[-•]\s+/, ''))));
        return;
      }
      list = null;
      if (!line.trim()) return;
      if (line.indexOf('## ') === 0) root.appendChild(h('h4', null, inline(line.slice(3))));
      else if (line.indexOf('# ') === 0) root.appendChild(h('h3', null, inline(line.slice(2))));
      else root.appendChild(h('p', null, inline(line)));
    });
    return root;
  }

  var FIGS = {
    dreieck: '<svg viewBox="0 0 220 140" class="fig" role="img" aria-label="Rechtwinkliges Dreieck mit Katheten a und b und Hypotenuse c">' +
      '<path d="M30 115 L190 115 L30 25 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M30 99 L46 99 L46 115" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<text x="110" y="134" text-anchor="middle" fill="currentColor" font-size="15" font-style="italic">b</text>' +
      '<text x="16" y="74" text-anchor="middle" fill="currentColor" font-size="15" font-style="italic">a</text>' +
      '<text x="118" y="60" text-anchor="middle" fill="currentColor" font-size="15" font-style="italic">c</text></svg>',
    strahlen: '<svg viewBox="0 0 260 150" class="fig" role="img" aria-label="Strahlensatz-Figur mit Zentrum Z und parallelen Strecken AB und A\'B\'">' +
      '<path d="M20 120 L245 20 M20 120 L245 135" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M110 80 L110 126 M200 40 L200 132" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="0" opacity=".9"/>' +
      '<g fill="currentColor"><circle cx="20" cy="120" r="3.5"/><circle cx="110" cy="80" r="3.5"/><circle cx="110" cy="126" r="3.5"/><circle cx="200" cy="40" r="3.5"/><circle cx="200" cy="132" r="3.5"/></g>' +
      '<g fill="currentColor" font-size="14"><text x="8" y="112">Z</text><text x="104" y="72">A</text><text x="104" y="146">B</text><text x="194" y="32">A\'</text><text x="194" y="150" >B\'</text></g></svg>'
  };

  function progressBar(value, color, label) {
    var pct = Math.round(LP.clamp(value || 0, 0, 1) * 100);
    return h('div', { class: 'meter', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label || 'Fortschritt' },
      h('div', { class: 'meter-fill', style: { width: pct + '%', background: color || '' } }));
  }

  function subjectChip(subjectId) {
    var s = LP.subject(subjectId);
    return h('span', { class: 'chip subj', style: { '--c': s.color } }, h('span', { class: 'dot' }), s.name);
  }

  /* ---------------------------------------------------------------- Dialog (statt confirm/prompt) */

  function dialog(opts) {
    return new Promise(function (resolve) {
      var back = h('div', { class: 'modal-back' });
      var box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
      function close(v) { document.body.removeChild(back); resolve(v); }
      box.appendChild(h('h3', null, opts.title || 'Bist du sicher?'));
      if (opts.text) box.appendChild(h('p', { class: 'muted' }, opts.text));
      if (opts.body) box.appendChild(opts.body);
      var btns = h('div', { class: 'row end' });
      if (opts.cancel !== false) btns.appendChild(h('button', { class: 'btn ghost', onclick: function () { close(false); } }, opts.cancel || 'Abbrechen'));
      btns.appendChild(h('button', { class: 'btn ' + (opts.danger ? 'danger' : 'primary'), onclick: function () { close(true); } }, opts.ok || 'OK'));
      box.appendChild(btns);
      back.appendChild(box);
      back.addEventListener('click', function (e) { if (e.target === back && opts.cancel !== false) close(false); });
      document.body.appendChild(back);
      var f = box.querySelector('input, textarea, .btn.primary, .btn.danger');
      if (f) setTimeout(function () { f.focus(); }, 30);
    });
  }

  /* ---------------------------------------------------------------- Aufgaben anzeigen */

  // done(result): 'right' | 'close' | 'hard' | 'wrong' | 'again' | 'read'
  function renderItem(host, item, done, opts) {
    opts = opts || {};
    LP.clear(host);
    var card = h('div', { class: 'task' });
    host.appendChild(card);
    var finished = false;
    function finish(result, delay) {
      if (finished) return;
      finished = true;
      setTimeout(function () { done(result); }, delay || 0);
    }
    function nextButton(result, label) {
      var b = h('button', { class: 'btn primary big', onclick: function () { finish(result); } }, label || 'Weiter', svg(I.back, 'flip-x'));
      setTimeout(function () { b.focus(); }, 30);
      return b;
    }
    function noteBox(card0) {
      return card0 && card0.n ? h('div', { class: 'note' }, svg(I.bulb), h('span', null, card0.n)) : null;
    }
    var subj = LP.subject(item.deck.subjectId);
    card.style.setProperty('--c', subj.color);
    card.appendChild(h('div', { class: 'task-meta' }, h('span', { class: 'dot' }), subj.name + ' · ' + (item.type === 'math' ? item.task.topicName : item.deck.title)));

    if (item.type === 'read') {
      var words = String(item.deck.text || '').split(/\s+/).length;
      var wait = opts.noWait ? 0 : Math.min(45, Math.round(words * 0.25));
      card.appendChild(h('div', { class: 'label' }, svg(I.book), 'Merkblatt – erst lesen, dann üben'));
      card.appendChild(markdown(item.deck.text));
      var rb = h('button', { class: 'btn primary big', disabled: wait > 0, onclick: function () { finish('read'); } }, 'Gelesen');
      card.appendChild(h('div', { class: 'row end' }, rb));
      if (wait > 0) {
        var left = wait;
        rb.textContent = 'Gelesen (' + left + ')';
        var iv = setInterval(function () {
          left--;
          if (!document.body.contains(rb)) { clearInterval(iv); return; }
          if (left <= 0) { clearInterval(iv); rb.disabled = false; rb.textContent = 'Gelesen'; }
          else rb.textContent = 'Gelesen (' + left + ')';
        }, 1000);
      }
      return;
    }

    if (item.type === 'flip') {
      card.appendChild(h('div', { class: 'label' }, svg(I.cards), 'Karteikarte – erst im Kopf beantworten'));
      card.appendChild(h('div', { class: 'prompt' }, item.card.a));
      var backSide = h('div', { class: 'answer-reveal', hidden: true }, h('div', { class: 'answer-text' }, item.card.b), noteBox(item.card));
      card.appendChild(backSide);
      var acts = h('div', { class: 'row end' });
      var reveal = h('button', { class: 'btn primary big', onclick: function () {
        backSide.hidden = false; LP.clear(acts);
        acts.appendChild(h('button', { class: 'btn rate bad', onclick: function () { finish('again'); } }, 'Wusste ich nicht'));
        acts.appendChild(h('button', { class: 'btn rate mid', onclick: function () { finish('hard'); } }, 'Teilweise'));
        acts.appendChild(h('button', { class: 'btn rate good', onclick: function () { finish('right'); } }, 'Gewusst'));
      } }, 'Aufdecken');
      acts.appendChild(reveal);
      card.appendChild(acts);
      setTimeout(function () { reveal.focus(); }, 30);
      return;
    }

    if (item.type === 'quiz' || (item.type === 'vocab' && item.mode === 'mc')) {
      var isVocab = item.type === 'vocab';
      var correct = isVocab ? item.answer : item.card.b;
      card.appendChild(h('div', { class: 'label' }, isVocab ? (item.dir === 'b2a' ? 'Wie heißt das auf Englisch?' : 'Was bedeutet das?') : 'Wähle die richtige Antwort'));
      card.appendChild(h('div', { class: 'prompt' }, isVocab ? item.prompt : item.card.a));
      var grid = h('div', { class: 'options' });
      var fb = h('div', { class: 'feedback' });
      item.options.forEach(function (opt) {
        var b = h('button', { class: 'option', onclick: function () {
          if (finished || grid.classList.contains('locked')) return;
          grid.classList.add('locked');
          var ok = opt === correct;
          Array.prototype.forEach.call(grid.children, function (c) {
            if (c.textContent === correct) c.classList.add('is-right');
          });
          if (!ok) b.classList.add('is-wrong');
          if (ok) {
            fb.appendChild(h('div', { class: 'fb good' }, svg(I.check), 'Richtig!'));
            var nb = noteBox(item.card); if (nb) fb.appendChild(nb);
            finish('right', item.card.n ? 1600 : 800);
          } else {
            fb.appendChild(h('div', { class: 'fb bad' }, svg(I.x), 'Richtig ist: ' + correct));
            var nb2 = noteBox(item.card); if (nb2) fb.appendChild(nb2);
            fb.appendChild(h('div', { class: 'row end' }, nextButton('wrong')));
          }
        } }, opt);
        grid.appendChild(b);
      });
      card.appendChild(grid);
      card.appendChild(fb);
      return;
    }

    if (item.type === 'vocab') {
      card.appendChild(h('div', { class: 'label' }, item.dir === 'b2a' ? 'Schreibe auf Englisch' : 'Schreibe auf Deutsch'));
      card.appendChild(h('div', { class: 'prompt' }, item.prompt));
      var input = h('input', { class: 'answer-input', id: 'answer', type: 'text', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Deine Antwort' });
      var fbv = h('div', { class: 'feedback' });
      var row = h('div', { class: 'row end' });
      var stage = 'ask';
      function check() {
        if (stage === 'ask') {
          if (!input.value.trim()) { input.focus(); return; }
          var r = LP.learn.checkText(input.value, item.answer).result;
          LP.clear(fbv);
          if (r === 'right') {
            input.classList.add('is-right'); input.readOnly = true;
            fbv.appendChild(h('div', { class: 'fb good' }, svg(I.check), 'Richtig!' + (LP.learn.norm(input.value) !== LP.learn.norm(item.answer) ? '  (' + item.answer + ')' : '')));
            stage = 'done'; LP.clear(row); finish('right', 900);
          } else if (r === 'close') {
            input.classList.add('is-close'); input.readOnly = true;
            fbv.appendChild(h('div', { class: 'fb mid' }, 'Fast! Achte auf die Schreibweise: ', h('strong', null, item.answer)));
            stage = 'done'; LP.clear(row); row.appendChild(nextButton('close'));
          } else {
            input.classList.add('is-wrong');
            fbv.appendChild(h('div', { class: 'fb bad' }, svg(I.x), 'Richtig ist: ', h('strong', null, item.answer)));
            fbv.appendChild(h('div', { class: 'muted small' }, 'Schreib es einmal richtig ab – so bleibt es besser hängen.'));
            stage = 'copy';
            setTimeout(function () { input.classList.remove('is-wrong'); input.value = ''; input.placeholder = item.answer; input.focus(); }, 50);
          }
        } else if (stage === 'copy') {
          var r2 = LP.learn.checkText(input.value, item.answer).result;
          if (r2 === 'wrong') { input.classList.add('shake'); setTimeout(function () { input.classList.remove('shake'); }, 400); return; }
          stage = 'done'; finish('wrong');
        }
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      row.appendChild(h('button', { class: 'btn ghost', onclick: function () {
        if (stage !== 'ask') return;
        input.value = '';
        LP.clear(fbv);
        input.classList.add('is-wrong');
        fbv.appendChild(h('div', { class: 'fb bad' }, 'Lösung: ', h('strong', null, item.answer)));
        fbv.appendChild(h('div', { class: 'muted small' }, 'Schreib es einmal ab.'));
        stage = 'copy';
        setTimeout(function () { input.classList.remove('is-wrong'); input.placeholder = item.answer; input.focus(); }, 50);
      } }, 'Weiß ich nicht'));
      row.appendChild(h('button', { class: 'btn primary big', onclick: check }, 'Prüfen'));
      card.appendChild(input);
      card.appendChild(fbv);
      card.appendChild(row);
      setTimeout(function () { input.focus(); }, 60);
      return;
    }

    if (item.type === 'math') {
      var task = item.task;
      card.appendChild(h('div', { class: 'prompt math' }, mathText(task.q)));
      if (task.fig && FIGS[task.fig]) card.appendChild(h('div', { class: 'fig-wrap', html: FIGS[task.fig] }));
      if (task.note) card.appendChild(h('div', { class: 'muted small' }, task.note));
      var inputs = [];
      var fields = h('div', { class: 'math-fields' });
      task.answers.forEach(function (a, i) {
        var inp = h('input', { class: 'answer-input num', id: 'math-' + i, type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': a.label });
        inputs.push(inp);
        fields.appendChild(h('label', { class: 'math-field', for: 'math-' + i }, h('span', { class: 'math-label' }, a.label + ' ='), inp, a.unit ? h('span', { class: 'unit' }, a.unit) : null));
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); if (inputs[i + 1] && !inputs[i + 1].value) inputs[i + 1].focus(); else checkMath(); }
        });
      });
      card.appendChild(fields);
      var fbm = h('div', { class: 'feedback' });
      var rowm = h('div', { class: 'row end' });
      var tries = 0, usedHint = false;
      var hintBtn = h('button', { class: 'btn ghost', onclick: function () {
        if (usedHint) return; usedHint = true; hintBtn.disabled = true;
        fbm.insertBefore(h('div', { class: 'note' }, svg(I.bulb), h('span', null, mathText(task.hint))), fbm.firstChild);
      } }, svg(I.bulb), 'Tipp');
      function solution() {
        return h('div', { class: 'solution' }, h('div', { class: 'label' }, 'Lösungsweg'),
          h('ol', null, task.steps.map(function (s) { return h('li', null, mathText(s)); })));
      }
      function checkMath() {
        if (finished) return;
        if (inputs.some(function (i) { return !i.value.trim(); })) { var empty = inputs.filter(function (i) { return !i.value.trim(); })[0]; empty.focus(); return; }
        var res = LP.math.check(task, inputs.map(function (i) { return i.value; }));
        tries++;
        inputs.forEach(function (inp, i) { inp.classList.remove('is-wrong'); if (!res.each[i]) inp.classList.add('is-wrong'); else inp.classList.add('is-right'); });
        Array.prototype.slice.call(fbm.querySelectorAll('.fb')).forEach(function (n) { n.parentNode.removeChild(n); });
        if (res.ok) {
          inputs.forEach(function (i) { i.readOnly = true; });
          var result = tries > 1 || usedHint ? 'close' : 'right';
          fbm.appendChild(h('div', { class: 'fb good' }, svg(I.check), tries > 1 ? 'Jetzt stimmt’s!' : 'Richtig!'));
          LP.clear(rowm);
          if (opts.showSolutionAlways) { fbm.appendChild(solution()); rowm.appendChild(nextButton(result)); }
          else finish(result, 1000);
        } else if (tries === 1 && !opts.test) {
          fbm.appendChild(h('div', { class: 'fb mid' }, 'Noch nicht ganz. Prüfe deine Rechnung – du hast noch einen Versuch.'));
          var wrongOne = inputs.filter(function (inp, i) { return !res.each[i]; })[0];
          if (wrongOne) { wrongOne.focus(); wrongOne.select(); }
        } else {
          inputs.forEach(function (i) { i.readOnly = true; });
          fbm.appendChild(h('div', { class: 'fb bad' }, svg(I.x), 'Richtig wäre: ' + task.answers.map(function (a) {
            return a.label + ' = ' + String(a.value).replace('.', ',') + (a.unit ? ' ' + a.unit : '');
          }).join(';  ')));
          fbm.appendChild(solution());
          LP.clear(rowm); rowm.appendChild(nextButton('wrong'));
        }
      }
      if (!opts.test) rowm.appendChild(hintBtn);
      rowm.appendChild(h('button', { class: 'btn primary big', onclick: checkMath }, 'Prüfen'));
      card.appendChild(fbm);
      card.appendChild(rowm);
      setTimeout(function () { if (inputs[0]) inputs[0].focus(); }, 60);
    }
  }

  // kurzer Ton (nur nach einer Berührung möglich)
  var audioCtx = null;
  function beep(kind) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      var notes = kind === 'done' ? [660, 880, 1046] : [880];
      notes.forEach(function (f, i) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(0.0001, audioCtx.currentTime + i * 0.14);
        g.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + i * 0.14 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.14 + 0.3);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(audioCtx.currentTime + i * 0.14); o.stop(audioCtx.currentTime + i * 0.14 + 0.32);
      });
    } catch (e) { /* kein Ton möglich */ }
  }

  LP.ui = { mathText: mathText, markdown: markdown, progressBar: progressBar, subjectChip: subjectChip, dialog: dialog, renderItem: renderItem, beep: beep, FIGS: FIGS };
})();
