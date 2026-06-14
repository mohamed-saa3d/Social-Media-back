process.env.NODE_ENV = 'test';
import app from '../server.js';

function regexpToPath(re){
  if(!re) return '';
  let s = re.source;
  // Simplified conversion: convert escaped slashes and strip regex groups/suffixes
  s = s.replace(/\\\//g, '/');
  s = s.replace(/^\^/, '');
  // remove everything from the first '(' (regex groups) as mount prefixes are before groups
  s = s.replace(/\(.*/, '');
  // remove trailing anchors and tokens
  s = s.replace(/\$$/, '');
  if(!s) return '';
  if(!s.startsWith('/')) s = '/' + s;
  return s.replace(/\/+/g, '/').replace(/\/$/, '');
}

function traverse(stack, prefix=''){
  const routes = [];
  for(const layer of stack){
    if(layer.route){
      const methods = Object.keys(layer.route.methods).map(m=>m.toUpperCase());
      const path = prefix + (layer.route.path || '');
      for(const m of methods){ routes.push({method: m, path, handler: layer.route.stack && layer.route.stack[0] && layer.route.stack[0].name}); }
    } else if(layer.name === 'router' && layer.handle && layer.handle.stack){
      const mountPath = regexpToPath(layer.regexp);
      const newPrefix = prefix + (mountPath || '');
      routes.push(...traverse(layer.handle.stack, newPrefix));
    } else if(layer.name === 'bound dispatch' && layer.handle && layer.handle.route){
      const methods = Object.keys(layer.handle.route.methods).map(m=>m.toUpperCase());
      const path = prefix + (layer.handle.route.path || '');
      for(const m of methods){ routes.push({method:m, path, handler: layer.handle.name}); }
    }
  }
  return routes;
}

const stack = app._router && app._router.stack ? app._router.stack : [];
const endpoints = traverse(stack, '');

console.log('--- RUNNING EXPRESS ROUTES ---');
for(const e of endpoints){ console.log(`${e.method} ${e.path} -> ${e.handler || 'anonymous'}`); }

console.log('\nTOTAL:', endpoints.length);

export default endpoints;
