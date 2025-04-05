// find-unused.mjs
import { promises as fs } from 'fs';
import { dirname, join, relative, resolve, extname, basename } from 'path';

// Konfiguration
const ROOT_DIR = process.cwd();
const SOURCE_DIR = join(ROOT_DIR, 'src');
const FILE_EXTENSIONS = ['.vue', '.js', '.ts', '.mjs'];
const ENTRY_POINTS = [
  'main.ts',
  'main.js',
  'App.vue',
  'router/index.ts',
  'router/index.js'
];
const COMPONENT_DIRS = ['components', 'views', 'layouts']; // Konfigurierbare Verzeichnisse für Template-Komponenten
const ALIASES = {
  '@': 'src', // Standard-Alias für src/
  // Füge weitere hinzu, z.B. '~': 'src', '#': 'types'
};

// Globale UI-Komponenten
const GLOBAL_COMPONENTS = ['Button', 'Card']; 


// Funktion zum Lesen aller Dateien rekursiv
async function getAllFiles(dir) {
  let files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(await getAllFiles(fullPath));
    } else if (FILE_EXTENSIONS.includes(extname(item.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Funktion zum Finden von Imports und Template-Komponenten
async function findReferences(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const references = new Set();

  // Statische Imports
  const staticImportRegex = /import(?:["'\s]*(?:[\w*${}\n\r\t, ]+)from\s*)?["'\s](.+?)["'\s]/g;
  let match;
  while ((match = staticImportRegex.exec(content)) !== null) {
    references.add(match[1]);
  }
  // Bare Imports
  const bareImportRegex = /import\s+['"](.+?)['"]/g;
  while ((match = bareImportRegex.exec(content)) !== null) {
    references.add(match[1]);
  }

  // Dynamische Imports
  const dynamicImportRegex = /import\(\s*['"](.+?)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    references.add(match[1]);
  }

  // Template-Komponenten
  if (filePath.endsWith('.vue')) {
    const templateRegex = /<([a-zA-Z][\w-]*)\b[^>]*\/?>/g;
    while ((match = templateRegex.exec(content)) !== null) {
      references.add(match[1]);
    }
  }

  return Array.from(references);
}

// Funktion zum Auflösen von Referenzen zu tatsächlichen Dateipfaden
function resolveReference(ref, basePath, allFiles) {
  let resolvedPath;

   // Globale Komponenten
   if (GLOBAL_COMPONENTS.includes(ref)) {
    const globalPath = join(SOURCE_DIR, 'components', 'ui', `${ref}.vue`);
    if (allFiles.includes(globalPath)) return globalPath;
  }

  // Alias-Auflösung
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (ref.startsWith(alias)) {
      resolvedPath = resolve(ROOT_DIR, target, ref.replace(`${alias}/`, ''));
      break;
    }
  }

  // Relativer Pfad oder direkter Name
  if (!resolvedPath) {
    resolvedPath = ref.startsWith('.') ? resolve(basePath, ref) : ref;
  }

  // Prüfe direkten Pfad mit vorhandener Endung
  if (extname(resolvedPath) && allFiles.includes(resolvedPath)) {
    return resolvedPath;
  }

  // Versuche Dateiendung hinzuzufügen
  for (const ext of FILE_EXTENSIONS) {
    const potentialPath = resolvedPath + ext;
    if (allFiles.includes(potentialPath)) {
      return potentialPath;
    }
  }

  // Prüfe index.* Dateien
  for (const ext of FILE_EXTENSIONS) {
    const indexPath = join(resolvedPath, `index${ext}`);
    if (allFiles.includes(indexPath)) {
      return indexPath;
    }
  }

  // Für Template-Komponenten: Suche in konfigurierbaren Verzeichnissen
  if (!ref.startsWith('.') && !ref.startsWith('@')) {
    const componentName = ref.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); // kebab-case zu PascalCase
    for (const dir of COMPONENT_DIRS) {
      const possiblePaths = [
        join(SOURCE_DIR, dir, `${componentName}.vue`),
        join(SOURCE_DIR, dir, componentName, `${componentName}.vue`)
      ];
      for (const path of possiblePaths) {
        if (allFiles.includes(path)) {
          return path;
        }
      }
    }
  }

  return null; // Keine Übereinstimmung
}

// Hauptfunktion
async function findUnusedFiles() {
  try {
    // Alle Dateien finden
    const allFiles = await getAllFiles(SOURCE_DIR);
    
    // Map von Datei zu ihren Referenzen erstellen
    const usageMap = new Map();
    for (const file of allFiles) {
      const references = await findReferences(file);
      const resolvedReferences = references
        .map(ref => resolveReference(ref, dirname(file), allFiles))
        .filter(ref => ref !== null);
      usageMap.set(file, resolvedReferences);
    }
    
    // Alle referenzierten Dateien sammeln
    const referencedFiles = new Set();
    for (const [file, references] of usageMap) {
      references.forEach(ref => referencedFiles.add(ref));
    }
    
    // Einstiegspunkte als referenziert markieren
    ENTRY_POINTS.forEach(entry => {
      const fullPath = join(SOURCE_DIR, entry);
      if (allFiles.includes(fullPath)) {
        referencedFiles.add(fullPath);
      }
    });
    
    // Ungenutzte Dateien finden
    const unusedFiles = allFiles.filter(file => !referencedFiles.has(file));
    
    // Ergebnisse nach Kategorie ausgeben
    const categories = {
      components: unusedFiles.filter(f => f.includes('/components/')),
      views: unusedFiles.filter(f => f.includes('/views/')),
      stores: unusedFiles.filter(f => f.includes('/stores/')),
      services: unusedFiles.filter(f => f.includes('/services/')),
      utils: unusedFiles.filter(f => f.includes('/utils/')),
      types: unusedFiles.filter(f => f.includes('/types/')),
      layouts: unusedFiles.filter(f => f.includes('/layouts/')),
      other: unusedFiles.filter(f => 
        !f.includes('/components/') && 
        !f.includes('/views/') && 
        !f.includes('/stores/') && 
        !f.includes('/services/') && 
        !f.includes('/utils/') && 
        !f.includes('/types/') && 
        !f.includes('/layouts/') &&
        !f.includes('/router/')
      )
    };
    
    console.log('\n=== Potenziell ungenutzte Dateien ===');
    for (const [category, files] of Object.entries(categories)) {
      if (files.length > 0) {
        console.log(`\n${category.toUpperCase()} (${files.length}):`);
        files.forEach(file => {
          console.log(`- ${relative(SOURCE_DIR, file)}`);
        });
      }
    }
    
    console.log('\n=== Statistik ===');
    console.log(`Gesamt Dateien: ${allFiles.length}`);
    console.log(`Referenzierte Dateien: ${referencedFiles.size}`);
    console.log(`Ungenutzte Dateien: ${unusedFiles.length}`);
    console.log(`Einstiegspunkte: ${ENTRY_POINTS.filter(ep => allFiles.includes(join(SOURCE_DIR, ep))).length}`);
    console.log('Referenzierte Dateien:', Array.from(referencedFiles).map(f => relative(SOURCE_DIR, f)));
    
  } catch (error) {
    console.error('Fehler:', error);
  }
}

findUnusedFiles();