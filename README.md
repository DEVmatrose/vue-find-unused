# find-unused.mjs - Analyse ungenutzter Dateien in Vue.js-Projekten

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Ein leistungsstarkes Tool zur statischen Codeanalyse, das ungenutzte Dateien in modernen Vue.js-Projekten identifiziert. Optimiert für Vue 3, Vite, Tailwind CSS und Pinia.

## Übersicht

`find-unused.mjs` durchsucht dein Projekt nach Dateien, die nirgendwo importiert oder verwendet werden, und hilft dir dabei, deinen Codebase aufzuräumen. Das Tool berücksichtigt alle modernen Import-Arten, Vue-Komponenten-Registrierungen und projektspezifische Patterns.

## Funktionen

- **Umfassende Import-Erkennung**:
  - Statische Imports (`import x from 'y'`)
  - Dynamische Imports (`() => import('...')`)
  - Bare Imports (`import 'style.css'`)
  - Vue Router-Komponenten (`component: MyComponent` oder `component: () => import('...')`)
  - Globale Komponenten-Registrierungen (`app.component('Name', Component)`)
  - Pinia Store-Nutzung (`useXxxStore()`)

- **Vue.js-Optimiert**:
  - Erkennt Vue Single File Components (.vue)
  - Analysiert Template-Tags auf Komponenten-Nutzung
  - Unterstützt sowohl PascalCase als auch kebab-case Komponenten
  - Berücksichtigt Vue-Router Patterns

- **Moderne Tooling-Unterstützung**:
  - Vite-Konfiguration und -Konventionen 
  - Pinia Stores
  - Tailwind CSS-Dateien
  - TypeScript-Unterstützung

- **Intelligente Analyse**:
  - Konfigurationsdateien werden automatisch als genutzt markiert
  - Implizit genutzte Verzeichnisse werden erkannt
  - Plattformspezifische Dateien werden berücksichtigt
  - Skriptanalyse für npm-Skripte in package.json

## Installation

```bash
# Klonen aus dem Repository
git clone https://github.com/DEVmatrose/vue-find-unused.git

# Ins Projektverzeichnis wechseln
cd vue-find-unused

# Optional: Als Paket installieren
npm install -g .
```

## Verwendung

```bash
# Lokale Ausführung im Vue-Projekt
node path/to/find-unused.mjs

# Oder wenn global installiert
vue-find-unused
```

### Beispiel-Ausgabe

```
=== Potenziell ungenutzte Dateien in src/ ===

COMPONENTS (10):
- src/components/admin/AdminUsers.vue
- src/components/dashboard/messages/MessageTable.vue
...

VIEWS (1):
- src/views/AdminView.vue

SERVICES (4):
- src/services/logService.ts
...

=== Statistik ===
Gesamt Dateien: 118
Referenzierte Dateien: 102
Ungenutzte Dateien in src/: 16
Ungenutzte Dateien außerhalb von src/: 0
Einstiegspunkte: 8
```

## Konfiguration

Die Standardeinstellungen sind für moderne Vue 3-Projekte optimiert, können aber leicht angepasst werden:

```javascript
// Zu analysierende Dateiendungen
const FILE_EXTENSIONS = ['.vue', '.js', '.ts', '.mjs', '.json', '.sql', '.html', '.css'];

// Einstiegspunkte, die immer als "genutzt" gelten
const ENTRY_POINTS = [
  'src/main.ts', 'src/main.js', 'src/App.vue', 
  'vite.config.ts', 'tailwind.config.js',
  // ...
];

// Standardmäßig ausgeschlossene Verzeichnisse
const EXCLUDED_DIRS = ['node_modules', 'dist', '.git', '.vscode', 'public'];

// Implizit genutzte Verzeichnisse
const IMPLICITLY_USED_DIRECTORIES = ['src/assets', 'src/locales', 'src/styles'];

// Aliase für Import-Pfade (z.B. @/components → src/components)
const ALIASES = { '@': 'src' };
```

## Tipps zur Verwendung der Ergebnisse

1. **Überprüfe die ungenutzten Dateien manuell** bevor du sie entfernst, da das Tool nicht alle möglichen dynamischen Import-Patterns erkennen kann.

2. **Komponenten**: Ungenutzte Komponenten sind oft:
   - Experimentelle Komponenten, die nie in Produktion gingen
   - Duplizierte oder umbenannte Komponenten (z.B. `ProjectDetail.vue` und `ProjectDetail1.vue`)
   - Veraltete Komponenten, die durch neuere ersetzt wurden

3. **Services**: Ungenutzte Services sind typischerweise:
   - Alternative Implementierungen
   - Veraltete APIs oder Clients
   - Hilfsdateien für Entwicklungszwecke

4. **Die Kategorie "OTHER"** enthält oft:
   - Testdaten (JSON)
   - Veraltete Konfigurationsdateien
   - Test-Dateien, die nicht mehr genutzt werden

## Bekannte Limitierungen

- Kann komplexe dynamische Imports mit Variablen übersehen (`import(path + componentName)`)
- Erkennt keine Komponenten, die ausschließlich dynamisch mit `resolveComponent` oder `markRaw` verwendet werden
- Kann bei ungewöhnlichen Projekt-Strukturen angepasst werden müssen
- Erkennt keine Komponenten, die ausschließlich über `provide`/`inject` weitergegeben werden

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz - siehe [LICENSE](LICENSE) für Details.