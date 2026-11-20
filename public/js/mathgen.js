/*
 * Mathe-Aufgabengenerator für Klasse 9 (Realschule).
 * Jede Aufgabe: { q, answers:[{label, value, unit, tol, rel, pct}], set, steps:[], hint, fig, note }
 * Im Text wird ^{..} hochgestellt dargestellt.
 */
(function (root) {
  'use strict';

  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[R(0, arr.length - 1)]; }
  function rnd(x, d) { var f = Math.pow(10, d); return Math.round(x * f) / f; }
  function n(x) { return String(x).replace('-', '−').replace('.', ','); }       // Zahl deutsch formatiert
  function nz(x, d) { return n(rnd(x, d).toFixed(d)); }                           // feste Nachkommastellen
  function money(x) { return nz(x, 2) + ' €'; }
  function sgn(x) { return x < 0 ? ' − ' + n(-x) : ' + ' + n(x); }               // „ + 3“ oder „ − 3“
  function coef(c, v, first) {
    if (c === 0) return '';
    var abs = Math.abs(c);
    var body = (abs === 1 ? '' : n(abs)) + v;
    if (first) return (c < 0 ? '−' : '') + body;
    return (c < 0 ? ' − ' : ' + ') + body;
  }
  function paren(x) { return x < 0 ? '(' + n(x) + ')' : n(x); }

  var T = {};

  T.pythagoras = {
    name: 'Satz des Pythagoras',
    gen: function () {
      var unit = pick(['cm', 'm']);
      var a, b, c, ask = pick(['c', 'c', 'b']);
      if (Math.random() < 0.5) {
        var t = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]);
        var k = pick([1, 1, 2, 3]);
        a = t[0] * k; b = t[1] * k; c = t[2] * k;
      } else {
        a = R(2, 14); b = R(2, 14); c = Math.sqrt(a * a + b * b);
      }
      if (ask === 'c') {
        return {
          q: 'Ein rechtwinkliges Dreieck hat die Katheten a = ' + n(a) + ' ' + unit + ' und b = ' + n(b) + ' ' + unit + '. Berechne die Hypotenuse c.',
          note: 'Runde auf eine Nachkommastelle.',
          answers: [{ label: 'c', unit: unit, value: rnd(c, 1), tol: 0.051 }],
          steps: ['c^{2} = a^{2} + b^{2}', 'c^{2} = ' + n(a) + '^{2} + ' + n(b) + '^{2} = ' + n(a * a) + ' + ' + n(b * b) + ' = ' + n(a * a + b * b),
            'c = √' + n(a * a + b * b) + ' ≈ ' + nz(c, 1) + ' ' + unit],
          hint: 'Die Hypotenuse liegt gegenüber dem rechten Winkel. Es gilt c² = a² + b².',
          fig: 'dreieck'
        };
      }
      var leg = Math.sqrt(c * c - a * a);
      var cr = rnd(c, 1);
      leg = Math.sqrt(cr * cr - a * a);
      return {
        q: 'In einem rechtwinkligen Dreieck ist die Hypotenuse c = ' + nz(cr, Number.isInteger(cr) ? 0 : 1) + ' ' + unit + ' und die Kathete a = ' + n(a) + ' ' + unit + ' lang. Berechne die Kathete b.',
        note: 'Runde auf eine Nachkommastelle.',
        answers: [{ label: 'b', unit: unit, value: rnd(leg, 1), tol: 0.051 }],
        steps: ['b^{2} = c^{2} − a^{2}', 'b^{2} = ' + n(cr) + '^{2} − ' + n(a) + '^{2} = ' + n(rnd(cr * cr, 2)) + ' − ' + n(a * a) + ' = ' + n(rnd(cr * cr - a * a, 2)),
          'b = √' + n(rnd(cr * cr - a * a, 2)) + ' ≈ ' + nz(leg, 1) + ' ' + unit],
        hint: 'Gesucht ist eine Kathete: b² = c² − a².',
        fig: 'dreieck'
      };
    }
  };

  T.prozent = {
    name: 'Prozentrechnung',
    gen: function () {
      var G = pick([40, 60, 80, 120, 150, 200, 240, 250, 320, 400, 480, 500, 640, 800, 1200]);
      var p = pick([5, 10, 12, 15, 20, 25, 30, 35, 40, 60, 75]);
      var W = rnd(G * p / 100, 2);
      var v = R(1, 4);
      if (v === 1) {
        var item = pick(['Ein Fahrrad', 'Eine Spielkonsole', 'Ein Paar Sneaker', 'Ein Handy']);
        return {
          q: item + ' kostet ' + money(G) + '. Im Angebot gibt es ' + p + ' % Rabatt. Wie viel Euro spart man?',
          answers: [{ label: 'Ersparnis', unit: '€', value: W, tol: 0.011 }],
          steps: ['Prozentwert W = G · p : 100', 'W = ' + n(G) + ' · ' + p + ' : 100 = ' + money(W)],
          hint: 'Grundwert G = Preis, Prozentsatz p = Rabatt. Gesucht ist der Prozentwert W.'
        };
      }
      if (v === 2) {
        var newP = rnd(G - W, 2);
        return {
          q: 'Eine Jacke kostet ' + money(G) + ' und wird um ' + p + ' % reduziert. Wie viel kostet sie jetzt?',
          answers: [{ label: 'Neuer Preis', unit: '€', value: newP, tol: 0.011 }],
          steps: ['Neuer Preis = G · (100 − p) : 100', '= ' + n(G) + ' · ' + (100 - p) + ' : 100 = ' + money(newP)],
          hint: 'Nach ' + p + ' % Rabatt bleiben ' + (100 - p) + ' % des Preises übrig.'
        };
      }
      if (v === 3) {
        return {
          q: 'Von ' + G + ' Schülerinnen und Schülern fahren ' + n(W) + ' mit dem Bus. Wie viel Prozent sind das?',
          answers: [{ label: 'p', unit: '%', value: p, tol: 0.051 }],
          steps: ['p = W : G · 100', 'p = ' + n(W) + ' : ' + G + ' · 100 = ' + p + ' %'],
          hint: 'Teil durch Ganzes, dann mal 100.'
        };
      }
      return {
        q: n(W) + ' € sind ' + p + ' % eines Betrags. Wie groß ist der ganze Betrag (Grundwert)?',
        answers: [{ label: 'G', unit: '€', value: G, tol: 0.011 }],
        steps: ['G = W · 100 : p', 'G = ' + n(W) + ' · 100 : ' + p + ' = ' + money(G)],
        hint: 'Erst 1 % berechnen (W : p), dann mal 100.'
      };
    }
  };

  T.zinsen = {
    name: 'Zinsrechnung',
    gen: function () {
      var K = R(5, 80) * 100;
      var p = pick([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]);
      var v = R(1, 3);
      if (v === 1) {
        var Z = rnd(K * p / 100, 2);
        return {
          q: 'Jana legt ' + money(K) + ' für ein Jahr zu ' + n(p) + ' % Zinsen an. Wie viele Zinsen bekommt sie?',
          answers: [{ label: 'Z', unit: '€', value: Z, tol: 0.011 }],
          steps: ['Z = K · p : 100', 'Z = ' + n(K) + ' · ' + n(p) + ' : 100 = ' + money(Z)],
          hint: 'Jahreszinsen: Z = K · p : 100'
        };
      }
      if (v === 2) {
        var t = pick([30, 45, 60, 90, 120, 150, 180, 240, 270]);
        var Zt = rnd(K * p * t / (100 * 360), 2);
        return {
          q: money(K) + ' werden ' + t + ' Tage lang zu ' + n(p) + ' % verzinst. Berechne die Zinsen (1 Jahr = 360 Tage).',
          answers: [{ label: 'Z', unit: '€', value: Zt, tol: 0.011 }],
          steps: ['Z = K · p : 100 · t : 360', 'Z = ' + n(K) + ' · ' + n(p) + ' : 100 · ' + t + ' : 360 = ' + money(Zt)],
          hint: 'Erst die Jahreszinsen berechnen, dann den Anteil t : 360 nehmen.'
        };
      }
      var yrs = R(2, 5);
      var Kn = rnd(K * Math.pow(1 + p / 100, yrs), 2);
      return {
        q: money(K) + ' werden ' + yrs + ' Jahre lang mit Zinseszins zu ' + n(p) + ' % angelegt. Wie hoch ist das Guthaben am Ende?',
        answers: [{ label: 'Kₙ', unit: '€', value: Kn, tol: 0.021 }],
        steps: ['Kₙ = K₀ · (1 + p/100)^{n}', 'Kₙ = ' + n(K) + ' · ' + n(rnd(1 + p / 100, 4)) + '^{' + yrs + '} ≈ ' + money(Kn)],
        hint: 'Wachstumsfaktor q = 1 + p/100. Er wird ' + yrs + '-mal multipliziert.'
      };
    }
  };

  T.lingl = {
    name: 'Lineare Gleichungen',
    gen: function () {
      var x = R(-9, 9), a = R(2, 9), c = R(-5, 9);
      while (c === a || c === 0) c = R(-5, 9);
      var b = R(-20, 20), d = a * x + b - c * x;
      var lhs = coef(a, 'x', true) + (b ? sgn(b) : '');
      var rhs = coef(c, 'x', true) + (d ? sgn(d) : '');
      return {
        q: 'Löse die Gleichung:  ' + lhs + ' = ' + rhs,
        answers: [{ label: 'x', value: x, tol: 0.001 }],
        steps: [
          lhs + ' = ' + rhs + '   | ' + (c < 0 ? '+ ' + n(-c) + 'x' : '− ' + n(c) + 'x'),
          coef(a - c, 'x', true) + (b ? sgn(b) : '') + ' = ' + n(d) + (b ? '   | ' + (b < 0 ? '+ ' + n(-b) : '− ' + n(b)) : ''),
          coef(a - c, 'x', true) + ' = ' + n(d - b) + '   | : ' + paren(a - c),
          'x = ' + n(x)
        ],
        hint: 'Bringe alle x auf eine Seite und alle Zahlen auf die andere.'
      };
    }
  };

  T.lgs = {
    name: 'Gleichungssysteme',
    gen: function () {
      var x, y, a1, b1, a2, b2;
      do {
        x = R(-6, 6); y = R(-6, 6);
        a1 = R(1, 5) * pick([1, -1]); b1 = R(1, 5) * pick([1, -1]);
        a2 = R(1, 5) * pick([1, -1]); b2 = R(1, 5) * pick([1, -1]);
      } while (a1 * b2 - a2 * b1 === 0);
      var c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      var e1 = coef(a1, 'x', true) + coef(b1, 'y') + ' = ' + n(c1);
      var e2 = coef(a2, 'x', true) + coef(b2, 'y') + ' = ' + n(c2);
      var ky = b1 * a2 - b2 * a1, kc = c1 * a2 - c2 * a1;
      return {
        q: 'Löse das Gleichungssystem:\n(I)  ' + e1 + '\n(II) ' + e2,
        answers: [{ label: 'x', value: x, tol: 0.001 }, { label: 'y', value: y, tol: 0.001 }],
        steps: [
          'Additionsverfahren: (I) · ' + paren(a2) + ' und (II) · ' + paren(a1) + ', dann subtrahieren',
          n(ky) + 'y = ' + n(kc) + '  →  y = ' + n(y),
          'y in (I) einsetzen: ' + coef(a1, 'x', true) + sgn(b1 * y) + ' = ' + n(c1) + '  →  x = ' + n(x),
          'Lösung: L = {(' + n(x) + ' | ' + n(y) + ')}'
        ],
        hint: 'Additions- oder Einsetzungsverfahren: Eine Variable muss verschwinden.'
      };
    }
  };

  T.quadgl = {
    name: 'Quadratische Gleichungen',
    gen: function () {
      var r1 = R(-9, 9), r2 = R(-9, 9);
      while (r2 === r1) r2 = R(-9, 9);
      var a = pick([1, 1, 1, 2, -1]);
      var b = -a * (r1 + r2), c = a * r1 * r2;
      var eq = coef(a, 'x^{2}', true) + coef(b, 'x') + (c ? sgn(c) : '') + ' = 0';
      return {
        q: 'Löse die quadratische Gleichung:  ' + eq,
        note: 'Gib beide Lösungen an (Reihenfolge egal).',
        answers: [{ label: 'x₁', value: r1, tol: 0.001 }, { label: 'x₂', value: r2, tol: 0.001 }],
        set: true,
        steps: (a !== 1 ? ['Erst durch ' + paren(a) + ' teilen (Normalform):  x^{2}' + coef(-(r1 + r2), 'x') + (r1 * r2 ? sgn(r1 * r2) : '') + ' = 0'] : []).concat([
          'p = ' + n(-(r1 + r2)) + ',  q = ' + n(r1 * r2),
          'p-q-Formel: x = −p/2 ± √((p/2)^{2} − q)',
          'x = ' + n((r1 + r2) / 2) + ' ± √(' + n(Math.pow((r1 + r2) / 2, 2)) + ' − ' + paren(r1 * r2) + ') = ' + n((r1 + r2) / 2) + ' ± √' + n(Math.pow((r1 - r2) / 2, 2)) + ' = ' + n((r1 + r2) / 2) + ' ± ' + n(Math.abs(r1 - r2) / 2),
          'x₁ = ' + n(Math.max(r1, r2)) + ',  x₂ = ' + n(Math.min(r1, r2))
        ]),
        hint: 'Normalform x² + px + q = 0 herstellen, dann p-q-Formel: x = −p/2 ± √((p/2)² − q)'
      };
    }
  };

  T.gerade = {
    name: 'Lineare Funktionen',
    gen: function () {
      var m = R(-4, 4); while (m === 0) m = R(-4, 4);
      var t = R(-6, 6), x1 = R(-4, 2), x2 = x1 + R(1, 4);
      var y1 = m * x1 + t, y2 = m * x2 + t;
      return {
        q: 'Eine Gerade geht durch die Punkte P(' + n(x1) + ' | ' + n(y1) + ') und Q(' + n(x2) + ' | ' + n(y2) + '). Bestimme die Steigung m und den y-Achsenabschnitt b der Geradengleichung y = mx + b.',
        answers: [{ label: 'm', value: m, tol: 0.001 }, { label: 'b', value: t, tol: 0.001 }],
        steps: [
          'm = (y₂ − y₁) : (x₂ − x₁) = (' + n(y2) + ' − ' + paren(y1) + ') : (' + n(x2) + ' − ' + paren(x1) + ') = ' + n(y2 - y1) + ' : ' + n(x2 - x1) + ' = ' + n(m),
          'P einsetzen: ' + n(y1) + ' = ' + n(m) + ' · ' + paren(x1) + ' + b  →  b = ' + n(t),
          'y = ' + coef(m, 'x', true) + (t ? sgn(t) : '')
        ],
        hint: 'Erst die Steigung mit dem Steigungsdreieck, dann einen Punkt einsetzen.'
      };
    }
  };

  T.scheitel = {
    name: 'Quadratische Funktionen',
    gen: function () {
      var d = R(-6, 6), e = R(-9, 9), a = pick([1, 1, -1]);
      var b = -2 * a * d, c = a * d * d + e;
      var f = 'y = ' + coef(a, 'x^{2}', true) + coef(b, 'x') + (c ? sgn(c) : '');
      return {
        q: 'Bestimme den Scheitelpunkt S der Parabel  ' + f,
        answers: [{ label: 'x-Wert von S', value: d, tol: 0.001 }, { label: 'y-Wert von S', value: e, tol: 0.001 }],
        steps: [
          'Quadratische Ergänzung' + (a === -1 ? ' (erst −1 ausklammern)' : '') + ':',
          'y = ' + (a === -1 ? '−' : '') + '(x' + sgn(-d) + ')^{2}' + (e ? sgn(e) : ''),
          'S(' + n(d) + ' | ' + n(e) + ')'
        ],
        hint: 'Scheitelform y = a(x − d)² + e  →  S(d | e). Tipp: d = −b : (2a).'
      };
    }
  };

  T.potenzen = {
    name: 'Potenzen',
    gen: function () {
      var v = R(1, 5), base = pick([2, 3, 5, 10, 'a', 'x']);
      var m = R(2, 9), k = R(2, 6);
      if (v === 1) return {
        q: 'Vereinfache und gib den Exponenten an:  ' + base + '^{' + m + '} · ' + base + '^{' + k + '} = ' + base + '^{?}',
        answers: [{ label: 'Exponent', value: m + k, tol: 0 }],
        steps: ['Gleiche Basis: Exponenten addieren', base + '^{' + m + ' + ' + k + '} = ' + base + '^{' + (m + k) + '}'],
        hint: 'aᵐ · aⁿ = aᵐ⁺ⁿ'
      };
      if (v === 2) return {
        q: 'Vereinfache und gib den Exponenten an:  (' + base + '^{' + m + '})^{' + k + '} = ' + base + '^{?}',
        answers: [{ label: 'Exponent', value: m * k, tol: 0 }],
        steps: ['Potenz einer Potenz: Exponenten multiplizieren', base + '^{' + m + ' · ' + k + '} = ' + base + '^{' + (m * k) + '}'],
        hint: '(aᵐ)ⁿ = aᵐ·ⁿ'
      };
      if (v === 3) {
        var big = m + k;
        return {
          q: 'Vereinfache und gib den Exponenten an:  ' + base + '^{' + big + '} : ' + base + '^{' + k + '} = ' + base + '^{?}',
          answers: [{ label: 'Exponent', value: m, tol: 0 }],
          steps: ['Gleiche Basis beim Dividieren: Exponenten subtrahieren', base + '^{' + big + ' − ' + k + '} = ' + base + '^{' + m + '}'],
          hint: 'aᵐ : aⁿ = aᵐ⁻ⁿ'
        };
      }
      if (v === 4) {
        var mant = R(11, 98) / 10, ex = pick([-6, -5, -4, -3, 3, 4, 5, 6, 7]);
        var full = ex > 0 ? n(rnd(mant * Math.pow(10, ex), 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : n(rnd(mant * Math.pow(10, ex), 8));
        return {
          q: 'Schreibe in wissenschaftlicher Schreibweise:  ' + full + ' = ' + n(mant) + ' · 10^{?}',
          answers: [{ label: 'Exponent', value: ex, tol: 0 }],
          steps: ['Komma so verschieben, dass genau eine Ziffer (nicht 0) davor steht', ex > 0 ? 'Komma um ' + ex + ' Stellen nach links → 10^{' + ex + '}' : 'Komma um ' + (-ex) + ' Stellen nach rechts → 10^{' + ex + '}'],
          hint: 'Große Zahl → positiver Exponent, kleine Zahl (0,00…) → negativer Exponent.'
        };
      }
      var b2 = pick([2, 4, 5, 10]), e2 = b2 === 10 ? R(1, 3) : R(1, 3);
      var val = rnd(Math.pow(b2, -e2), 6);
      return {
        q: 'Berechne als Dezimalzahl:  ' + b2 + '^{−' + e2 + '}',
        answers: [{ label: 'Ergebnis', value: val, tol: 0.0000001 }],
        steps: [b2 + '^{−' + e2 + '} = 1 : ' + b2 + '^{' + e2 + '} = 1 : ' + n(Math.pow(b2, e2)) + ' = ' + n(val)],
        hint: 'Negativer Exponent bedeutet Kehrwert: a⁻ⁿ = 1 : aⁿ'
      };
    }
  };

  T.wurzeln = {
    name: 'Wurzeln',
    gen: function () {
      var v = R(1, 3);
      if (v === 1) {
        var r = R(4, 25);
        return {
          q: 'Berechne ohne Taschenrechner:  √' + (r * r),
          answers: [{ label: 'Ergebnis', value: r, tol: 0 }],
          steps: [r + ' · ' + r + ' = ' + r * r + ', also √' + r * r + ' = ' + r],
          hint: 'Welche Zahl mal sich selbst ergibt ' + r * r + '?'
        };
      }
      if (v === 2) {
        var k = R(2, 7), m = pick([2, 3, 5, 6, 7]);
        return {
          q: 'Ziehe teilweise die Wurzel:  √' + (k * k * m) + ' = a · √b',
          answers: [{ label: 'a (vor der Wurzel)', value: k, tol: 0 }, { label: 'b (unter der Wurzel)', value: m, tol: 0 }],
          steps: ['√' + (k * k * m) + ' = √(' + k * k + ' · ' + m + ')', '= √' + k * k + ' · √' + m + ' = ' + k + '√' + m],
          hint: 'Suche die größte Quadratzahl, die in ' + (k * k * m) + ' steckt.'
        };
      }
      var p = pick([[2, 8], [2, 18], [3, 12], [2, 32], [5, 20], [3, 27], [2, 50], [6, 24]]);
      var res = Math.sqrt(p[0] * p[1]);
      return {
        q: 'Berechne:  √' + p[0] + ' · √' + p[1],
        answers: [{ label: 'Ergebnis', value: res, tol: 0 }],
        steps: ['√a · √b = √(a · b)', '√(' + p[0] + ' · ' + p[1] + ') = √' + p[0] * p[1] + ' = ' + res],
        hint: 'Wurzeln darf man beim Multiplizieren zusammenfassen.'
      };
    }
  };

  T.kreis = {
    name: 'Kreis & Zylinder',
    gen: function () {
      var r = R(2, 15), h = R(3, 20), v = R(1, 4);
      var note = 'Runde auf zwei Nachkommastellen (π-Taste oder 3,14).';
      if (v === 1) {
        var A = Math.PI * r * r;
        return {
          q: 'Ein Kreis hat den Radius r = ' + r + ' cm. Berechne den Flächeninhalt.', note: note,
          answers: [{ label: 'A', unit: 'cm²', value: rnd(A, 2), rel: 0.006 }],
          steps: ['A = π · r^{2}', 'A = π · ' + r + '^{2} = π · ' + r * r + ' ≈ ' + nz(A, 2) + ' cm²'],
          hint: 'A = π · r²'
        };
      }
      if (v === 2) {
        var d = 2 * r, U = Math.PI * d;
        return {
          q: 'Ein rundes Beet hat den Durchmesser d = ' + d + ' m. Wie lang ist sein Umfang?', note: note,
          answers: [{ label: 'U', unit: 'm', value: rnd(U, 2), rel: 0.006 }],
          steps: ['U = π · d', 'U = π · ' + d + ' ≈ ' + nz(U, 2) + ' m'],
          hint: 'U = π · d = 2 · π · r'
        };
      }
      if (v === 3) {
        var V = Math.PI * r * r * h;
        return {
          q: 'Eine zylinderförmige Dose hat den Radius r = ' + r + ' cm und die Höhe h = ' + h + ' cm. Berechne das Volumen.', note: note,
          answers: [{ label: 'V', unit: 'cm³', value: rnd(V, 2), rel: 0.006 }],
          steps: ['V = π · r^{2} · h', 'V = π · ' + r * r + ' · ' + h + ' ≈ ' + nz(V, 2) + ' cm³'],
          hint: 'Volumen Zylinder = Grundfläche · Höhe'
        };
      }
      var O = 2 * Math.PI * r * r + 2 * Math.PI * r * h;
      return {
        q: 'Ein Zylinder hat r = ' + r + ' cm und h = ' + h + ' cm. Berechne die Oberfläche.', note: note,
        answers: [{ label: 'O', unit: 'cm²', value: rnd(O, 2), rel: 0.006 }],
        steps: ['O = 2 · π · r^{2} + 2 · π · r · h', 'O = 2 · π · ' + r * r + ' + 2 · π · ' + r + ' · ' + h + ' ≈ ' + nz(O, 2) + ' cm²'],
        hint: 'Oberfläche = 2 Kreise + Mantel (Rechteck mit Länge 2πr)'
      };
    }
  };

  T.strahlensatz = {
    name: 'Strahlensätze',
    gen: function () {
      var a = R(2, 8), k = pick([1.5, 2, 2.5, 3]), b = R(2, 9), s = R(2, 7);
      var a2 = rnd(a * k, 1), b2 = rnd(b * k, 1), s2 = rnd(s * k, 1);
      var info = 'Von Z gehen zwei Strahlen aus, die Strecken AB und A\'B\' sind parallel. ';
      if (Math.random() < 0.5) {
        return {
          q: info + 'Es gilt: ZA = ' + n(a) + ' cm, ZA\' = ' + n(a2) + ' cm, ZB = ' + n(b) + ' cm. Berechne ZB\'.',
          answers: [{ label: 'ZB\'', unit: 'cm', value: b2, tol: 0.051 }],
          steps: ['1. Strahlensatz: ZB\' : ZB = ZA\' : ZA', 'ZB\' = ' + n(b) + ' · ' + n(a2) + ' : ' + n(a) + ' = ' + n(b2) + ' cm'],
          hint: 'Streckungsfaktor k = ZA\' : ZA = ' + n(k),
          fig: 'strahlen'
        };
      }
      return {
        q: info + 'Es gilt: ZA = ' + n(a) + ' cm, ZA\' = ' + n(a2) + ' cm, AB = ' + n(s) + ' cm. Berechne A\'B\'.',
        answers: [{ label: 'A\'B\'', unit: 'cm', value: s2, tol: 0.051 }],
        steps: ['2. Strahlensatz: A\'B\' : AB = ZA\' : ZA', 'A\'B\' = ' + n(s) + ' · ' + n(a2) + ' : ' + n(a) + ' = ' + n(s2) + ' cm'],
        hint: 'Die Parallelen stehen im gleichen Verhältnis wie die Strahlenabschnitte ab Z.',
        fig: 'strahlen'
      };
    }
  };

  T.wahrscheinlichkeit = {
    name: 'Wahrscheinlichkeit',
    gen: function () {
      var r = R(2, 6), b = R(2, 6), N = r + b, v = R(1, 3);
      var urn = 'In einer Urne liegen ' + r + ' rote und ' + b + ' blaue Kugeln. ';
      var note = 'Gib das Ergebnis in Prozent an, gerundet auf eine Nachkommastelle.';
      if (v === 1) {
        var P = r / N * (r - 1) / (N - 1) * 100;
        return {
          q: urn + 'Es werden nacheinander zwei Kugeln OHNE Zurücklegen gezogen. Wie groß ist die Wahrscheinlichkeit, zwei rote Kugeln zu ziehen?', note: note,
          answers: [{ label: 'P', unit: '%', value: rnd(P, 1), tol: 0.11, pct: true }],
          steps: ['Pfadregel: Wahrscheinlichkeiten entlang des Pfades multiplizieren', 'P = ' + r + '/' + N + ' · ' + (r - 1) + '/' + (N - 1) + ' = ' + r * (r - 1) + '/' + N * (N - 1) + ' ≈ ' + nz(P, 1) + ' %'],
          hint: 'Beim zweiten Zug ist eine rote Kugel weniger in der Urne.'
        };
      }
      if (v === 2) {
        var P2 = r / N * r / N * 100;
        return {
          q: urn + 'Es wird zweimal MIT Zurücklegen gezogen. Wie groß ist die Wahrscheinlichkeit, zweimal Rot zu ziehen?', note: note,
          answers: [{ label: 'P', unit: '%', value: rnd(P2, 1), tol: 0.11, pct: true }],
          steps: ['Mit Zurücklegen bleibt die Wahrscheinlichkeit gleich', 'P = ' + r + '/' + N + ' · ' + r + '/' + N + ' = ' + r * r + '/' + N * N + ' ≈ ' + nz(P2, 1) + ' %'],
          hint: 'Pfadregel: multiplizieren.'
        };
      }
      var P3 = (1 - (b / N) * ((b - 1) / (N - 1))) * 100;
      return {
        q: urn + 'Es werden zwei Kugeln OHNE Zurücklegen gezogen. Wie groß ist die Wahrscheinlichkeit, MINDESTENS eine rote Kugel zu ziehen?', note: note,
        answers: [{ label: 'P', unit: '%', value: rnd(P3, 1), tol: 0.11, pct: true }],
        steps: ['Gegenereignis: keine rote Kugel = zweimal Blau', 'P(blau, blau) = ' + b + '/' + N + ' · ' + (b - 1) + '/' + (N - 1) + ' = ' + b * (b - 1) + '/' + N * (N - 1),
          'P(mind. eine rote) = 1 − ' + b * (b - 1) + '/' + N * (N - 1) + ' ≈ ' + nz(P3, 1) + ' %'],
        hint: '„Mindestens einmal“ rechnet man am einfachsten über das Gegenereignis.'
      };
    }
  };

  /* ---------------------------------------------------------------- Eingaben prüfen */

  function parseNum(s) {
    if (s === null || s === undefined) return NaN;
    var t = String(s).trim().replace(/[−–]/g, '-').replace(/\s+/g, '');
    t = t.replace(/^[a-zA-Z₁₂ₙ']+=/, '');            // „x=3“ erlauben
    t = t.replace(/(€|%|cm²|cm³|m²|m³|cm|mm|m|km|°)$/i, '');
    if (t.indexOf(',') >= 0 && t.indexOf('.') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(',', '.');
    var frac = t.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (frac) return parseFloat(frac[1]) / parseFloat(frac[2]);
    if (!/^-?\d*\.?\d+$/.test(t)) return NaN;
    return parseFloat(t);
  }

  function within(val, ans) {
    if (isNaN(val)) return false;
    var tol = ans.rel ? Math.max(0.011, Math.abs(ans.value) * ans.rel) : (ans.tol || 0) + 1e-9;
    if (Math.abs(val - ans.value) <= tol) return true;
    if (ans.pct && Math.abs(val * 100 - ans.value) <= tol) return true;  // 0,25 statt 25 %
    return false;
  }

  function check(task, inputs) {
    var vals = inputs.map(parseNum);
    var ok = [];
    if (task.set) {
      var used = {};
      task.answers.forEach(function () { ok.push(false); });
      vals.forEach(function (v, i) {
        for (var j = 0; j < task.answers.length; j++) {
          if (!used[j] && within(v, task.answers[j])) { used[j] = true; ok[i] = true; break; }
        }
      });
    } else {
      task.answers.forEach(function (a, i) { ok.push(within(vals[i], a)); });
    }
    return { ok: ok.every(Boolean), each: ok, parsed: vals };
  }

  function generate(topic) {
    var t = T[topic] || T.prozent;
    var task = t.gen();
    task.topic = topic;
    task.topicName = t.name;
    return task;
  }

  var api = { topics: T, generate: generate, check: check, parseNum: parseNum,
    list: function () { return Object.keys(T).map(function (k) { return { id: k, name: T[k].name }; }); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.LP = root.LP || {}; root.LP.math = api; }
})(typeof window !== 'undefined' ? window : null);
