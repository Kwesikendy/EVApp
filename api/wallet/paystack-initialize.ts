// Wilpower / ChargeLink GH — Vercel Serverless Paystack Initialize API
// Initializes a live Paystack checkout transaction for wallet top-ups.

import crypto from 'crypto';

const API_ROOT = 'https://api.paystack.co';

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

function requestOrigin(req: any): string {
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || 'https').split(',')[0];
  const host = String(req.headers?.host || 'localhost:5173');
  return `${forwardedProto}://${host}`.replace(/\/$/, '');
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
      endpoint: '/api/wallet/paystack-initialize',
      currency: 'GHS',
      message: 'Paystack initialization gateway is active. Submit a POST request with { amount, phone, email, displayName } to initialize a payment.'
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

    const amount = Number(body.amount);
    const phone = normalizePhone(body.phone || '+233248901204');

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount.' });
    }
    if (!/^\+233\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Enter a valid Ghana phone number before paying.' });
    }

    const baseUrl = (process.env.APP_URL || requestOrigin(req)).replace(/\/$/, '');
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${baseUrl}/payments/paystack/callback`;
    const reference = `CHG-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const email = body.email?.trim() || `${phone.replace(/\D/g, '')}@chargelink.com.gh`;

    const key = getSecret();
    if (!key) {
      return res.status(500).json({
        success: false,
        error: 'PAYSTACK_SECRET_KEY is missing from environment variables. Please configure it in Vercel project settings.'
      });
    }

    const paystackRes = await fetch(`${API_ROOT}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: String(Math.round(amount * 100)),
        currency: 'GHS',
        reference,
        callback_url: callbackUrl,
        metadata: {
          purpose: 'wallet_topup',
          phoneNumber: phone,
          amountGhs: Number(amount.toFixed(2)),
          displayName: body.displayName || undefined,
        },
      }),
    });

    const result = await paystackRes.json().catch(() => null) as any;
    if (!paystackRes.ok || !result?.status) {
      return res.status(400).json({
        success: false,
        error: result?.message || `Paystack returned HTTP ${paystackRes.status}.`
      });
    }

    return res.status(200).json({
      success: true,
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    });
  } catch (err: any) {
    console.error('[Paystack initialize error]', err?.message || err);
    return res.status(500).json({ success: false, error: err.message || 'Could not initialize Paystack payment.' });
  }
}
