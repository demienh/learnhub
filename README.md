# Persönlicher Study Space

Eine lokale Lern-App auf React, TypeScript und Vite. Verwalte mehrere Fächer und importiere belegte Lernkarten und Quizfragen aus einem versionierten JSON-Paket, das außerhalb der App erstellt wurde. Es gibt keine KI-Anbindung, Benutzerkonten, Cloud-Synchronisierung, PDF-Verarbeitung oder Netzwerk-Uploads.

## Lerninhalte und Quellen

Es werden keine Fragen, Antworten, Zusammenfassungen oder Beispiele erzeugt. Ein neues Fach bleibt absichtlich leer, bis du ein extern erstelltes JSON-Lernpaket importiert hast. Die Quellenangaben (Dateiname und Seite) stammen aus dem importierten Paket. Die App lädt keine PDFs hoch, speichert oder analysiert sie nicht und führt keine OCR aus.

Die bestehende Datei `src/content/fragen.json` enthält nur markierte ABWL-Platzhalter. Die erwartete `materials/ABWL.pdf` ist im Repository nicht vorhanden. Deshalb wurden keine ABWL-Inhalte oder bestätigten Folienverweise ergänzt. Der bisherige ABWL-Lernstand wird beim ersten Start in das Fach „ABWL“ migriert; die bestehenden Daten bleiben pro Fach getrennt gespeichert.

## Navigation und Lernen

Die sechs Hauptbereiche sind **Übersicht**, **Lernen**, **Wiederholen**, **Prüfung**, **Inhalte** und **Fortschritt**. Lernmodi und Sitzungsplanung, fällige/überfällige Wiederholungen und Fehlerliste sowie Lernverlauf sind als Unteransichten gruppiert. Eine optionale gemischte Sitzung priorisiert fällige Fragen und kann bereits gelernte Fragen nach Kapitel/Abschnitt einstreuen.

Vor einer Antwort kann die Sicherheit optional eingeschätzt werden. Eine niedrige Sicherheit verkürzt den nächsten Abstand auf einen Tag. Quizfeedback zeigt die belegte richtige Antwort und eine Erklärung nur, falls sie im importierten Inhalt vorhanden ist. Bei Lernkarten kann eine eigene Erklärung eingegeben und anschließend mit der Musterantwort verglichen werden; sie wird weder automatisch bewertet noch gespeichert.

## Externe Lernpakete

Das JSON-Schema liegt unter [`schemas/study-space-content.schema.json`](./schemas/study-space-content.schema.json). Format und Version sind `study-space-content`, Version `1`. Das Paket enthält:

- optionale `courseId`, die mit dem gerade ausgewählten Fach übereinstimmen muss
- `chapters` mit stabilen IDs, Titeln und optionalen `sections`
- `items` mit eindeutigen IDs, `kind` (`flashcard` oder `quiz`), Frage/Lernziel und Kapitelzuordnung
- Lernkarten mit `answer`; Quizfragen mit mindestens zwei `options` und `correctOption` als nullbasiertem Index
- optional `explanation`, `shortExplanation`, `keyTerms`, `examples`, `questionType` und `uncertain`
- `source` mit positiver ganzzahliger `page` und entweder einer `materialId`, die auf erhaltene ältere Material-Metadaten im Fach verweist, oder einem extern angegebenen `fileName`

Vor dem Speichern prüft die App das gesamte Paket einschließlich Fachzuordnung, IDs, Kapitel-/Abschnittsverweisen, Antwortoptionen und Seitenangaben. Das JSON-Schema beschreibt die statische Paketform und wird in den Tests mit Ajv (Draft 2020-12) gegen gültige und ungültige Fixtures geprüft; Ajv wird nicht zur Laufzeit ausgeliefert. Fachkontextabhängige Referenzen, eindeutige IDs und ob `correctOption` innerhalb der konkreten Optionsliste liegt, prüft zusätzlich der Runtime-Validator, weil diese Regeln Paketinhalt oder ausgewähltes Fach kennen müssen. Eine unbekannte Version scheitert an beiden Validierungsebenen. Du siehst eine Vorschau mit Anzahl, Inhaltstypen und den im Paket angegebenen Quellen und musst den Import ausdrücklich bestätigen. Datei-/Seitenverweise erfordern keinen lokalen PDF-Upload und belegen nicht, dass die App die Datei geprüft hat. Kapitel-IDs sind die Zuordnungsgrundlage; beim Zusammenführen werden kollidierende IDs automatisch eindeutig gemacht. Kapitelnummer und Titel dienen nur der Anzeige. Ungültige Pakete oder ID-Konflikte ändern keine Inhalte. Eine kurze technische Feldbeschreibung und die Implementierung befinden sich in `src/studySpace.ts`.

## Fächer, Lernstand und Sicherungen

Jedes Fach hat eigene Kapitel, Lerninhalte und einen unabhängigen Lernstand. Bestehende ältere Material-Metadaten werden aus Kompatibilitätsgründen in Fachobjekten und Sicherungen erhalten. Fächer lassen sich anlegen, umbenennen, archivieren und nach einer Bestätigung löschen. Gleichlautende Fragen-IDs verschiedener Fächer kollidieren dadurch nicht. Der frühere ABWL-Schlüssel `abwl-lernraum-fortschritt-v1` wird in das ABWL-Fach migriert und erst entfernt, nachdem der neue Study-Space-Datensatz erfolgreich gespeichert wurde.

Eine Study-Space-Sicherung aus dem Übersichtsbildschirm umfasst Fächer, erhaltene ältere Material-Metadaten, Lerninhalte und Lernstände. PDF-Binärdateien sind nicht enthalten. Bereits früher von einer Projektversion in IndexedDB gespeicherte PDFs werden durch diese Version nicht gelesen, verändert oder gelöscht. Auch beim Löschen eines Fachs bleiben solche früheren Blobs unangetastet; diese App-Version bietet keine PDF-Verwaltung mehr. Beim Sicherungsimport werden ausschließlich neue Fach-IDs hinzugefügt; vorhandene Fächer werden nie still überschrieben.

Die Lernfunktionen umfassen aktives Erinnern, Lernkarten, Quiz, Fehlerliste, Wiederholungsplanung, kurze Lernsitzungen, Prüfungssimulationen, Notizen, Lesezeichen, Tagesziel, Verlauf, Suche und Tastaturkürzel. Leere Lernansichten sind beabsichtigt. Prüfungen ändern weder Wiederholungspläne noch Beherrschungsstatus.

Die Fortschrittsansicht hebt fällige Wiederholungen sowie Kapitel mit markierten, wiederholt in Lernsitzungen verfehlten oder zuletzt mit hoher Sicherheit falsch beantworteten Inhalten hervor. Prüfungssimulationen zählen nicht als wiederholte Lernfehler. Beherrschung erfordert weiterhin mindestens zwei sichere Wiederholungen; kleine Kapitelstände werden als konkrete Zähler statt als Prozentdiagnose dargestellt. Der bestehende feste Wiederholungsplan und gespeicherte Verläufe bleiben unverändert.

Der Lernstand und die Study-Space-Metadaten bleiben im `localStorage` des aktuellen Browsers. Lernpakete sind beim Einlesen auf 1 MB, Sicherungsdateien auf 20 MB begrenzt. Bereits gespeicherte Study Spaces werden nicht durch ein app-eigenes Gesamtgrößenlimit unänderbar: Änderungen werden zuerst im Browser gespeichert und erst danach als übernommen angezeigt. Lehnt der Browser den Schreibvorgang ab, bleibt der vorherige sichtbare und gespeicherte Stand erhalten; die Fehlermeldung empfiehlt, eine Sicherung zu exportieren und den verfügbaren Speicher zu prüfen. Browserdaten, privates Surfen oder das Löschen von Website-Daten können Daten entfernen; exportiere regelmäßig eine Study-Space-Sicherung. Es wird nichts an einen Server gesendet.

## Voraussetzungen und Start

- Node.js und npm
- die im Projekt enthaltenen React-, Vite- und TypeScript-Abhängigkeiten

```sh
npm install
npm run dev
```

Öffne anschließend die von Vite angezeigte lokale Adresse. Prüfungen:

```sh
npm test
npm run build
```
