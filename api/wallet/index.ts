export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      availableBalance: 245.50,
      heldEscrow: 0.00,
      currency: 'GHS',
      momoProvider: 'MTN',
      transactions: []
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
