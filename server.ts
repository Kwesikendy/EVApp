import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type { ChargingStation, ActiveTelemetrySession, UserWallet, FleetAccount, OcppMessage } from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3040;

app.use(express.json());

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
        tariffPerKwh: 0.32,
        tariffCurrency: 'USD'
      },
      {
        id: 102,
        connectorId: 2,
        type: 'CCS2',
        maxPowerKw: 160,
        currentPowerKw: 124,
        status: 'Charging',
        tariffPerKwh: 0.32,
        tariffCurrency: 'USD'
      },
      {
        id: 103,
        connectorId: 3,
        type: 'CHAdeMO',
        maxPowerKw: 60,
        currentPowerKw: 0,
        status: 'Available',
        tariffPerKwh: 0.28,
        tariffCurrency: 'USD'
      },
      {
        id: 104,
        connectorId: 4,
        type: 'Type2',
        maxPowerKw: 22,
        currentPowerKw: 0,
        status: 'Available',
        tariffPerKwh: 0.20,
        tariffCurrency: 'USD'
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
        tariffPerKwh: 0.35,
        tariffCurrency: 'USD'
      },
      {
        id: 202,
        connectorId: 2,
        type: 'CCS2',
        maxPowerKw: 200,
        currentPowerKw: 0,
        status: 'Available',
        tariffPerKwh: 0.35,
        tariffCurrency: 'USD'
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
        tariffPerKwh: 0.30,
        tariffCurrency: 'USD'
      },
      {
        id: 302,
        connectorId: 2,
        type: 'CCS2',
        maxPowerKw: 350,
        currentPowerKw: 280,
        status: 'Charging',
        tariffPerKwh: 0.30,
        tariffCurrency: 'USD'
      },
      {
        id: 303,
        connectorId: 3,
        type: 'GB/T',
        maxPowerKw: 120,
        currentPowerKw: 0,
        status: 'Available',
        tariffPerKwh: 0.25,
        tariffCurrency: 'USD'
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
        tariffPerKwh: 0.33,
        tariffCurrency: 'USD'
      },
      {
        id: 402,
        connectorId: 2,
        type: 'Type2',
        maxPowerKw: 22,
        currentPowerKw: 0,
        status: 'Available',
        tariffPerKwh: 0.22,
        tariffCurrency: 'USD'
      }
    ]
  }
];

// User Wallet with Split Wallets & Mobile Money Pre-Auth
let USER_WALLET: UserWallet = {
  userId: 'usr-xcharge-77',
  currency: 'USD',
  availableBalance: 45.50,
  heldBalance: 0.00,
  momoProvider: 'MTN',
  phoneNumber: '+233 24 981 4421',
  transactions: [
    {
      id: 'tx-001',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      amount: 50.00,
      type: 'TOPUP',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: 'MOMO-GH-998241',
      description: 'MTN Mobile Money Wallet Top-Up'
    },
    {
      id: 'tx-002',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      amount: 14.80,
      type: 'CHARGE_SETTLEMENT',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: 'SES-XC-0921',
      description: 'Charging Settlement: 46.2 kWh delivered @ XC-AFR-001'
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

// Background session ticker: increments kWh and checks hold amount
setInterval(() => {
  if (ACTIVE_SESSION && ACTIVE_SESSION.status === 'Charging') {
    ACTIVE_SESSION.elapsedSeconds += 1;
    // Deliver energy: power / 3600 per second
    const kwhAdded = ACTIVE_SESSION.currentPowerKw / 3600;
    ACTIVE_SESSION.kwhDelivered += kwhAdded;

    // Estimate battery SoC increase
    const targetCapacity = 75; // kWh battery baseline
    const socIncrement = (kwhAdded / targetCapacity) * 100;
    if (ACTIVE_SESSION.currentSocPercent < ACTIVE_SESSION.targetSocPercent) {
      ACTIVE_SESSION.currentSocPercent = Math.min(
        ACTIVE_SESSION.targetSocPercent,
        ACTIVE_SESSION.currentSocPercent + socIncrement
      );
    }

    // Accrued cost calculation
    const currentStation = STATIONS.find(s => s.stationId === ACTIVE_SESSION?.stationId);
    const connector = currentStation?.connectors.find(c => c.connectorId === ACTIVE_SESSION?.connectorId);
    const rate = connector?.tariffPerKwh || 0.32;
    ACTIVE_SESSION.accruedCost = ACTIVE_SESSION.kwhDelivered * rate;

    // Add periodic MeterValue packet to telemetry log every 5 seconds
    if (ACTIVE_SESSION.elapsedSeconds % 5 === 0) {
      ACTIVE_SESSION.meterValuesLog.push({
        timestamp: new Date().toISOString(),
        soc: Math.round(ACTIVE_SESSION.currentSocPercent * 10) / 10,
        powerKw: Math.round(ACTIVE_SESSION.currentPowerKw * 10) / 10,
        kwhTotal: Math.round(ACTIVE_SESSION.kwhDelivered * 1000) / 1000
      });

      // Also append to CSMS OCPP log
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
                { value: '398.4', unit: 'V', measurand: 'Voltage' },
                { value: '142.1', unit: 'A', measurand: 'Current.Import' }
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

  USER_WALLET.availableBalance += numAmount;
  const tx = {
    id: `tx-${Date.now()}`,
    timestamp: new Date().toISOString(),
    amount: numAmount,
    type: 'TOPUP' as const,
    status: 'SUCCESS' as const,
    provider: (provider || 'MOMO') as 'MOMO' | 'CARD',
    reference: `MOMO-REF-${Math.floor(100000 + Math.random() * 900000)}`,
    description: `${provider || 'Mobile Money'} Top-up (${phone || USER_WALLET.phoneNumber})`
  };
  USER_WALLET.transactions.unshift(tx);

  res.json({ success: true, wallet: USER_WALLET, transaction: tx });
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
  const { stationId, connectorId, isFleet, vin, preauthHoldAmount = 20 } = req.body;

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
    USER_WALLET.availableBalance -= preauthHoldAmount;
    USER_WALLET.heldBalance += preauthHoldAmount;
    USER_WALLET.transactions.unshift({
      id: `hold-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: preauthHoldAmount,
      type: 'PREAUTH_HOLD',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: `PREAUTH-${Date.now()}`,
      description: `Hold of $${preauthHoldAmount.toFixed(2)} for charging at ${station.name}`
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
    accruedCost: 0.02,
    currency: 'USD',
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
    USER_WALLET.heldBalance = Math.max(0, USER_WALLET.heldBalance - holdAmount);

    // Charge actual cost from wallet
    // Difference refund
    const refund = holdAmount - actualCost;
    if (refund > 0) {
      USER_WALLET.availableBalance += refund;
    } else {
      USER_WALLET.availableBalance -= (actualCost - holdAmount);
    }

    USER_WALLET.transactions.unshift({
      id: `rel-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: holdAmount,
      type: 'PREAUTH_RELEASE',
      status: 'RELEASED',
      provider: 'MOMO',
      reference: `REL-${Date.now()}`,
      description: `Release of $${holdAmount.toFixed(2)} pre-auth hold`
    });

    USER_WALLET.transactions.unshift({
      id: `settle-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: actualCost,
      type: 'CHARGE_SETTLEMENT',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: `STMT-${session.sessionId}`,
      description: `Settlement: ${session.kwhDelivered.toFixed(2)} kWh consumed ($${actualCost.toFixed(2)})`
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
