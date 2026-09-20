import { getUserWallet } from '../../server/auth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const phone = (req.query.phoneNumber as string) || (req.query.phone as string);
    const wallet = getUserWallet(phone);
    return res.status(200).json(wallet);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
