import fs from 'fs';

const OCPP_STATE_FILE = '/tmp/xcharge-data/ocpp-state.json';

const DEFAULT_STATIONS = [
  {
    id: 'st-01',
    stationId: 'CL-KSI-001',
    chargeBoxId: 'CL-KSI-001',
    pileNumber: '19046744073709551615',
    name: 'Greenwood Event Center Station 1',
    imageUrl: '/stations/greenwood-site.jpg',
    operator: 'ChargeLink GH',
    address: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi',
    latitude: 6.6697479,
    longitude: -1.5995679,
    isOnline: true,
    ocppVersion: '1.6J',
    vendor: 'MaxPower',
    model: 'VCP160 Dual-Gun DC Fast Charger (160kW)',
    firmwareVersion: 'MP-VCP160-OCPP16J-v2.4.8',
    serialNumber: 'MP160-GH-KSI-2026001',
    meterType: 'DC-DIN-4Q-160KW',
    networkMode: '2.Ethernet (4G/LAN)',
    rating: 5.0,
    amenities: [
      'Event Center',
      'Parking Bay',
      'Security',
      '24/7 Operation',
      'Opoku Bandoh Plaza',
      'OCPP 1.6J Live',
    ],
    connectors: [
      {
        id: 101,
        connectorId: 1,
        label: 'Outlet A',
        imageUrl: '/stations/station1-outlet-a.jpg',
        type: 'GB/T',
        maxPowerKw: 160,
        currentPowerKw: 0,
        status: 'Available',
        errorCode: 'NoError',
        tariffPerKwh: 4.50,
        tariffGhsPerKwh: 4.50,
        tariffCurrency: 'GHS',
      },
      {
        id: 102,
        connectorId: 2,
        label: 'Outlet B',
        imageUrl: '/stations/station1-outlet-b.jpg',
        type: 'CCS2',
        maxPowerKw: 160,
        currentPowerKw: 0,
        status: 'Available',
        errorCode: 'NoError',
        tariffPerKwh: 4.50,
        tariffGhsPerKwh: 4.50,
        tariffCurrency: 'GHS',
      },
    ],
  },
  {
    id: 'st-02',
    stationId: 'CL-KSI-002',
    chargeBoxId: 'CL-KSI-002',
    pileNumber: 'CL-KSI-002',
    name: 'Greenwood Event Center Station 2',
    imageUrl: '/stations/station2-40kw.jpg',
    operator: 'ChargeLink GH',
    address: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi',
    latitude: 6.6697479,
    longitude: -1.5995679,
    isOnline: true,
    ocppVersion: '1.6J',
    vendor: 'MaxPower',
    model: 'DC Fast Charger (40kW)',
    firmwareVersion: 'Awaiting BootNotification',
    serialNumber: 'Awaiting BootNotification',
    meterType: 'DC-40KW',
    networkMode: '2.Ethernet (4G/LAN)',
    rating: 5.0,
    amenities: [
      'Event Center',
      'Parking Bay',
      'Security',
      '24/7 Operation',
      'Opoku Bandoh Plaza',
      'OCPP 1.6J Live',
    ],
    connectors: [
      {
        id: 201,
        connectorId: 1,
        label: 'Outlet A',
        type: 'GB/T',
        maxPowerKw: 40,
        currentPowerKw: 0,
        status: 'Available',
        errorCode: 'NoError',
        tariffPerKwh: 4.50,
        tariffGhsPerKwh: 4.50,
        tariffCurrency: 'GHS',
      },
    ],
  },
];

function loadStations() {
  try {
    if (fs.existsSync(OCPP_STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(OCPP_STATE_FILE, 'utf8'));
      if (Array.isArray(parsed.stations) && parsed.stations.length > 0) {
        return parsed.stations;
      }
    }
  } catch {
    // Fallback to default stations
  }
  return DEFAULT_STATIONS;
}

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { lat, lng, type } = req.query || {};
  let results = [...loadStations()];

  if (type) {
    results = results.filter((s: any) =>
      s.connectors.some((c: any) => c.type.toLowerCase() === String(type).toLowerCase())
    );
  }

  if (lat && lng) {
    const uLat = parseFloat(String(lat));
    const uLng = parseFloat(String(lng));
    results = results.map((st: any) => {
      const R = 6371;
      const dLat = ((st.latitude - uLat) * Math.PI) / 180;
      const dLng = ((st.longitude - uLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((uLat * Math.PI) / 180) *
          Math.cos((st.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...st, distanceKm: Math.round(R * c * 10) / 10 };
    });
    results.sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

  return res.status(200).json(results);
}
