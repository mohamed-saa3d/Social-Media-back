import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const openApiPath = join(currentDir, 'openapi.json');

export default JSON.parse(readFileSync(openApiPath, 'utf8'));
