import crypto from 'crypto';

function normalizeGhanaPhoneNumber(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.startsWith('2330') && digits.length === 13) {
    return `+233${digits.substring(4)}`;
  }
  if (digits.startsWith('233') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+233${digits.substring(1)}`;
  }
  if (digits.length === 9) {
    return `+233${digits}`;
  }
  return (rawPhone || '').trim();
}

function getDeterministicOtp(phone: string, windowOffset: number = 0): string {
  const normalized = normalizeGhanaPhoneNumber(phone);
  const window = Math.floor(Date.now() / (5 * 60 * 1000)) + windowOffset;
  const secretRaw = process.env.OTP_SECRET || process.env.MOOLRE_VAS_KEY || 'xcharge-auth-stateless-hmac-seed-2025-accra-gh';
  const secret = secretRaw.replace(/^["']|["']$/g, '').trim();

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`otp:${normalized}:${window}`);
  const hash = hmac.digest('hex');
  const intVal = (parseInt(hash.substring(0, 8), 16) % 900000) + 100000;
  return intVal.toString();
}

export default async function handler(req: any, res: any) {
  // Permissive CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    } else if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf-8')); } catch {}
    } else if (!body) {
      body = {};
    }

    const phoneNumber = body.phoneNumber || body.phone;
    const code = body.code || body.otp;
    const metadata = body.metadata;

    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, error: 'Phone number and verification code are required' });
    }

    const normalized = normalizeGhanaPhoneNumber(phoneNumber);
    const trimmedCode = String(code).trim();

    // Universal test bypass code '123456'
    const isDevBypass = trimmedCode === '123456';

    // Stateless deterministic verification across 5 sliding windows
    const isDeterministic =
      trimmedCode === getDeterministicOtp(normalized, 0) ||
      trimmedCode === getDeterministicOtp(normalized, -1) ||
      trimmedCode === getDeterministicOtp(normalized, -2) ||
      trimmedCode === getDeterministicOtp(normalized, -3) ||
      trimmedCode === getDeterministicOtp(normalized, 1);

    if (!isDevBypass && !isDeterministic) {
      return res.status(400).json({ success: false, error: 'Invalid verification code. Please check and retry.' });
    }

    const userProfile = {
      id: `usr-gh-${normalized.slice(-4)}-${Date.now().toString(36)}`,
      phoneNumber: normalized,
      displayName: metadata?.displayName || (normalized === '+233248901204' ? 'Kofi Mensah' : 'EV Driver'),
      email: metadata?.email || (normalized === '+233248901204' ? 'kofi.mensah@chargelink.com.gh' : 'driver@chargelink.com.gh'),
      walletBalance: 245.50,
      heldEscrow: 0.00,
      defaultPaymentMethod: 'MTN_MOMO',
      registeredVehicles: [
        {
          id: 'veh-01',
          make: metadata?.selectedEv === 'tesla' ? 'Tesla' : 'BYD',
          model: metadata?.selectedEv === 'tesla' ? 'Model Y Long Range' : 'Atto 3 EV',
          year: 2024,
          batteryCapacityKwh: metadata?.selectedEv === 'tesla' ? 75.0 : 60.5,
          connectorType: 'CCS2',
          licensePlate: 'GW 4821 - 24',
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      user: userProfile,
    });
  } catch (err: any) {
    console.error('[API verify-otp error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
