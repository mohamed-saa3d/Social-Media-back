import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const openApiPath = join(currentDir, 'openapi.json');
const openApiDocument = JSON.parse(readFileSync(openApiPath, 'utf8'));

export default openApiDocument;
