import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export type AdminRole = 'super_admin' | 'network_operator' | 'finance_manager' | 'fleet_manager' | 'support_agent' | 'read_only';

export interface AdminIdentity {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

const ADMIN_COOKIE = 'wilpower_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEV_EMAIL = 'admin@wilpower.local';
const DEV_PASSWORD = 'WilpowerLocalAdmin!2026';

function isProduction() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

function sessionSecret() {
  return process.env.WILPOWER_ADMIN_SESSION_SECRET || process.env.OTP_SECRET || 'wilpower-local-admin-session-secret-change-me';
}

function configuredCredentials() {
  return {
    email: (process.env.WILPOWER_ADMIN_EMAIL || (isProduction() ? '' : DEV_EMAIL)).trim().toLowerCase(),
    password: process.env.WILPOWER_ADMIN_PASSWORD || (isProduction() ? '' : DEV_PASSWORD),
    displayName: process.env.WILPOWER_ADMIN_NAME || 'Wilpower Administrator',
    role: (process.env.WILPOWER_ADMIN_ROLE || 'super_admin') as AdminRole,
  };
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
  if (!safeEqual(email.trim().toLowerCase(), credentials.email) || !safeEqual(password, credentials.password)) return null;
  return {
    id: 'admin-primary',
    email: credentials.email,
    displayName: credentials.displayName,
    role: credentials.role,
  };
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
    return { id: parsed.id, email: parsed.email, displayName: parsed.displayName, role: parsed.role };
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
  return { localCredentialsEnabled: !isProduction(), email: isProduction() ? undefined : DEV_EMAIL };
}
