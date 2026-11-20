# Lernportal-Server einrichten

Der Server ist ein kleines Programm, das im Heimnetz läuft. Tablet (Sohn) und Handy (Eltern) öffnen es im Browser.
Er muss laufen, wenn gelernt wird – am besten immer.

**Die FRITZ!Box selbst kann den Server nicht ausführen** (sie kann keine eigenen Programme starten).
Sie wird aber gebraucht, um dem Server eine feste Adresse zu geben (Schritt 4).

## Welches Gerät?

| Gerät | Geeignet? | Bemerkung |
|---|---|---|
| **Raspberry Pi 4 oder 5** | ⭐ Empfehlung | ca. 60–100 € mit Netzteil und SD-Karte, braucht ~3 Watt, läuft immer |
| Raspberry Pi Zero 2 W | gut | reicht aus; nur 2,4-GHz-WLAN, Netzteil 5 V / 2,5 A, unbedingt **64-Bit-Lite-System** |
| NAS mit Docker (z. B. Synology Plus-Serie) | gut | `docker compose up -d` im Lernportal-Ordner |
| Alter Laptop/PC | zum Ausprobieren | muss zur Lernzeit an sein, braucht viel mehr Strom |
| FRITZ!Box | nein | kann keine Programme ausführen |

---

## Raspberry Pi – Schritt für Schritt

### 1. SD-Karte vorbereiten (am PC)
1. **Raspberry Pi Imager** von raspberrypi.com installieren und starten.
2. Gerät: dein Pi-Modell (z. B. „Raspberry Pi Zero 2 W“) · Betriebssystem: **Raspberry Pi OS Lite (64-bit)** · Speicher: die SD-Karte.
   Keine Desktop-Version – beim Zero 2 reicht der Arbeitsspeicher dafür nicht gut.
3. Bei der Frage nach Anpassungen **„Einstellungen bearbeiten“** wählen:
   - Hostname: `lernportal`
   - Benutzername und Passwort festlegen (merken!)
   - WLAN eintragen (oder später per Netzwerkkabel an die FRITZ!Box – stabiler)
   - Zeitzone `Europe/Berlin`, Tastatur `de`
   - Reiter *Dienste*: **SSH aktivieren** (Passwort-Anmeldung)
4. Schreiben, SD-Karte in den Pi, Strom anschließen, ca. 2 Minuten warten.

### 2. Am Pi anmelden (vom PC aus)
In der Eingabeaufforderung (Windows) bzw. im Terminal (Mac):
```bash
ssh BENUTZERNAME@lernportal.local
```
Passwort eingeben. Klappt `lernportal.local` nicht: Die IP-Adresse steht in der FRITZ!Box unter *Heimnetz → Netzwerk*.

### 3. Lernportal holen und installieren
```bash
sudo apt-get update && sudo apt-get install -y git
```
```bash
git clone https://github.com/schneiderpeterh-lang/Lernportal.git
```
Ist das Repository privat, fragt Git nach Benutzername und Passwort: als Passwort einen **Personal Access Token** von
GitHub nehmen (*GitHub → Settings → Developer settings → Fine-grained tokens*, nur Lesezugriff auf „Lernportal“).
```bash
cd Lernportal
```
```bash
bash scripts/install-raspberry.sh
```
Das Skript installiert Node.js, richtet den automatischen Start ein und zeigt am Ende die Adresse an,
z. B. `http://192.168.178.42:3000`.

### 4. Feste Adresse in der FRITZ!Box
1. `http://fritz.box` öffnen → *Heimnetz → Netzwerk → Netzwerkverbindungen*.
2. Beim Gerät **lernportal** auf den Stift (Bearbeiten).
3. Haken bei **„Diesem Netzwerkgerät immer die gleiche IPv4-Adresse zuweisen“** → Übernehmen.

Damit bleibt die Adresse gleich, und die Start-Adresse in Fully Kiosk muss nie geändert werden.

### 5. Erster Aufruf
1. Am Handy (im WLAN) die Adresse öffnen → **Eltern** → Eltern-PIN festlegen.
2. Unter *Einstellungen* Name, Lerntage, Uhrzeit prüfen.
3. Die Adresse in Fully Kiosk als Start-URL eintragen (siehe `TABLET-EINRICHTEN.md`).

### KI-Prüfung später einschalten
```bash
sudo nano /etc/lernportal.env
```
Bei `# ANTHROPIC_API_KEY=` die Raute entfernen, Schlüssel eintragen, speichern (Strg+O, Enter, Strg+X), dann:
```bash
sudo systemctl restart lernportal
```

### Nützliche Befehle
| Zweck | Befehl |
|---|---|
| Läuft der Server? | `sudo systemctl status lernportal` |
| Meldungen ansehen | `journalctl -u lernportal -n 50` |
| Neustart | `sudo systemctl restart lernportal` |
| Update holen | `cd ~/Lernportal && git pull && npm install --omit=dev && sudo systemctl restart lernportal` |

### Datensicherung
Alle Daten liegen in `~/Lernportal/data/` (täglich automatisch gesichert in `data/backups/`).
Zusätzlich kann man im Eltern-Bereich unter *Einstellungen → Sicherung herunterladen* eine Kopie aufs Handy/den PC holen.
Wer möchte, kopiert den `data`-Ordner gelegentlich auf den USB-Speicher der FRITZ!Box.

---

## Schnelltest am Windows-PC (ohne Raspberry Pi)
1. **Node.js LTS** von nodejs.org installieren.
2. Lernportal von GitHub als ZIP herunterladen (*Code → Download ZIP*) und entpacken.
3. Im entpackten Ordner in die Adresszeile des Explorers `cmd` tippen, Enter, dann:
   ```bash
   node server.js
   ```
4. Die Windows-Firewall fragt nach: **Private Netzwerke zulassen**.
5. Die angezeigte Adresse (`http://192.168.178.…:3000`) am Tablet öffnen.

Das Fenster muss offen bleiben, solange gelernt wird.
