import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';

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
const ADMIN_DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'xcharge-data') : path.join(process.cwd(), 'data');
const ADMIN_PASSWORD_FILE = path.join(ADMIN_DATA_DIR, 'admin-password.json');

interface AdminPasswordOverride {
  salt: string;
  hash: string;
  changedAt: string;
}

function isProduction() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

function sessionSecret() {
  return process.env.WILPOWER_ADMIN_SESSION_SECRET || process.env.OTP_SECRET || 'wilpower-local-admin-session-secret-change-me';
}

function configuredCredentials() {
  return {
    email: (process.env.WILPOWER_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase(),
    password: process.env.WILPOWER_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
    displayName: process.env.WILPOWER_ADMIN_NAME || 'Wilpower Administrator',
    role: (process.env.WILPOWER_ADMIN_ROLE || 'super_admin') as AdminRole,
  };
}

function readPasswordOverride(): AdminPasswordOverride | null {
  try {
    if (!fs.existsSync(ADMIN_PASSWORD_FILE)) return null;
    const value = JSON.parse(fs.readFileSync(ADMIN_PASSWORD_FILE, 'utf8')) as AdminPasswordOverride;
    return value?.salt && value?.hash ? value : null;
  } catch {
    return null;
  }
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  return {
    salt,
    hash: crypto.scryptSync(password, salt, 64).toString('hex'),
  };
}

function passwordMatches(password: string) {
  const override = readPasswordOverride();
  if (override) {
    const candidate = Buffer.from(hashPassword(password, override.salt).hash, 'hex');
    const expected = Buffer.from(override.hash, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  }
  return safeEqual(password, configuredCredentials().password);
}

function hasConfiguredPasswordOverride() {
  return Boolean(readPasswordOverride() || process.env.WILPOWER_ADMIN_PASSWORD);
}

function savePasswordOverride(password: string) {
  const hashed = hashPassword(password);
  try {
    if (!fs.existsSync(ADMIN_DATA_DIR)) fs.mkdirSync(ADMIN_DATA_DIR, { recursive: true });
    fs.writeFileSync(ADMIN_PASSWORD_FILE, JSON.stringify({ ...hashed, changedAt: new Date().toISOString() }, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Admin Auth] Could not persist password change:', error);
    return false;
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function encode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function decode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function authenticateAdmin(email: string, password: string): AdminIdentity | null {
  const credentials = configuredCredentials();
  if (!credentials.email || !credentials.password) return null;
  if (!safeEqual(email.trim().toLowerCase(), credentials.email) || !passwordMatches(password)) return null;
  return {
    id: 'admin-primary',
    email: credentials.email,
    displayName: credentials.displayName,
    role: credentials.role,
    mustChangePassword: !hasConfiguredPasswordOverride(),
  };
}

export function changeAdminPassword(admin: AdminIdentity, currentPassword: string, newPassword: string): AdminIdentity | null {
  if (!admin?.email || newPassword.length < 12 || !passwordMatches(currentPassword)) return null;
  if (!savePasswordOverride(newPassword)) return null;
  return { ...admin, mustChangePassword: false };
}

export function issueAdminSession(identity: AdminIdentity) {
  const payload = encode(JSON.stringify({ ...identity, exp: Date.now() + SESSION_TTL_SECONDS * 1000 }));
  return payload + '.' + sign(payload);
}

export function readAdminSession(req: Request): AdminIdentity | null {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(ADMIN_COOKIE + '='));
  const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
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

export function setAdminCookie(res: Response, token: string) {
  const secure = isProduction() ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`);
}

export function clearAdminCookie(res: Response) {
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const admin = readAdminSession(req);
  if (!admin) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  (req as Request & { admin?: AdminIdentity }).admin = admin;
  next();
}

export function requireAdminRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as Request & { admin?: AdminIdentity }).admin || readAdminSession(req);
    if (!admin) {
      res.status(401).json({ error: 'Admin authentication required.' });
      return;
    }
    if (!roles.includes(admin.role) && admin.role !== 'super_admin') {
      res.status(403).json({ error: 'Your admin role cannot perform this action.' });
      return;
    }
    next();
  };
}

export function adminDevelopmentInfo() {
  const credentials = configuredCredentials();
  return {
    localCredentialsEnabled: !isProduction(),
    defaultCredentialsEnabled: !hasConfiguredPasswordOverride(),
    email: credentials.email,
  };
}
