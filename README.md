# UV-K1 Web CHIRP · F4HWN v6.3.0

Vollständig clientseitige Webapp zum Verwalten von Quansheng **UV-K1 / UV-K5 V3** mit der **F4HWN-Firmware**. Keine Cloud, kein Konto, kein Backend, keine Telemetrie. Gebaut aus den im November 2026 bereitgestellten Originalquellen `chirp-20261030` und `f4hwn.chirp.v6.3.0` (Treiberstand 22.10.2026). Die CHIRP-Python-WX-Oberfläche wurde **nicht** als solche nach WebAssembly übersetzt; stattdessen enthält die App eine direkte JavaScript-Portierung von F4HWNs EEPROM-Binärformat und USB-Seriell-Protokoll. Der kleine CRC/XOR-Protokollkern liegt als C-Code vor und ist für **Emscripten** vorbereitet. Die veröffentlichte `.wasm`-Datei wurde mangels `emcc` in dieser Buildumgebung mit Clang/LLVM erzeugt; `./scripts/build-wasm.sh` baut sie mit echtem Emscripten neu.

## Funktionen

- **1024 Speicherkanäle**: Empfangsfrequenz (10-Hz-Raster), Offset, Duplex, FM/NFM/AM/NAM/USB, Leistung, Name, CTCSS/DCS (TX und RX), Schrittraster, TX-Lockout, Busy-Channel-Lockout, PTT-ID und Compander.
- **14 VFO-Speicher** für beide VFOs der sieben Frequenzbänder.
- **24 Scanlisten** mit Namen, Kanalzuordnung, MIX-Maske und Prioritätskanälen.
- F4HWN-Menüoptionen und allgemeine Einstellungen, die bekannt und sicher im Speicherbild abgebildet sind.
- **48 UKW-Sender** sowie CSV-Import/Export (eigenes beschriftetes CSV-Format) und binäre `.img`-Dateien.
- Serielle Verbindung via **Web Serial bei 38400 8N1**: originalgetreue `hello`, EEPROM-Read (`0x1b05`), EEPROM-Write (`0x1d05`), XOR-Obfuscation, CRC16/XMODEM, Antwortprüfung und Geräteneustart.
- Keine EEPROM-Initialisierung aus Vermutungen: binäre Änderungen erfolgen nur anhand eines **vollständig geladenen Images**. Vor dem Schreiben wird eine lokale IMG-Sicherung verlangt. Upload umfasst nur den F4HWN-Konfigurationsbereich `[0, 0xA178)` – **keine Kalibrierungsregion**.

## GitHub Pages

Das Repository enthält eine direkt auf GitHub Pages ladbare `index.html`, sowie die gzip-gepackten offenen Browserquellen `site.json.gz` und `wasm/codec.wasm`. Die Dateien werden statisch ausgeliefert und im Browser ausgeführt. Unter **Settings → Pages → Build and deployment** die Quelle **Deploy from a branch**, Branch **main**, Ordner **/(root)** aktivieren. Anschließend:

https://de8msh.github.io/uvk1_web_chirp_f4hwn/

Mit Chrome oder Chromium über HTTPS aufrufen; die Web Serial API wird nicht in allen Browsern unterstützt. Unter Linux muss der Benutzer Zugriff auf den seriellen Port haben, beispielsweise `/dev/ttyUSB0` oder `/dev/ttyACM0`. Für ältere Quansheng-Modelle ist in der Regel ein 2-Pin-UART-Programmierkabel erforderlich. Ein normales USB-C-Ladekabel ist nicht automatisch kompatibel. Das UV-K1 muss **im normalen Betriebsmodus** eingeschaltet sein (nicht im Firmware-Flash-Modus).

## Wartung & Tests

Die ausgepackten Dateien `f4hwn.js`, `app.js` und `index.html` sind der editierbare Quellcode. `python3 scripts/make-site.py` erzeugt `site.json.gz` und `site.bundle.mjs`. `node tests/test.mjs` testet EEPROM-Roundtrips sowie CRC/XOR und das tatsächlich mitgelieferte WASM. `bash scripts/build-wasm.sh` erzeugt die WebAssembly-Datei mit `emcc` (installiertes und aktiviertes Emscripten nötig). Für Linux Mint 22: `bash PRUEFEN.sh` prüft das Projekt und `bash BAUEN.sh` baut bei installiertem `emcc` neu.

## Grenzen und Risiken

**Nicht** 100 % CHIRP: Nur das F4HWN-Gerätemodell wird unterstützt, nicht die über 1000 anderen CHIRP-Treiber. Nicht alle F4HWN-Optionen (z. B. komplexe DTMF-Einstellungen, Kalibrierung und Experten-/Unlock-Felder) haben hier einen GUI-Editor. Eine Kollision zwischen eingebautem F4HWN und einem anderen Firmware-Stand ist möglich. Der physische Funkgerätetest war beim Erstellen nicht möglich – vor einem ersten Schreibversuch mit einer Sicherungsdatei und dem echten Gerät prüfen.

### Rechte

Der ursprüngliche F4HWN-Treiber stammt aus Arbeiten von sq5bpf/Jacek Lipkowski, EGZUMER, JOC2 und F4HWN (laut Quellkopf). Die Portierung ist als derivative Arbeit unter **GPL-2.0-or-later** veröffentlicht. CHIRP ist ein eigenes Projekt; dieses Repository ist keine offizielle CHIRP-Webversion.
