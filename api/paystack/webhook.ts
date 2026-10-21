import { settleVerifiedTransaction, verifyEventSignature } from '../_paystackRuntime';
import { readRawBody } from '../_paystack';

export const config = { api: { bodyParser: false } };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const rawBody = await readRawBody(req);
    const signature = String(req.headers?.['x-paystack-signature'] || '');
    if (!verifyEventSignature(rawBody, signature)) return res.status(401).json({ success: false, error: 'Invalid Paystack signature.' });
    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event === 'charge.success' && event.data) settleVerifiedTransaction(event.data);
    return res.status(200).json({ received: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Paystack webhook processing failed.' });
  }
}
