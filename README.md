# find-unused.mjs: Analyse und Erkennung ungenutzter Dateien in Vue.js-Projekten

[![npm version](https://img.shields.io/npm/v/vue-find-unused.svg)](https://www.npmjs.com/package/vue-find-unused)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/DEVmatrose/vue-find-unused/actions/workflows/node.js.yml/badge.svg)](https://github.com/DEVmatrose/vue-find-unused/actions/workflows/node.js.yml)

## Übersicht

Das Skript `find-unused.mjs` ist ein spezialisiertes Analyse-Tool zur statischen Codeanalyse, das ungenutzte Dateien in Vue.js-Projekten identifiziert. Es führt eine umfassende Untersuchung der Importabhängigkeiten und Komponentenreferenzen durch, um nicht verwendete Code-Artefakte zu erkennen.

## Wissenschaftlicher Hintergrund

### Problemkontext

Große Frontend-Projekte wie Vue.js-Anwendungen wachsen mit zunehmender Lebensdauer und durchlaufen zahlreiche Refaktorierungen. Dies führt häufig zu "Code-Erosion" - einem Zustand, bei dem veraltete oder ungenutzte Ressourcen im Codebase verbleiben. Diese Ressourcen:

- Erhöhen die kognitive Last für Entwickler
- Vergrößern den Build-Output unnötig
- Erschweren die Wartbarkeit des Projekts
- Können potenzielle Sicherheitsrisiken darstellen

Die statische Analyse von Dateireferenzen bietet einen methodischen Ansatz zur Identifizierung solcher ungenutzten Artefakte.

### Methodischer Ansatz

Das Skript verwendet einen graphenbasierten Abhängigkeitsanalysealgorithmus, der einen gerichteten Graphen der Dateiabhängigkeiten erstellt. Dateien, die nicht vom Wurzelknoten (Einstiegspunkte) erreichbar sind, werden als ungenutzt identifiziert. Der Algorithmus berücksichtigt:

1. **Statische Analyse**: Identifikation expliziter textueller Referenzen
2. **Pattern-Matching**: Erkennung von Vue-Komponenten in Templates
3. **Pfadauflösung**: Transformation von relativen, absoluten und Alias-Pfaden
4. **Projektkonventionen**: Berücksichtigung von Standard-Namenskonventionen und Dateisystemstrukturen

## Funktionen

- **Umfassende Import-Erkennung**:
  - Statische Imports (`import foo from 'bar'`)
  - Dynamische Imports (`import('path/to/component')`) 
  - Bare Imports (`import 'package'`)

- **Vue-spezifische Analysen**:
  - Erkennung von Template-Komponenten in `.vue` Dateien (sowohl PascalCase als auch kebab-case)
  - Unterstützung für index-Dateien (`index.vue`, `index.ts`, etc.)
  - Berücksichtigung globaler Komponenten

- **Projektstruktur-Optimierung**:
  - Auflösung von Alias-Pfaden (`@/components` → `src/components`)
  - Automatisches Mapping zwischen verschiedenen Schreibweisen (kebab-case ↔ PascalCase)
  - Unterstützung für beliebige Komponenten-Hierarchien

- **Kategorisierte Ergebnisse**:
  - Gruppierung nach logischen Verzeichnistypen (components, views, utils, etc.)
  - Detaillierte Statistiken zur Codebase

## Technische Implementierung

Das Skript nutzt einen mehrstufigen Analyseprozess:

### 1. Datei-Sammlung

```javascript
async function getAllFiles(dir) {
  // Rekursive Traversierung des Dateisystems
  // ...
}
```

Durchsucht rekursiv das Quellverzeichnis und sammelt alle relevanten Dateien anhand ihrer Dateiendungen.

### 2. Referenz-Extraktion

```javascript
async function findReferences(filePath) {
  // Muster-basierte Analyse des Dateiinhalts
  // ...
}
```

Verwendet mehrere reguläre Ausdrücke, um verschiedene Arten von Referenzen in jeder Datei zu identifizieren:

- Statische Import-Anweisungen
- Dynamische Import-Aufrufe
- Vue-Komponenten-Tags in Templates

### 3. Pfadauflösung

```javascript
function resolveReference(ref, basePath, allFiles) {
  // Auflösung der extrahierten Referenzen zu tatsächlichen Dateipfaden
  // ...
}
```

Ein komplexer Auflösungsalgorithmus, der:

- Globale Komponenten berücksichtigt
- Alias-Pfade auflöst
- Dateiendungen hinzufügt
- Verschiedene Namenskonventionen abgleicht
- Index-Dateien unterstützt

### 4. Abhängigkeitsanalyse

```javascript
async function findUnusedFiles() {
  // Erstellung des Abhängigkeitsgraphen und Identifikation unerreichbarer Knoten
  // ...
}
```

Konstruiert einen Abhängigkeitsgraphen, markiert alle erreichbaren Dateien von den Einstiegspunkten aus und identifiziert die nicht erreichbaren als ungenutzt.

## Konfiguration

Das Skript bietet umfangreiche Konfigurationsmöglichkeiten:

```javascript
// Basisverzeichnisse
const ROOT_DIR = process.cwd();
const SOURCE_DIR = join(ROOT_DIR, 'src');

// Dateifilterung
const FILE_EXTENSIONS = ['.vue', '.js', '.ts', '.mjs'];

// Einstiegspunkte
const ENTRY_POINTS = [
  'main.ts',
  'main.js',
  'App.vue',
  'router/index.ts',
  'router/index.js'
];

// Komponentenverzeichnisse
const COMPONENT_DIRS = ['components', 'views', 'layouts'];

// Pfad-Aliase
const ALIASES = {
  '@': 'src',
  // Weitere Aliase...
};

// Globale Komponenten
const GLOBAL_COMPONENTS = ['Button', 'Card'];
```

## Anwendung

### Voraussetzungen

- Node.js (empfohlen: v14.0.0 oder höher)
- Vue.js-Projekt mit standardisierter Verzeichnisstruktur
- Ausführung aus dem Projektstamm (neben dem `src/`-Verzeichnis)

### Installation

#### Lokale Installation im Projekt

```bash
npm install --save-dev vue-find-unused
```

Dann kannst du das Tool in deinen npm-Scripts verwenden:

```json
"scripts": {
  "find-unused": "vue-find-unused"
}
```

#### Globale Installation

```bash
npm install -g vue-find-unused
```

Nach der globalen Installation kannst du das Tool direkt von der Kommandozeile aufrufen:

```bash
vue-find-unused
```

### Ausführung

Wenn lokal installiert:
```bash
npx vue-find-unused
```

Oder direkt mit Node.js:
```bash
node node_modules/vue-find-unused/find-unused.mjs
```

Bei globaler Installation einfach:
```bash
vue-find-unused
```

### Ausgabebeispiel

```
=== Potenziell ungenutzte Dateien ===

COMPONENTS (12):
- components/admin/AdminUsers.vue
- components/dashboard/messages/MessageTable.vue
...

VIEWS (1):
- views/AdminView.vue

=== Statistik ===
Gesamt Dateien: 110
Referenzierte Dateien: 88
Ungenutzte Dateien: 22
Einstiegspunkte: 3
```

![Beispiel-Ausgabe](https://raw.githubusercontent.com/DEVmatrose/vue-find-unused/main/docs/images/screenshot.png)
*Beispielhafte Darstellung der Konsolenausgabe*

## Wissenschaftliche Genauigkeit und Einschränkungen

### Precision und Recall

- **Precision**: Die Wahrscheinlichkeit, dass eine als ungenutzt identifizierte Datei tatsächlich ungenutzt ist.
- **Recall**: Die Wahrscheinlichkeit, dass eine tatsächlich ungenutzte Datei als solche erkannt wird.

Das Skript wurde optimiert, um eine hohe Precision zu erreichen, kann jedoch durch folgende Faktoren beeinträchtigt werden:

### Potenzielle False Positives

- Komponenten, die dynamisch über Strings oder Variablen geladen werden
- Komplexe Meta-Programmierung oder Codegenerierung
- Imports in nicht-standardkonformen Formaten

### Potenzielle False Negatives

- Dateien, die zwar importiert, aber niemals verwendet werden
- Komponenten mit identischen Namen in verschiedenen Verzeichnissen
- Temporäre oder generierte Dateien

## Weiterentwicklungspotenzial

- **Dynamische Analysen**: Integration mit Laufzeitinformationen
- **Automatische Code-Bereinigung**: Entfernung ungenutzter Dateien mit Sicherungsoption
- **IDE-Integration**: Visual Studio Code Extension oder WebStorm Plugin
- **Continuous Integration**: Automatische Überprüfung als Teil des CI/CD-Prozesses
- **Erweiterte Heuristiken**: Verbesserte Komponenten-Erkennung und Pfadauflösung

## CLI-Verwendung

Das Tool ist als Befehlszeilen-Interface (CLI) verfügbar und kann mit verschiedenen Optionen verwendet werden.

```bash
Usage: vue-find-unused [options]

Options:
  -d, --dir <directory>    Das Quellverzeichnis (Standard: src/)
  -e, --ext <extensions>   Dateiendungen (Komma-getrennt, Standard: vue,js,ts,mjs)
  -v, --verbose            Ausführliche Ausgabe aktivieren
  -o, --output <file>      Ausgabe in eine Datei schreiben
  -h, --help               Zeigt diese Hilfe an
```

### Beispiele

```bash
# Standard-Analyse im aktuellen Verzeichnis
vue-find-unused

# Analyse eines spezifischen Verzeichnisses
vue-find-unused --dir lib/components

# Nur bestimmte Dateiendungen analysieren
vue-find-unused --ext vue,ts

# Ausführliche Ausgabe in eine Datei schreiben
vue-find-unused --verbose --output unused-report.txt
```

Diese CLI-Optionen sind noch nicht implementiert, zeigen aber die geplante Erweiterung des Tools.

## Schlussbemerkung

`find-unused.mjs` bietet einen wissenschaftlich fundierten Ansatz zur Optimierung von Vue.js-Projekten durch statische Codeanalyse. Es ermöglicht Entwicklungsteams, die Codebasis effizient zu bereinigen und technische Schulden abzubauen.


## Automatisierte Tests

Dieses Repository verwendet GitHub Actions für kontinuierliche Integration:

- Lint-Prüfung des Codes
- Automatische Tests bei jedem Push und Pull Request
- Automatisierte Veröffentlichung zu npm bei neuen Releases

Die Workflow-Konfiguration findest du in `.github/workflows/node.js.yml`.

## Danksagungen

- Dank an alle Mitwirkenden L;L)M's, die dieses Projekt verbessert haben 
- Besonderer Dank an die Vue.js-Community für ihr Feedback
- Inspiration durch ähnliche Tools wie [unused-webpack-plugin](https://github.com/MatthieuLemoine/unused-webpack-plugin)

## Lizenz

MIT