import { IncomingMessage } from 'http';

export function requestOrigin(req: any) {
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || 'https').split(',')[0];
  const host = String(req.headers?.host || 'localhost:5173');
  return `${forwardedProto}://${host}`.replace(/\/$/, '');
}

export function readRawBody(req: IncomingMessage & { body?: unknown }): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body));
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
