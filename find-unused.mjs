// find-unused.mjs
import { promises as fs } from 'fs';
import { dirname, join, relative, resolve, extname } from 'path';

// Konfiguration
const ROOT_DIR = process.cwd();
const SOURCE_DIR = ROOT_DIR;
const FILE_EXTENSIONS = ['.vue', '.js', '.ts', '.mjs', '.json', '.sql', '.html', '.css'];
const ENTRY_POINTS = [
  'src/main.ts', 'src/main.js', 'src/App.vue', 'src/router/index.ts', 'src/router/index.js',
  'vite.config.ts', 'tailwind.config.js', 'src/stores/index.ts', 'src/style.css',
  'src/assets/main.css', 'index.html', 'scripts/setup-schema-storage.js'
];
const PLATFORM_SPECIFIC_FILES = ['404.html']; // Für GitHub Pages
const COMPONENT_DIRS = ['src/components', 'src/views', 'src/layouts'];
const ALIASES = { '@': 'src' };
const EXCLUDED_DIRS = ['node_modules', 'dist', '.git', '.vscode', 'public', 'coverage', 'db'];
const EXCLUDED_FILES = [
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.gitignore',
  '.eslintrc.js', '.eslintrc.json', 'postcss.config.js', 'tsconfig.json',
  'README.md', '.env', '.env.local', '.env.development',
  'find-unused.mjs', 'generate-code-file.mjs', 'vitest.config.ts'
];
const IMPLICITLY_USED_DIRECTORIES = ['src/assets', 'src/locales', 'src/styles', 'public'];

function isPiniaStore(filePath, content) {
  if (filePath.includes('/stores/') && (filePath.endsWith('.js') || filePath.endsWith('.ts'))) {
    return content.includes('defineStore') || content.includes('createPinia');
  }
  return false;
}

function isTailwindResource(filePath) {
  return filePath.includes('/assets/css/') || filePath.includes('/assets/tailwind/') ||
         filePath.endsWith('tailwind.css') || filePath.endsWith('main.css') ||
         filePath.endsWith('tailwind.config.js') || filePath.endsWith('tailwind.config.ts');
}

function isConfigFile(filePath) {
  const configFiles = [
    'vite.config.js', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
    'jsconfig.json', '.eslintrc.js', '.eslintrc.json', '.eslintrc', 'postcss.config.js',
    'postcss.config.cjs', 'babel.config.js', 'babel.config.json', 'vue.config.js', 'vue.config.ts'
  ];
  return configFiles.some(cf => filePath.endsWith(cf)) || filePath.endsWith('.d.ts');
}

async function getAllFiles(dir, excludedDirs = [], excludedFiles = []) {
  let files = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = join(dir, item.name);
      const relPath = relative(ROOT_DIR, fullPath);

      if (item.isDirectory() && excludedDirs.some(ex => relPath.startsWith(ex))) continue;
      if (item.isFile() && excludedFiles.includes(item.name)) continue;

      if (item.isDirectory()) {
        files = files.concat(await getAllFiles(fullPath, excludedDirs, excludedFiles));
      } else if (FILE_EXTENSIONS.includes(extname(item.name))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Konnte Verzeichnis ${dir} nicht lesen: ${error.message}`);
  }
  return files;
}

async function findReferences(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const references = new Set();

  const staticImportRegex = /import(?:["'\s]*(?:[\w*${}\n\r\t, ]+)from\s*)?["'\s](.+?)["'\s]/g;
  let match;
  while ((match = staticImportRegex.exec(content)) !== null) references.add(match[1]);
  const bareImportRegex = /import\s+['"](.+?)['"]/g;
  while ((match = bareImportRegex.exec(content)) !== null) references.add(match[1]);
  const dynamicImportRegex = /import\(\s*['"](.+?)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) references.add(match[1]);
  if (filePath.endsWith('.vue')) {
    const templateRegex = /<([a-zA-Z][\w-]*)\b[^>]*\/?>/g;
    while ((match = templateRegex.exec(content)) !== null) references.add(match[1]);
  }
  const viteImportRegex = /['"]\.\.?\/[^'"]*?\.(css|scss|less|svg|png|jpg|jpeg|gif|webp)['"]/g;
  while ((match = viteImportRegex.exec(content)) !== null) references.add(match[0].slice(1, -1));
  const piniaUseStoreRegex = /use(\w+)Store\s*\(/g;
  while ((match = piniaUseStoreRegex.exec(content)) !== null) {
    const storeName = match[1].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    references.add(`@/stores/${storeName}`);
  }
  if (filePath.includes('router') && (filePath.endsWith('.js') || filePath.endsWith('.ts'))) {
    const routeComponentRegex = /component:\s*(?:async\s*\(\)\s*=>\s*)?(?:import\(['"](.*?)['"]\)|(\w+))/g;
    while ((match = routeComponentRegex.exec(content)) !== null) {
      if (match[1]) references.add(match[1]);
      else if (match[2]) references.add(match[2]);
    }
  }
  if (filePath.endsWith('main.ts') || filePath.endsWith('main.js')) {
    const globalComponentRegex = /app\.component\(\s*['"](\w+)['"]/g;
    while ((match = globalComponentRegex.exec(content)) !== null) {
      references.add(match[1]);
    }
  }
  if (filePath.endsWith('.json') || filePath.endsWith('.sql')) {
    const pathRegex = /['"]([^'"\s]+?\.(?:vue|js|ts|mjs|json|sql|html|css))['"]/g;
    while ((match = pathRegex.exec(content)) !== null) references.add(match[1]);
  }
  if (filePath.includes('router') && (filePath.endsWith('.js') || filePath.endsWith('.ts'))) {
    const routeComponentRegex = /component:\s*(?:async\s*\(\)\s*=>\s*)?(?:import\s*\(['"]([^'"]+)['"]\)|(\w+))/g;
    let match;
    while ((match = routeComponentRegex.exec(content)) !== null) {
      if (match[1]) {
        console.log(`Dynamischer Import in ${filePath}: ${match[1]}`); // Debug
        references.add(match[1]);
      } else if (match[2]) {
        console.log(`Statischer Import in ${filePath}: ${match[2]}`); // Debug
        references.add(match[2]);
      }
    }
  }
  return Array.from(references);
}

function resolveReference(ref, basePath, allFiles) {
  let resolvedPath;
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (ref.startsWith(alias)) {
      resolvedPath = resolve(ROOT_DIR, target, ref.replace(`${alias}/`, ''));
      break;
    }
  }
  if (!resolvedPath) resolvedPath = ref.startsWith('.') ? resolve(basePath, ref) : ref;

  if (extname(resolvedPath) && allFiles.includes(resolvedPath)) return resolvedPath;
  for (const ext of FILE_EXTENSIONS) {
    const potentialPath = resolvedPath + ext;
    if (allFiles.includes(potentialPath)) return potentialPath;
  }
  for (const ext of FILE_EXTENSIONS) {
    const indexPath = join(resolvedPath, `index${ext}`);
    if (allFiles.includes(indexPath)) return indexPath;
  }
  if (!ref.startsWith('.') && !ref.startsWith('@')) {
    const componentName = ref.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    for (const dir of COMPONENT_DIRS) {
      const possiblePaths = [
        join(ROOT_DIR, dir, `${componentName}.vue`),
        join(ROOT_DIR, dir, componentName, `${componentName}.vue`)
      ];
      for (const path of possiblePaths) {
        if (allFiles.includes(path)) return path;
      }
    }
  }
  return null;
}

async function findUnusedFiles() {
  try {
    const allFiles = await getAllFiles(SOURCE_DIR, EXCLUDED_DIRS, EXCLUDED_FILES);
    const srcFiles = allFiles.filter(f => f.startsWith(join(ROOT_DIR, 'src')));
    const nonSrcFiles = allFiles.filter(f => !f.startsWith(join(ROOT_DIR, 'src')));

    const usageMap = new Map();
    const implicitlyUsedFiles = new Set();

    // Package.json und Skripte
    const packageJsonPath = join(ROOT_DIR, 'package.json');
    if (allFiles.includes(packageJsonPath)) {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      implicitlyUsedFiles.add(packageJsonPath);
      if (packageJson.scripts) {
        for (const scriptCmd of Object.values(packageJson.scripts)) {
          const scriptMatch = scriptCmd.match(/node\s+([^\s]+)/);
          if (scriptMatch) {
            const scriptPath = resolve(ROOT_DIR, scriptMatch[1]);
            if (allFiles.includes(scriptPath)) {
              implicitlyUsedFiles.add(scriptPath);
            }
          }
        }
      }
    }

    // Plattform-spezifische Dateien (z.B. GitHub Pages)
    PLATFORM_SPECIFIC_FILES.forEach(file => {
      const fullPath = join(ROOT_DIR, file);
      if (allFiles.includes(fullPath)) implicitlyUsedFiles.add(fullPath);
    });

    for (const file of allFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relativePath = relative(ROOT_DIR, file);

      if (
        isConfigFile(relativePath) ||
        isPiniaStore(relativePath, content) ||
        isTailwindResource(relativePath) ||
        IMPLICITLY_USED_DIRECTORIES.some(dir => relativePath.startsWith(dir))
      ) {
        implicitlyUsedFiles.add(file);
      }

      const references = await findReferences(file);
      const resolvedReferences = references
        .map(ref => resolveReference(ref, dirname(file), allFiles))
        .filter(ref => ref !== null);
      usageMap.set(file, resolvedReferences);
    }

    const referencedFiles = new Set();
    for (const [file, references] of usageMap) {
      references.forEach(ref => referencedFiles.add(ref));
    }
    ENTRY_POINTS.forEach(entry => {
      const fullPath = join(ROOT_DIR, entry);
      if (allFiles.includes(fullPath)) referencedFiles.add(fullPath);
    });
    implicitlyUsedFiles.forEach(file => referencedFiles.add(file));

    const unusedSrcFiles = srcFiles.filter(file => !referencedFiles.has(file));
    const unusedNonSrcFiles = nonSrcFiles.filter(file => !referencedFiles.has(file));
    const potentiallyUsedScripts = nonSrcFiles.filter(f => 
      f.startsWith(join(ROOT_DIR, 'scripts')) && usageMap.get(f).length > 0 && !referencedFiles.has(f)
    );

    const srcCategories = {
      components: unusedSrcFiles.filter(f => f.includes('/src/components/')),
      views: unusedSrcFiles.filter(f => f.includes('/src/views/')),
      stores: unusedSrcFiles.filter(f => f.includes('/src/stores/')),
      services: unusedSrcFiles.filter(f => f.includes('/src/services/')),
      utils: unusedSrcFiles.filter(f => f.includes('/src/utils/')),
      types: unusedSrcFiles.filter(f => f.includes('/src/types/')),
      layouts: unusedSrcFiles.filter(f => f.includes('/src/layouts/')),
      other: unusedSrcFiles.filter(f => 
        !f.includes('/src/components/') && 
        !f.includes('/src/views/') && 
        !f.includes('/src/stores/') && 
        !f.includes('/src/services/') && 
        !f.includes('/src/utils/') && 
        !f.includes('/src/types/') && 
        !f.includes('/src/layouts/') &&
        !f.includes('/src/router/')
      )
    };

    console.log('\n=== Potenziell ungenutzte Dateien in src/ ===');
    for (const [category, files] of Object.entries(srcCategories)) {
      if (files.length > 0) {
        console.log(`\n${category.toUpperCase()} (${files.length}):`);
        files.forEach(file => console.log(`- ${relative(ROOT_DIR, file)}`));
      }
    }

    console.log('\n=== Potenziell ungenutzte Dateien außerhalb von src/ ===');
    unusedNonSrcFiles.forEach(file => console.log(`- ${relative(ROOT_DIR, file)}`));

    if (potentiallyUsedScripts.length > 0) {
      console.log('\n=== Skripte mit Referenzen zu anderen Dateien (nicht als Einstiegspunkt) ===');
      potentiallyUsedScripts.forEach(file => console.log(`- ${relative(ROOT_DIR, file)}`));
    }

    console.log('\n=== Statistik ===');
    console.log(`Gesamt Dateien: ${allFiles.length}`);
    console.log(`Referenzierte Dateien: ${referencedFiles.size}`);
    console.log(`Ungenutzte Dateien in src/: ${unusedSrcFiles.length}`);
    console.log(`Ungenutzte Dateien außerhalb von src/: ${unusedNonSrcFiles.length}`);
    console.log(`Einstiegspunkte: ${ENTRY_POINTS.filter(ep => allFiles.includes(join(ROOT_DIR, ep))).length}`);
    console.log('Referenzierte Dateien:', Array.from(referencedFiles).map(f => relative(ROOT_DIR, f)));
  } catch (error) {
    console.error('Fehler:', error);
  }
}

findUnusedFiles();