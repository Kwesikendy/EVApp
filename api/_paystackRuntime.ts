import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const API_ROOT = 'https://api.paystack.co';
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'xcharge-data') : path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'users.json');

type User = {
  id: string;
  phoneNumber: string;
  displayName: string;
  email?: string;
  walletBalance: number;
  heldEscrow: number;
  defaultPaymentMethod: 'MTN_MOMO' | 'TELECEL_CASH' | 'MASTERCARD';
  registeredVehicles: any[];
  transactions?: any[];
  createdAt: string;
  updatedAt: string;
};

export interface PaystackTransaction {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  channel?: string;
  metadata?: unknown;
  customer?: { email?: string; phone?: string };
}

export function normalizePhone(value: string) {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.startsWith('2330') && digits.length === 13) return `+233${digits.slice(4)}`;
  if (digits.startsWith('233') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return (value || '').trim();
}

function getSecret() {
  return (process.env.PAYSTACK_SECRET_KEY || '').replace(/^['"]|['"]$/g, '').trim();
}

async function requestPaystack<T>(urlPath: string, init: RequestInit): Promise<T> {
  const key = getSecret();
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is missing from this Vercel function environment.');
  const response = await fetch(`${API_ROOT}${urlPath}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const result = await response.json().catch(() => null) as { status?: boolean; message?: string; data?: T } | null;
  if (!response.ok || !result?.status) {
    throw new Error(result?.message || `Paystack returned HTTP ${response.status}.`);
  }
  return result.data as T;
}

export async function initializeCheckout(input: {
  amount: number;
  phone: string;
  email?: string;
  displayName?: string;
  callbackUrl: string;
}) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Invalid payment amount.');
  const phone = normalizePhone(input.phone);
  if (!/^\+233\d{9}$/.test(phone)) throw new Error('Enter a valid Ghana phone number before paying.');
  const reference = `CHG-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const email = input.email?.trim() || `${phone.replace(/\D/g, '')}@chargelink.com.gh`;
  return requestPaystack<{ authorization_url: string; access_code: string; reference: string }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: String(Math.round(input.amount * 100)),
      currency: 'GHS',
      reference,
      callback_url: input.callbackUrl,
      metadata: {
        purpose: 'wallet_topup',
        phoneNumber: phone,
        amountGhs: Number(input.amount.toFixed(2)),
        displayName: input.displayName || undefined,
      },
    }),
  });
}

export function verifyEventSignature(rawBody: Buffer, signature: string) {
  const key = getSecret();
  if (!key || !signature) return false;
  const expected = crypto.createHmac('sha512', key).update(rawBody).digest('hex');
  const received = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return expectedBuffer.length === received.length && crypto.timingSafeEqual(expectedBuffer, received);
}

export async function verifyTransaction(reference: string) {
  if (!reference.trim()) throw new Error('Missing Paystack transaction reference.');
  return requestPaystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference.trim())}`, { method: 'GET' });
}

function parseMetadata(value: unknown): Record<string, any> {
  if (value && typeof value === 'object') return value as Record<string, any>;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
}

function readUsers() {
  try {
    const file = fs.existsSync(USERS_FILE) ? USERS_FILE : SEED_FILE;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data as User[] : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export function settleVerifiedTransaction(transaction: PaystackTransaction) {
  const metadata = parseMetadata(transaction.metadata);
  const phone = normalizePhone(String(metadata.phoneNumber || transaction.customer?.phone || ''));
  const amount = Number(transaction.amount) / 100;
  const expectedAmount = Number(metadata.amountGhs);
  if (transaction.status !== 'success') throw new Error(`Payment has not succeeded (status: ${transaction.status || 'unknown'}).`);
  if (transaction.currency !== 'GHS') throw new Error('Payment currency mismatch. Expected GHS.');
  if (!/^\+233\d{9}$/.test(phone)) throw new Error('Paystack transaction has no valid Ghana phone number.');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Paystack returned an invalid payment amount.');
  if (Number.isFinite(expectedAmount) && expectedAmount > 0 && Math.round(expectedAmount * 100) !== Number(transaction.amount)) {
    throw new Error('Payment amount mismatch. Wallet was not credited.');
  }

  const users = readUsers();
  let user = users.find((record) => normalizePhone(record.phoneNumber) === phone);
  if (!user) {
    const now = new Date().toISOString();
    user = {
      id: `usr-gh-${Date.now().toString(36)}`,
      phoneNumber: phone,
      displayName: String(metadata.displayName || `Driver ${phone.slice(-4)}`),
      email: transaction.customer?.email || `${phone.replace(/\D/g, '')}@chargelink.com.gh`,
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
  user.transactions ||= [];
  const previous = user.transactions.find((entry: any) => entry.reference === transaction.reference);
  if (!previous) {
    user.walletBalance = Number((Number(user.walletBalance || 0) + amount).toFixed(2));
    user.updatedAt = new Date().toISOString();
    user.transactions.unshift({
      id: `tx-${Date.now()}`,
      timestamp: user.updatedAt,
      amount,
      type: 'TOPUP',
      status: 'SUCCESS',
      provider: transaction.channel === 'card' ? 'CARD' : 'MOMO',
      reference: transaction.reference,
      description: `Paystack wallet top-up (${transaction.channel || 'payment'})`,
    });
    user.transactions = user.transactions.slice(0, 50);
    saveUsers(users);
  }
  return {
    success: true,
    alreadyCredited: Boolean(previous),
    reference: transaction.reference,
    wallet: {
      userId: user.id,
      currency: 'GHS',
      availableBalance: Number(user.walletBalance || 0),
      heldBalance: Number(user.heldEscrow || 0),
      momoProvider: user.defaultPaymentMethod === 'TELECEL_CASH' ? 'TELECEL' : user.defaultPaymentMethod === 'MASTERCARD' ? 'CARD' : 'MTN',
      phoneNumber: user.phoneNumber,
      transactions: user.transactions,
    },
    user,
  };
}
