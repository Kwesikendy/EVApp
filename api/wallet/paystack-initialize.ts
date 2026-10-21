import { initializeCheckout } from '../_paystackRuntime';
import { requestOrigin } from '../_paystack';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const amount = Number(body.amount);
    const phone = body.phone || '+233248901204';
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, error: 'Invalid payment amount.' });
    const baseUrl = (process.env.APP_URL || requestOrigin(req)).replace(/\/$/, '');
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${baseUrl}/payments/paystack/callback`;
    const checkout = await initializeCheckout({ amount, phone, email: body.email, displayName: body.displayName, callbackUrl });
    return res.status(200).json({ success: true, ...checkout });
  } catch (err: any) {
    console.error('[Paystack initialize]', err?.message || err);
    return res.status(500).json({ success: false, error: err.message || 'Could not initialize Paystack payment.' });
  }
}
