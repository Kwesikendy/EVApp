// Wilpower / ChargeLink GH — Vercel Serverless Wallet Balance API
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const phone = req.query?.phoneNumber || req.query?.phone;
    const users = readUsers();

    let user: any = null;
    if (phone) {
      const normalized = normalizeGhanaPhoneNumber(String(phone));
      user = users.find((u) => normalizeGhanaPhoneNumber(u.phoneNumber) === normalized);
    }
    if (!user && users.length > 0) {
      user = users[0];
    }

    if (user) {
      return res.status(200).json({
        userId: user.id,
        availableBalance: Number(user.walletBalance || 0),
        heldEscrow: Number(user.heldEscrow || 0),
        currency: 'GHS',
        momoProvider: user.defaultPaymentMethod === 'TELECEL_CASH' ? 'TELECEL' : user.defaultPaymentMethod === 'MASTERCARD' ? 'CARD' : 'MTN',
        phoneNumber: user.phoneNumber,
        transactions: user.transactions || [],
      });
    }

    return res.status(200).json({
      availableBalance: 245.50,
      heldEscrow: 0.00,
      currency: 'GHS',
      momoProvider: 'MTN',
      transactions: []
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
