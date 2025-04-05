# find-unused.mjs: Analyse und Erkennung ungenutzter Dateien in Vue.js-Projekten

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

### Ausführung

```bash
node find-unused.mjs
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

## Schlussbemerkung

`find-unused.mjs` bietet einen wissenschaftlich fundierten Ansatz zur Optimierung von Vue.js-Projekten durch statische Codeanalyse. Es ermöglicht Entwicklungsteams, die Codebasis effizient zu bereinigen und technische Schulden abzubauen.

## Lizenz

MIT