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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const rawPhone = (req.query.phoneNumber as string) || (req.query.phone as string) || '+233248901204';
    const normalized = normalizeGhanaPhoneNumber(rawPhone);

    const profile = {
      id: `usr-gh-${normalized.slice(-4)}`,
      phoneNumber: normalized,
      displayName: normalized === '+233248901204' ? 'Kofi Mensah' : 'EV Driver',
      email: normalized === '+233248901204' ? 'kofi.mensah@chargelink.com.gh' : 'driver@chargelink.com.gh',
      walletBalance: 245.50,
      heldEscrow: 0.00,
      defaultPaymentMethod: 'MTN_MOMO',
      registeredVehicles: [
        {
          id: 'veh-01',
          make: 'BYD',
          model: 'Atto 3 EV',
          year: 2024,
          batteryCapacityKwh: 60.5,
          connectorType: 'CCS2',
          licensePlate: 'GW 4821 - 24',
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json(profile);
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    return res.status(200).json({ success: true, ...body });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
