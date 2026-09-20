import { verifyOtp } from '../../server/auth';

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
    const { phoneNumber, code, metadata } = req.body || {};
    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, error: 'Phone number and verification code are required' });
    }

    const result = verifyOtp(phoneNumber, code, metadata);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API verify-otp error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
