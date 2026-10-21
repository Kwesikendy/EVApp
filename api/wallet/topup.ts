// Wilpower / ChargeLink GH — Vercel Serverless Wallet Top-Up API
// Direct wallet top-up handler with disk/tmp persistence.

import fs from 'fs';
import path from 'path';

const dataDir = process.env.VERCEL ? path.join('/tmp', 'xcharge-data') : path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const seedFile = path.join(process.cwd(), 'data', 'users.json');

function normalizeGhanaPhoneNumber(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.startsWith('2330') && digits.length === 13) return `+233${digits.substring(4)}`;
  if (digits.startsWith('233') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+233${digits.substring(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return (rawPhone || '').trim();
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      status: 'ONLINE',
      endpoint: '/api/wallet/topup',
      currency: 'GHS',
      message: 'Wallet top-up gateway is active. Submit a POST request with { amount, provider, phone } to credit wallet.'
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    } else if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf8')); } catch {}
    }
    body = body || {};

    const { amount, provider = 'MOMO', phone } = body;
    const targetPhone = phone || '+233248901204';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid top-up amount' });
    }

    const normalized = normalizeGhanaPhoneNumber(targetPhone);
    const prov = (String(provider).toUpperCase() === 'CARD' ? 'CARD' : 'MOMO') as 'MOMO' | 'CARD';
    const ref = `TOPUP-GH-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const users = readUsers();
    let user = users.find((u) => normalizeGhanaPhoneNumber(u.phoneNumber) === normalized);

    if (!user) {
      user = {
        id: `usr-gh-${normalized.slice(-4)}`,
        phoneNumber: normalized,
        displayName: `Driver ${normalized.slice(-4)}`,
        email: `${normalized.replace(/\D/g, '')}@chargelink.com.gh`,
        walletBalance: 0,
        heldEscrow: 0,
        defaultPaymentMethod: prov === 'CARD' ? 'MASTERCARD' : 'MTN_MOMO',
        registeredVehicles: [],
        transactions: [],
        createdAt: now,
        updatedAt: now,
      };
      users.push(user);
    }

    user.walletBalance = Number((Number(user.walletBalance || 0) + numAmount).toFixed(2));
    user.updatedAt = now;
    user.transactions = user.transactions || [];
    const tx = {
      id: `tx-${Date.now()}`,
      timestamp: now,
      amount: numAmount,
      type: 'TOPUP',
      status: 'SUCCESS',
      provider: prov,
      reference: ref,
      description: `${provider || 'MTN MoMo'} Top-up (${normalized})`,
    };
    user.transactions.unshift(tx);
    user.transactions = user.transactions.slice(0, 50);

    saveUsers(users);

    const updatedWallet = {
      userId: user.id,
      currency: 'GHS',
      availableBalance: user.walletBalance,
      heldBalance: user.heldEscrow || 0,
      momoProvider: user.defaultPaymentMethod === 'TELECEL_CASH' ? 'TELECEL' : user.defaultPaymentMethod === 'MASTERCARD' ? 'CARD' : 'MTN',
      phoneNumber: user.phoneNumber,
      transactions: user.transactions,
    };

    return res.status(200).json({
      success: true,
      wallet: updatedWallet,
      transaction: tx,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Top-up failed' });
  }
}
