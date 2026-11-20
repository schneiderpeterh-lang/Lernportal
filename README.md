# Lernportal

Ein kleines, werbefreies Lernportal für Schüler der 9. Klasse (Deutsch, Englisch, Mathe) – gedacht für ein
gesperrtes Fire-Tablet zu Hause. Eltern tragen Termine und Lerninhalte ein, das Portal macht daraus jeden Tag
eine **feste Lernzeit mit immer gleichem Ablauf**.

## Was es kann

**Für den Schüler**
- **Heute:** Die Lernzeit des Tages, immer im selben Ritual:
  Aufwärmen (fällige Wiederholungen) → Block 1 → Pause → Block 2 → Mini-Test.
  Die Blöcke richten sich automatisch nach den nächsten Arbeiten/Tests (dringend + schlecht vorbereitet = zuerst).
  Ohne anstehende Termine wird das Fach mit den schlechtesten Noten trainiert.
- **Lernzeit im Fokusmodus:** keine Navigation, Countdown pro Block, Uhr stoppt bei Untätigkeit,
  Pause wird erzwungen, Abbrechen nur mit Bestätigung. Fortschritt bleibt erhalten, falls das Tablet ausgeht.
- **Übungsarten:**
  - Vokabeln: erst Multiple Choice, dann selbst schreiben (tolerant bei Groß-/Kleinschreibung, „to“, Alternativen,
    kleinen Tippfehlern). Falsche Antworten werden einmal abgeschrieben.
  - Karteikarten mit Selbsteinschätzung, Quiz mit Erklärungen, Merkblätter zum Lesen.
  - **Mathe-Training mit 13 Themen der 9. Klasse** (Pythagoras, Prozent, Zinsen, lineare/quadratische Gleichungen,
    Gleichungssysteme, Funktionen, Potenzen, Wurzeln, Kreis & Zylinder, Strahlensätze, Wahrscheinlichkeit) –
    unendlich viele Aufgaben mit Zufallszahlen, Tipp, zweitem Versuch und **Lösungsweg**.
- **Karteikasten-System (Leitner, 5 Fächer):** Gewusstes kommt seltener, Falsches sofort wieder.
  Kurz vor einem Test wird der Stoff des Tests verstärkt geübt.
- **Termine:** Countdown, Stoff, „Vorbereitungsgrad“ in Prozent, 14-Tage-Übersicht.
- **Motivation:** Punkte, Level, Serie (Tage am Stück), Erfolge – und **Belohnungen, die die Eltern festlegen**
  (z. B. 150 Punkte = 30 Minuten extra Zocken). Einlösen erzeugt eine Anfrage an die Eltern.

**Für die Eltern** (PIN-geschützt, auch vom eigenen Handy aus erreichbar)
- Übersicht: Lernzeiten der Woche, Minuten, Trefferquote, Stimmung nach jeder Lernzeit,
  Karten, an denen es hakt, schwache Mathe-Themen, Notenschnitt.
- Termine anlegen und Lerninhalte direkt dazu erstellen.
- Lernpakete pflegen – inkl. **Massen-Import** („englisch ; deutsch“ pro Zeile) und einem fertigen
  **KI-Prompt**: Buchseite fotografieren, an Claude schicken, Ergebnis einfügen – fertig.
- Noten, Belohnungen, feste Lerntage/Uhrzeit/Dauer, PIN, Datensicherung.

## Installation (Heimserver)

Das Portal braucht einen Rechner im Heimnetz, der läuft, wenn gelernt wird: ein Raspberry Pi, ein NAS mit Docker
(z. B. Synology) oder ein alter Laptop/PC. Es gibt **keine externen Abhängigkeiten** – nur Node.js ab Version 18.

### Variante 1: Direkt mit Node.js

```bash
node server.js
```

Der Server zeigt beim Start die Adressen an, z. B. `http://192.168.178.20:3000`. Diese Adresse am Tablet öffnen.
Port ändern: `PORT=8080 node server.js`.

### Variante 2: Docker (NAS, Raspberry Pi)

```bash
docker compose up -d
```

Die Daten liegen im Ordner `./data` (wird automatisch angelegt).

### Erster Start
1. Adresse im Browser öffnen → unten/links auf **Eltern** → eine **Eltern-PIN festlegen** (6 Ziffern empfohlen).
   Alternativ fest vorgeben: `PARENT_PIN=123456 node server.js`.
2. Unter *Einstellungen* Name, Lerntage, Uhrzeit und Dauer eintragen.
3. Unter *Termine* die nächsten Arbeiten und Tests eintragen und Lernpakete dazu anlegen.
   Beispiel-Lernpakete (unregelmäßige Verben, if-Sätze, das/dass, Kommaregeln, Stilmittel, Erörterung,
   Formelsammlung, Mathe-Training …) sind schon vorhanden.
4. Tablet einrichten: **[docs/TABLET-EINRICHTEN.md](docs/TABLET-EINRICHTEN.md)**.

Tipp: Dem Server-Rechner im Router eine feste IP-Adresse geben, damit sich die Adresse nie ändert.

### Ohne Server ausprobieren
`node build-demo.js` erzeugt `dist/lernportal-standalone.html` – eine einzelne Datei mit Beispieldaten,
die in jedem Browser läuft (Daten bleiben im Browser, Eltern-PIN 1234).

## Daten & Sicherheit
- Alle Daten bleiben bei Ihnen: `data/db.json`, täglich gesichert nach `data/backups/` (30 Tage).
- Sicherung/Wiederherstellung auch im Eltern-Bereich unter *Einstellungen*.
- Die Eltern-PIN wird nur als Hash gespeichert; nach 5 Fehlversuchen ist das Login 5 Minuten gesperrt.
- Der Schüler kann nur Lernfortschritt, Sitzungen und Belohnungswünsche speichern – Termine, Inhalte,
  Noten und Einstellungen nur mit Eltern-PIN.
- Gedacht für das Heimnetz. Nicht ohne HTTPS und zusätzlichen Schutz ins Internet stellen.

## Technik
- `server.js` – Node.js ohne Pakete: statische Dateien, JSON-API, Speicherung, PIN.
- `public/` – Web-App ohne Build-Schritt (Vanilla JS), läuft auch in der WebView älterer Fire-Tablets
  (empfohlen: Fire OS 7 oder neuer).
- Offline-tolerant: Bricht das WLAN kurz ab, wird weitergelernt und später übertragen.

| Datei | Inhalt |
|---|---|
| `public/js/learn.js` | Lernplan, Karteikasten, Übungs-Engine, Punkte |
| `public/js/mathgen.js` | Mathe-Aufgabengenerator mit Lösungswegen |
| `public/js/seed.js` | Startinhalte (hier eigene Standard-Inhalte ergänzen) |
| `public/js/student.js` | Ansichten für den Schüler inkl. Lernzeit |
| `public/js/parent.js` | Eltern-Bereich |
