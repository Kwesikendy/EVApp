import { getUserWallet, creditUserWallet } from '../../server/auth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { amount, provider = 'MOMO', phone } = body;
  const targetPhone = phone || '+233248901204';
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid top-up amount' });
  }

  const prov = (provider.toUpperCase() === 'CARD' ? 'CARD' : 'MOMO') as 'MOMO' | 'CARD';
  const ref = `TOPUP-GH-${Math.floor(100000 + Math.random() * 900000)}`;
  const desc = `${provider || 'MTN MoMo'} Top-up (${targetPhone})`;
  creditUserWallet(targetPhone, numAmount, desc, ref, prov);
  const updatedWallet = getUserWallet(targetPhone);

  return res.status(200).json({
    success: true,
    wallet: updatedWallet,
    transaction: updatedWallet.transactions[0],
  });
}
