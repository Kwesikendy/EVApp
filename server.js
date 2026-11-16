import { createRequire } from 'module';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const require = createRequire(import.meta.url);
require('./dist/server.cjs');
