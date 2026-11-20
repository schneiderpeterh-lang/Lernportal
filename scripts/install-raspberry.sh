#!/usr/bin/env bash
# Richtet das Lernportal auf einem Raspberry Pi (Raspberry Pi OS) oder einem anderen Debian/Ubuntu-Rechner ein:
#   - installiert Node.js 22, falls nötig
#   - installiert das Paket für die KI-Prüfung (npm install)
#   - legt einen Dienst an, der das Lernportal beim Einschalten automatisch startet
#
# Aufruf (im Lernportal-Ordner):   bash scripts/install-raspberry.sh
# Danach:                          sudo systemctl status lernportal
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_USER="$(id -un)"
ENV_FILE=/etc/lernportal.env
SERVICE=/etc/systemd/system/lernportal.service

echo "Lernportal-Ordner: $APP_DIR"
echo "Läuft als Benutzer: $RUN_USER"

# 1. Node.js (mindestens Version 18)
NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
fi
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Installiere Node.js 22 …"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node.js: $(node --version)"

# 2. Paket für die KI-Prüfung der Schreibrunden
cd "$APP_DIR"
npm install --omit=dev

# 3. Einstellungen (nur beim ersten Mal anlegen; nur für root lesbar, weil hier der API-Schlüssel stehen kann)
if [ ! -f "$ENV_FILE" ]; then
  sudo tee "$ENV_FILE" >/dev/null <<'EOF'
PORT=3000
TZ=Europe/Berlin
# Für die KI-Prüfung der Schreibrunden: Schlüssel eintragen, Raute entfernen, dann
#   sudo systemctl restart lernportal
# ANTHROPIC_API_KEY=sk-ant-...
EOF
  sudo chmod 600 "$ENV_FILE"
  echo "Einstellungen angelegt: $ENV_FILE"
fi

# 4. Dienst für den automatischen Start
sudo tee "$SERVICE" >/dev/null <<EOF
[Unit]
Description=Lernportal
After=network-online.target
Wants=network-online.target

[Service]
User=$RUN_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now lernportal
sleep 2

IP="$(hostname -I | awk '{print $1}')"
echo
echo "Fertig. Das Lernportal startet ab jetzt automatisch."
echo "Adresse für Tablet und Handy:  http://$IP:3000"
echo "Tipp: In der FRITZ!Box diesem Gerät immer die gleiche IP-Adresse geben."
