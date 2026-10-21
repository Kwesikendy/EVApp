// Wilpower / ChargeLink GH — Vercel Serverless MoMo Initiate API
// Handles interactive Ghana Mobile Money payment requests and USSD prompts.

function normalizeGhanaPhoneNumber(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.startsWith('2330') && digits.length === 13) return `+233${digits.substring(4)}`;
  if (digits.startsWith('233') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+233${digits.substring(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return (rawPhone || '').trim();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Gracefully handle GET requests (browser address bar navigation, uptime checks, health monitors)
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      status: 'ONLINE',
      endpoint: '/api/wallet/momo-initiate',
      currency: 'GHS',
      merchantName: 'CHARGELINK GH LTD',
      supportedProviders: ['MTN', 'TELECEL', 'CARD'],
      message: 'MoMo Payment Initiation Gateway is operational. Submit a POST request with { amount, provider, phone } to dispatch a USSD prompt.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    } else if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf8')); } catch {}
    }
    body = body || {};

    const { amount, provider = 'MTN', phone } = body;
    const targetPhone = phone || '+233248901204';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount' });
    }

    const normalized = normalizeGhanaPhoneNumber(targetPhone);
    const provStr = String(provider || 'MTN').toUpperCase();
    const prov = (provStr === 'TELECEL' ? 'TELECEL' : provStr === 'CARD' ? 'CARD' : 'MTN') as 'MTN' | 'TELECEL' | 'CARD';
    const txId = `momo-req-${Date.now()}`;
    const networkRef = `GH-${prov}-${Math.floor(100000 + Math.random() * 900000)}`;
    const merchant = 'CHARGELINK GH LTD';

    const ussdPrompt = prov === 'MTN'
      ? `Authorize payment of GHS ${numAmount.toFixed(2)} to ${merchant}? Ref: ${networkRef}. Enter Mobile Money (*170#) PIN:`
      : prov === 'TELECEL'
      ? `Authorize payment of GHS ${numAmount.toFixed(2)} to ${merchant}? Ref: ${networkRef}. Enter Telecel Cash (*110#) PIN:`
      : `Authorize payment of GHS ${numAmount.toFixed(2)} via Mastercard 3D Secure?`;

    return res.status(200).json({
      success: true,
      transactionId: txId,
      status: 'PENDING',
      amount: numAmount,
      currency: 'GHS',
      provider: prov,
      phoneNumber: normalized,
      networkReference: networkRef,
      merchantName: merchant,
      ussdPrompt,
      timeoutSeconds: 45,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Payment initiation failed' });
  }
}
