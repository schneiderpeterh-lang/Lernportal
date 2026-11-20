# Fire-Tablet als reines Lerngerät einrichten

Ziel: Das Tablet startet direkt ins Lernportal, und es gibt **keinen** Weg zu Spielen, Videos, Browser oder App-Store.
Empfohlen ist **Weg A (Fully Kiosk Browser)**. Weg B kommt ohne Zusatz-App aus, ist aber weniger dicht.

> Vorher: Der Lernportal-Server läuft (siehe README), und Sie kennen seine Adresse,
> z. B. `http://192.168.178.20:3000`. Testen Sie die Adresse zuerst im Browser Ihres Handys.

---

## Weg A – Fully Kiosk Browser (empfohlen)

Fully Kiosk ist eine bekannte Kiosk-App für Android/Fire OS. Die Kiosk-Funktionen brauchen die
**PLUS-Lizenz** (einmalig ca. 8–10 € pro Gerät, vorher kostenlos mit Wasserzeichen testbar).

### 1. Tablet vorbereiten
1. Optional, aber sauber: Tablet auf Werkseinstellungen zurücksetzen
   (*Einstellungen → Geräteoptionen → Auf Werkseinstellungen zurücksetzen*).
2. Bei der Einrichtung **Ihr** Amazon-Konto verwenden und **kein** Kinderprofil anlegen
   (das Kinderprofil „Amazon Kids“ lässt keine fremden Apps zu).
3. Alle Fire-OS-Updates installieren (*Einstellungen → Geräteoptionen → Systemupdates*).
4. Unnötiges abschalten: Alexa (*Einstellungen → Alexa*), Benachrichtigungen, Bluetooth.

### 2. Fully Kiosk installieren
1. *Einstellungen → Sicherheit & Datenschutz → Apps aus unbekannten Quellen* → für **Silk-Browser** erlauben.
2. Im Silk-Browser `fully-kiosk.com` öffnen, die **APK für Fire-Tablets/Android** herunterladen und installieren.
3. Danach die Freigabe für unbekannte Quellen wieder **ausschalten**.

### 3. Fully einrichten
In Fully: vom linken Rand wischen → *Settings*.
- **Web Content Settings → Start URL:** `http://<IP-des-Servers>:3000`
- **Web Content Settings → URL Whitelist:** `http://<IP-des-Servers>:3000/*`
  (damit kann keine andere Seite geöffnet werden)
- **Web Browsing Settings:** Zurück-Taste/Adressleiste aus, Pull-to-Refresh an
- **Device Management → Keep Screen On:** an (während des Lernens), *Screen Off Timer* nach Wunsch
- **Kiosk Mode (PLUS) → Enable Kiosk Mode:** an, **Kiosk Exit PIN** setzen (nicht dieselbe wie die Eltern-PIN!)
- **Kiosk Mode → Disable Status Bar / Disable Volume Buttons / Disable Power Button (wo verfügbar)** nach Wunsch
- **Web Content Settings → Enable File Uploads** und **Enable Camera Capture Uploads** (o. ä.): **an** –
  nötig für die Schreibrunde (Foto vom Blatt). Fire OS fragt beim ersten Foto nach der Kamera-Berechtigung: erlauben.
- Fully fragt beim Aktivieren nach Berechtigungen (z. B. „Über anderen Apps anzeigen“, Bedienungshilfe) – zustimmen.

Fully holt sich danach sofort den Vordergrund zurück, wenn jemand die Home-Taste drückt.
Verlassen kann man den Kiosk nur mit Wischgeste + Kiosk-PIN.

### 4. Fire-OS-Kindersicherung als zweite Sperre
*Einstellungen → Kindersicherung* einschalten (Passwort vergeben) und sperren:
Webbrowser (Silk), Amazon-Stores, Prime Video, E-Mail/Kontakte/Kalender, soziale Netzwerke.
**Die Kamera nicht sperren** – sie wird für die Schreibrunde gebraucht. Die Kamera-App selbst ist aus dem Kiosk heraus
nicht erreichbar; Fully öffnet sie nur kurz für das Foto.
Damit ist auch dann nichts zu holen, wenn der Kiosk einmal verlassen würde.

### 5. Für Fortgeschrittene: Geräteadministrator (komplett dicht)
Fully kann als *Device Owner* eingerichtet werden, dann sind Home-/Übersichtstaste vollständig blockiert.
Das geht laut Fully-Dokumentation nur auf einem frisch zurückgesetzten Gerät **ohne angemeldetes Konto** per ADB:

```bash
adb shell dpm set-device-owner de.ozerov.fully/.DeviceOwnerReceiver
```

Das ist für die meisten Familien nicht nötig – Schritt 3 und 4 reichen in der Praxis.

---

## Weg B – Amazon-Kids-Profil mit nur einer erlaubten Webseite (ohne Zusatz-App)

1. Kinderprofil anlegen bzw. öffnen: *Einstellungen → Profile & Familienbibliothek*.
2. Im Eltern-Dashboard (Zahnrad im Kinderprofil oder `parents.amazon.com`):
   - **Amazon Kids+ Inhalte** ausblenden bzw. Abo nicht nutzen,
   - **Web-Browser** erlauben, aber *Webinhalte automatisch zulassen* **ausschalten**,
   - unter *Inhalte hinzufügen → Websites* die Adresse `http://<IP-des-Servers>:3000` hinzufügen.
3. Alle anderen Apps/Bücher/Videos aus dem Profil entfernen.

Hinweis: Ob der Amazon-Kids-Browser Fotos für die Schreibrunde hochladen kann, ist nicht sicher. Dann bleibt nur Weg A.

Einschränkungen: Der Kids-Browser zeigt eine eigene Leiste, das Profil kann man über das Eltern-Passwort verlassen,
und je nach Fire-OS-Version werden Adressen im Heimnetz (192.168.…) nicht als Website akzeptiert.
Funktioniert es nicht: Weg A nehmen.

---

## Alternative: Schul-iPad

Das Portal läuft auch auf dem iPad (Safari, Kamera für die Schreibrunde funktioniert). Sperren lässt es sich mit
**Geführter Zugriff** (*Einstellungen → Bedienungshilfen → Geführter Zugriff*): Portal in Safari öffnen,
dreimal die Seitentaste (bzw. Home-Taste) drücken, Code festlegen – dann kommt man ohne Code nicht aus Safari heraus.

Nachteile gegenüber dem Fire-Tablet:
- Der Geführte Zugriff muss **vor jeder Lernzeit neu gestartet** werden – und das Gerät ist sonst voll mit Schul-Apps und Ablenkung.
- Schul-iPads werden meist von der Schule verwaltet (MDM). Ob Geführter Zugriff erlaubt ist und ob private Apps/Webseiten
  im Heimnetz genutzt werden dürfen, entscheidet die Schule – vorher fragen.

Empfehlung: Fire-Tablet als festes Lerngerät; das iPad nur als Notlösung.

## Tipps für den Alltag

- **Feste Lernzeit:** Im Eltern-Bereich unter *Einstellungen* Lerntage, Uhrzeit und Dauer festlegen.
- **Ort:** Das Tablet hat einen festen Platz (Schreibtisch, nicht Bett). Handy während der Lernzeit in einen anderen Raum.
- **Laden:** Ladegerät am Lernplatz – Fully kann den Bildschirm bei Ladekabel automatisch anschalten.
- **Kontrolle ohne Kontrolle:** Die Übersicht im Eltern-Bereich können Sie auf Ihrem Handy unter derselben Adresse öffnen
  – dafür müssen Sie nicht am Tablet stehen.
