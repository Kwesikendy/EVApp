export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const STATIONS = [
    {
      id: 'st-01',
      stationId: 'XC-AFR-001',
      name: 'XCharge Superhub - Airport City',
      operator: 'XCharge Grid Network',
      address: 'Liberation Rd, Airport Residential Area',
      latitude: 5.6037,
      longitude: -0.1870,
      isOnline: true,
      rating: 4.9,
      amenities: ['Coffee Lounge', 'Free Wi-Fi', 'Security 24/7', 'Restrooms', 'EV Detailing'],
      connectors: [
        {
          id: 101,
          connectorId: 1,
          type: 'CCS2',
          maxPowerKw: 160,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 4.20,
          tariffCurrency: 'GHS'
        },
        {
          id: 102,
          connectorId: 2,
          type: 'CCS2',
          maxPowerKw: 160,
          currentPowerKw: 142,
          status: 'Occupied',
          tariffPerKwh: 4.20,
          tariffCurrency: 'GHS'
        },
        {
          id: 103,
          connectorId: 3,
          type: 'CHAdeMO',
          maxPowerKw: 60,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 3.80,
          tariffCurrency: 'GHS'
        }
      ]
    },
    {
      id: 'st-02',
      stationId: 'XC-MALL-002',
      name: 'XCharge Destination - Accra Mall',
      operator: 'XCharge Grid Network',
      address: 'Tetteh Quarshie Interchange',
      latitude: 5.6225,
      longitude: -0.1740,
      isOnline: true,
      rating: 4.8,
      amenities: ['Shopping Mall', 'Cinema', 'Food Court', 'Valet Parking'],
      connectors: [
        {
          id: 201,
          connectorId: 1,
          type: 'CCS2',
          maxPowerKw: 120,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 4.10,
          tariffCurrency: 'GHS'
        },
        {
          id: 202,
          connectorId: 2,
          type: 'Type2',
          maxPowerKw: 22,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 2.90,
          tariffCurrency: 'GHS'
        }
      ]
    },
    {
      id: 'st-03',
      stationId: 'XC-IND-003',
      name: 'XCharge Freight Hub - Tema Port',
      operator: 'XCharge Fleet Logistics',
      address: 'Harbour Rd, Commercial Port Area, Tema',
      latitude: 5.5892,
      longitude: -0.2450,
      isOnline: true,
      rating: 4.7,
      amenities: ['Fleet Truck Bay', 'Driver Rest Area', 'High Clearance Canopy'],
      connectors: [
        {
          id: 301,
          connectorId: 1,
          type: 'CCS2',
          maxPowerKw: 350,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 4.00,
          tariffCurrency: 'GHS'
        },
        {
          id: 302,
          connectorId: 2,
          type: 'CCS2',
          maxPowerKw: 350,
          currentPowerKw: 280,
          status: 'Charging',
          tariffPerKwh: 4.00,
          tariffCurrency: 'GHS'
        },
        {
          id: 303,
          connectorId: 3,
          type: 'GB/T',
          maxPowerKw: 120,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 3.50,
          tariffCurrency: 'GHS'
        }
      ]
    },
    {
      id: 'st-04',
      stationId: 'XC-RES-004',
      name: 'XCharge Urban Oasis - Cantonments',
      operator: 'XCharge Grid Network',
      address: '8th Circular Rd, Cantonments',
      latitude: 5.5780,
      longitude: -0.1720,
      isOnline: true,
      rating: 4.9,
      amenities: ['Cafe & Bakery', 'Parkside Seating', 'Pet Friendly'],
      connectors: [
        {
          id: 401,
          connectorId: 1,
          type: 'CCS2',
          maxPowerKw: 120,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 3.90,
          tariffCurrency: 'GHS'
        },
        {
          id: 402,
          connectorId: 2,
          type: 'Type2',
          maxPowerKw: 22,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 2.80,
          tariffCurrency: 'GHS'
        }
      ]
    }
  ];

  return res.status(200).json(STATIONS);
}
