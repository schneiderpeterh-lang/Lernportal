/*
 * Startinhalte: Fächer, Beispiel-Lernpakete (Klasse 9 Realschule), Belohnungen.
 * Wird vom Server beim ersten Start und von der Demo-Version genutzt.
 * Kartenfelder:  a = Vorderseite / Fremdwort / Frage,  b = Rückseite / Deutsch / richtige Antwort,
 *                x = falsche Antworten (Quiz),  n = Merkhilfe, die nach der Antwort erscheint.
 */
(function (root) {
  'use strict';

  function cards(prefix, rows) {
    return rows.map(function (r, i) {
      var c = { id: prefix + (i + 1), a: r[0], b: r[1] };
      if (r[2]) c.x = r[2];
      if (r[3]) c.n = r[3];
      return c;
    });
  }

  function isoDay(offset) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function buildSeed(opts) {
    opts = opts || {};
    var now = Date.now();

    var subjects = [
      { id: 'deutsch', name: 'Deutsch', color: '#d9480f', short: 'D', order: 1 },
      { id: 'englisch', name: 'Englisch', color: '#1c7ed6', short: 'E', order: 2 },
      { id: 'mathe', name: 'Mathe', color: '#2b8a3e', short: 'M', order: 3 }
    ];

    var decks = [
      {
        id: 'en-vokabeln-beispiel', subjectId: 'englisch', kind: 'vokabeln', direction: 'b2a',
        title: 'Beispiel: Unit-Vokabeln',
        cards: cards('v', [
          ['environment', 'Umwelt'],
          ['to improve', 'verbessern'],
          ['experience', 'Erfahrung / Erlebnis'],
          ['opportunity', 'Gelegenheit / Chance'],
          ['to achieve', 'erreichen / schaffen'],
          ['responsible', 'verantwortlich'],
          ['to suggest', 'vorschlagen'],
          ['reliable', 'zuverlässig'],
          ['to avoid', 'vermeiden'],
          ['advantage', 'Vorteil'],
          ['disadvantage', 'Nachteil'],
          ['to depend on', 'abhängen von']
        ])
      },
      {
        id: 'en-redline9-u2', subjectId: 'englisch', kind: 'vokabeln', direction: 'b2a',
        title: 'Red Line 9 – Unit 2', cards: []
      },
      {
        id: 'en-irregular', subjectId: 'englisch', kind: 'vokabeln', direction: 'b2a',
        title: 'Unregelmäßige Verben',
        cards: cards('iv', [
          ['be – was, were – been', 'sein'],
          ['begin – began – begun', 'beginnen / anfangen'],
          ['break – broke – broken', 'brechen / zerbrechen'],
          ['bring – brought – brought', 'bringen'],
          ['buy – bought – bought', 'kaufen'],
          ['catch – caught – caught', 'fangen'],
          ['choose – chose – chosen', 'wählen / aussuchen'],
          ['come – came – come', 'kommen'],
          ['do – did – done', 'tun / machen'],
          ['drink – drank – drunk', 'trinken'],
          ['drive – drove – driven', 'fahren'],
          ['eat – ate – eaten', 'essen'],
          ['fall – fell – fallen', 'fallen'],
          ['feel – felt – felt', 'fühlen'],
          ['find – found – found', 'finden'],
          ['fly – flew – flown', 'fliegen'],
          ['forget – forgot – forgotten', 'vergessen'],
          ['give – gave – given', 'geben'],
          ['go – went – gone', 'gehen'],
          ['know – knew – known', 'wissen / kennen'],
          ['leave – left – left', 'verlassen / weggehen'],
          ['lose – lost – lost', 'verlieren'],
          ['meet – met – met', 'treffen'],
          ['pay – paid – paid', 'bezahlen'],
          ['run – ran – run', 'rennen / laufen'],
          ['say – said – said', 'sagen'],
          ['see – saw – seen', 'sehen'],
          ['speak – spoke – spoken', 'sprechen'],
          ['take – took – taken', 'nehmen'],
          ['teach – taught – taught', 'unterrichten / lehren'],
          ['think – thought – thought', 'denken'],
          ['write – wrote – written', 'schreiben']
        ])
      },
      {
        id: 'en-tenses-info', subjectId: 'englisch', kind: 'merkblatt',
        title: 'Zeitformen & Signalwörter',
        text: [
          '# Zeitformen im Überblick',
          '',
          '## Simple Present',
          'Gewohnheiten, Fakten, Fahrpläne. **he/she/it – das s muss mit!**',
          '- Signalwörter: always, usually, often, sometimes, never, every day',
          '- Beispiel: *She plays football every Friday.*',
          '',
          '## Present Progressive',
          'Etwas passiert genau jetzt oder ist vorübergehend: **am/is/are + -ing**',
          '- Signalwörter: now, at the moment, Look!, Listen!',
          '- Beispiel: *Look! It is raining.*',
          '',
          '## Simple Past',
          'Abgeschlossen in der Vergangenheit, Zeitpunkt ist bekannt: **-ed / 2. Form**',
          '- Signalwörter: yesterday, last week, two days ago, in 2019',
          '- Beispiel: *We went to London last summer.*',
          '',
          '## Present Perfect',
          'Vergangenheit mit Bezug zur Gegenwart, Zeitpunkt egal: **have/has + 3. Form**',
          '- Signalwörter: already, ever, never, just, yet, since, for, so far',
          '- Beispiel: *I have already finished my homework.*',
          '',
          '## Past Perfect',
          'Vorvergangenheit – passierte VOR etwas anderem in der Vergangenheit: **had + 3. Form**',
          '- Signalwörter: before, after, already, by the time',
          '- Beispiel: *When we arrived, the film had already started.*',
          '',
          '## Will-Future und going to',
          '- **will**: Vermutung, spontaner Entschluss – *I think it will rain.*',
          '- **going to**: Plan oder sichere Anzeichen – *Look at the clouds! It is going to rain.*',
          '',
          '## Merksatz',
          'Erst das **Signalwort** suchen, dann die **Zeitform** wählen, dann die **Form** bilden.'
        ].join('\n')
      },
      {
        id: 'en-tenses-quiz', subjectId: 'englisch', kind: 'quiz',
        title: 'Zeitformen-Quiz',
        cards: cards('tq', [
          ['She ___ to school every day.', 'goes', ['is going', 'went', 'has gone'], 'every day = Gewohnheit → Simple Present (he/she/it: -s)'],
          ['Look! The children ___ in the garden.', 'are playing', ['play', 'played', 'have played'], 'Look! = passiert gerade → Present Progressive'],
          ['I ___ my homework yet.', 'haven\'t done', ['didn\'t do', 'don\'t do', 'am not doing'], 'yet → Present Perfect'],
          ['Last summer we ___ to Italy.', 'went', ['have gone', 'go', 'had gone'], 'last summer = Zeitpunkt bekannt → Simple Past'],
          ['When I arrived, the film ___ already ___.', 'had … started', ['has … started', 'was … starting', 'is … started'], 'Vor etwas anderem in der Vergangenheit → Past Perfect'],
          ['I think it ___ tomorrow.', 'will rain', ['rained', 'has rained', 'rain'], 'I think … = Vermutung → will-Future'],
          ['He ___ in Berlin since 2020.', 'has lived', ['lives', 'lived', 'is living'], 'since → Present Perfect'],
          ['Two days ago I ___ my phone.', 'lost', ['have lost', 'lose', 'had lose'], 'ago → Simple Past']
        ])
      },
      {
        id: 'en-ifclauses', subjectId: 'englisch', kind: 'quiz',
        title: 'If-Sätze (Typ 1–3)',
        cards: cards('if', [
          ['If it rains tomorrow, we ___ at home.', 'will stay', ['would stay', 'stayed', 'would have stayed'], 'Typ 1: If + Simple Present → will + Infinitiv'],
          ['If I ___ more time, I would learn Spanish.', 'had', ['have', 'will have', 'would have'], 'Typ 2: If + Simple Past → would + Infinitiv'],
          ['If she had studied, she ___ the test.', 'would have passed', ['would pass', 'will pass', 'passed'], 'Typ 3: If + Past Perfect → would have + 3. Form'],
          ['If I were you, I ___ to the doctor.', 'would go', ['will go', 'went', 'would have gone'], 'Typ 2 (Ratschlag): If I were you … would'],
          ['Which type? „If we had left earlier, we would have caught the bus.“', 'Typ 3', ['Typ 1', 'Typ 2', 'Typ 0'], 'had left + would have caught → Typ 3'],
          ['If he ___ late, we will start without him.', 'is', ['was', 'will be', 'had been'], 'Typ 1: im if-Teil nie will!'],
          ['We would buy a bigger house if we ___ rich.', 'were', ['are', 'will be', 'had been'], 'Typ 2: Simple Past (bei be oft „were“)'],
          ['If you ___ the bus, you will be late.', 'miss', ['missed', 'will miss', 'would miss'], 'Typ 1: If + Simple Present']
        ])
      },
      {
        id: 'de-dassdas', subjectId: 'deutsch', kind: 'quiz',
        title: 'das oder dass?',
        cards: cards('dd', [
          ['Ich hoffe, ___ du morgen kommst.', 'dass', ['das'], 'Konjunktion leitet einen Nebensatz ein → dass. Probe: „dieses/welches“ passt nicht.'],
          ['Das Buch, ___ auf dem Tisch liegt, gehört mir.', 'das', ['dass'], 'Relativpronomen → das. Probe: „welches“ passt.'],
          ['Er sagt, ___ er keine Zeit hat.', 'dass', ['das'], 'Nach sagen, glauben, hoffen, wissen … folgt meist „dass“.'],
          ['___ ist eine gute Idee.', 'Das', ['Dass'], 'Demonstrativpronomen → das. Probe: „Dies ist eine gute Idee.“'],
          ['Ich weiß, ___ ___ stimmt.', 'dass das', ['das das', 'dass dass', 'das dass'], 'Erst Konjunktion (dass), dann Pronomen (das = dies).'],
          ['Das Auto, ___ ich gekauft habe, ist rot.', 'das', ['dass'], 'Relativpronomen → das (welches).'],
          ['Es ist wichtig, ___ man regelmäßig lernt.', 'dass', ['das'], 'Konjunktion → dass.'],
          ['Kennst du ___ Lied?', 'das', ['dass'], 'Artikel → das.'],
          ['Er rannte so schnell, ___ er den Bus noch erwischte.', 'dass', ['das'], '„so …, dass“ → Konjunktion.'],
          ['___ du gewonnen hast, freut mich.', 'Dass', ['Das'], 'Nebensatz am Satzanfang → Dass.']
        ])
      },
      {
        id: 'de-komma', subjectId: 'deutsch', kind: 'karten',
        title: 'Kommaregeln',
        cards: cards('k', [
          ['Komma bei Aufzählungen?', 'Ja, zwischen gleichrangigen Wörtern und Wortgruppen – außer sie sind mit „und“ oder „oder“ verbunden.'],
          ['Komma vor „dass“, „weil“, „obwohl“, „wenn“?', 'Ja. Nebensätze werden immer durch Komma vom Hauptsatz getrennt.'],
          ['Komma bei Relativsätzen?', 'Ja. Relativsätze (der, die, das, welcher …) werden abgetrennt – steht der Relativsatz in der Satzmitte, vorne UND hinten.'],
          ['Komma vor „aber“, „sondern“, „doch“?', 'Ja, vor entgegenstellenden Konjunktionen steht immer ein Komma.'],
          ['Komma vor „und“ zwischen zwei Hauptsätzen?', 'Nicht nötig. Man darf es setzen, um die Gliederung deutlich zu machen.'],
          ['Komma bei „um … zu“, „ohne … zu“, „statt … zu“?', 'Ja. Infinitivgruppen mit um, ohne, statt, anstatt, außer, als werden immer abgetrennt.'],
          ['Komma bei einem Beisatz (Apposition)?', 'Ja, der Beisatz wird eingeschlossen: „Herr Meier, unser Lehrer, ist krank.“'],
          ['Komma nach Anrede oder Ausruf?', 'Ja: „Tim, kommst du?“ – „Ach, das ist schade.“']
        ])
      },
      {
        id: 'de-stilmittel', subjectId: 'deutsch', kind: 'karten',
        title: 'Stilmittel erkennen',
        cards: cards('s', [
          ['Metapher', 'Bildhafter Ausdruck ohne „wie“: ein Wort in übertragener Bedeutung. Bsp.: „Das Leben ist eine Achterbahn.“'],
          ['Vergleich', 'Zwei Bereiche werden mit „wie“ oder „als ob“ verbunden. Bsp.: „stark wie ein Bär“'],
          ['Personifikation', 'Dinge oder Tiere bekommen menschliche Eigenschaften. Bsp.: „Die Sonne lacht.“'],
          ['Alliteration', 'Gleicher Anfangslaut bei aufeinanderfolgenden Wörtern. Bsp.: „Milch macht müde Männer munter.“'],
          ['Anapher', 'Wiederholung desselben Wortes am Anfang aufeinanderfolgender Sätze oder Verse. Bsp.: „Ich will … Ich will …“'],
          ['Hyperbel', 'Starke Übertreibung. Bsp.: „Ich habe dir das schon tausendmal gesagt.“'],
          ['Rhetorische Frage', 'Frage, auf die keine Antwort erwartet wird. Bsp.: „Wer will schon verlieren?“'],
          ['Ironie', 'Man sagt das Gegenteil von dem, was man meint. Bsp.: „Na super, schon wieder Regen.“'],
          ['Klimax', 'Steigerung in mehreren Schritten. Bsp.: „Ich kam, sah und siegte.“'],
          ['Antithese', 'Gegenüberstellung gegensätzlicher Begriffe. Bsp.: „Krieg und Frieden“'],
          ['Euphemismus', 'Beschönigende Umschreibung. Bsp.: „entschlafen“ statt „sterben“'],
          ['Neologismus', 'Neu erfundenes Wort. Bsp.: „Smombie“']
        ])
      },
      {
        id: 'de-eroerterung', subjectId: 'deutsch', kind: 'merkblatt',
        title: 'Erörterung – Aufbau',
        text: [
          '# Die Erörterung',
          '',
          'Du setzt dich mit einer Frage auseinander und kommst zu einem begründeten Urteil.',
          '',
          '## Einleitung',
          '- Hinführung zum Thema: aktueller Anlass, Erlebnis oder Zahl',
          '- Die Fragestellung nennen',
          '',
          '## Hauptteil',
          '- **Lineare Erörterung**: nur eine Seite (z. B. nur Gründe dafür)',
          '- **Dialektische Erörterung**: erst die Gegenseite, dann die eigene Seite',
          '- Jedes Argument nach dem **Drei-Schritt**: These – Begründung – Beispiel',
          '- Reihenfolge: das stärkste Argument kommt **zuletzt**',
          '',
          '## Schluss',
          '- Eigene Meinung als Fazit',
          '- Ausblick oder Kompromiss-Vorschlag',
          '',
          '## Überleitungen, die immer passen',
          '- Ein weiteres Argument ist …',
          '- Hinzu kommt, dass …',
          '- Dagegen spricht jedoch …',
          '- Der wichtigste Grund ist aber …',
          '- Abschließend lässt sich sagen, dass …',
          '',
          '## Typische Fehler',
          '- Argument ohne Beispiel',
          '- Umgangssprache („voll gut“, „krass“)',
          '- Meinung schon in der Einleitung verraten'
        ].join('\n')
      },
      {
        id: 'de-inhaltsangabe', subjectId: 'deutsch', kind: 'merkblatt',
        title: 'Inhaltsangabe',
        text: [
          '# Die Inhaltsangabe',
          '',
          '## Einleitungssatz',
          'Er enthält: **Textsorte, Titel, Autor, Erscheinungsjahr, Thema**.',
          '- *In der Kurzgeschichte „…“ von … aus dem Jahr … geht es um …*',
          '',
          '## Hauptteil',
          '- Die wichtigsten Handlungsschritte in der richtigen Reihenfolge',
          '- Zeitform: **Präsens** (Vorzeitiges im Perfekt)',
          '- **Keine wörtliche Rede** – stattdessen indirekte Rede im **Konjunktiv I**: *Er sagt, er habe keine Zeit.*',
          '- Eigene Worte, sachlich, keine Spannung, keine eigene Meinung',
          '',
          '## Schluss (wenn verlangt)',
          '- Was will der Autor zeigen? Wie wirkt der Text?',
          '',
          '## Checkliste',
          '- Präsens durchgehalten?',
          '- Keine Zitate, keine Ausrufe?',
          '- Etwa ein Drittel der Länge des Originals?'
        ].join('\n')
      },
      {
        id: 'de-bewerbung', subjectId: 'deutsch', kind: 'merkblatt',
        title: 'Bewerbung & Lebenslauf (Praktikum)',
        text: [
          '# Bewerbung für ein Praktikum',
          '',
          '## Das Anschreiben (eine Seite)',
          '- Oben: eigene Adresse, Telefon, E-Mail (seriös, z. B. vorname.nachname@…)',
          '- Adresse der Firma, rechts das Datum',
          '- **Betreff**: Bewerbung um einen Praktikumsplatz vom … bis …',
          '- Anrede mit Namen, wenn möglich: *Sehr geehrte Frau …,*',
          '- Einleitung: Warum gerade diese Firma? Woher kenne ich sie?',
          '- Hauptteil: Was interessiert mich am Beruf? Welche Stärken passen (mit Beispiel)?',
          '- Schluss: *Über eine Einladung zu einem Vorstellungsgespräch freue ich mich.*',
          '- Gruß, Unterschrift, Anlagen (Lebenslauf, Zeugnis)',
          '',
          '## Der Lebenslauf (tabellarisch)',
          '- Persönliche Daten: Name, Adresse, Geburtsdatum, Kontakt',
          '- Schulbildung: aktuelle Schule und Klasse zuerst',
          '- Praktische Erfahrungen: Ferienjob, Ehrenamt, Verein',
          '- Kenntnisse: Sprachen, Computer',
          '- Interessen und Hobbys',
          '- Ort, Datum, Unterschrift',
          '',
          '## Typische Fehler',
          '- Rechtschreibfehler – immer von jemandem gegenlesen lassen',
          '- Floskeln ohne Beispiel („Ich bin teamfähig.“ – Woran merkt man das?)',
          '- Umgangssprache und Smileys'
        ].join('\n')
      },
      {
        id: 'm-formeln', subjectId: 'mathe', kind: 'karten',
        title: 'Formelsammlung Klasse 9',
        cards: cards('f', [
          ['Satz des Pythagoras', 'a² + b² = c²  (c ist die Hypotenuse, sie liegt gegenüber dem rechten Winkel)'],
          ['Flächeninhalt Kreis', 'A = π · r²'],
          ['Umfang Kreis', 'U = 2 · π · r  (= π · d)'],
          ['Volumen Zylinder', 'V = π · r² · h'],
          ['Oberfläche Zylinder', 'O = 2 · π · r² + 2 · π · r · h'],
          ['1. binomische Formel', '(a + b)² = a² + 2ab + b²'],
          ['2. binomische Formel', '(a − b)² = a² − 2ab + b²'],
          ['3. binomische Formel', '(a + b) · (a − b) = a² − b²'],
          ['p-q-Formel für x² + px + q = 0', 'x = −p/2 ± √((p/2)² − q)  (vorher auf Normalform bringen: durch den Faktor vor x² teilen)'],
          ['Normalform einer Geraden', 'y = m · x + b  (m = Steigung, b = y-Achsenabschnitt)'],
          ['Jahreszinsen', 'Z = K · p : 100'],
          ['Zinseszins', 'Kₙ = K₀ · (1 + p/100)ⁿ'],
          ['Potenzgesetz aᵐ · aⁿ', 'aᵐ⁺ⁿ  (gleiche Basis: Exponenten addieren)'],
          ['Potenzgesetz (aᵐ)ⁿ', 'aᵐ·ⁿ  (Exponenten multiplizieren)'],
          ['Steigung durch P₁(x₁|y₁) und P₂(x₂|y₂)', 'm = (y₂ − y₁) : (x₂ − x₁)']
        ])
      },
      {
        id: 'm-training', subjectId: 'mathe', kind: 'mathe',
        title: 'Mathe-Training (alle Themen)',
        topics: ['pythagoras', 'prozent', 'zinsen', 'lingl', 'lgs', 'quadgl', 'gerade', 'scheitel', 'potenzen', 'wurzeln', 'kreis', 'strahlensatz', 'wahrscheinlichkeit']
      }
    ];

    var rewards = [
      { id: 'r-zocken', title: '30 Minuten extra Zocken', cost: 150 },
      { id: 'r-essen', title: 'Lieblingsessen aussuchen', cost: 300 },
      { id: 'r-ausschlafen', title: 'Einmal vom Tischdienst befreit', cost: 400 },
      { id: 'r-kino', title: 'Kinobesuch', cost: 1000 }
    ];

    var settings = [{
      id: 'main', studentName: '', days: [1, 2, 3, 4, 5], startTime: '16:00', minutes: 45, idleSeconds: 90, createdAt: now
    }];

    // Wöchentlicher Englisch-Vokabeltest: jeden Donnerstag, ab dem nächsten Donnerstag
    var dow = new Date().getDay();
    var weeklyVocab = {
      id: 'ex-vok-woche', subjectId: 'englisch', type: 'vokabeltest', title: 'Vokabeltest Englisch',
      date: isoDay((4 - dow + 7) % 7), repeat: 'weekly', skipDates: [], until: null,
      topics: 'Vokabeln der aktuellen Unit (Red Line 9) – Lernpaket jede Woche ergänzen',
      deckIds: ['en-redline9-u2', 'en-irregular']
    };

    var seed = {
      settings: settings, subjects: subjects, decks: decks, rewards: rewards,
      exams: [weeklyVocab], grades: [], sessions: [], progress: [], redemptions: []
    };

    if (opts.demo) {
      settings[0].studentName = 'Jonas';
      decks.push({
        id: 'm-sa-training', subjectId: 'mathe', kind: 'mathe',
        title: 'Training: Pythagoras & quadratische Gleichungen',
        topics: ['pythagoras', 'quadgl', 'wurzeln']
      });
      weeklyVocab.deckIds = ['en-vokabeln-beispiel', 'en-irregular'];
      seed.exams = [weeklyVocab,
        { id: 'ex-mathe', subjectId: 'mathe', type: 'arbeit', title: '2. Klassenarbeit', date: isoDay(7),
          topics: 'Satz des Pythagoras, quadratische Gleichungen, Wurzeln', deckIds: ['m-sa-training', 'm-formeln'] },
        { id: 'ex-deutsch', subjectId: 'deutsch', type: 'arbeit', title: 'Klassenarbeit Erörterung', date: isoDay(13),
          topics: 'Dialektische Erörterung, Kommasetzung, das/dass', deckIds: ['de-eroerterung', 'de-komma', 'de-dassdas'] }
      ];
      seed.grades = [
        { id: 'g1', subjectId: 'mathe', date: isoDay(-40), type: 'arbeit', grade: 4, note: '1. Klassenarbeit' },
        { id: 'g2', subjectId: 'englisch', date: isoDay(-30), type: 'test', grade: 5, note: 'Vokabeltest Unit 2' },
        { id: 'g3', subjectId: 'deutsch', date: isoDay(-25), type: 'arbeit', grade: 3, note: 'Inhaltsangabe' },
        { id: 'g4', subjectId: 'englisch', date: isoDay(-12), type: 'arbeit', grade: 4, note: '1. Klassenarbeit' },
        { id: 'g5', subjectId: 'mathe', date: isoDay(-9), type: 'test', grade: 3, note: 'Kurztest Potenzen' }
      ];
      // Ein paar vergangene Lerntage, damit Statistiken nicht leer sind
      var pattern = [[-6, 42, 61, 9], [-5, 45, 70, 6], [-4, 38, 55, 12], [-1, 47, 74, 8]];
      pattern.forEach(function (p, i) {
        seed.sessions.push({
          id: 'demo-s' + i, date: isoDay(p[0]), type: 'plan', minutes: p[1], right: p[2], wrong: p[3],
          xp: p[2] * 2 + 45, completed: true, mood: i % 3 === 0 ? 2 : 3,
          steps: [{ kind: 'focus', subjectId: i % 2 ? 'englisch' : 'mathe', right: p[2], wrong: p[3], seconds: p[1] * 60 }]
        });
      });
      seed.redemptions = [{ id: 'demo-red1', rewardId: 'r-zocken', cost: 150, date: isoDay(-2), status: 'eingelöst' }];
    }

    return seed;
  }

  var api = { buildSeed: buildSeed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.LP = root.LP || {}; root.LP.buildSeed = buildSeed; }
})(typeof window !== 'undefined' ? window : null);
