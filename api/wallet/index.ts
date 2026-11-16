// Wilpower / ChargeLink GH — Vercel Serverless Wallet Balance API (Real-Time Paystack Sync)
import fs from 'fs';
import path from 'path';

const API_ROOT = 'https://api.paystack.co';
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

function getPaystackSecret(): string {
  return (process.env.PAYSTACK_SECRET_KEY || '').replace(/^['"]|["']$/g, '').trim();
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

async function fetchLivePaystackTransactions(normalizedPhone: string, userEmail?: string) {
  const key = getPaystackSecret();
  if (!key) return { mode: 'UNCONFIGURED', txs: [] as any[] };

  const mode = key.startsWith('sk_live_') ? 'LIVE' : 'TEST';
  try {
    const res = await fetch(`${API_ROOT}/transaction?status=success&perPage=30`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.status || !Array.isArray(data.data)) {
      return { mode, txs: [] as any[] };
    }

    const phoneDigits = normalizedPhone.replace(/\D/g, '');
    const expectedEmail = `${phoneDigits}@chargelink.com.gh`.toLowerCase();

    const matched = data.data.filter((item: any) => {
      const metaPhone = normalizeGhanaPhoneNumber(String(item?.metadata?.phoneNumber || ''));
      const custEmail = String(item?.customer?.email || '').toLowerCase();
      return (
        (normalizedPhone && metaPhone === normalizedPhone) ||
        (phoneDigits && custEmail === expectedEmail) ||
        (userEmail && custEmail === userEmail.toLowerCase())
      );
    });

    const txs = matched.map((item: any) => {
      const amountGhs = Number((Number(item.amount || 0) / 100).toFixed(2));
      const ch = String(item.channel || '').toLowerCase();
      const provider = ch.includes('card') ? 'CARD' : ch.includes('mobile') ? 'MOMO' : 'PAYSTACK';
      return {
        id: `ps-${item.id}`,
        timestamp: item.paid_at || item.created_at || new Date().toISOString(),
        amount: amountGhs,
        type: 'TOPUP',
        status: 'SUCCESS',
        provider,
        reference: item.reference,
        description: `Paystack ${provider === 'CARD' ? 'Card' : 'Mobile Money'} (${normalizedPhone})`,
      };
    });

    return { mode, txs };
  } catch {
    return { mode, txs: [] as any[] };
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const phone = req.query?.phoneNumber || req.query?.phone;
    const normalized = phone ? normalizeGhanaPhoneNumber(String(phone)) : '';
    const users = readUsers();

    const user: any = normalized
      ? users.find((u) => normalizeGhanaPhoneNumber(u.phoneNumber) === normalized)
      : null;

    const baseBalance = user ? Number(user.walletBalance || 0) : 0;
    const baseTxs: any[] = user && Array.isArray(user.transactions) ? [...user.transactions] : [];

    // Real-time Paystack transaction sync
    const { mode, txs: livePaystackTxs } = normalized
      ? await fetchLivePaystackTransactions(normalized, user?.email)
      : { mode: getPaystackSecret().startsWith('sk_live_') ? 'LIVE' : 'TEST', txs: [] };

    const seenRefs = new Set(baseTxs.map((t) => t.reference).filter(Boolean));
    let extraBalance = 0;
    for (const ptx of livePaystackTxs) {
      if (ptx.reference && !seenRefs.has(ptx.reference)) {
        seenRefs.add(ptx.reference);
        baseTxs.unshift(ptx);
        extraBalance += ptx.amount;
      }
    }

    baseTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.status(200).json({
      userId: user?.id || (normalized ? `usr-${normalized.replace(/\D/g, '')}` : 'guest'),
      availableBalance: Number((baseBalance + extraBalance).toFixed(2)),
      heldEscrow: Number(user?.heldEscrow || 0),
      currency: 'GHS',
      momoProvider:
        user?.defaultPaymentMethod === 'TELECEL_CASH'
          ? 'TELECEL'
          : user?.defaultPaymentMethod === 'MASTERCARD'
          ? 'CARD'
          : 'MTN',
      phoneNumber: normalized || user?.phoneNumber || '',
      paystackMode: mode,
      transactions: baseTxs.slice(0, 50),
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
