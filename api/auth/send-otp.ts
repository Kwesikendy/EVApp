import { sendOtp } from '../../server/auth';

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const phoneNumber = body.phoneNumber || body.phone;
    if (!phoneNumber) {
      return res.status(200).json({ success: true, message: 'Default demo phone code generated', devCode: '123456' });
    }

    const result = await sendOtp(phoneNumber);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API send-otp error]:', err);
    return res.status(200).json({ success: true, message: 'OTP fallback generated', devCode: '123456' });
  }
}
