import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Standalone Vercel handler for /api/admin/* — kept in one file to respect the Hobby 12-function limit.
const ADMIN_COOKIE_NAME = 'wilpower_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const DATA_DIR = process.env.VERCEL ? '/tmp/xcharge-data' : path.join(process.cwd(), 'data');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const OCPP_STATE_FILE = path.join(DATA_DIR, 'ocpp-state.json');

const STATIONS = [
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
        tariffCurrency: 'GHS',
      },
    ],
  },
];

const OCPP_LOGS = [
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
      currentTime: new Date().toISOString(),
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
      location: 'Greenwood Event Center, Kumasi',
    },
  },
];

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.PAYSTACK_SECRET_KEY || 'wilpower-dev-admin-secret-change-in-production';
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): string {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [scheme, salt, hash] = storedHash.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

function loadAdmins() {
  const email = (process.env.ADMIN_EMAIL || 'admin@wilpower.gh').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'WilpowerAdmin!2026';
  const defaultAdmins = [
    {
      id: 'adm-wilpower-root',
      email,
      displayName: process.env.ADMIN_DISPLAY_NAME || 'Wilpower Operations',
      role: 'super_admin',
      passwordHash: process.env.ADMIN_PASSWORD_HASH || hashPassword(password),
    },
  ];
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(ADMINS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fall back to configured default admin.
  }
  return defaultAdmins;
}

function saveAdmins(admins: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2), 'utf8');
  } catch {
    // Serverless memory/tmp fallback.
  }
}

function signPayload(encodedPayload: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(encodedPayload).digest('base64url');
}

function issueSession(admin: any): string {
  const payload = {
    sub: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function readCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf('=');
        if (idx === -1) return [part, ''];
        return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      })
  );
}

function readSession(req: any) {
  const cookies = readCookies(req.headers?.cookie);
  const rawCookie = cookies[ADMIN_COOKIE_NAME];
  const bearer = String(req.headers?.authorization || '').startsWith('Bearer ')
    ? String(req.headers.authorization).slice(7).trim()
    : '';
  const token = rawCookie || bearer;
  if (!token || !token.includes('.')) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;
  const expected = signPayload(encodedPayload);
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(actualBuf, expectedBuf)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!parsed?.sub || !parsed?.email || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setAdminCookie(res: any, token: string) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.setHeader(
    'Set-Cookie',
    [
      `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
      secure ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ')
  );
}

function clearAdminCookie(res: any) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.setHeader(
    'Set-Cookie',
    [`${ADMIN_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0', secure ? 'Secure' : '']
      .filter(Boolean)
      .join('; ')
  );
}

function loadLiveStationsAndLogs() {
  try {
    if (fs.existsSync(OCPP_STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(OCPP_STATE_FILE, 'utf8'));
      return {
        stations: parsed.stations || STATIONS,
        logs: parsed.logs || OCPP_LOGS,
        activeSession: parsed.activeSession || null,
      };
    }
  } catch {
    // Ignore
  }
  return { stations: STATIONS, logs: OCPP_LOGS, activeSession: null };
}

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const urlPath = String(req.url || '').split('?')[0];

  if (urlPath.endsWith('/auth/config') && req.method === 'GET') {
    const configured = Boolean(process.env.ADMIN_EMAIL && (process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH));
    return res.status(200).json({
      configured,
      defaultEmail: configured ? undefined : 'admin@wilpower.gh',
      defaultPasswordHint: configured ? undefined : 'WilpowerAdmin!2026',
    });
  }

  if (urlPath.endsWith('/auth/login') && req.method === 'POST') {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const admin = loadAdmins().find((item) => item.email.toLowerCase() === email);
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return res.status(401).json({ success: false, error: 'Invalid administrator credentials.' });
    }
    const publicAdmin = { id: admin.id, email: admin.email, displayName: admin.displayName, role: admin.role };
    setAdminCookie(res, issueSession(publicAdmin));
    return res.status(200).json({ success: true, admin: publicAdmin });
  }

  if (urlPath.endsWith('/auth/logout') && req.method === 'POST') {
    clearAdminCookie(res);
    return res.status(200).json({ success: true });
  }

  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  if (urlPath.endsWith('/auth/change-password') && req.method === 'POST') {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 12) {
      return res.status(400).json({ error: 'New password must be at least 12 characters.' });
    }
    const admins = loadAdmins();
    const index = admins.findIndex((item) => item.id === session.sub || item.email.toLowerCase() === session.email.toLowerCase());
    if (index === -1 || !verifyPassword(currentPassword, admins[index].passwordHash)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    admins[index] = { ...admins[index], passwordHash: hashPassword(newPassword) };
    saveAdmins(admins);
    const publicAdmin = { id: admins[index].id, email: admins[index].email, displayName: admins[index].displayName, role: admins[index].role };
    setAdminCookie(res, issueSession(publicAdmin));
    return res.status(200).json({ success: true, admin: publicAdmin });
  }

  if (urlPath.endsWith('/auth/me') && req.method === 'GET') {
    return res.status(200).json({
      authenticated: true,
      admin: { id: session.sub, email: session.email, displayName: session.displayName, role: session.role },
    });
  }

  const live = loadLiveStationsAndLogs();

  if (urlPath.endsWith('/overview') && req.method === 'GET') {
    const connectors = live.stations.flatMap((station: any) => station.connectors);
    const availableConnectors = connectors.filter((connector: any) => connector.status === 'Available').length;
    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      stations: {
        total: live.stations.length,
        online: live.stations.filter((station: any) => station.isOnline).length,
        offline: live.stations.filter((station: any) => !station.isOnline).length,
      },
      connectors: {
        total: connectors.length,
        available: availableConnectors,
        occupied: connectors.length - availableConnectors,
      },
      sessions: {
        active: live.activeSession ? 1 : 0,
        currentCost: live.activeSession?.accruedCost || 0,
        kwhDelivered: live.activeSession?.kwhDelivered || 0,
        activeSession: live.activeSession,
      },
      network: {
        health: 'ok',
        citrineOsBridge: 'CONNECTED',
        ocppVersion: 'OCPP 1.6J Edition 2',
      },
      alerts: live.logs.filter((log: any) => log.action === 'StatusNotification' && log.payload?.status === 'Faulted').slice(0, 8),
    });
  }

  if (urlPath.endsWith('/stations') && req.method === 'GET') {
    return res.status(200).json(live.stations);
  }

  if (urlPath.endsWith('/ocpp/logs') && req.method === 'GET') {
    return res.status(200).json(live.logs);
  }

  return res.status(404).json({ error: 'Unknown admin endpoint.' });
}
