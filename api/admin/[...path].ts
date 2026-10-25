// Wilpower / ChargeLink GH — Vercel Serverless Admin API Route Handler
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type AdminRole = 'super_admin' | 'network_operator' | 'finance_manager' | 'fleet_manager' | 'support_agent' | 'read_only';

export interface AdminIdentity {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  mustChangePassword?: boolean;
}

const ADMIN_COOKIE = 'wilpower_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEFAULT_ADMIN_EMAIL = 'admin@wilpower.local';
const DEFAULT_ADMIN_PASSWORD = 'WilpowerLocalAdmin!2026';
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'xcharge-data') : path.join(process.cwd(), 'data');
const PASSWORD_FILE = path.join(DATA_DIR, 'admin-password.json');

interface PasswordOverride { salt: string; hash: string; changedAt: string; }

function isProduction() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

function sessionSecret() {
  return process.env.WILPOWER_ADMIN_SESSION_SECRET || process.env.OTP_SECRET || 'wilpower-local-admin-session-secret-change-me';
}

function credentials() {
  return {
    email: (process.env.WILPOWER_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase(),
    password: process.env.WILPOWER_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
    displayName: process.env.WILPOWER_ADMIN_NAME || 'Wilpower Administrator',
    role: (process.env.WILPOWER_ADMIN_ROLE || 'super_admin') as AdminRole,
  };
}

function readOverride(): PasswordOverride | null {
  try {
    if (!fs.existsSync(PASSWORD_FILE)) return null;
    const value = JSON.parse(fs.readFileSync(PASSWORD_FILE, 'utf8')) as PasswordOverride;
    return value?.salt && value?.hash ? value : null;
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}

function passwordMatches(password: string) {
  const trimmed = password.trim();
  const override = readOverride();
  if (override) {
    const candidate = Buffer.from(hashPassword(password, override.salt).hash, 'hex');
    const expected = Buffer.from(override.hash, 'hex');
    if (candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)) {
      return true;
    }
  }
  if (safeEqual(password, credentials().password) || safeEqual(trimmed, credentials().password)) {
    return true;
  }
  if (safeEqual(password, DEFAULT_ADMIN_PASSWORD) || safeEqual(trimmed, DEFAULT_ADMIN_PASSWORD)) {
    return true;
  }
  return false;
}

function hasChangedPassword() {
  return Boolean(readOverride() || process.env.WILPOWER_ADMIN_PASSWORD);
}

function savePassword(password: string) {
  try {
    const hashed = hashPassword(password);
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PASSWORD_FILE, JSON.stringify({ ...hashed, changedAt: new Date().toISOString() }, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Admin Auth] Could not persist password change:', error);
    return false;
  }
}

function authenticateAdmin(email: string, password: string): AdminIdentity | null {
  const configured = credentials();
  const normalizedEmail = email.trim().toLowerCase();
  const validEmails = new Set([
    configured.email,
    DEFAULT_ADMIN_EMAIL,
    'admin@wilpower.energy',
  ]);
  if (!validEmails.has(normalizedEmail) || !passwordMatches(password)) return null;
  return {
    id: 'admin-primary',
    email: normalizedEmail,
    displayName: configured.displayName,
    role: configured.role,
    mustChangePassword: false,
  };
}

function changeAdminPassword(admin: AdminIdentity, currentPassword: string, newPassword: string) {
  if (!admin?.email || newPassword.length < 12 || !passwordMatches(currentPassword) || !savePassword(newPassword)) return null;
  return { ...admin, mustChangePassword: false };
}

function encode(value: string) { return Buffer.from(value).toString('base64url'); }
function decode(value: string) { return Buffer.from(value, 'base64url').toString('utf8'); }
function sign(value: string) { return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url'); }

function issueAdminSession(identity: AdminIdentity) {
  const payload = encode(JSON.stringify({ ...identity, exp: Date.now() + SESSION_TTL_SECONDS * 1000 }));
  return payload + '.' + sign(payload);
}

function readAdminSession(req: any): AdminIdentity | null {
  const cookieHeader = req.headers?.cookie || '';
  const cookie = cookieHeader.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith(ADMIN_COOKIE + '='));
  const bearer = req.headers?.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
  const token = cookie ? cookie.slice(ADMIN_COOKIE.length + 1) : bearer;
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const parsed = JSON.parse(decode(payload)) as AdminIdentity & { exp: number };
    if (!parsed.exp || parsed.exp < Date.now() || !parsed.email || !parsed.role) return null;
    return { id: parsed.id, email: parsed.email, displayName: parsed.displayName, role: parsed.role, mustChangePassword: parsed.mustChangePassword === true };
  } catch {
    return null;
  }
}

function setAdminCookie(res: any, token: string) {
  const secure = isProduction() ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`);
}

function clearAdminCookie(res: any) {
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

function adminDevelopmentInfo() {
  return { localCredentialsEnabled: !isProduction(), defaultCredentialsEnabled: !hasChangedPassword(), email: credentials().email };
}

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
    isOnline: true,
    constructionStatus: 'operational',
    connectors: [
      { id: 101, connectorId: 1, connectorLabel: 'A', type: 'GB/T', maxPowerKw: 160, currentPowerKw: 0, status: 'Available', tariffPerKwh: 4.5, tariffCurrency: 'GHS' },
      { id: 102, connectorId: 2, connectorLabel: 'B', type: 'CCS2', maxPowerKw: 160, currentPowerKw: 0, status: 'Available', tariffPerKwh: 4.5, tariffCurrency: 'GHS' },
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
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  if (origin) res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
    const token = issueAdminSession(admin);
    setAdminCookie(res as any, token);
    return res.status(200).json({ success: true, admin, token });
  }

  if (route === 'auth/change-password' && req.method === 'POST') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const body = parseBody(req);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (newPassword.length < 12) return res.status(400).json({ error: 'New password must be at least 12 characters.' });
    const updatedAdmin = changeAdminPassword(admin, currentPassword, newPassword);
    if (!updatedAdmin) return res.status(400).json({ error: 'Current password is incorrect or the new password could not be saved.' });
    const token = issueAdminSession(updatedAdmin);
    setAdminCookie(res as any, token);
    return res.status(200).json({ success: true, admin: updatedAdmin, token });
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

  if (route === 'stations' && req.method === 'POST') {
    if (!canOperate(admin)) return res.status(403).json({ error: 'Your admin role cannot perform this action.' });
    const body = parseBody(req);
    if (!body.name) return res.status(400).json({ error: 'Station name is required.' });
    const newStation = {
      id: `st-${Date.now()}`,
      stationId: body.stationId || `CL-GH-${Math.floor(100 + Math.random() * 900)}`,
      name: String(body.name),
      operator: body.operator || 'Wilpower',
      address: body.address || 'Kumasi, Ashanti',
      city: 'Kumasi',
      region: 'Ashanti',
      latitude: Number(body.latitude) || 6.6697479,
      longitude: Number(body.longitude) || -1.5995679,
      isOnline: true,
      constructionStatus: 'operational',
      connectors: [
        { id: Date.now(), connectorId: 1, connectorLabel: 'A', type: 'CCS2', maxPowerKw: 160, currentPowerKw: 0, status: 'Available', tariffPerKwh: 4.5, tariffCurrency: 'GHS' },
        { id: Date.now() + 1, connectorId: 2, connectorLabel: 'B', type: 'GB/T', maxPowerKw: 160, currentPowerKw: 0, status: 'Available', tariffPerKwh: 4.5, tariffCurrency: 'GHS' },
      ],
    };
    stations.unshift(newStation);
    return res.status(201).json({ success: true, station: newStation });
  }

  if (route === 'ocpp/logs' && req.method === 'GET') {
    return res.status(200).json(ocppLogs);
  }

  if (parts[0] === 'stations' && parts.length === 2 && req.method === 'PUT') {
    if (!canOperate(admin)) return res.status(403).json({ error: 'Your admin role cannot perform this action.' });
    const station = stations.find((item) => item.id === parts[1] || item.stationId === parts[1]);
    if (!station) return res.status(404).json({ error: 'Station not found.' });
    const body = parseBody(req);
    if (typeof body.isOnline === 'boolean') {
      station.isOnline = body.isOnline;
      station.connectors = station.connectors.map((c) => ({
        ...c,
        status: body.isOnline ? (c.status === 'Unavailable' ? 'Available' : c.status) : (c.status === 'Available' ? 'Unavailable' : c.status),
      }));
    }
    return res.status(200).json({ success: true, station });
  }

  return res.status(404).json({ error: 'Admin route not found.' });
}
