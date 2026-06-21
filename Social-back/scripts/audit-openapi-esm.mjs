#!/usr/bin/env node
import { readFile, readdir } from 'fs/promises';
import path from 'path';

const root = process.cwd();
const routesDir = path.join(root, 'src', 'routes');
const openapiPath = path.join(root, 'src', 'docs', 'openapi.json');
const serverPath = path.join(root, 'server.js');

function normalizePath(p) {
  if (!p) return p;
  // ensure leading slash
  if (!p.startsWith('/')) p = '/' + p;
  // remove trailing slash unless root
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  // convert Express :params to OpenAPI {param}
  return p.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

async function parseServerMounts() {
  const text = await readFile(serverPath, 'utf8');
  const importRegex = /import\s+(\w+)\s+from\s+['"](\.\/src\/routes\/[^"]+)['"]/g;
  const imports = {};
  let im;
  while ((im = importRegex.exec(text))) {
    imports[im[1]] = im[2];
  }

  const useRegex = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g;
  const mounts = [];
  let mu;
  while ((mu = useRegex.exec(text))) {
    const prefix = mu[1];
    const varName = mu[2];
    mounts.push({ prefix, varName, file: imports[varName] || null });
  }

  return mounts;
}

async function listRouteFiles() {
  try {
    const files = await readdir(routesDir);
    return files.filter(f => f.endsWith('.js')).map(f => path.join('src', 'routes', f));
  } catch (e) {
    return [];
  }
}

async function parseRoutesFromFile(filePath) {
  const absolute = path.join(root, filePath);
  try {
    const src = await readFile(absolute, 'utf8');
    const routes = [];
    const r1 = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]?([^'"`\)]+)['"`]?/g;
    let m;
    while ((m = r1.exec(src))) {
      routes.push({ method: m[1].toUpperCase(), path: m[2] });
    }
    const r2 = /router\.route\s*\(\s*['"`]?([^'"`\)]+)['"`]?\s*\)\s*\.\s*(get|post|put|patch|delete)/g;
    while ((m = r2.exec(src))) {
      routes.push({ method: m[2].toUpperCase(), path: m[1] });
    }
    return { file: filePath, routes };
  } catch (e) {
    return { file: filePath, error: String(e), routes: [] };
  }
}

function collectRefs(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) {
    for (const it of obj) collectRefs(it, out);
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$ref' && typeof v === 'string') {
      const m = v.match(/^#\/components\/schemas\/(.+)$/);
      if (m) out.push(m[1]);
    } else {
      collectRefs(v, out);
    }
  }
  return out;
}

async function run() {
  // parse server mounts
  const mounts = await parseServerMounts();
  const routeFiles = await listRouteFiles();
  const parsedAll = {};
  for (const f of routeFiles) {
    const parsed = await parseRoutesFromFile(f);
    parsedAll[f] = parsed;
  }

  const runtimeEndpoints = [];
  for (const m of mounts) {
    let file = m.file;
    if (!file) {
      const candidates = routeFiles.filter(f => f.toLowerCase().includes(m.varName.toLowerCase()));
      if (candidates.length === 1) file = './' + candidates[0].replace(/\\/g, '/');
      else {
        const guess = `./src/routes/${m.varName}.js`;
        if (routeFiles.map(p => path.join(root, p)).includes(path.join(root, guess))) file = guess;
      }
    }
    if (!file) continue;
    const fNormalized = file.startsWith('./') ? file.slice(2) : file;
    const parsed = parsedAll[fNormalized] || (await parseRoutesFromFile(fNormalized));
    for (const r of parsed.routes || []) {
      const joined = path.posix.join(m.prefix, r.path).replace(/\\/g, '/');
      runtimeEndpoints.push({ method: r.method, raw: joined, normalized: normalizePath(joined) });
    }
  }

  // parse openapi
  let openapi;
  try {
    const text = await readFile(openapiPath, 'utf8');
    openapi = JSON.parse(text);
  } catch (e) {
    console.error('ERROR_PARSING_OPENAPI', String(e));
    process.exit(1);
  }

  const swaggerEntries = [];
  for (const p of Object.keys(openapi.paths || {})) {
    for (const method of Object.keys(openapi.paths[p])) {
      swaggerEntries.push({ method: method.toUpperCase(), raw: p, normalized: normalizePath(p) });
    }
  }

  function findMatch(arr, method, norm) {
    return arr.find(e => e.method === method && e.normalized === norm);
  }

  const runtimeMissingInSwagger = [];
  const swaggerMissingInRuntime = [];

  for (const r of runtimeEndpoints) {
    if (!findMatch(swaggerEntries, r.method, r.normalized)) runtimeMissingInSwagger.push(`${r.method} ${r.normalized}`);
  }
  for (const s of swaggerEntries) {
    if (!findMatch(runtimeEndpoints, s.method, s.normalized)) swaggerMissingInRuntime.push(`${s.method} ${s.normalized}`);
  }

  const refs = collectRefs(openapi);
  const uniqueRefs = [...new Set(refs)];
  const schemaKeys = openapi.components && openapi.components.schemas ? Object.keys(openapi.components.schemas) : [];
  const missingSchemaRefs = uniqueRefs.filter(r => !schemaKeys.includes(r));

  console.log('RUNTIME_MISSING_IN_SWAGGER=' + JSON.stringify(runtimeMissingInSwagger, null, 2));
  console.log('SWAGGER_MISSING_IN_RUNTIME=' + JSON.stringify(swaggerMissingInRuntime, null, 2));
  console.log('MISSING_SCHEMAS_REFS=' + JSON.stringify(missingSchemaRefs, null, 2));
}

run().catch(err => {
  console.error('UNEXPECTED_ERROR', String(err));
  process.exit(1);
});
