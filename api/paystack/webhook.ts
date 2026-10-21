// Wilpower / ChargeLink GH — Vercel Serverless Paystack Webhook API
// Validates HMAC-SHA512 webhook signature and settles successful charges into driver wallet.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const dataDir = process.env.VERCEL ? path.join('/tmp', 'xcharge-data') : path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const seedFile = path.join(process.cwd(), 'data', 'users.json');

function normalizePhone(value: string): string {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.startsWith('2330') && digits.length === 13) return `+233${digits.slice(4)}`;
  if (digits.startsWith('233') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return (value || '').trim();
}

function getSecret(): string {
  return (process.env.PAYSTACK_SECRET_KEY || '').replace(/^['"]|['"]$/g, '').trim();
}

function verifyEventSignature(rawBody: Buffer, signature: string): boolean {
  const key = getSecret();
  if (!key || !signature) return false;
  const expected = crypto.createHmac('sha512', key).update(rawBody).digest('hex');
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function readRawBody(req: any): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body));
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function readUsers(): any[] {
  try {
    const file = fs.existsSync(usersFile) ? usersFile : seedFile;
    if (fs.existsSync(file)) {
      const records = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(records)) return records;
    }
  } catch {}
  return [];
}

function saveUsers(users: any[]) {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
  } catch {}
}

function parseMetadata(value: unknown): Record<string, any> {
  if (value && typeof value === 'object') return value as Record<string, any>;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
}

function settleTransaction(tx: any) {
  const metadata = parseMetadata(tx.metadata);
  const phone = normalizePhone(String(metadata.phoneNumber || tx.customer?.phone || ''));
  const amount = Number(tx.amount) / 100;
  if (tx.status !== 'success' || tx.currency !== 'GHS' || !/^\+233\d{9}$/.test(phone)) return;

  const users = readUsers();
  let user = users.find((record) => normalizePhone(record.phoneNumber) === phone);
  const now = new Date().toISOString();

  if (!user) {
    user = {
      id: `usr-gh-${Date.now().toString(36)}`,
      phoneNumber: phone,
      displayName: String(metadata.displayName || `Driver ${phone.slice(-4)}`),
      email: tx.customer?.email || `${phone.replace(/\D/g, '')}@chargelink.com.gh`,
      walletBalance: 0,
      heldEscrow: 0,
      defaultPaymentMethod: 'MTN_MOMO',
      registeredVehicles: [],
      transactions: [],
      createdAt: now,
      updatedAt: now,
    };
    users.push(user);
  }

  user.transactions = user.transactions || [];
  const previous = user.transactions.find((entry: any) => entry.reference === tx.reference);
  if (!previous) {
    user.walletBalance = Number((Number(user.walletBalance || 0) + amount).toFixed(2));
    user.updatedAt = now;
    user.transactions.unshift({
      id: `tx-${Date.now()}`,
      timestamp: now,
      amount,
      type: 'TOPUP',
      status: 'SUCCESS',
      provider: tx.channel === 'card' ? 'CARD' : 'MOMO',
      reference: tx.reference,
      description: `Paystack webhook settlement (${tx.channel || 'payment'})`,
    });
    user.transactions = user.transactions.slice(0, 50);
    saveUsers(users);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Paystack-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      status: 'ONLINE',
      endpoint: '/api/paystack/webhook',
      message: 'Paystack webhook receiver is active.'
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const rawBody = await readRawBody(req);
    const signature = String(req.headers?.['x-paystack-signature'] || '');
    if (!verifyEventSignature(rawBody, signature)) {
      return res.status(401).json({ success: false, error: 'Invalid Paystack signature.' });
    }
    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event === 'charge.success' && event.data) {
      settleTransaction(event.data);
    }
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[Paystack webhook error]', err?.message || err);
    return res.status(500).json({ success: false, error: err.message || 'Paystack webhook processing failed.' });
  }
}
