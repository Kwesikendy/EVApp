// ChargeLink GH — Vercel Serverless Stations API
// Returns the live ChargeLink GH station registry with real GPS coordinates and hardware specs.
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ChargeLink GH Station Registry
  // Station 1: Greenwood Event Center, Kumasi (Under Construction — hardware arriving soon)
  const STATIONS = [
    {
      id: 'st-01',
      stationId: 'CL-KSI-001',
      name: 'Greenwood Event Center',
      operator: 'ChargeLink GH',
      address: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi, Ashanti',
      city: 'Kumasi',
      region: 'Ashanti',
      landmark: 'Opoku Bandoh Plaza / Greenwood Event Center',
      latitude: 6.6697479,
      longitude: -1.5995679,
      isOnline: false,
      constructionStatus: 'under_construction',
      operatingHours: '24 hours',
      parkingBays: 2,
      rating: 5.0,
      hardware: {
        brand: 'MaxPower',
        model: 'VCP160',
        protocol: 'OCPP 1.6J',
        chargingUnits: 1,
        chargingGuns: 2,
        dynamicPowerSharing: true
      },
      amenities: ['Event Center', 'Parking Bay', 'Security', '24/7 Operation', 'Opoku Bandoh Plaza'],
      connectors: [
        {
          id: 101,
          connectorId: 1,
          connectorLabel: 'A',
          type: 'GB/T',
          maxPowerKw: 160,
          currentPowerKw: 0,
          status: 'Unavailable',
          tariffPerKwh: 4.50,
          tariffCurrency: 'GHS',
          idleFeePerMin: 0.50,
          idleGraceMinutes: 5,
          maxIdleFeeCap: 10.00
        },
        {
          id: 102,
          connectorId: 2,
          connectorLabel: 'B',
          type: 'CCS2',
          maxPowerKw: 160,
          currentPowerKw: 0,
          status: 'Unavailable',
          tariffPerKwh: 4.50,
          tariffCurrency: 'GHS',
          idleFeePerMin: 0.50,
          idleGraceMinutes: 5,
          maxIdleFeeCap: 10.00
        }
      ]
    }
  ];

  return res.status(200).json(STATIONS);
}
