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
  const override = readOverride();
  if (!override) return safeEqual(password, credentials().password);
  const candidate = Buffer.from(hashPassword(password, override.salt).hash, 'hex');
  const expected = Buffer.from(override.hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
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

export function authenticateAdmin(email: string, password: string): AdminIdentity | null {
  const configured = credentials();
  if (!safeEqual(email.trim().toLowerCase(), configured.email) || !passwordMatches(password)) return null;
  return {
    id: 'admin-primary',
    email: configured.email,
    displayName: configured.displayName,
    role: configured.role,
    mustChangePassword: !hasChangedPassword(),
  };
}

export function changeAdminPassword(admin: AdminIdentity, currentPassword: string, newPassword: string) {
  if (!admin?.email || newPassword.length < 12 || !passwordMatches(currentPassword) || !savePassword(newPassword)) return null;
  return { ...admin, mustChangePassword: false };
}

function encode(value: string) { return Buffer.from(value).toString('base64url'); }
function decode(value: string) { return Buffer.from(value, 'base64url').toString('utf8'); }
function sign(value: string) { return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url'); }

export function issueAdminSession(identity: AdminIdentity) {
  const payload = encode(JSON.stringify({ ...identity, exp: Date.now() + SESSION_TTL_SECONDS * 1000 }));
  return payload + '.' + sign(payload);
}

export function readAdminSession(req: any): AdminIdentity | null {
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

export function setAdminCookie(res: any, token: string) {
  const secure = isProduction() ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`);
}

export function clearAdminCookie(res: any) {
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export function adminDevelopmentInfo() {
  return { localCredentialsEnabled: !isProduction(), defaultCredentialsEnabled: !hasChangedPassword(), email: credentials().email };
}
