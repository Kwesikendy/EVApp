import {
  adminDevelopmentInfo,
  authenticateAdmin,
  clearAdminCookie,
  issueAdminSession,
  readAdminSession,
  setAdminCookie,
  type AdminRole,
} from '../../server/admin';

type VercelRequest = any;
type VercelResponse = any;

const stations = [
  {
    id: 'st-01',
    stationId: 'CL-KSI-001',
    name: 'Greenwood Event Center',
    operator: 'Wilpower',
    address: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi, Ashanti',
    city: 'Kumasi',
    region: 'Ashanti',
    latitude: 6.6697479,
    longitude: -1.5995679,
    isOnline: false,
    constructionStatus: 'under_construction',
    connectors: [
      { id: 101, connectorId: 1, connectorLabel: 'A', type: 'GB/T', maxPowerKw: 160, currentPowerKw: 0, status: 'Unavailable', tariffPerKwh: 4.5, tariffCurrency: 'GHS' },
      { id: 102, connectorId: 2, connectorLabel: 'B', type: 'CCS2', maxPowerKw: 160, currentPowerKw: 0, status: 'Unavailable', tariffPerKwh: 4.5, tariffCurrency: 'GHS' },
    ],
  },
];

const ocppLogs: any[] = [];

function pathParts(req: VercelRequest) {
  const value = req.query?.path;
  return (Array.isArray(value) ? value : [value]).filter(Boolean).map(String);
}

function parseBody(req: VercelRequest) {
  if (!req.body) return {};
  if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body); } catch { return {}; }
}

function sendUnauthorized(res: VercelResponse) {
  return res.status(401).json({ error: 'Admin authentication required.' });
}

function currentAdmin(req: VercelRequest) {
  return readAdminSession(req as any);
}

function requireAdmin(req: VercelRequest, res: VercelResponse) {
  const admin = currentAdmin(req);
  if (!admin) {
    sendUnauthorized(res);
    return null;
  }
  return admin;
}

function canOperate(admin: { role: AdminRole }) {
  return admin.role === 'super_admin' || admin.role === 'network_operator';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const parts = pathParts(req);
  const route = parts.join('/');

  if (route === 'auth/config' && req.method === 'GET') {
    return res.status(200).json(adminDevelopmentInfo());
  }

  if (route === 'auth/login' && req.method === 'POST') {
    const body = parseBody(req);
    const admin = authenticateAdmin(String(body.email || ''), String(body.password || ''));
    if (!admin) return res.status(401).json({ success: false, error: 'Invalid administrator credentials.' });
    setAdminCookie(res as any, issueAdminSession(admin));
    return res.status(200).json({ success: true, admin });
  }

  if (route === 'auth/me' && req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    return res.status(200).json({ authenticated: true, admin });
  }

  if (route === 'auth/logout' && req.method === 'POST') {
    clearAdminCookie(res as any);
    return res.status(200).json({ success: true });
  }

  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (route === 'overview' && req.method === 'GET') {
    const connectorCount = stations.reduce((total, station) => total + station.connectors.length, 0);
    const availableCount = stations.reduce((total, station) => total + station.connectors.filter((connector) => connector.status === 'Available').length, 0);
    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      stations: { total: stations.length, online: stations.filter((station) => station.isOnline).length, offline: stations.filter((station) => !station.isOnline).length },
      connectors: { total: connectorCount, available: availableCount, occupied: connectorCount - availableCount },
      sessions: { active: 0, currentCost: 0, kwhDelivered: 0 },
      network: { health: 'ok', citrineOsBridge: 'CONNECTED', ocppVersion: 'OCPP 1.6J / 2.0.1' },
      alerts: [],
    });
  }

  if (route === 'stations' && req.method === 'GET') {
    return res.status(200).json(stations);
  }

  if (route === 'ocpp/logs' && req.method === 'GET') {
    return res.status(200).json(ocppLogs);
  }

  if (parts[0] === 'stations' && parts.length === 2 && req.method === 'PUT') {
    if (!canOperate(admin)) return res.status(403).json({ error: 'Your admin role cannot perform this action.' });
    const station = stations.find((item) => item.id === parts[1]);
    if (!station) return res.status(404).json({ error: 'Station not found.' });
    const body = parseBody(req);
    if (typeof body.isOnline === 'boolean') station.isOnline = body.isOnline;
    return res.status(200).json(station);
  }

  return res.status(404).json({ error: 'Admin route not found.' });
}
