import 'dotenv/config';
import http from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import type {
  ChargingStation,
  Connector,
  ActiveTelemetrySession,
  UserWallet,
  FleetAccount,
  OcppMessage,
  OcppAction,
  OcppStopReason,
} from './src/types';
import {
  sendOtp,
  verifyOtp,
  getUserProfile,
  updateUserProfile,
  normalizeGhanaPhoneNumber,
  getUserWallet,
  creditUserWallet,
  holdUserEscrow,
  settleAndReleaseEscrow,
} from './server/auth';
import { initiateMomoPayment, confirmMomoPayment, handleMomoWebhook } from './server/momo';
import {
  initializePaystackTransaction,
  isPaystackSignatureValid,
  settlePaystackTransaction,
  verifyPaystackTransaction,
} from './server/paystack';
import {
  adminDevelopmentInfo,
  authenticateAdmin,
  changeAdminPassword,
  clearAdminCookie,
  issueAdminSession,
  readAdminSession,
  requireAdmin,
  requireAdminRole,
  setAdminCookie,
} from './server/admin';
import {
  Ocpp16Engine,
  attachOcpp16WebSocketServer,
  MAXPOWER_VCP160_COMMISSIONING,
} from './server/ocpp16';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buffer) => {
      (req as any).rawBody = Buffer.from(buffer);
    },
  })
);

// Permissive CORS middleware for mobile APKs and external devices
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Ensure /api prefix is preserved if Vercel serverless strips it
app.use((req, _res, next) => {
  if (process.env.VERCEL && !req.url.startsWith('/api') && !req.url.startsWith('/electric')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Serve static assets from /public folder with full MIME type and byte-range support
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Explicit high-performance video streaming handler
app.get(
  [
    '/electric_vehicle_charging.mp4',
    '/electric%20vehical%20charging.mp4',
    '/electric vehical charging.mp4',
  ],
  (_req, res) => {
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
  }
);

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

// ────────────────────────────────────────────────────────────────────────────
// ChargeLink GH — Idle Fee Policy (applies to all stations uniformly)
// ────────────────────────────────────────────────────────────────────────────
export const IDLE_GRACE_MINUTES = 5; // Free grace period after session ends
export const IDLE_FEE_PER_MIN_GHS = 0.50; // GH₵ 0.50 per minute after grace
export const MAX_IDLE_FEE_GHS = 10.00; // Maximum idle overstay cap

// In-memory persistent state representing PostgreSQL / PostGIS database & CitrineOS CSMS state
// ChargeLink GH: Greenwood Event Center — Kumasi, Ashanti Region
// Hardware: MaxPower VCP160 | OCPP 1.6J Edition 2 | 2 charging guns (Outlet A & Outlet B) | 160kW shared
const STATIONS: ChargingStation[] = [
  {
    id: 'st-01',
    stationId: 'CL-KSI-001',
    chargeBoxId: 'CL-KSI-001',
    pileNumber: '19046744073709551615',
    name: 'Greenwood Event Center',
    operator: 'ChargeLink GH',
    address: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi',
    latitude: 6.6697479,
    longitude: -1.5995679,
    isOnline: true,
    ocppVersion: '1.6J',
    lastHeartbeat: new Date().toISOString(),
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
      description: 'MTN Mobile Money Top-Up (+233 24 981 4421)',
    },
    {
      id: 'tx-002',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      amount: 58.80,
      type: 'CHARGE_SETTLEMENT',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: 'SES-XC-0921',
      description: 'Charging Settlement: 14.0 kWh delivered @ Greenwood Event Center',
    },
  ],
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
      driverPhone: '+233 50 123 4567',
    },
    {
      vin: '7SAYGDEE4PF889120',
      licensePlate: 'GW-8920-23',
      model: 'Model Y Long Range',
      make: 'Tesla',
      batteryCapacityKwh: 78.1,
      assignedDriver: 'Ama Osei',
      driverPhone: '+233 24 555 7890',
    },
    {
      vin: 'LGX1C23D8M1093847',
      licensePlate: 'GN-1002-24',
      model: 'T3 Commercial Van',
      make: 'BYD',
      batteryCapacityKwh: 44.9,
      assignedDriver: 'Kofi Boateng',
      driverPhone: '+233 20 888 1122',
    },
  ],
};

// Active Session state
let ACTIVE_SESSION: ActiveTelemetrySession | null = null;

// Real-time OCPP 1.6 Edition 2 Messages Audit Trail
// ChargeLink GH — MaxPower VCP160 @ Greenwood Event Center, Kumasi
const OCPP_LOGS: OcppMessage[] = [
  {
    id: 'ocpp-05',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    chargeBoxId: 'CL-KSI-001',
    direction: 'INCOMING',
    action: 'Heartbeat',
    messageTypeId: 2,
    uniqueId: 'hb-1002',
    payload: {
      chargeBoxId: 'CL-KSI-001',
      pileNumber: '19046744073709551615',
    },
  },
  {
    id: 'ocpp-04',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    chargeBoxId: 'CL-KSI-001',
    direction: 'INCOMING',
    action: 'StatusNotification',
    messageTypeId: 2,
    uniqueId: 'stat-1002',
    payload: {
      connectorId: 2,
      connectorLabel: 'Outlet B',
      errorCode: 'NoError',
      status: 'Available',
      info: 'MaxPower VCP160 Outlet B (CCS2 160kW) Ready',
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
  },
  {
    id: 'ocpp-03',
    timestamp: new Date(Date.now() - 125000).toISOString(),
    chargeBoxId: 'CL-KSI-001',
    direction: 'INCOMING',
    action: 'StatusNotification',
    messageTypeId: 2,
    uniqueId: 'stat-1001',
    payload: {
      connectorId: 1,
      connectorLabel: 'Outlet A',
      errorCode: 'NoError',
      status: 'Available',
      info: 'MaxPower VCP160 Outlet A (GB/T 160kW) Ready',
      timestamp: new Date(Date.now() - 125000).toISOString(),
    },
  },
  {
    id: 'ocpp-02',
    timestamp: new Date(Date.now() - 3590000).toISOString(),
    chargeBoxId: 'CL-KSI-001',
    direction: 'OUTGOING',
    action: 'BootNotification',
    messageTypeId: 3,
    uniqueId: 'boot-1001',
    payload: {
      status: 'Accepted',
      currentTime: new Date(Date.now() - 3590000).toISOString(),
      interval: 60,
    },
  },
  {
    id: 'ocpp-01',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    chargeBoxId: 'CL-KSI-001',
    direction: 'INCOMING',
    action: 'BootNotification',
    messageTypeId: 2,
    uniqueId: 'boot-1001',
    payload: {
      chargePointVendor: 'MaxPower',
      chargePointModel: 'VCP160',
      chargePointSerialNumber: 'MP160-GH-KSI-2026001',
      firmwareVersion: 'MP-VCP160-OCPP16J-v2.4.8',
      chargeBoxId: 'CL-KSI-001',
      pileNumber: '19046744073709551615',
      meterType: 'DC-DIN-4Q-160KW',
      location: 'Greenwood Event Center, Kumasi',
    },
  },
];

// Simulation multiplier for testing (1x = real-time, 5x = rapid, 10x = demo turbo)
let SIMULATION_SPEED = 1;

// Instantiate OCPP 1.6 Edition 2 Central System Engine
const ocpp16Engine = new Ocpp16Engine({
  getStations: () => STATIONS,
  getActiveSession: () => ACTIVE_SESSION,
  setActiveSession: (session) => {
    ACTIVE_SESSION = session;
  },
  getLogs: () => OCPP_LOGS,
  pushLog: (chargeBoxId, direction, action, payload, messageTypeId = 2, uniqueId) => {
    const msg: OcppMessage = {
      id: `ocpp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      chargeBoxId,
      direction,
      action,
      messageTypeId,
      uniqueId,
      payload,
    };
    OCPP_LOGS.unshift(msg);
    if (OCPP_LOGS.length > 80) OCPP_LOGS.pop();
    return msg;
  },
  onRemoteStartSession: ({ station, connectorId, idTag, transactionId }) => {
    const connector =
      station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId) ||
      station.connectors[0];
    connector.status = 'Charging';
    connector.errorCode = 'NoError';
    connector.currentPowerKw = Math.min(connector.maxPowerKw, 120);
    connector.reservedByIdTag = undefined;
    connector.reservationId = undefined;
    connector.reservationExpiryDate = undefined;

    const driverPhone = '+233248901204';
    const wallet = getUserWallet(driverPhone);
    const voltageV = 400.4;
    const currentA = Number(((connector.currentPowerKw * 1000) / voltageV).toFixed(1));
    const meterStartWh = 142500;

    ACTIVE_SESSION = {
      sessionId: `ses-${Date.now()}`,
      transactionId,
      stationId: station.stationId,
      stationName: station.name,
      chargeBoxId: station.stationId,
      connectorId: connector.connectorId,
      connectorLabel: connector.label || (connector.connectorId === 1 ? 'Outlet A' : 'Outlet B'),
      connectorType: connector.type,
      idTag,
      userId: driverPhone,
      driverPhone,
      isFleetSession: false,
      startTime: Date.now(),
      elapsedSeconds: 0,
      remainingMinutes: 24,
      currentSocPercent: 28,
      targetSocPercent: 85,
      currentPowerKw: connector.currentPowerKw,
      voltageV,
      currentA,
      kwhDelivered: 0.05,
      meterStartWh,
      meterStopWh: meterStartWh + 50,
      temperatureC: 34.5,
      accruedCost: Number((0.05 * connector.tariffPerKwh).toFixed(2)),
      tariffPerKwh: connector.tariffPerKwh,
      cardBalanceGhs: wallet.availableBalance,
      currency: 'GHS',
      preauthHoldAmount: 25,
      status: 'Charging',
      meterValuesLog: [
        {
          timestamp: new Date().toISOString(),
          soc: 28,
          powerKw: connector.currentPowerKw,
          kwhTotal: 0.05,
        },
      ],
    };
    return ACTIVE_SESSION;
  },
  onRemoteStopSession: ({ reason, meterStopWh }) => {
    if (!ACTIVE_SESSION) {
      return { session: null, totalCostGhs: 0 };
    }
    const finished = { ...ACTIVE_SESSION };
    if (meterStopWh !== undefined && finished.meterStartWh !== undefined) {
      const deltaKwh = Math.max(0, (meterStopWh - finished.meterStartWh) / 1000);
      if (deltaKwh > 0) {
        finished.kwhDelivered = Number(deltaKwh.toFixed(3));
        finished.accruedCost = Number((finished.kwhDelivered * (finished.tariffPerKwh || 4.5)).toFixed(2));
      }
      finished.meterStopWh = meterStopWh;
    }
    finished.stopReason = reason;
    finished.status = 'Completed';

    const station = STATIONS.find((s) => s.stationId === finished.stationId);
    const connector = station?.connectors.find((c) => c.connectorId === finished.connectorId);
    if (connector) {
      connector.status = 'Available';
      connector.errorCode = 'NoError';
      connector.currentPowerKw = 0;
    }

    const driverPhone = finished.driverPhone || '+233248901204';
    if (!finished.isFleetSession && finished.preauthHoldAmount > 0) {
      settleAndReleaseEscrow(driverPhone, finished.accruedCost, finished.preauthHoldAmount, {
        sessionId: finished.sessionId,
        kwhDelivered: finished.kwhDelivered,
      });
    }

    ACTIVE_SESSION = null;
    return { session: finished, totalCostGhs: finished.accruedCost };
  },
});

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
    ACTIVE_SESSION.kwhDelivered = +(ACTIVE_SESSION.kwhDelivered + kwhAdded).toFixed(4);
    ACTIVE_SESSION.meterStopWh = Math.round(
      (ACTIVE_SESSION.meterStartWh || 142500) + ACTIVE_SESSION.kwhDelivered * 1000
    );

    // Dynamic electrical characteristics (400V architecture with slight AC-to-DC grid ripple)
    ACTIVE_SESSION.voltageV = +(401.2 + Math.sin(ACTIVE_SESSION.elapsedSeconds / 2) * 1.8).toFixed(1);
    ACTIVE_SESSION.currentA = +((ACTIVE_SESSION.currentPowerKw * 1000) / ACTIVE_SESSION.voltageV).toFixed(1);
    ACTIVE_SESSION.temperatureC = +(34.2 + Math.min(9.5, ACTIVE_SESSION.elapsedSeconds * 0.03) + Math.sin(ACTIVE_SESSION.elapsedSeconds / 4) * 0.4).toFixed(1);

    // Estimate battery SoC increase (assuming standard 75 kWh battery pack)
    const targetCapacity = 75; // kWh baseline
    const socIncrement = (kwhAdded / targetCapacity) * 100;
    if (ACTIVE_SESSION.currentSocPercent < ACTIVE_SESSION.targetSocPercent) {
      ACTIVE_SESSION.currentSocPercent = Math.min(
        ACTIVE_SESSION.targetSocPercent,
        +(ACTIVE_SESSION.currentSocPercent + socIncrement).toFixed(2)
      );
    }

    const remainingSoc = Math.max(0, ACTIVE_SESSION.targetSocPercent - ACTIVE_SESSION.currentSocPercent);
    const remainingKwh = (remainingSoc / 100) * targetCapacity;
    ACTIVE_SESSION.remainingMinutes =
      ACTIVE_SESSION.currentPowerKw > 0
        ? Math.max(1, Math.round((remainingKwh / ACTIVE_SESSION.currentPowerKw) * 60))
        : 0;

    // Accrued cost calculation — ChargeLink GH standard tariff: GH₵ 4.50/kWh
    const currentStation = STATIONS.find((s) => s.stationId === ACTIVE_SESSION?.stationId);
    const connector = currentStation?.connectors.find(
      (c) => c.connectorId === ACTIVE_SESSION?.connectorId
    );
    const rate = connector?.tariffPerKwh || ACTIVE_SESSION.tariffPerKwh || 4.50;
    ACTIVE_SESSION.tariffPerKwh = rate;
    ACTIVE_SESSION.accruedCost = +(ACTIVE_SESSION.kwhDelivered * rate).toFixed(2);

    const driverWallet = getUserWallet(ACTIVE_SESSION.driverPhone || '+233248901204');
    ACTIVE_SESSION.cardBalanceGhs = Number(
      Math.max(0, driverWallet.availableBalance + driverWallet.heldBalance - ACTIVE_SESSION.accruedCost).toFixed(2)
    );

    // Add periodic MeterValue packet to telemetry log every 3 seconds
    if (ACTIVE_SESSION.elapsedSeconds % 3 === 0) {
      ACTIVE_SESSION.meterValuesLog.push({
        timestamp: new Date().toISOString(),
        soc: Math.round(ACTIVE_SESSION.currentSocPercent * 10) / 10,
        powerKw: Math.round(ACTIVE_SESSION.currentPowerKw * 10) / 10,
        kwhTotal: Math.round(ACTIVE_SESSION.kwhDelivered * 1000) / 1000,
      });
      if (ACTIVE_SESSION.meterValuesLog.length > 30) {
        ACTIVE_SESSION.meterValuesLog.shift();
      }

      // Append OCPP 1.6 Edition 2 MeterValues.req to CSMS OCPP audit log
      OCPP_LOGS.unshift({
        id: `mv-${Date.now()}`,
        timestamp: new Date().toISOString(),
        chargeBoxId: ACTIVE_SESSION.stationId,
        direction: 'INCOMING',
        action: 'MeterValues',
        messageTypeId: 2,
        uniqueId: `mv-${ACTIVE_SESSION.elapsedSeconds}`,
        payload: {
          connectorId: ACTIVE_SESSION.connectorId,
          connectorLabel:
            ACTIVE_SESSION.connectorLabel ||
            (ACTIVE_SESSION.connectorId === 1 ? 'Outlet A' : 'Outlet B'),
          transactionId: ACTIVE_SESSION.transactionId || 98421,
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [
                {
                  value: ACTIVE_SESSION.kwhDelivered.toFixed(3),
                  context: 'Sample.Periodic',
                  format: 'Raw',
                  measurand: 'Energy.Active.Import.Register',
                  location: 'Outlet',
                  unit: 'kWh',
                },
                {
                  value: ACTIVE_SESSION.currentPowerKw.toFixed(1),
                  context: 'Sample.Periodic',
                  format: 'Raw',
                  measurand: 'Power.Active.Import',
                  location: 'Outlet',
                  unit: 'kW',
                },
                {
                  value: ACTIVE_SESSION.currentSocPercent.toFixed(1),
                  context: 'Sample.Periodic',
                  format: 'Raw',
                  measurand: 'SoC',
                  location: 'EV',
                  unit: 'Percent',
                },
                {
                  value: ACTIVE_SESSION.voltageV.toString(),
                  context: 'Sample.Periodic',
                  format: 'Raw',
                  measurand: 'Voltage',
                  location: 'Outlet',
                  unit: 'V',
                },
                {
                  value: ACTIVE_SESSION.currentA.toString(),
                  context: 'Sample.Periodic',
                  format: 'Raw',
                  measurand: 'Current.Import',
                  location: 'Outlet',
                  unit: 'A',
                },
                {
                  value: (ACTIVE_SESSION.temperatureC || 35.0).toFixed(1),
                  context: 'Sample.Periodic',
                  format: 'Raw',
                  measurand: 'Temperature',
                  location: 'Body',
                  unit: 'Celsius',
                },
              ],
            },
          ],
        },
      });
      if (OCPP_LOGS.length > 80) OCPP_LOGS.pop();
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
    ocppVersion: 'OCPP 1.6J Edition 2 / 2.0.1',
    activeSessions: ACTIVE_SESSION ? 1 : 0,
    greenwoodStatus: STATIONS[0]?.isOnline ? 'ONLINE' : 'OFFLINE',
  });
});

// --- ISOLATED WILPOWER ADMIN PORTAL ---
app.get('/api/admin/auth/config', (_req, res) => {
  res.json(adminDevelopmentInfo());
});

app.post('/api/admin/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const admin = authenticateAdmin(String(email || ''), String(password || ''));
  if (!admin) {
    res.status(401).json({ success: false, error: 'Invalid administrator credentials.' });
    return;
  }
  setAdminCookie(res, issueAdminSession(admin));
  res.json({ success: true, admin });
});

app.post('/api/admin/auth/change-password', requireAdmin, (req, res) => {
  const admin = readAdminSession(req);
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  if (!admin) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  if (newPassword.length < 12) {
    res.status(400).json({ error: 'New password must be at least 12 characters.' });
    return;
  }
  const updatedAdmin = changeAdminPassword(admin, currentPassword, newPassword);
  if (!updatedAdmin) {
    res.status(400).json({ error: 'Current password is incorrect or the new password could not be saved.' });
    return;
  }
  setAdminCookie(res, issueAdminSession(updatedAdmin));
  res.json({ success: true, admin: updatedAdmin });
});

app.get('/api/admin/auth/me', requireAdmin, (req, res) => {
  res.json({ authenticated: true, admin: readAdminSession(req) });
});

app.post('/api/admin/auth/logout', (_req, res) => {
  clearAdminCookie(res);
  res.json({ success: true });
});

app.get('/api/admin/overview', requireAdmin, (req, res) => {
  const connectors = STATIONS.flatMap((station) => station.connectors);
  const availableConnectors = connectors.filter((connector) => connector.status === 'Available').length;
  const activeSessions = ACTIVE_SESSION ? 1 : 0;
  const sessionCost = ACTIVE_SESSION?.accruedCost || 0;
  res.json({
    generatedAt: new Date().toISOString(),
    stations: {
      total: STATIONS.length,
      online: STATIONS.filter((station) => station.isOnline).length,
      offline: STATIONS.filter((station) => !station.isOnline).length,
    },
    connectors: {
      total: connectors.length,
      available: availableConnectors,
      occupied: connectors.length - availableConnectors,
    },
    sessions: {
      active: activeSessions,
      currentCost: sessionCost,
      kwhDelivered: ACTIVE_SESSION?.kwhDelivered || 0,
      activeSession: ACTIVE_SESSION,
    },
    network: {
      health: 'ok',
      citrineOsBridge: 'CONNECTED',
      ocppVersion: 'OCPP 1.6J Edition 2',
      connectedSockets: ocpp16Engine.getConnectedChargePoints().length,
    },
    commissioning: MAXPOWER_VCP160_COMMISSIONING,
    ocppStatus: ocpp16Engine.getStatusSnapshot(req.get('host')),
    alerts: OCPP_LOGS.filter(
      (log) => log.action === 'StatusNotification' && log.payload?.status === 'Faulted'
    ).slice(0, 8),
  });
});

app.get('/api/admin/stations', requireAdmin, (_req, res) => {
  res.json(STATIONS);
});

app.get('/api/admin/ocpp/logs', requireAdmin, (_req, res) => {
  res.json(OCPP_LOGS);
});

app.post('/api/admin/ocpp/command', requireAdmin, async (req, res) => {
  try {
    const { chargeBoxId = 'CL-KSI-001', action, payload = {} } = req.body || {};
    if (!action) {
      res.status(400).json({ error: 'OCPP 1.6 action is required' });
      return;
    }
    const result = await ocpp16Engine.dispatchCentralSystemCommand(
      chargeBoxId,
      action as OcppAction,
      payload
    );
    res.json({
      success: true,
      ...result,
      stations: STATIONS,
      activeSession: ACTIVE_SESSION,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stations list (Supports geospatial proximity simulation)
app.get('/api/stations', (req, res) => {
  const { lat, lng, type } = req.query;
  let results = [...STATIONS];

  if (type) {
    results = results.filter((s) =>
      s.connectors.some((c) => c.type.toLowerCase() === (type as string).toLowerCase())
    );
  }

  // Calculate distance if lat and lng provided
  if (lat && lng) {
    const uLat = parseFloat(lat as string);
    const uLng = parseFloat(lng as string);
    results = results.map((st) => {
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
        distanceKm: Math.round(R * c * 10) / 10,
      };
    });
    results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

  res.json(results);
});

// Get single station
app.get('/api/stations/:id', (req, res) => {
  const station = STATIONS.find(
    (s) =>
      s.id === req.params.id ||
      s.stationId === req.params.id ||
      s.pileNumber === req.params.id
  );
  if (!station) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }
  res.json(station);
});

// Admin: Create new charging station
app.post('/api/stations', requireAdminRole('network_operator'), (req, res) => {
  const { name, stationId, operator, address, latitude, longitude, connectors, amenities } = req.body;
  if (!name || !latitude || !longitude) {
    res.status(400).json({ error: 'Name, latitude, and longitude are required.' });
    return;
  }

  const newId = `st-${Date.now()}`;
  const generatedStationId = stationId || `EV-ST-${Math.floor(100 + Math.random() * 900)}`;

  const formattedConnectors: Connector[] =
    connectors && connectors.length > 0
      ? connectors.map((c: any, index: number) => ({
          id: Date.now() + index,
          connectorId: c.connectorId || index + 1,
          label: c.label || `Outlet ${index === 0 ? 'A' : 'B'}`,
          type: c.type || 'CCS2',
          maxPowerKw: Number(c.maxPowerKw) || 160,
          currentPowerKw: 0,
          status: (c.status || 'Available') as any,
          errorCode: 'NoError',
          tariffPerKwh: Number(c.tariffPerKwh) || 4.50,
          tariffGhsPerKwh: Number(c.tariffPerKwh) || 4.50,
          tariffCurrency: c.tariffCurrency || 'GHS',
        }))
      : [
          {
            id: Date.now(),
            connectorId: 1,
            label: 'Outlet A',
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
            id: Date.now() + 1,
            connectorId: 2,
            label: 'Outlet B',
            type: 'CCS2',
            maxPowerKw: 160,
            currentPowerKw: 0,
            status: 'Available',
            errorCode: 'NoError',
            tariffPerKwh: 4.50,
            tariffGhsPerKwh: 4.50,
            tariffCurrency: 'GHS',
          },
        ];

  const newStation: ChargingStation = {
    id: newId,
    stationId: generatedStationId,
    chargeBoxId: generatedStationId,
    name,
    operator: operator || 'ChargeLink GH Network',
    address: address || 'Main Highway Plaza',
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    isOnline: true,
    ocppVersion: '1.6J',
    lastHeartbeat: new Date().toISOString(),
    rating: 5.0,
    amenities:
      amenities && amenities.length > 0
        ? amenities
        : ['Restrooms', '24/7 Security', 'Convenience Store'],
    connectors: formattedConnectors,
  };

  STATIONS.unshift(newStation);
  res.status(201).json({ success: true, station: newStation });
});

// Admin: Update station
app.put('/api/stations/:id', requireAdminRole('network_operator'), (req, res) => {
  const index = STATIONS.findIndex((s) => s.id === req.params.id || s.stationId === req.params.id);
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
    connectors: connectors ?? existing.connectors,
  };

  res.json({ success: true, station: STATIONS[index] });
});

// Admin: Delete station
app.delete('/api/stations/:id', requireAdminRole('network_operator'), (req, res) => {
  const index = STATIONS.findIndex((s) => s.id === req.params.id || s.stationId === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }
  const deleted = STATIONS.splice(index, 1)[0];
  res.json({ success: true, deletedStationId: deleted.id });
});

// Get Wallet (Returns driver-specific persistent wallet)
app.get('/api/wallet', (req, res) => {
  const phone = (req.query.phoneNumber as string) || (req.query.phone as string);
  const wallet = getUserWallet(phone);
  res.json(wallet);
});

// Mobile Money / Card Top-up
app.post('/api/wallet/topup', (req, res) => {
  const { amount, provider = 'MOMO', phone } = req.body;
  const targetPhone = phone || '+233248901204';
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: 'Invalid top-up amount' });
    return;
  }

  const prov = (provider.toUpperCase() === 'CARD' ? 'CARD' : 'MOMO') as 'MOMO' | 'CARD';
  const ref = `TOPUP-GH-${Math.floor(100000 + Math.random() * 900000)}`;
  const desc = `${provider || 'MTN MoMo'} Top-up (${targetPhone})`;
  creditUserWallet(targetPhone, numAmount, desc, ref, prov);
  const updatedWallet = getUserWallet(targetPhone);

  res.json({
    success: true,
    wallet: updatedWallet,
    transaction: updatedWallet.transactions[0],
  });
});

// Interactive Real-Time Ghana Mobile Money USSD Push Initiation
app.post('/api/wallet/momo-initiate', async (req, res) => {
  try {
    const { amount, provider = 'MTN', phone } = req.body;
    const targetPhone = phone || '+233248901204';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Invalid payment amount' });
      return;
    }

    const result = await initiateMomoPayment({
      amount: numAmount,
      provider,
      phoneNumber: targetPhone,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Interactive Real-Time Ghana Mobile Money Confirmation & Settlement
app.post('/api/wallet/momo-confirm', (req, res) => {
  try {
    const { transactionId, amount, provider = 'MTN', phone, pin } = req.body;
    const targetPhone = phone || '+233248901204';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Invalid payment amount' });
      return;
    }

    const result = confirmMomoPayment({
      transactionId,
      amount: numAmount,
      provider,
      phoneNumber: targetPhone,
      pin,
    });
    const updatedWallet = getUserWallet(targetPhone);

    res.json({
      ...result,
      wallet: updatedWallet,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Paystack hosted checkout initialization. The secret key never reaches the browser.
app.post('/api/wallet/paystack-initialize', async (req, res) => {
  try {
    const { amount, phone, email, displayName } = req.body || {};
    const targetPhone = phone || '+233248901204';
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid payment amount.' });
      return;
    }
    const configuredBaseUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const requestOrigin = `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${configuredBaseUrl || requestOrigin}/payments/paystack/callback`;
    const checkout = await initializePaystackTransaction({
      amount: numAmount,
      phoneNumber: targetPhone,
      email,
      displayName,
      callbackUrl,
    });
    res.json({ success: true, ...checkout });
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, error: err.message || 'Could not initialize Paystack payment.' });
  }
});

// Callback verification is kept server-side and settles the wallet idempotently.
app.get('/api/wallet/paystack-verify', async (req, res) => {
  try {
    const reference = String(req.query.reference || '').trim();
    if (!reference) {
      res.status(400).json({ success: false, error: 'Missing Paystack transaction reference.' });
      return;
    }
    const transaction = await verifyPaystackTransaction(reference);
    res.json(settlePaystackTransaction(transaction));
  } catch (err: any) {
    res
      .status(400)
      .json({ success: false, error: err.message || 'Could not verify Paystack payment.' });
  }
});

// Paystack webhook. Signature validation uses the exact JSON bytes captured above.
app.post('/api/paystack/webhook', (req, res) => {
  const rawBody = (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const signature = String(req.headers['x-paystack-signature'] || '');
  if (!isPaystackSignatureValid(rawBody, signature)) {
    res.status(401).json({ success: false, error: 'Invalid Paystack signature.' });
    return;
  }
  try {
    const event = req.body || {};
    if (event.event === 'charge.success' && event.data) settlePaystackTransaction(event.data);
    res.status(200).json({ received: true });
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, error: err.message || 'Paystack webhook processing failed.' });
  }
});

// Asynchronous Ghana Mobile Money Webhook Endpoint
app.post('/api/momo/webhook', (req, res) => {
  try {
    const result = handleMomoWebhook(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fleet Accounts
app.get('/api/fleet', (_req, res) => {
  res.json(FLEET_ACCOUNT);
});

// Active Session
app.get('/api/session/active', (_req, res) => {
  res.json({ session: ACTIVE_SESSION });
});

// ==========================================
// OCPP 1.6 EDITION 2 CENTRAL SYSTEM ENDPOINTS
// ==========================================

// Full OCPP 1.6 Edition 2 Status, Commissioning Guide, Configuration Keys, Reservations & Frames
app.get('/api/ocpp/status', (req, res) => {
  res.json(ocpp16Engine.getStatusSnapshot(req.get('host')));
});

// Get or Update OCPP 1.6 Standard Configuration Keys (Section 9)
app.get('/api/ocpp/config', (req, res) => {
  const keysParam = req.query.key ? String(req.query.key).split(',') : undefined;
  res.json(ocpp16Engine.getConfigurationKeys(keysParam));
});

app.post('/api/ocpp/config', (req, res) => {
  const { key, value, chargeBoxId = 'CL-KSI-001' } = req.body || {};
  if (!key || value === undefined) {
    res.status(400).json({ error: 'Configuration key and value are required' });
    return;
  }
  const status = ocpp16Engine.changeConfigurationKey(String(key), String(value));
  OCPP_LOGS.unshift({
    id: `cfg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId,
    direction: 'OUTGOING',
    action: 'ChangeConfiguration',
    messageTypeId: 2,
    uniqueId: `cfg-${Date.now()}`,
    payload: { key, value, status },
  });
  res.json({
    success: status === 'Accepted',
    status,
    configurationKeys: ocpp16Engine.getConfigurationKeys().configurationKey,
  });
});

// Receive or simulate any Charge Point -> CSMS OCPP 1.6J frame ([2, UniqueId, Action, Payload])
app.post('/api/ocpp/frame', (req, res) => {
  const {
    chargeBoxId = 'CL-KSI-001',
    action,
    payload = {},
    uniqueId = `cp-${Date.now()}`,
    frame,
  } = req.body || {};

  let resolvedAction = action as OcppAction;
  let resolvedPayload = payload;
  let resolvedUniqueId = uniqueId;

  if (Array.isArray(frame) && frame.length >= 3 && Number(frame[0]) === 2) {
    resolvedUniqueId = String(frame[1]);
    resolvedAction = String(frame[2]) as OcppAction;
    resolvedPayload = frame[3] || {};
  }

  if (!resolvedAction) {
    res.status(400).json({ error: 'OCPP 1.6 action or [2, id, action, payload] frame is required' });
    return;
  }

  const callResult = ocpp16Engine.handleChargePointCall(
    chargeBoxId,
    resolvedAction,
    resolvedPayload,
    resolvedUniqueId
  );

  res.json({
    success: true,
    chargeBoxId: ocpp16Engine.normalizeChargeBoxId(chargeBoxId),
    requestFrame: [2, resolvedUniqueId, resolvedAction, resolvedPayload],
    responseFrame: callResult,
    activeSession: ACTIVE_SESSION,
    station: ocpp16Engine.findStation(chargeBoxId),
  });
});

// Dispatch any Central System -> Charge Point OCPP 1.6J operation (Section 5)
app.post('/api/ocpp/command', async (req, res) => {
  try {
    const { chargeBoxId = 'CL-KSI-001', action, payload = {} } = req.body || {};
    if (!action) {
      res.status(400).json({ error: 'OCPP 1.6 action is required' });
      return;
    }
    const result = await ocpp16Engine.dispatchCentralSystemCommand(
      chargeBoxId,
      action as OcppAction,
      payload
    );
    res.json({
      success: true,
      ...result,
      activeSession: ACTIVE_SESSION,
      station: ocpp16Engine.findStation(chargeBoxId),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OCPP 1.6 ReserveNow (Connector Reservation)
app.post('/api/ocpp/reserve', async (req, res) => {
  try {
    const {
      stationId = 'CL-KSI-001',
      connectorId = 1,
      idTag = 'VID-GH-8842-A',
      durationMinutes = 30,
    } = req.body || {};
    const expiryDate = new Date(Date.now() + Number(durationMinutes) * 60 * 1000).toISOString();
    const result = await ocpp16Engine.dispatchCentralSystemCommand(stationId, 'ReserveNow', {
      connectorId: Number(connectorId),
      idTag,
      expiryDate,
    });
    res.json({
      success: result.responsePayload.status === 'Accepted',
      ...result.responsePayload,
      reservations: ocpp16Engine.getReservations(),
      station: ocpp16Engine.findStation(stationId),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OCPP 1.6 CancelReservation
app.post('/api/ocpp/cancel-reservation', async (req, res) => {
  try {
    const { stationId = 'CL-KSI-001', reservationId } = req.body || {};
    const result = await ocpp16Engine.dispatchCentralSystemCommand(
      stationId,
      'CancelReservation',
      { reservationId: Number(reservationId) }
    );
    res.json({
      success: result.responsePayload.status === 'Accepted',
      ...result.responsePayload,
      reservations: ocpp16Engine.getReservations(),
      station: ocpp16Engine.findStation(stationId),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OCPP 1.6 UnlockConnector
app.post('/api/ocpp/unlock', async (req, res) => {
  try {
    const { stationId = 'CL-KSI-001', connectorId = 1 } = req.body || {};
    const result = await ocpp16Engine.dispatchCentralSystemCommand(stationId, 'UnlockConnector', {
      connectorId: Number(connectorId),
    });
    res.json({
      success: result.responsePayload.status === 'Unlocked',
      ...result.responsePayload,
      station: ocpp16Engine.findStation(stationId),
      activeSession: ACTIVE_SESSION,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OCPP Remote Start Transaction with Pre-Auth Hold
app.post(['/api/ocpp/remote-start', '/api/charge/start'], (req, res) => {
  const { stationId, connectorId, isFleet, vin, preauthHoldAmount = 25, phoneNumber, idTag } = req.body;
  const driverPhone = phoneNumber || '+233248901204';

  if (ACTIVE_SESSION) {
    res.status(400).json({ error: 'An active charging session is already in progress' });
    return;
  }

  const station = STATIONS.find(
    (s) => s.stationId === stationId || s.id === stationId || s.pileNumber === stationId
  ) || STATIONS[0];
  if (!station) {
    res.status(404).json({ error: 'Station not found' });
    return;
  }

  const connector =
    station.connectors.find((c) => c.connectorId === Number(connectorId) || c.id === Number(connectorId)) ||
    station.connectors.find((c) => c.status === 'Available' || c.status === 'Reserved') ||
    station.connectors[0];
  if (!connector) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }

  if (connector.status !== 'Available' && connector.status !== 'Reserved') {
    res.status(400).json({ error: `Connector ${connector.connectorId} is currently ${connector.status}` });
    return;
  }

  // Pre-authorization escrow hold verification
  if (!isFleet) {
    const holdRes = holdUserEscrow(driverPhone, preauthHoldAmount, station.name);
    if (!holdRes.success) {
      res.status(402).json({
        error: holdRes.error || 'Insufficient wallet balance for pre-authorization hold',
        required: preauthHoldAmount,
        available: holdRes.availableBalance,
        message: 'Please top up your wallet via Mobile Money or Card before unlocking.',
      });
      return;
    }
  }

  // Update connector status
  connector.status = 'Charging';
  connector.errorCode = 'NoError';
  connector.currentPowerKw = Math.min(connector.maxPowerKw, 120);
  connector.reservedByIdTag = undefined;
  connector.reservationId = undefined;
  connector.reservationExpiryDate = undefined;

  const transactionId = ocpp16Engine.allocateTransactionId();
  const resolvedIdTag = idTag || (isFleet ? `FLEET-VIN-${vin || 'GENERIC'}` : 'VID-GH-8842-A');
  const currentWallet = getUserWallet(driverPhone);
  const meterStartWh = 142500;

  // Create active session with full MaxPower VCP160 HMI fields
  ACTIVE_SESSION = {
    sessionId: `ses-${Date.now()}`,
    transactionId,
    stationId: station.stationId,
    stationName: station.name,
    chargeBoxId: station.stationId,
    connectorId: connector.connectorId,
    connectorLabel: connector.label || (connector.connectorId === 1 ? 'Outlet A' : 'Outlet B'),
    connectorType: connector.type,
    idTag: resolvedIdTag,
    userId: driverPhone,
    driverPhone,
    isFleetSession: !!isFleet,
    fleetVin: vin || (isFleet ? FLEET_ACCOUNT.vehicles[0].vin : undefined),
    startTime: Date.now(),
    elapsedSeconds: 0,
    remainingMinutes: 24,
    currentSocPercent: isFleet ? 32 : 28,
    targetSocPercent: 85,
    currentPowerKw: connector.currentPowerKw,
    voltageV: 400.2,
    currentA: +((connector.currentPowerKw * 1000) / 400.2).toFixed(1),
    kwhDelivered: 0.05,
    meterStartWh,
    meterStopWh: meterStartWh + 50,
    temperatureC: 34.5,
    accruedCost: +(0.05 * connector.tariffPerKwh).toFixed(2),
    tariffPerKwh: connector.tariffPerKwh,
    cardBalanceGhs: currentWallet.availableBalance,
    currency: 'GHS',
    preauthHoldAmount: isFleet ? 0 : preauthHoldAmount,
    status: 'Charging',
    meterValuesLog: [
      {
        timestamp: new Date().toISOString(),
        soc: isFleet ? 32 : 28,
        powerKw: connector.currentPowerKw,
        kwhTotal: 0.05,
      },
    ],
  };

  // Add CSMS OCPP 1.6J Action logs (RemoteStartTransaction.req -> StartTransaction.req -> StatusNotification.req)
  OCPP_LOGS.unshift({
    id: `ocpp-start-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId: station.stationId,
    direction: 'OUTGOING',
    action: 'RemoteStartTransaction',
    messageTypeId: 2,
    uniqueId: `rst-${transactionId}`,
    payload: {
      connectorId: connector.connectorId,
      idTag: resolvedIdTag,
      chargingProfile: {
        chargingProfileId: 1,
        stackLevel: 0,
        chargingProfilePurpose: 'TxDefaultProfile',
        chargingProfileKind: 'Absolute',
        chargingSchedule: {
          chargingRateUnit: 'W',
          chargingSchedulePeriod: [{ startPeriod: 0, limit: connector.maxPowerKw * 1000 }],
        },
      },
    },
  });

  OCPP_LOGS.unshift({
    id: `ocpp-txstart-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId: station.stationId,
    direction: 'INCOMING',
    action: 'StartTransaction',
    messageTypeId: 2,
    uniqueId: `stx-${transactionId}`,
    payload: {
      connectorId: connector.connectorId,
      connectorLabel: ACTIVE_SESSION.connectorLabel,
      idTag: resolvedIdTag,
      meterStart: meterStartWh,
      transactionId,
      timestamp: new Date().toISOString(),
    },
  });

  OCPP_LOGS.unshift({
    id: `ocpp-stat-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId: station.stationId,
    direction: 'INCOMING',
    action: 'StatusNotification',
    messageTypeId: 2,
    uniqueId: `sn-${transactionId}`,
    payload: {
      connectorId: connector.connectorId,
      connectorLabel: ACTIVE_SESSION.connectorLabel,
      errorCode: 'NoError',
      status: 'Charging',
      timestamp: new Date().toISOString(),
    },
  });

  res.json({
    success: true,
    message: `Connector ${ACTIVE_SESSION.connectorLabel} (${connector.type}) unlocked via OCPP 1.6J RemoteStartTransaction.`,
    session: ACTIVE_SESSION,
    wallet: currentWallet,
  });
});

// OCPP Remote Stop Transaction with Settlement & Release of Hold
app.post(['/api/ocpp/remote-stop', '/api/charge/stop'], (req, res) => {
  if (!ACTIVE_SESSION) {
    res.status(400).json({ error: 'No active session to stop' });
    return;
  }

  const session = { ...ACTIVE_SESSION };
  const stopReason: OcppStopReason = (req.body?.reason as OcppStopReason) || 'Remote';
  session.stopReason = stopReason;
  const station = STATIONS.find((s) => s.stationId === session.stationId);
  const connector = station?.connectors.find((c) => c.connectorId === session.connectorId);

  if (connector) {
    connector.status = 'Available';
    connector.errorCode = 'NoError';
    connector.currentPowerKw = 0;
  }

  const driverPhone = req.body.phoneNumber || session.driverPhone || '+233248901204';

  // Financial reconciliation:
  if (!session.isFleetSession) {
    const actualCost = Math.round(session.accruedCost * 100) / 100;
    const holdAmount = session.preauthHoldAmount;

    settleAndReleaseEscrow(driverPhone, actualCost, holdAmount, {
      sessionId: session.sessionId,
      kwhDelivered: session.kwhDelivered,
    });
  } else {
    // Commercial Fleet billing ledger
    FLEET_ACCOUNT.currentUtilization += session.accruedCost;
  }

  // Push OCPP 1.6J StopTransaction & StatusNotification Logs
  OCPP_LOGS.unshift({
    id: `ocpp-stop-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId: session.stationId,
    direction: 'OUTGOING',
    action: 'RemoteStopTransaction',
    messageTypeId: 2,
    uniqueId: `rstop-${session.transactionId || 98421}`,
    payload: {
      transactionId: session.transactionId || 98421,
    },
  });

  OCPP_LOGS.unshift({
    id: `ocpp-stoptx-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId: session.stationId,
    direction: 'INCOMING',
    action: 'StopTransaction',
    messageTypeId: 2,
    uniqueId: `stoptx-${session.transactionId || 98421}`,
    payload: {
      transactionId: session.transactionId || 98421,
      idTag: session.idTag || 'VID-GH-8842-A',
      meterStop: session.meterStopWh || Math.round(142500 + session.kwhDelivered * 1000),
      timestamp: new Date().toISOString(),
      reason: stopReason,
    },
  });

  OCPP_LOGS.unshift({
    id: `ocpp-avail-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId: session.stationId,
    direction: 'INCOMING',
    action: 'StatusNotification',
    messageTypeId: 2,
    uniqueId: `snavail-${session.transactionId || 98421}`,
    payload: {
      connectorId: session.connectorId,
      connectorLabel: session.connectorLabel || (session.connectorId === 1 ? 'Outlet A' : 'Outlet B'),
      errorCode: 'NoError',
      status: 'Available',
      timestamp: new Date().toISOString(),
    },
  });

  ACTIVE_SESSION = null;
  const currentWallet = getUserWallet(driverPhone);

  res.json({
    success: true,
    message: 'Session terminated via OCPP 1.6J StopTransaction. Connector unlatched and escrow settled.',
    completedSession: session,
    wallet: currentWallet,
  });
});

// OCPP Audit Logs
app.get('/api/ocpp/logs', (_req, res) => {
  res.json(OCPP_LOGS);
});

// Inject simulated hardware event (Task 4 test runner + OCPP 1.6J Virtual HMI)
app.post('/api/ocpp/inject-event', (req, res) => {
  const { action, payload, direction = 'INCOMING', chargeBoxId = 'CL-KSI-001' } = req.body || {};

  if (direction === 'INCOMING' && action) {
    const reply = ocpp16Engine.handleChargePointCall(
      chargeBoxId,
      action as OcppAction,
      payload || {}
    );
    res.json({
      success: true,
      message: OCPP_LOGS[0],
      responseFrame: reply,
      station: ocpp16Engine.findStation(chargeBoxId),
      activeSession: ACTIVE_SESSION,
    });
    return;
  }

  const msg: OcppMessage = {
    id: `sim-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId,
    direction,
    action,
    payload: payload || {},
  };
  OCPP_LOGS.unshift(msg);

  if (action === 'StatusNotification' && payload?.connectorId) {
    const connId = Number(payload.connectorId);
    STATIONS.forEach((s) => {
      s.connectors.forEach((c) => {
        if (c.connectorId === connId && payload.status) {
          c.status = payload.status;
          if (payload.errorCode) c.errorCode = payload.errorCode;
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
    availableStations: STATIONS.filter(
      (s) => s.isOnline && s.connectors.some((c) => c.status === 'Available')
    ).length,
    recentOcppPackets: OCPP_LOGS.slice(0, 10),
  });
});

// Start Simulated Session directly (with optional speed, initial SoC, target SoC, power)
app.post('/api/simulator/start', (req, res) => {
  const {
    stationId = STATIONS[0]?.stationId || 'CL-KSI-001',
    connectorId = 1,
    initialSoc = 24,
    targetSoc = 85,
    powerKw = 160,
    speedMultiplier = 1,
    isFleet = false,
  } = req.body;

  SIMULATION_SPEED = Math.max(1, Math.min(20, Number(speedMultiplier) || 1));

  const station =
    STATIONS.find((s) => s.stationId === stationId || s.id === stationId) || STATIONS[0];
  const connector =
    station.connectors.find((c) => c.connectorId === Number(connectorId)) || station.connectors[0];

  connector.status = 'Charging';
  connector.errorCode = 'NoError';
  connector.currentPowerKw = Number(powerKw) || connector.maxPowerKw;

  const currentVoltage = 400.8;
  const currentAmps = +((connector.currentPowerKw * 1000) / currentVoltage).toFixed(1);
  const transactionId = ocpp16Engine.allocateTransactionId();
  const meterStartWh = 142500;

  ACTIVE_SESSION = {
    sessionId: `sim-ses-${Date.now()}`,
    transactionId,
    stationId: station.stationId,
    stationName: station.name,
    chargeBoxId: station.stationId,
    connectorId: connector.connectorId,
    connectorLabel: connector.label || (connector.connectorId === 1 ? 'Outlet A' : 'Outlet B'),
    connectorType: connector.type,
    idTag: 'VID-GH-8842-A',
    userId: 'usr-gh-001',
    isFleetSession: !!isFleet,
    fleetVin: isFleet ? FLEET_ACCOUNT.vehicles[0].vin : undefined,
    startTime: Date.now(),
    elapsedSeconds: 0,
    remainingMinutes: 22,
    currentSocPercent: Number(initialSoc) || 24,
    targetSocPercent: Number(targetSoc) || 85,
    currentPowerKw: connector.currentPowerKw,
    voltageV: currentVoltage,
    currentA: currentAmps,
    kwhDelivered: 0.01,
    meterStartWh,
    meterStopWh: meterStartWh + 10,
    temperatureC: 34.5,
    accruedCost: 0.05,
    tariffPerKwh: connector.tariffPerKwh,
    cardBalanceGhs: 145.5,
    currency: 'GHS',
    preauthHoldAmount: 25.00,
    status: 'Charging',
    meterValuesLog: [
      {
        timestamp: new Date().toISOString(),
        soc: Number(initialSoc) || 24,
        powerKw: connector.currentPowerKw,
        kwhTotal: 0.01,
      },
    ],
  };

  OCPP_LOGS.unshift({
    id: `sim-start-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId: station.stationId,
    direction: 'INCOMING',
    action: 'StartTransaction',
    messageTypeId: 2,
    uniqueId: `sim-${transactionId}`,
    payload: {
      station: station.name,
      stationId: station.stationId,
      connectorId: connector.connectorId,
      connectorLabel: ACTIVE_SESSION.connectorLabel,
      transactionId,
      meterStart: meterStartWh,
      maxPowerKw: connector.maxPowerKw,
      simulationSpeed: `${SIMULATION_SPEED}x`,
    },
  });

  res.json({
    success: true,
    message: `Simulation initiated at ${station.name} (${ACTIVE_SESSION.connectorLabel} · ${connector.maxPowerKw} kW) at ${SIMULATION_SPEED}x speed`,
    session: ACTIVE_SESSION,
    simulationSpeed: SIMULATION_SPEED,
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
app.post('/api/simulator/stop', (_req, res) => {
  if (!ACTIVE_SESSION) {
    res.status(400).json({ error: 'No active session to stop' });
    return;
  }

  const finished = { ...ACTIVE_SESSION };
  const station = STATIONS.find((s) => s.stationId === finished.stationId);
  const connector = station?.connectors.find((c) => c.connectorId === finished.connectorId);
  if (connector) {
    connector.status = 'Available';
    connector.errorCode = 'NoError';
    connector.currentPowerKw = 0;
  }

  ACTIVE_SESSION = null;

  OCPP_LOGS.unshift({
    id: `sim-stop-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chargeBoxId: finished.stationId,
    direction: 'INCOMING',
    action: 'StopTransaction',
    messageTypeId: 2,
    uniqueId: `sim-stop-${finished.transactionId || 98421}`,
    payload: {
      transactionId: finished.transactionId || 98421,
      kwhDelivered: finished.kwhDelivered.toFixed(3),
      finalSoc: finished.currentSocPercent.toFixed(1),
      accruedCost: finished.accruedCost.toFixed(2),
      durationSeconds: finished.elapsedSeconds,
      reason: 'Local',
    },
  });

  res.json({
    success: true,
    message: 'Simulation session stopped and connector returned to Available.',
    session: finished,
  });
});

// --- AUTHENTICATION & MOOLRE OTP ENDPOINTS ---

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
    const { phoneNumber, code, metadata } = req.body;
    if (!phoneNumber || !code) {
      return res
        .status(400)
        .json({ success: false, error: 'Phone number and verification code are required' });
    }
    const result = verifyOtp(phoneNumber, code, metadata);
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
  const allowedUpdates = {
    displayName:
      typeof req.body.displayName === 'string'
        ? req.body.displayName.trim().slice(0, 120)
        : undefined,
    email: typeof req.body.email === 'string' ? req.body.email.trim().slice(0, 160) : undefined,
    avatarUrl:
      typeof req.body.avatarUrl === 'string' ? req.body.avatarUrl.slice(0, 450_000) : undefined,
    ghanaCardId:
      typeof req.body.ghanaCardId === 'string'
        ? req.body.ghanaCardId.trim().slice(0, 80)
        : undefined,
    targetChargeLimit: Number.isFinite(Number(req.body.targetChargeLimit))
      ? Math.min(100, Math.max(50, Number(req.body.targetChargeLimit)))
      : undefined,
    smsReceiptsEnabled:
      typeof req.body.smsReceiptsEnabled === 'boolean' ? req.body.smsReceiptsEnabled : undefined,
    defaultPaymentMethod: ['MTN_MOMO', 'TELECEL_CASH', 'MASTERCARD'].includes(
      req.body.defaultPaymentMethod
    )
      ? req.body.defaultPaymentMethod
      : undefined,
    registeredVehicles: Array.isArray(req.body.registeredVehicles)
      ? req.body.registeredVehicles
      : undefined,
  };
  const updated = updateUserProfile(
    phone,
    Object.fromEntries(Object.entries(allowedUpdates).filter(([, value]) => value !== undefined))
  );
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(updated);
});

// --- VITE & SERVER STARTUP (WITH NATIVE RFC 6455 OCPP 1.6J WEBSOCKET INGRESS) ---
async function startServer() {
  const httpServer = http.createServer(app);

  // Attach native OCPP 1.6J WebSocket server before Vite HMR so /ocpp/1.6/:chargeBoxId upgrades cleanly
  attachOcpp16WebSocketServer(httpServer, ocpp16Engine);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[XCharge Server] Running on http://0.0.0.0:${PORT}`);
    console.log(
      `[OCPP 1.6J CSMS] WebSocket endpoint ready at ws://0.0.0.0:${PORT}/ocpp/1.6/CL-KSI-001 (or /19046744073709551615)`
    );
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
