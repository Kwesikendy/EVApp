import { getUserProfile, updateUserProfile } from '../../server/auth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const phone = (req.query.phoneNumber as string) || '+233248901204';
    const profile = getUserProfile(phone);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    return res.status(200).json(profile);
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const phone = body?.phoneNumber;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    const updated = updateUserProfile(phone, body);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
