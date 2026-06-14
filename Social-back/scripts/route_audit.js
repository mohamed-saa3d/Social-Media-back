import fs from 'fs';
import path from 'path';

const root = process.cwd();
const serverPath = path.join(root, 'server.js');
const docsPath = path.join(root, 'src', 'docs', 'openapi.json');

function read(p){ return fs.readFileSync(p,'utf8'); }

const server = read(serverPath);

// find imports from routes
const importRegex = /import\s+(\w+)\s+from\s+['"](\.\/src\/routes\/[^'";]+)['"]/g;
let m; const imports = {};
while((m=importRegex.exec(server))){ imports[m[1]] = m[2]; }

// find app.use mounts
const useRegex = /app.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g;
let u; const mounts = [];
while((u=useRegex.exec(server))){ mounts.push({prefix: u[1], varName: u[2], file: imports[u[2]] || 'UNKNOWN'}); }

function parseRouteFile(file){
  const p = path.join(root, file);
  if(!fs.existsSync(p)) return {error:'MISSING', file};
  const src = read(p);
  const lines = src.split(/\r?\n/);
  const routerLines = [];
  const r = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"\)]+)['"]/g;
  let mm;
  while((mm=r.exec(src))){ routerLines.push({method:mm[1].toUpperCase(), path:mm[2]}); }
  return {file, routes:routerLines};
}

const routeMap = {};
for(const mt of mounts){ routeMap[mt.prefix] = parseRouteFile(mt.file.replace(/^\.\//,'')); }

// now load openapi paths
let openapi = null;
try{ openapi = JSON.parse(read(docsPath)); }catch(e){ console.error('OPENAPI PARSE ERROR', e.message); process.exit(1); }
const apiPaths = Object.keys(openapi.paths||{});

// build runtime endpoint list (full paths)
const runtimeEndpoints = [];
for(const [prefix, info] of Object.entries(routeMap)){
  if(info.error){ continue; }
  for(const r of info.routes){
    const full = path.posix.join(prefix, r.path).replace(/\\/g,'/');
    runtimeEndpoints.push({method:r.method, path:full, file:info.file});
  }
}

// build swagger list
const swaggerEndpoints = [];
for(const p of apiPaths){
  const methods = Object.keys(openapi.paths[p]);
  for(const mth of methods){ swaggerEndpoints.push({method:mth.toUpperCase(), path:p}); }
}

// classification
function findSwagger(method,path){ return swaggerEndpoints.find(s=>s.method===method && s.path===path); }
function findRuntime(method,path){ return runtimeEndpoints.find(r=>r.method===method && r.path===path); }

const matched = [];
const missingInSwagger = [];
const swaggerOnly = [];

for(const r of runtimeEndpoints){ if(findSwagger(r.method,r.path)){ matched.push(r); } else { missingInSwagger.push(r); } }
for(const s of swaggerEndpoints){ if(findRuntime(s.method,s.path)){ /* matched already recorded */ } else { swaggerOnly.push(s); } }

// parameter mismatches and path mismatches detection (best-effort exact param name checks)
const paramMismatches = [];
for(const r of runtimeEndpoints){
  // find swagger paths that match ignoring param names
  const norm = (p)=>p.replace(/\{[^}]+\}/g, '{}');
  const candidates = swaggerEndpoints.filter(s=>s.method===r.method && norm(s.path)===norm(r.path));
  if(candidates.length>0){
    const exact = candidates.find(c=>c.path===r.path);
    if(!exact){
      paramMismatches.push({runtime:r, swaggerCandidates:candidates});
    }
  }
}

// duplicate runtime endpoints (same method+path repeated)
const duplicates = runtimeEndpoints.reduce((acc,e)=>{ const key=e.method+" "+e.path; acc[key]=(acc[key]||0)+1; return acc; },{});
const runtimeDuplicates = Object.entries(duplicates).filter(([k,v])=>v>1).map(([k,v])=>({endpoint:k,count:v}));

// orphan routes (route files not mounted)
const routeFiles = fs.readdirSync(path.join(root,'src','routes')).filter(f=>f.endsWith('.js'));
const mountedFiles = Object.values(imports).map(p=>p.replace('./src/routes/','') );
const orphanRoutes = routeFiles.filter(f=>!mountedFiles.includes(f));

// orphan schemas: find schemas in components.schemas not referenced by any path response/request
const schemas = openapi.components && openapi.components.schemas ? Object.keys(openapi.components.schemas) : [];
const usedSchemas = new Set();
for(const p of Object.keys(openapi.paths||{})){
  const methods = openapi.paths[p];
  for(const m of Object.keys(methods)){
    const op = methods[m];
    const resp = op.responses||{};
    for(const code of Object.keys(resp)){
      const content = resp[code].content||{};
      for(const ct of Object.keys(content)){
        const schema = content[ct].schema;
        if(schema && schema.$ref){ usedSchemas.add(schema.$ref.split('/').pop()); }
      }
    }
    const rb = op.requestBody;
    if(rb && rb.content){
      for(const ct of Object.keys(rb.content)){
        const sch = rb.content[ct].schema;
        if(sch && sch.$ref){ usedSchemas.add(sch.$ref.split('/').pop()); }
      }
    }
  }
}
const orphanSchemas = schemas.filter(s=>!usedSchemas.has(s));

// final report
console.log('--- ROUTE TABLE ---');
for(const [prefix,info] of Object.entries(routeMap)){
  console.log(prefix, '->', info.file);
  if(info.error){ console.log('  ERROR:', info.error); continue; }
  for(const r of info.routes){ console.log(`  ${r.method} ${path.posix.join(prefix,r.path)}`); }
}

console.log('\n--- SWAGGER PATHS ---');
for(const s of swaggerEndpoints){ console.log(`  ${s.method} ${s.path}`); }

console.log('\n--- MATCHED ---'); matched.forEach(m=>console.log(`  ${m.method} ${m.path}`));
console.log('\n--- MISSING IN SWAGGER ---'); missingInSwagger.forEach(m=>console.log(`  ${m.method} ${m.path} (file: ${m.file})`));
console.log('\n--- SWAGGER ONLY ---'); swaggerOnly.forEach(s=>console.log(`  ${s.method} ${s.path}`));
console.log('\n--- PARAM MISMATCHES ---'); paramMismatches.forEach(pm=>console.log(`  runtime: ${pm.runtime.method} ${pm.runtime.path}  candidates: ${pm.swaggerCandidates.map(c=>c.path).join(', ')}`));
console.log('\n--- RUNTIME DUPLICATES ---'); console.log(runtimeDuplicates.length?JSON.stringify(runtimeDuplicates,null,2):'  none');
console.log('\n--- ORPHAN ROUTE FILES (not mounted) ---'); orphanRoutes.forEach(f=>console.log('  ',f));
console.log('\n--- ORPHAN SWAGGER SCHEMAS (defined but not referenced) ---'); orphanSchemas.forEach(s=>console.log('  ',s));

// consistency score: matched / (matched+missing+swaggerOnly)
const total = matched.length + missingInSwagger.length + swaggerOnly.length;
const score = total? Math.round((matched.length/total)*100):100;
console.log('\n--- CONSISTENCY SCORE ---'); console.log(score+'%');

// exit
