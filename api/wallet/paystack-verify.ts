// Wilpower / ChargeLink GH — Vercel Serverless Paystack Verify API
// Verifies transaction with Paystack and settles payment into driver wallet.

import fs from 'fs';
import path from 'path';

const API_ROOT = 'https://api.paystack.co';
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const reference = String(req.query?.reference || '').trim();
    if (!reference) {
      return res.status(200).json({
        success: true,
        status: 'ONLINE',
        endpoint: '/api/wallet/paystack-verify',
        message: 'Provide a ?reference=... query parameter to verify a payment transaction.'
      });
    }

    const key = getSecret();
    if (!key) {
      return res.status(500).json({
        success: false,
        error: 'PAYSTACK_SECRET_KEY is missing from environment variables.'
      });
    }

    const verifyRes = await fetch(`${API_ROOT}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await verifyRes.json().catch(() => null) as any;
    if (!verifyRes.ok || !result?.status || !result.data) {
      return res.status(400).json({
        success: false,
        error: result?.message || `Paystack verification returned HTTP ${verifyRes.status}.`
      });
    }

    const tx = result.data;
    if (tx.status !== 'success') {
      return res.status(400).json({
        success: false,
        error: `Payment has not succeeded (status: ${tx.status || 'unknown'}).`
      });
    }

    const metadata = parseMetadata(tx.metadata);
    const phone = normalizePhone(String(metadata.phoneNumber || tx.customer?.phone || ''));
    const amount = Number(tx.amount) / 100;

    const users = readUsers();
    let user = users.find((record) => normalizePhone(record.phoneNumber) === phone);
    const now = new Date().toISOString();

    if (!user) {
      user = {
        id: `usr-gh-${Date.now().toString(36)}`,
        phoneNumber: phone || '+233248901204',
        displayName: String(metadata.displayName || `Driver ${phone ? phone.slice(-4) : 'User'}`),
        email: tx.customer?.email || `${(phone || 'driver').replace(/\D/g, '')}@chargelink.com.gh`,
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
        description: `Paystack wallet top-up (${tx.channel || 'payment'})`,
      });
      user.transactions = user.transactions.slice(0, 50);
      saveUsers(users);
    }

    return res.status(200).json({
      success: true,
      alreadyCredited: Boolean(previous),
      reference: tx.reference,
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
    });
  } catch (err: any) {
    console.error('[Paystack verify error]', err?.message || err);
    return res.status(400).json({ success: false, error: err.message || 'Could not verify Paystack payment.' });
  }
}
