import { settlePaystackTransaction, verifyPaystackTransaction } from '../../server/paystack';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const reference = String(req.query?.reference || '').trim();
    if (!reference) return res.status(400).json({ success: false, error: 'Missing Paystack transaction reference.' });
    const transaction = await verifyPaystackTransaction(reference);
    return res.status(200).json(settlePaystackTransaction(transaction));
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Could not verify Paystack payment.' });
  }
}
