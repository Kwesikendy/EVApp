import fs from 'fs';
import path from 'path';

type PaymentMethod = 'MTN_MOMO' | 'TELECEL_CASH' | 'MASTERCARD';

interface UserRecord {
  id: string;
  phoneNumber: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  ghanaCardId?: string;
  targetChargeLimit?: number;
  smsReceiptsEnabled?: boolean;
  walletBalance: number;
  heldEscrow: number;
  defaultPaymentMethod: PaymentMethod;
  registeredVehicles: any[];
  transactions?: any[];
  createdAt: string;
  updatedAt: string;
}

const dataDir = process.env.VERCEL ? path.join('/tmp', 'xcharge-data') : path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const seedFile = path.join(process.cwd(), 'data', 'users.json');

function normalizeGhanaPhoneNumber(rawPhone: string) {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.startsWith('2330') && digits.length === 13) return `+233${digits.substring(4)}`;
  if (digits.startsWith('233') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+233${digits.substring(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return (rawPhone || '').trim();
}

function defaultUser(phoneNumber: string): UserRecord {
  const now = new Date().toISOString();
  return {
    id: `usr-gh-${phoneNumber.slice(-4)}`,
    phoneNumber,
    displayName: phoneNumber === '+233248901204' ? 'Kofi Mensah' : 'EV Driver',
    email: phoneNumber === '+233248901204' ? 'kofi.mensah@chargelink.com.gh' : 'driver@chargelink.com.gh',
    walletBalance: 100,
    heldEscrow: 0,
    defaultPaymentMethod: 'MTN_MOMO',
    registeredVehicles: [{
      id: 'veh-01', make: 'BYD', model: 'Atto 3 EV', year: 2024,
      batteryCapacityKwh: 60.5, connectorType: 'CCS2', licensePlate: 'GW 4821 - 24', isDefault: true,
    }],
    createdAt: now,
    updatedAt: now,
  };
}

function readUsers() {
  const users = new Map<string, UserRecord>();
  try {
    const file = fs.existsSync(usersFile) ? usersFile : seedFile;
    if (fs.existsSync(file)) {
      const records = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(records)) {
        for (const record of records) {
          if (record?.phoneNumber) users.set(normalizeGhanaPhoneNumber(record.phoneNumber), record);
        }
      }
    }
  } catch (error) {
    console.warn('[Profile API] Could not read users.json:', error);
  }
  return users;
}

function saveUsersToDisk(users: Map<string, UserRecord>) {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(usersFile, JSON.stringify(Array.from(users.values()), null, 2), 'utf8');
  } catch (error) {
    console.error('[Profile API] Could not persist users.json:', error);
  }
}

function parseBody(req: any) {
  if (!req.body) return {};
  if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body); } catch { return {}; }
}

function profileUpdates(body: any) {
  const updates: Partial<UserRecord> = {};
  if (typeof body.displayName === 'string') updates.displayName = body.displayName.trim().slice(0, 120);
  if (typeof body.email === 'string') updates.email = body.email.trim().slice(0, 160);
  if (typeof body.avatarUrl === 'string') updates.avatarUrl = body.avatarUrl.slice(0, 450_000);
  if (typeof body.ghanaCardId === 'string') updates.ghanaCardId = body.ghanaCardId.trim().slice(0, 80);
  if (Number.isFinite(Number(body.targetChargeLimit))) updates.targetChargeLimit = Math.min(100, Math.max(50, Number(body.targetChargeLimit)));
  if (typeof body.smsReceiptsEnabled === 'boolean') updates.smsReceiptsEnabled = body.smsReceiptsEnabled;
  if (['MTN_MOMO', 'TELECEL_CASH', 'MASTERCARD'].includes(body.defaultPaymentMethod)) updates.defaultPaymentMethod = body.defaultPaymentMethod;
  if (Array.isArray(body.registeredVehicles)) updates.registeredVehicles = body.registeredVehicles.slice(0, 20);
  return updates;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const body = parseBody(req);
  const rawPhone = String(req.query?.phoneNumber || req.query?.phone || body.phoneNumber || '+233248901204');
  const phoneNumber = normalizeGhanaPhoneNumber(rawPhone);
  const users = readUsers();
  let user = users.get(phoneNumber);

  if (req.method === 'GET') {
    if (!user) {
      user = defaultUser(phoneNumber);
      users.set(phoneNumber, user);
      saveUsersToDisk(users);
    }
    return res.status(200).json(user);
  }

  if (req.method === 'PUT') {
    if (!user) user = defaultUser(phoneNumber);
    user = { ...user, ...profileUpdates(body), phoneNumber, updatedAt: new Date().toISOString() };
    users.set(phoneNumber, user);
    saveUsersToDisk(users);
    return res.status(200).json(user);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
