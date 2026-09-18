import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import type { ChargingStation, Connector, ActiveTelemetrySession, UserWallet, FleetAccount, OcppMessage } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Permissive CORS middleware for mobile APKs and external devices
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static assets from /public folder with full MIME type and byte-range support
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Explicit high-performance video streaming handler
app.get(['/electric_vehicle_charging.mp4', '/electric%20vehical%20charging.mp4', '/electric vehical charging.mp4'], (req, res) => {
  const candidateFiles = [
    path.join(publicDir, 'electric_vehicle_charging.mp4'),
    path.join(publicDir, 'electric vehical charging.mp4'),
  ];
  for (const file of candidateFiles) {
    if (fs.existsSync(file)) {
      return res.sendFile(file);
    }
  }
  res.status(404).json({ error: 'Video file not found on server' });
});

// Video upload endpoint allowing client to replace/upload custom splash video directly
app.post('/api/upload-video', express.raw({ type: '*/*', limit: '100mb' }), (req, res) => {
  try {
    const target1 = path.join(publicDir, 'electric_vehicle_charging.mp4');
    const target2 = path.join(publicDir, 'electric vehical charging.mp4');
    fs.writeFileSync(target1, req.body);
    fs.writeFileSync(target2, req.body);
    res.json({ success: true, url: '/electric_vehicle_charging.mp4' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory persistent state representing PostgreSQL / PostGIS database & CitrineOS CSMS state
const STATIONS: ChargingStation[] = [
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
        currentPowerKw: 124,
        status: 'Charging',
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
      },
      {
        id: 104,
        connectorId: 4,
        type: 'Type2',
        maxPowerKw: 22,
        currentPowerKw: 0,
        status: 'Available',
        tariffPerKwh: 2.80,
        tariffCurrency: 'GHS'
      }
    ]
  },
  {
    id: 'st-02',
    stationId: 'XC-CBD-002',
    name: 'XCharge Express - Financial Plaza',
    operator: 'XCharge Grid Network',
    address: 'High Street Commercial District',
    latitude: 5.5489,
    longitude: -0.2012,
    isOnline: true,
    rating: 4.8,
    amenities: ['Shopping Mall', 'ATM', 'Valet EV Parking'],
    connectors: [
      {
        id: 201,
        connectorId: 1,
        type: 'CCS2',
        maxPowerKw: 200,
        currentPowerKw: 0,
        status: 'Available',
        tariffPerKwh: 4.50,
        tariffCurrency: 'GHS'
      },
      {
        id: 202,
        connectorId: 2,
        type: 'CCS2',
        maxPowerKw: 200,
        currentPowerKw: 0,
        status: 'Available',
        tariffPerKwh: 4.50,
        tariffCurrency: 'GHS'
      }
    ]
  },
  {
    id: 'st-03',
    stationId: 'XC-LOG-003',
    name: 'XCharge Fleet Depot - West Logistics Corridor',
    operator: 'XCharge Commercial Systems',
    address: 'Industrial Ring Rd, Heavy Transport Hub',
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

// User Wallet with Split Wallets & Mobile Money Pre-Auth
let USER_WALLET: UserWallet = {
  userId: 'usr-xcharge-77',
  currency: 'GHS',
  availableBalance: 145.50,
  heldBalance: 0.00,
  momoProvider: 'MTN',
  phoneNumber: '+233 24 981 4421',
  transactions: [
    {
      id: 'tx-001',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      amount: 100.00,
      type: 'TOPUP',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: 'MOMO-GH-998241',
      description: 'MTN Mobile Money Top-Up (+233 24 981 4421)'
    },
    {
      id: 'tx-002',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      amount: 58.80,
      type: 'CHARGE_SETTLEMENT',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: 'SES-XC-0921',
      description: 'Charging Settlement: 14.0 kWh delivered @ Airport City Hub'
    }
  ]
};

// Corporate Fleet Account with VINs
const FLEET_ACCOUNT: FleetAccount = {
  id: 'flt-corp-01',
  companyName: 'Apex Logistics & Express EV Fleet',
  fleetCode: 'APEX-EV-ACCRA',
  billingAccountNo: 'CORP-XC-88402',
  creditLimit: 5000.00,
  currentUtilization: 1420.50,
  vehicles: [
    {
      vin: '1FTFW1ED8NFA02941',
      licensePlate: 'GT-4491-24',
      model: 'E-Transit Cargo 350',
      make: 'Ford',
      batteryCapacityKwh: 68,
      assignedDriver: 'Kwame Mensah',
      driverPhone: '+233 50 123 4567'
    },
    {
      vin: '7SAYGDEE4PF889120',
      licensePlate: 'GW-8920-23',
      model: 'Model Y Long Range',
      make: 'Tesla',
      batteryCapacityKwh: 78.1,
      assignedDriver: 'Ama Osei',
      driverPhone: '+233 24 555 7890'
    },
    {
      vin: 'LGX1C23D8M1093847',
      licensePlate: 'GN-1002-24',
      model: 'T3 Commercial Van',
      make: 'BYD',
      batteryCapacityKwh: 44.9,
      assignedDriver: 'Kofi Boateng',
      driverPhone: '+233 20 888 1122'
    }
  ]
};

// Active Session state
let ACTIVE_SESSION: ActiveTelemetrySession | null = null;

// Real-time OCPP Messages Audit Trail
const OCPP_LOGS: OcppMessage[] = [
  {
    id: 'ocpp-01',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    direction: 'INCOMING',
    action: 'BootNotification',
    payload: {
      chargePointVendor: 'XCharge Tech',
      chargePointModel: 'C9-Pro-160kW',
      chargePointSerialNumber: 'XC-2024-00188',
      firmwareVersion: 'v3.8.4-citrineos'
    }
  },
  {
    id: 'ocpp-02',
    timestamp: new Date(Date.now() - 3590000).toISOString(),
    direction: 'OUTGOING',
    action: 'BootNotification',
    payload: {
      status: 'Accepted',
      currentTime: new Date().toISOString(),
      interval: 60
    }
  },
  {
    id: 'ocpp-03',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    direction: 'INCOMING',
    action: 'StatusNotification',
    payload: {
      connectorId: 1,
      errorCode: 'NoError',
      status: 'Available',
      timestamp: new Date().toISOString()
    }
  }
];

// Simulation multiplier for testing (1x = real-time, 5x = rapid, 10x = demo turbo)
let SIMULATION_SPEED = 1;

// Background session ticker: increments kWh and calculates real-time electrical telemetry
setInterval(() => {
  if (ACTIVE_SESSION && ACTIVE_SESSION.status === 'Charging') {
    ACTIVE_SESSION.elapsedSeconds += 1;

    // Taper power when battery exceeds 80% SoC (realistic EV BMS curve)
    if (ACTIVE_SESSION.currentSocPercent > 80) {
      const taperRatio = Math.max(0.25, (100 - ACTIVE_SESSION.currentSocPercent) / 20);
      ACTIVE_SESSION.currentPowerKw = Math.round(ACTIVE_SESSION.currentPowerKw * taperRatio * 10) / 10;
    }

    // Deliver energy: (power / 3600 per second) * simulation multiplier
    const kwhAdded = (ACTIVE_SESSION.currentPowerKw / 3600) * SIMULATION_SPEED;
    ACTIVE_SESSION.kwhDelivered += kwhAdded;

    // Dynamic electrical characteristics (400V architecture with slight AC-to-DC grid ripple)
    ACTIVE_SESSION.voltageV = +(401.2 + Math.sin(ACTIVE_SESSION.elapsedSeconds / 2) * 1.8).toFixed(1);
    ACTIVE_SESSION.currentA = +((ACTIVE_SESSION.currentPowerKw * 1000) / ACTIVE_SESSION.voltageV).toFixed(1);

    // Estimate battery SoC increase (assuming standard 75 kWh battery pack)
    const targetCapacity = 75; // kWh baseline
    const socIncrement = (kwhAdded / targetCapacity) * 100;
    if (ACTIVE_SESSION.currentSocPercent < ACTIVE_SESSION.targetSocPercent) {
      ACTIVE_SESSION.currentSocPercent = Math.min(
        ACTIVE_SESSION.targetSocPercent,
        +(ACTIVE_SESSION.currentSocPercent + socIncrement).toFixed(2)
      );
    }

    // Accrued cost calculation
    const currentStation = STATIONS.find(s => s.stationId === ACTIVE_SESSION?.stationId);
    const connector = currentStation?.connectors.find(c => c.connectorId === ACTIVE_SESSION?.connectorId);
    const rate = connector?.tariffPerKwh || 4.20;
    ACTIVE_SESSION.accruedCost = +(ACTIVE_SESSION.kwhDelivered * rate).toFixed(2);

    // Add periodic MeterValue packet to telemetry log every 3 seconds
    if (ACTIVE_SESSION.elapsedSeconds % 3 === 0) {
      ACTIVE_SESSION.meterValuesLog.push({
        timestamp: new Date().toISOString(),
        soc: Math.round(ACTIVE_SESSION.currentSocPercent * 10) / 10,
        powerKw: Math.round(ACTIVE_SESSION.currentPowerKw * 10) / 10,
        kwhTotal: Math.round(ACTIVE_SESSION.kwhDelivered * 1000) / 1000
      });
      if (ACTIVE_SESSION.meterValuesLog.length > 30) {
        ACTIVE_SESSION.meterValuesLog.shift();
      }

      // Append to CSMS OCPP audit log
      OCPP_LOGS.unshift({
        id: `mv-${Date.now()}`,
        timestamp: new Date().toISOString(),
        direction: 'INCOMING',
        action: 'MeterValues',
        payload: {
          connectorId: ACTIVE_SESSION.connectorId,
          transactionId: 98421,
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [
                { value: ACTIVE_SESSION.kwhDelivered.toFixed(3), unit: 'kWh', measurand: 'Energy.Active.Import.Register' },
                { value: ACTIVE_SESSION.currentPowerKw.toFixed(1), unit: 'kW', measurand: 'Power.Active.Import' },
                { value: ACTIVE_SESSION.currentSocPercent.toFixed(1), unit: 'Percent', measurand: 'SoC' },
                { value: ACTIVE_SESSION.voltageV.toString(), unit: 'V', measurand: 'Voltage' },
                { value: ACTIVE_SESSION.currentA.toString(), unit: 'A', measurand: 'Current.Import' }
              ]
            }
          ]
        }
      });
      if (OCPP_LOGS.length > 50) OCPP_LOGS.pop();
    }
  }
}, 1000);

// --- API ROUTES ---

// Health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'xcharge-ev-backend',
    citrineOsBridge: 'CONNECTED',
    ocppVersion: 'OCPP 1.6J / 2.0.1',
    activeSessions: ACTIVE_SESSION ? 1 : 0
  });
});

// Stations list (Supports geospatial proximity simulation)
app.get('/api/stations', (req, res) => {
  const { lat, lng, type } = req.query;
  let results = [...STATIONS];

  if (type) {
    results = results.filter(s =>
      s.connectors.some(c => c.type.toLowerCase() === (type as string).toLowerCase())
    );
  }

  // Calculate distance if lat and lng provided
  if (lat && lng) {
    const uLat = parseFloat(lat as string);
    const uLng = parseFloat(lng as string);
    results = results.map(st => {
      // Haversine formula
      const R = 6371; // km
      const dLat = ((st.latitude - uLat) * Math.PI) / 180;
      const dLng = ((st.longitude - uLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((uLat * Math.PI) / 180) *
          Math.cos((st.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return {
        ...st,
        distanceKm: Math.round(R * c * 10) / 10
      };
    });
    results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

  res.json(results);
});

// Get single station
app.get('/api/stations/:id', (req, res) => {
  const station = STATIONS.find(s => s.id === req.params.id || s.stationId === req.params.id);
  if (!station) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }
  res.json(station);
});

// Admin: Create new charging station
app.post('/api/stations', (req, res) => {
  const { name, stationId, operator, address, latitude, longitude, connectors, amenities } = req.body;
  if (!name || !latitude || !longitude) {
    res.status(400).json({ error: 'Name, latitude, and longitude are required.' });
    return;
  }

  const newId = `st-${Date.now()}`;
  const generatedStationId = stationId || `EV-ST-${Math.floor(100 + Math.random() * 900)}`;

  const formattedConnectors: Connector[] = (connectors && connectors.length > 0)
    ? connectors.map((c: any, index: number) => ({
        id: Date.now() + index,
        connectorId: c.connectorId || index + 1,
        type: c.type || 'CCS2',
        maxPowerKw: Number(c.maxPowerKw) || 150,
        currentPowerKw: 0,
        status: (c.status || 'Available') as any,
        tariffPerKwh: Number(c.tariffPerKwh) || 0.30,
        tariffCurrency: c.tariffCurrency || 'USD'
      }))
    : [
        {
          id: Date.now(),
          connectorId: 1,
          type: 'CCS2',
          maxPowerKw: 150,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 0.30,
          tariffCurrency: 'USD'
        },
        {
          id: Date.now() + 1,
          connectorId: 2,
          type: 'CCS2',
          maxPowerKw: 150,
          currentPowerKw: 0,
          status: 'Available',
          tariffPerKwh: 0.30,
          tariffCurrency: 'USD'
        }
      ];

  const newStation: ChargingStation = {
    id: newId,
    stationId: generatedStationId,
    name,
    operator: operator || 'EnergyGrid Network',
    address: address || 'Main Highway Plaza',
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    isOnline: true,
    rating: 5.0,
    amenities: amenities && amenities.length > 0 ? amenities : ['Restrooms', '24/7 Security', 'Convenience Store'],
    connectors: formattedConnectors
  };

  STATIONS.unshift(newStation);
  res.status(201).json({ success: true, station: newStation });
});

// Admin: Update station
app.put('/api/stations/:id', (req, res) => {
  const index = STATIONS.findIndex(s => s.id === req.params.id || s.stationId === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }

  const existing = STATIONS[index];
  const { name, operator, address, latitude, longitude, isOnline, amenities, connectors } = req.body;

  STATIONS[index] = {
    ...existing,
    name: name ?? existing.name,
    operator: operator ?? existing.operator,
    address: address ?? existing.address,
    latitude: latitude ? parseFloat(latitude) : existing.latitude,
    longitude: longitude ? parseFloat(longitude) : existing.longitude,
    isOnline: isOnline !== undefined ? Boolean(isOnline) : existing.isOnline,
    amenities: amenities ?? existing.amenities,
    connectors: connectors ?? existing.connectors
  };

  res.json({ success: true, station: STATIONS[index] });
});

// Admin: Delete station
app.delete('/api/stations/:id', (req, res) => {
  const index = STATIONS.findIndex(s => s.id === req.params.id || s.stationId === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }
  const deleted = STATIONS.splice(index, 1)[0];
  res.json({ success: true, deletedStationId: deleted.id });
});

// Get Wallet
app.get('/api/wallet', (_req, res) => {
  res.json(USER_WALLET);
});

// Mobile Money / Card Top-up
app.post('/api/wallet/topup', (req, res) => {
  const { amount, provider, phone } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: 'Invalid top-up amount' });
    return;
  }

  USER_WALLET.availableBalance = +(USER_WALLET.availableBalance + numAmount).toFixed(2);
  const tx = {
    id: `tx-${Date.now()}`,
    timestamp: new Date().toISOString(),
    amount: numAmount,
    type: 'TOPUP' as const,
    status: 'SUCCESS' as const,
    provider: (provider || 'MOMO') as 'MOMO' | 'CARD',
    reference: `MOMO-GH-${Math.floor(100000 + Math.random() * 900000)}`,
    description: `${provider || 'MTN MoMo'} Top-up (${phone || USER_WALLET.phoneNumber})`
  };
  USER_WALLET.transactions.unshift(tx);

  res.json({ success: true, wallet: USER_WALLET, transaction: tx });
});

// Interactive Real-Time Ghana Mobile Money USSD Push Initiation
app.post('/api/wallet/momo-initiate', (req, res) => {
  const { amount, provider = 'MTN', phone = '+233 24 981 4421' } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: 'Invalid payment amount' });
    return;
  }

  const txId = `momo-req-${Date.now()}`;
  const networkRef = `GH-${provider.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  res.json({
    success: true,
    transactionId: txId,
    status: 'PENDING',
    amount: numAmount,
    currency: 'GHS',
    provider,
    phoneNumber: phone,
    networkReference: networkRef,
    merchantName: 'XCHARGE GHANA LTD',
    ussdPrompt: `Authorize payment of GHS ${numAmount.toFixed(2)} to XCHARGE GHANA LTD? Reference: ${networkRef}. Enter Mobile Money PIN:`,
    timeoutSeconds: 60,
    timestamp: new Date().toISOString(),
  });
});

// Interactive Real-Time Ghana Mobile Money Confirmation & Settlement
app.post('/api/wallet/momo-confirm', (req, res) => {
  const { transactionId, amount, provider = 'MTN', phone = '+233 24 981 4421', pin } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: 'Invalid payment amount' });
    return;
  }

  USER_WALLET.availableBalance = +(USER_WALLET.availableBalance + numAmount).toFixed(2);
  const approvalCode = `${provider.toUpperCase()}-AUTH-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const tx = {
    id: transactionId || `tx-${Date.now()}`,
    timestamp: new Date().toISOString(),
    amount: numAmount,
    type: 'TOPUP' as const,
    status: 'SUCCESS' as const,
    provider: (provider.toUpperCase() === 'CARD' ? 'CARD' : 'MOMO') as 'MOMO' | 'CARD',
    reference: approvalCode,
    description: `${provider} MoMo Top-up (${phone}) · Approved`
  };

  USER_WALLET.transactions.unshift(tx);

  res.json({
    success: true,
    status: 'SUCCESS',
    approvalCode,
    graTaxInvoice: `GRA-ELEV-EXEMPT-${Math.floor(10000 + Math.random() * 90000)}`,
    settledAmount: numAmount,
    currency: 'GHS',
    wallet: USER_WALLET,
    transaction: tx,
  });
});

// Fleet Accounts
app.get('/api/fleet', (_req, res) => {
  res.json(FLEET_ACCOUNT);
});

// Active Session
app.get('/api/session/active', (_req, res) => {
  res.json({ session: ACTIVE_SESSION });
});

// OCPP Remote Start Transaction with Pre-Auth Hold
app.post('/api/ocpp/remote-start', (req, res) => {
  const { stationId, connectorId, isFleet, vin, preauthHoldAmount = 25 } = req.body;

  if (ACTIVE_SESSION) {
    res.status(400).json({ error: 'An active charging session is already in progress' });
    return;
  }

  const station = STATIONS.find(s => s.stationId === stationId || s.id === stationId);
  if (!station) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }

  const connector = station.connectors.find(c => c.connectorId === Number(connectorId));
  if (!connector) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }

  if (connector.status !== 'Available') {
    res.status(400).json({ error: `Connector ${connectorId} is currently ${connector.status}` });
    return;
  }

  // Pre-authorization verification
  if (!isFleet) {
    if (USER_WALLET.availableBalance < preauthHoldAmount) {
      res.status(402).json({
        error: 'Insufficient wallet balance for pre-authorization hold',
        required: preauthHoldAmount,
        available: USER_WALLET.availableBalance,
        message: 'Please top up your wallet via Mobile Money or Card before unlocking.'
      });
      return;
    }

    // Execute Hold on Wallet
    USER_WALLET.availableBalance = +(USER_WALLET.availableBalance - preauthHoldAmount).toFixed(2);
    USER_WALLET.heldBalance = +(USER_WALLET.heldBalance + preauthHoldAmount).toFixed(2);
    USER_WALLET.transactions.unshift({
      id: `hold-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: preauthHoldAmount,
      type: 'PREAUTH_HOLD',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: `PREAUTH-${Date.now()}`,
      description: `Security hold of GH₵ ${preauthHoldAmount.toFixed(2)} at ${station.name}`
    });
  }

  // Update connector status
  connector.status = 'Charging';
  connector.currentPowerKw = Math.min(connector.maxPowerKw, 120);

  // Create active session
  ACTIVE_SESSION = {
    sessionId: `ses-${Date.now()}`,
    stationId: station.stationId,
    connectorId: connector.connectorId,
    userId: USER_WALLET.userId,
    isFleetSession: !!isFleet,
    fleetVin: vin || (isFleet ? FLEET_ACCOUNT.vehicles[0].vin : undefined),
    startTime: Date.now(),
    elapsedSeconds: 0,
    currentSocPercent: isFleet ? 32 : 28,
    targetSocPercent: 85,
    currentPowerKw: connector.currentPowerKw,
    voltageV: 400.2,
    currentA: (connector.currentPowerKw * 1000) / 400.2,
    kwhDelivered: 0.05,
    accruedCost: 0.21,
    currency: 'GHS',
    preauthHoldAmount: isFleet ? 0 : preauthHoldAmount,
    status: 'Charging',
    meterValuesLog: [
      {
        timestamp: new Date().toISOString(),
        soc: isFleet ? 32 : 28,
        powerKw: connector.currentPowerKw,
        kwhTotal: 0.05
      }
    ]
  };

  // Add CSMS OCPP Action log
  OCPP_LOGS.unshift({
    id: `ocpp-start-${Date.now()}`,
    timestamp: new Date().toISOString(),
    direction: 'OUTGOING',
    action: 'RemoteStartTransaction',
    payload: {
      connectorId: connector.connectorId,
      idTag: isFleet ? `FLEET-VIN-${vin || 'GENERIC'}` : `USER-RFID-991`,
      chargingProfile: {
        chargingProfileId: 1,
        stackLevel: 0,
        chargingProfilePurpose: 'TxDefaultProfile'
      }
    }
  });

  OCPP_LOGS.unshift({
    id: `ocpp-stat-${Date.now()}`,
    timestamp: new Date().toISOString(),
    direction: 'INCOMING',
    action: 'StatusNotification',
    payload: {
      connectorId: connector.connectorId,
      errorCode: 'NoError',
      status: 'Charging',
      timestamp: new Date().toISOString()
    }
  });

  res.json({
    success: true,
    message: 'Connector unlocked. Charging initiated via CitrineOS OCPP CSMS.',
    session: ACTIVE_SESSION,
    wallet: USER_WALLET
  });
});

// OCPP Remote Stop Transaction with Settlement & Release of Hold
app.post('/api/ocpp/remote-stop', (req, res) => {
  if (!ACTIVE_SESSION) {
    res.status(400).json({ error: 'No active session to stop' });
    return;
  }

  const session = { ...ACTIVE_SESSION };
  const station = STATIONS.find(s => s.stationId === session.stationId);
  const connector = station?.connectors.find(c => c.connectorId === session.connectorId);

  if (connector) {
    connector.status = 'Available';
    connector.currentPowerKw = 0;
  }

  // Financial reconciliation:
  if (!session.isFleetSession) {
    const actualCost = Math.round(session.accruedCost * 100) / 100;
    const holdAmount = session.preauthHoldAmount;

    // Release pre-auth hold
    USER_WALLET.heldBalance = Math.max(0, +(USER_WALLET.heldBalance - holdAmount).toFixed(2));

    // Charge actual cost from wallet
    // Difference refund
    const refund = +(holdAmount - actualCost).toFixed(2);
    if (refund > 0) {
      USER_WALLET.availableBalance = +(USER_WALLET.availableBalance + refund).toFixed(2);
    } else {
      USER_WALLET.availableBalance = +(USER_WALLET.availableBalance - (actualCost - holdAmount)).toFixed(2);
    }

    USER_WALLET.transactions.unshift({
      id: `rel-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: holdAmount,
      type: 'PREAUTH_RELEASE',
      status: 'RELEASED',
      provider: 'MOMO',
      reference: `REL-${Date.now()}`,
      description: `Release of GH₵ ${holdAmount.toFixed(2)} pre-auth security hold`
    });

    USER_WALLET.transactions.unshift({
      id: `settle-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: actualCost,
      type: 'CHARGE_SETTLEMENT',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: `STMT-${session.sessionId}`,
      description: `Settlement: ${session.kwhDelivered.toFixed(2)} kWh consumed (GH₵ ${actualCost.toFixed(2)})`
    });
  } else {
    // Commercial Fleet billing ledger
    FLEET_ACCOUNT.currentUtilization += session.accruedCost;
  }

  // Push OCPP Logs
  OCPP_LOGS.unshift({
    id: `ocpp-stop-${Date.now()}`,
    timestamp: new Date().toISOString(),
    direction: 'OUTGOING',
    action: 'RemoteStopTransaction',
    payload: {
      transactionId: 98421
    }
  });

  OCPP_LOGS.unshift({
    id: `ocpp-avail-${Date.now()}`,
    timestamp: new Date().toISOString(),
    direction: 'INCOMING',
    action: 'StatusNotification',
    payload: {
      connectorId: session.connectorId,
      errorCode: 'NoError',
      status: 'Available',
      timestamp: new Date().toISOString()
    }
  });

  ACTIVE_SESSION = null;

  res.json({
    success: true,
    message: 'Session terminated. Connector locked. Financial settlement finalized.',
    completedSession: session,
    wallet: USER_WALLET
  });
});

// OCPP Audit Logs
app.get('/api/ocpp/logs', (_req, res) => {
  res.json(OCPP_LOGS);
});

// Inject simulated hardware event (Task 4 test runner)
app.post('/api/ocpp/inject-event', (req, res) => {
  const { action, payload, direction = 'INCOMING' } = req.body;
  const msg: OcppMessage = {
    id: `sim-${Date.now()}`,
    timestamp: new Date().toISOString(),
    direction,
    action,
    payload: payload || {}
  };
  OCPP_LOGS.unshift(msg);

  // If status notification affects a connector, update it
  if (action === 'StatusNotification' && payload?.connectorId) {
    const connId = Number(payload.connectorId);
    STATIONS.forEach(s => {
      s.connectors.forEach(c => {
        if (c.connectorId === connId && payload.status) {
          c.status = payload.status;
        }
      });
    });
  }

  res.json({ success: true, message: msg });
});

// --- HARDWARE SIMULATION ENGINE ENDPOINTS ---

// Simulator Status & Diagnostics
app.get('/api/simulator/status', (_req, res) => {
  res.json({
    simulationSpeed: SIMULATION_SPEED,
    activeSession: ACTIVE_SESSION,
    totalStations: STATIONS.length,
    availableStations: STATIONS.filter(s => s.isOnline && s.connectors.some(c => c.status === 'Available')).length,
    recentOcppPackets: OCPP_LOGS.slice(0, 10),
  });
});

// Start Simulated Session directly (with optional speed, initial SoC, target SoC, power)
app.post('/api/simulator/start', (req, res) => {
  const {
    stationId = STATIONS[0]?.stationId || 'XC-AFR-001',
    connectorId = 1,
    initialSoc = 24,
    targetSoc = 85,
    powerKw = 160,
    speedMultiplier = 1,
    isFleet = false
  } = req.body;

  SIMULATION_SPEED = Math.max(1, Math.min(20, Number(speedMultiplier) || 1));

  const station = STATIONS.find(s => s.stationId === stationId || s.id === stationId) || STATIONS[0];
  const connector = station.connectors.find(c => c.connectorId === Number(connectorId)) || station.connectors[0];

  connector.status = 'Charging';
  connector.currentPowerKw = Number(powerKw) || connector.maxPowerKw;

  const currentVoltage = 400.8;
  const currentAmps = +((connector.currentPowerKw * 1000) / currentVoltage).toFixed(1);

  ACTIVE_SESSION = {
    sessionId: `sim-ses-${Date.now()}`,
    stationId: station.stationId,
    connectorId: connector.connectorId,
    userId: USER_WALLET.userId,
    isFleetSession: !!isFleet,
    fleetVin: isFleet ? FLEET_ACCOUNT.vehicles[0].vin : undefined,
    startTime: Date.now(),
    elapsedSeconds: 0,
    currentSocPercent: Number(initialSoc) || 24,
    targetSocPercent: Number(targetSoc) || 85,
    currentPowerKw: connector.currentPowerKw,
    voltageV: currentVoltage,
    currentA: currentAmps,
    kwhDelivered: 0.01,
    accruedCost: 0.01,
    currency: 'USD',
    preauthHoldAmount: 25.00,
    status: 'Charging',
    meterValuesLog: [
      {
        timestamp: new Date().toISOString(),
        soc: Number(initialSoc) || 24,
        powerKw: connector.currentPowerKw,
        kwhTotal: 0.01
      }
    ]
  };

  OCPP_LOGS.unshift({
    id: `sim-start-${Date.now()}`,
    timestamp: new Date().toISOString(),
    direction: 'INCOMING',
    action: 'SimulatedSessionStarted',
    payload: {
      station: station.name,
      stationId: station.stationId,
      connectorId: connector.connectorId,
      maxPowerKw: connector.maxPowerKw,
      simulationSpeed: `${SIMULATION_SPEED}x`
    }
  });

  res.json({
    success: true,
    message: `Simulation initiated at ${station.name} (${connector.maxPowerKw} kW) at ${SIMULATION_SPEED}x speed`,
    session: ACTIVE_SESSION,
    simulationSpeed: SIMULATION_SPEED
  });
});

// Adjust Simulation Speed (1x, 5x, 10x, etc.)
app.post('/api/simulator/speed', (req, res) => {
  const { multiplier } = req.body;
  const val = Number(multiplier);
  if (!isNaN(val) && val >= 1 && val <= 50) {
    SIMULATION_SPEED = val;
    res.json({ success: true, simulationSpeed: SIMULATION_SPEED });
  } else {
    res.status(400).json({ error: 'Multiplier must be a number between 1 and 50' });
  }
});

// Adjust Charging Power / Speed (e.g. 50kW, 150kW, 240kW)
app.post('/api/simulator/power', (req, res) => {
  const { powerKw } = req.body;
  const val = Number(powerKw);
  if (ACTIVE_SESSION && !isNaN(val) && val > 0) {
    ACTIVE_SESSION.currentPowerKw = val;
    ACTIVE_SESSION.currentA = +((val * 1000) / ACTIVE_SESSION.voltageV).toFixed(1);
    res.json({ success: true, currentPowerKw: val, currentA: ACTIVE_SESSION.currentA });
  } else {
    res.status(400).json({ error: 'No active session or invalid powerKw' });
  }
});

// Stop simulated session
app.post('/api/simulator/stop', (req, res) => {
  if (!ACTIVE_SESSION) {
    res.status(400).json({ error: 'No active session to stop' });
    return;
  }

  const finished = { ...ACTIVE_SESSION };
  const station = STATIONS.find(s => s.stationId === finished.stationId);
  const connector = station?.connectors.find(c => c.connectorId === finished.connectorId);
  if (connector) {
    connector.status = 'Available';
    connector.currentPowerKw = 0;
  }

  ACTIVE_SESSION = null;

  OCPP_LOGS.unshift({
    id: `sim-stop-${Date.now()}`,
    timestamp: new Date().toISOString(),
    direction: 'INCOMING',
    action: 'SimulatedSessionCompleted',
    payload: {
      kwhDelivered: finished.kwhDelivered.toFixed(3),
      finalSoc: finished.currentSocPercent.toFixed(1),
      accruedCost: finished.accruedCost.toFixed(2),
      durationSeconds: finished.elapsedSeconds
    }
  });

  res.json({
    success: true,
    message: 'Simulation session stopped and connector returned to Available.',
    session: finished
  });
});

// --- AUTHENTICATION & MOOLRE OTP ENDPOINTS ---
import { sendOtp, verifyOtp, getUserProfile, updateUserProfile, normalizeGhanaPhoneNumber } from './server/auth';

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    const result = await sendOtp(phoneNumber);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, error: 'Phone number and verification code are required' });
    }
    const result = verifyOtp(phoneNumber, code);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/user/profile', (req, res) => {
  const phone = (req.query.phoneNumber as string) || '+233248901204';
  const profile = getUserProfile(phone);
  if (!profile) {
    return res.status(404).json({ error: 'User profile not found' });
  }
  res.json(profile);
});

app.put('/api/user/profile', (req, res) => {
  const phone = req.body.phoneNumber;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }
  const updated = updateUserProfile(phone, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(updated);
});

// --- VITE & SERVER STARTUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[XCharge Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
