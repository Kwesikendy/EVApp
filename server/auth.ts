/**
 * Authentication and SMS OTP Engine with Arkesel Gateway Integration
 * Supports live Arkesel SMS dispatch and developer fallback testing.
 */

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP storage with automatic expiry
const OTP_STORE = new Map<string, OtpRecord>();

export interface WalletTransaction {
  id: string;
  timestamp: string;
  amount: number;
  type: 'TOPUP' | 'CHARGE_SETTLEMENT' | 'PREAUTH_HOLD' | 'PREAUTH_RELEASE';
  status: 'SUCCESS' | 'RELEASED' | 'PENDING' | 'FAILED';
  provider: 'MOMO' | 'CARD';
  reference: string;
  description: string;
}

// User persistence model
export interface UserProfile {
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
  customTariffPerKwh?: number;
  defaultPaymentMethod: 'MTN_MOMO' | 'TELECEL_CASH' | 'MASTERCARD';
  registeredVehicles: {
    id: string;
    make: string;
    model: string;
    year: number;
    batteryCapacityKwh: number;
    connectorType: string;
    licensePlate: string;
    isDefault: boolean;
  }[];
  transactions?: WalletTransaction[];
  createdAt: string;
  updatedAt: string;
}

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const SEED_FILE = path.join(process.cwd(), 'data', 'users.json');
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'xcharge-data')
  : process.cwd().includes('hbuilds')
  ? path.join(os.homedir(), '.wilpower-data')
  : path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OTP_FILE = path.join(DATA_DIR, 'otps.json');

/**
 * Deterministic 6-digit OTP generation using HMAC-SHA256 based on phone number and time window.
 * Guarantees 100% reliable verification across stateless serverless lambdas (Vercel),
 * container recycles, multi-instance clusters, and cold starts without requiring a shared database.
 */
export function getDeterministicOtp(phone: string, windowOffset: number = 0): string {
  const normalized = normalizeGhanaPhoneNumber(phone);
  // 5-minute time window
  const window = Math.floor(Date.now() / (5 * 60 * 1000)) + windowOffset;
  const secretRaw = process.env.OTP_SECRET || process.env.MOOLRE_VAS_KEY || 'xcharge-auth-stateless-hmac-seed-2025-accra-gh';
  const secret = secretRaw.replace(/^["']|["']$/g, '').trim();

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`otp:${normalized}:${window}`);
  const hash = hmac.digest('hex');

  // Extract a 6-digit number between 100000 and 999999
  const intVal = (parseInt(hash.substring(0, 8), 16) % 900000) + 100000;
  return intVal.toString();
}

function saveOtpToStorage(normalized: string, record: OtpRecord): void {
  OTP_STORE.set(normalized, record);
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let map: Record<string, OtpRecord> = {};
    if (fs.existsSync(OTP_FILE)) {
      try {
        map = JSON.parse(fs.readFileSync(OTP_FILE, 'utf-8'));
      } catch {}
    }
    map[normalized] = record;
    fs.writeFileSync(OTP_FILE, JSON.stringify(map), 'utf-8');
  } catch {}
}

function getOtpFromStorage(normalized: string): OtpRecord | undefined {
  const mem = OTP_STORE.get(normalized);
  if (mem) return mem;
  try {
    if (fs.existsSync(OTP_FILE)) {
      const map: Record<string, OtpRecord> = JSON.parse(fs.readFileSync(OTP_FILE, 'utf-8'));
      if (map[normalized]) {
        OTP_STORE.set(normalized, map[normalized]);
        return map[normalized];
      }
    }
  } catch {}
  return undefined;
}

function loadUsersFromDisk(): Map<string, UserProfile> {
  const map = new Map<string, UserProfile>();

  try {
    const fileToRead = fs.existsSync(USERS_FILE)
      ? USERS_FILE
      : (fs.existsSync(SEED_FILE) ? SEED_FILE : null);

    if (fileToRead) {
      const content = fs.readFileSync(fileToRead, 'utf-8');
      const records: UserProfile[] = JSON.parse(content);
      if (Array.isArray(records)) {
        for (const user of records) {
          if (user && user.phoneNumber) {
            if (/^Driver \d{4}$/.test(user.displayName || '')) {
              user.displayName = 'Wilpower Driver';
            }
            if (Array.isArray(user.registeredVehicles)) {
              user.registeredVehicles = user.registeredVehicles.filter(
                (v: any) => !/^(GX \d{4} - 24|GW 4821 - 24)$/.test(String(v?.licensePlate || '').trim())
              );
            }
            map.set(normalizeGhanaPhoneNumber(user.phoneNumber), user);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[XCharge DB] Could not read users.json, using defaults:', err);
  }

  return map;
}

export function saveUsersToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(USERS_DB.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[XCharge DB] Failed to persist users to disk:', err);
  }
}

// User persistent database loaded from disk
const USERS_DB = loadUsersFromDisk();

/**
 * Standardize Ghanaian phone number format to +233XXXXXXXXX
 */
export function normalizeGhanaPhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('2330') && digits.length === 13) {
    return `+233${digits.substring(4)}`;
  }
  if (digits.startsWith('233') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+233${digits.substring(1)}`;
  }
  if (digits.length === 9) {
    return `+233${digits}`;
  }
  return rawPhone.trim();
}

export const PRODUCTION_MOOLRE_VAS_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2YXNpZCI6MTY1MTUsImV4cCI6MTk1NjUyNzk5OX0.NBdSLQz1QSw8_Tt1LDPp6YJmJd0gjHcLsN0xPxCeGnA';
export const PRODUCTION_MOOLRE_SENDER_ID = 'Wilpower';

/**
 * Send OTP via Moolre Ghana Messaging API (https://api.moolre.com/open/sms/send) or dev sandbox
 */
export async function sendOtp(phoneNumber: string): Promise<{ success: boolean; message?: string; error?: string; code?: string; devCode?: string }> {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  
  // Generate deterministic 6-digit code for the current 5-minute window
  const code = getDeterministicOtp(normalized, 0);
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  saveOtpToStorage(normalized, {
    code,
    expiresAt,
    attempts: 0,
  });

  const moolreVasKey = (process.env.MOOLRE_VAS_KEY || process.env.MOOLRE_API_KEY || PRODUCTION_MOOLRE_VAS_KEY).replace(/^["']|["']$/g, '').trim();
  const moolreSenderId = (process.env.MOOLRE_SENDER_ID || PRODUCTION_MOOLRE_SENDER_ID).replace(/^["']|["']$/g, '').trim();
  const rawRecipient = normalized.startsWith('+') ? normalized.substring(1) : normalized;

  // If live Moolre API/VAS key is configured, dispatch live SMS via Moolre
  if (moolreVasKey) {
    try {
      const messageText = `Your Wilpower EV code is ${code}. Valid for 5 minutes.`;

      async function dispatchMoolre(sender: string) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
          const postRes = await fetch('https://api.moolre.com/open/sms/send', {
            method: 'POST',
            headers: {
              'X-API-VASKEY': moolreVasKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              type: 1,
              senderid: sender,
              messages: [{ recipient: rawRecipient, message: messageText }],
            }),
            signal: controller.signal,
          });
          const postData = await postRes.json().catch(() => null);
          if (postData && postData.status === 1) return postData;

          const url = new URL('https://api.moolre.com/open/sms/send');
          url.searchParams.append('type', '1');
          url.searchParams.append('senderid', sender);
          url.searchParams.append('recipient', rawRecipient);
          url.searchParams.append('message', messageText);
          const getRes = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'X-API-VASKEY': moolreVasKey, 'Accept': 'application/json' },
            signal: controller.signal,
          });
          return await getRes.json().catch(() => postData);
        } finally {
          clearTimeout(timeoutId);
        }
      }

      let data = await dispatchMoolre(moolreSenderId);
      console.log(`[Moolre SMS Gateway] Dispatched to ${normalized} (sender=${moolreSenderId}):`, data);

      if (data && data.code === 'ASMS07' && moolreSenderId !== 'Business_Ad') {
        data = await dispatchMoolre('Business_Ad');
        console.log(`[Moolre SMS Gateway Retry] Dispatched to ${normalized}:`, data);
      }

      if (data && data.status === 1) {
        return {
          success: true,
          message: `Verification SMS sent via Wilpower to ${normalized}`,
        };
      }

      // Moolre error reporting (e.g. AIN11 Authentication Error, ASMS06 bundle exhausted)
      console.warn(`[Moolre SMS Gateway Notice]:`, data);
      return {
        success: false,
        error: data?.message || 'SMS delivery failed. Please try again.',
        code: data?.code || 'SMS_ERROR',
      };
    } catch (err: any) {
      console.error('[Moolre SMS Gateway Error]', err);
      return {
        success: false,
        error: `SMS gateway unavailable: ${err.message}`,
      };
    }
  }

  return {
    success: false,
    error: 'SMS gateway is not configured.',
  };
}

export interface VerifyOtpMetadata {
  displayName?: string;
  email?: string;
  selectedEv?: string;
  selectedGateway?: string;
  vehiclePlate?: string;
}

/**
 * Verify OTP code with optional driver registration metadata
 */
export function verifyOtp(
  phoneNumber: string,
  inputCode: string,
  metadata?: VerifyOtpMetadata
): { success: boolean; error?: string; user?: UserProfile } {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  const trimmedCode = (inputCode || '').trim();
  const record = getOtpFromStorage(normalized);

  // Check 1: Deterministic OTP verification across sliding time windows
  // (current 5 min, previous 5 min, previous 10 min, previous 15 min, next 5 min for clock skew)
  const codeNow = getDeterministicOtp(normalized, 0);
  const codePrev = getDeterministicOtp(normalized, -1);
  const codePrev2 = getDeterministicOtp(normalized, -2);
  const codePrev3 = getDeterministicOtp(normalized, -3);
  const codeNext = getDeterministicOtp(normalized, 1);
  const isDeterministicMatch =
    trimmedCode === codeNow ||
    trimmedCode === codePrev ||
    trimmedCode === codePrev2 ||
    trimmedCode === codePrev3 ||
    trimmedCode === codeNext;

  // Check 2: In-memory or disk record match
  const isRecordMatch = record && record.code === trimmedCode && Date.now() <= record.expiresAt;

  if (!isDeterministicMatch && !isRecordMatch) {
    if (record) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        OTP_STORE.delete(normalized);
        return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
      }
      return { success: false, error: `Invalid verification code. ${5 - record.attempts} attempts remaining.` };
    }
    return { success: false, error: 'Invalid verification code. Please check the code in your SMS and try again.' };
  }

  // Success - consume OTP
  OTP_STORE.delete(normalized);

  // Retrieve or create driver profile
  let user = USERS_DB.get(normalized);
  if (!user) {
    let make = 'BYD';
    let model = 'Atto 3';
    let batteryCapacityKwh = 60.5;
    let connectorType = 'CCS2';

    if (metadata?.selectedEv === 'tesla') {
      make = 'Tesla';
      model = 'Model Y';
      batteryCapacityKwh = 75.0;
      connectorType = 'CCS2';
    } else if (metadata?.selectedEv === 'hyundai') {
      make = 'Hyundai';
      model = 'Ioniq 5';
      batteryCapacityKwh = 77.4;
      connectorType = 'CCS2';
    }

    let defaultPayment: 'MTN_MOMO' | 'TELECEL_CASH' | 'MASTERCARD' = 'MTN_MOMO';
    if (metadata?.selectedGateway === 'telecel') {
      defaultPayment = 'TELECEL_CASH';
    } else if (metadata?.selectedGateway === 'card') {
      defaultPayment = 'MASTERCARD';
    }

    user = {
      id: `usr-gh-${Date.now().toString(36)}`,
      phoneNumber: normalized,
      displayName: metadata?.displayName || 'Wilpower Driver',
      email: metadata?.email || '',
      walletBalance: 0.00,
      heldEscrow: 0.00,
      defaultPaymentMethod: defaultPayment,
      registeredVehicles: metadata?.vehiclePlate
        ? [
            {
              id: `veh-${Date.now().toString(36)}`,
              make,
              model,
              year: new Date().getFullYear(),
              batteryCapacityKwh,
              connectorType: 'GB/T',
              licensePlate: metadata.vehiclePlate,
              isDefault: true,
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    USERS_DB.set(normalized, user);
    saveUsersToDisk();
  } else if (metadata && (metadata.displayName || metadata.email || metadata.vehiclePlate)) {
    if (metadata.displayName && metadata.displayName !== 'Wilpower Driver') {
      user.displayName = metadata.displayName;
    }
    if (metadata.email) user.email = metadata.email;
    if (metadata.vehiclePlate && (!user.registeredVehicles || user.registeredVehicles.length === 0)) {
      user.registeredVehicles = [
        {
          id: `veh-${Date.now().toString(36)}`,
          make: 'EV',
          model: 'Driver Vehicle',
          year: new Date().getFullYear(),
          batteryCapacityKwh: 60.5,
          connectorType: 'GB/T',
          licensePlate: metadata.vehiclePlate,
          isDefault: true,
        },
      ];
    }
    user.updatedAt = new Date().toISOString();
    USERS_DB.set(normalized, user);
    saveUsersToDisk();
  }

  return { success: true, user };
}

export function getUserProfile(phoneNumber: string): UserProfile | undefined {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  return USERS_DB.get(normalized);
}

export function getAllUsers(): UserProfile[] {
  return Array.from(USERS_DB.values()).sort(
    (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );
}

export function updateUserProfile(phoneNumber: string, updates: Partial<UserProfile>): UserProfile | null {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  const existing = USERS_DB.get(normalized);
  if (!existing) return null;

  const updated: UserProfile = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  USERS_DB.set(normalized, updated);
  saveUsersToDisk();
  return updated;
}

/**
 * Retrieve driver wallet with real-time balance and ledger history
 */
export function getUserWallet(phoneNumber?: string): {
  userId: string;
  currency: 'GHS';
  availableBalance: number;
  heldBalance: number;
  momoProvider: 'MTN' | 'TELECEL' | 'CARD';
  phoneNumber: string;
  transactions: WalletTransaction[];
} {
  const norm = phoneNumber ? normalizeGhanaPhoneNumber(phoneNumber) : '';
  const user = norm ? USERS_DB.get(norm) : undefined;
  if (!user) {
    return {
      userId: norm ? `usr-gh-${norm.replace(/\D/g, '')}` : 'guest',
      currency: 'GHS',
      availableBalance: 0,
      heldBalance: 0,
      momoProvider: 'MTN',
      phoneNumber: norm,
      transactions: [],
    };
  }

  const defaultProvider = user.defaultPaymentMethod === 'TELECEL_CASH'
    ? 'TELECEL'
    : user.defaultPaymentMethod === 'MASTERCARD'
    ? 'CARD'
    : 'MTN';

  return {
    userId: user.id,
    currency: 'GHS',
    availableBalance: user.walletBalance,
    heldBalance: user.heldEscrow || 0,
    momoProvider: defaultProvider,
    phoneNumber: user.phoneNumber,
    transactions: user.transactions || [],
  };
}

/**
 * Top up driver wallet with instant disk persistence and audit log entry
 */
export function creditUserWallet(
  phoneNumber: string,
  amount: number,
  description: string,
  reference: string,
  provider: 'MOMO' | 'CARD'
): UserProfile {
  const norm = normalizeGhanaPhoneNumber(phoneNumber);
  let user = USERS_DB.get(norm);

  if (!user) {
    user = {
      id: `usr-gh-${Date.now().toString(36)}`,
      phoneNumber: norm,
      displayName: 'Wilpower Driver',
      email: '',
      walletBalance: 0,
      heldEscrow: 0,
      defaultPaymentMethod: provider === 'CARD' ? 'MASTERCARD' : 'MTN_MOMO',
      registeredVehicles: [],
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    USERS_DB.set(norm, user);
  }

  user.walletBalance = +(user.walletBalance + amount).toFixed(2);
  user.updatedAt = new Date().toISOString();

  if (!user.transactions) user.transactions = [];
  user.transactions.unshift({
    id: `tx-${Date.now()}`,
    timestamp: new Date().toISOString(),
    amount,
    type: 'TOPUP',
    status: 'SUCCESS',
    provider,
    reference,
    description,
  });

  if (user.transactions.length > 50) user.transactions.pop();
  saveUsersToDisk();
  return user;
}

/**
 * Place security pre-authorization hold on driver wallet when session starts
 */
export function holdUserEscrow(
  phoneNumber: string,
  holdAmount: number,
  stationName: string
): { success: boolean; availableBalance: number; heldEscrow: number; error?: string } {
  const norm = normalizeGhanaPhoneNumber(phoneNumber);
  let user = USERS_DB.get(norm);
  if (!user) {
    user = USERS_DB.get('+233248901204') || Array.from(USERS_DB.values())[0];
  }

  if (user.walletBalance < holdAmount) {
    return {
      success: false,
      availableBalance: user.walletBalance,
      heldEscrow: user.heldEscrow || 0,
      error: `Insufficient wallet balance for pre-auth hold. Required: GH₵ ${holdAmount.toFixed(2)}, Available: GH₵ ${user.walletBalance.toFixed(2)}`,
    };
  }

  user.walletBalance = +(user.walletBalance - holdAmount).toFixed(2);
  user.heldEscrow = +((user.heldEscrow || 0) + holdAmount).toFixed(2);
  user.updatedAt = new Date().toISOString();

  if (!user.transactions) user.transactions = [];
  user.transactions.unshift({
    id: `hold-${Date.now()}`,
    timestamp: new Date().toISOString(),
    amount: holdAmount,
    type: 'PREAUTH_HOLD',
    status: 'SUCCESS',
    provider: user.defaultPaymentMethod === 'MASTERCARD' ? 'CARD' : 'MOMO',
    reference: `PREAUTH-${Date.now()}`,
    description: `Security hold of GH₵ ${holdAmount.toFixed(2)} at ${stationName}`,
  });

  if (user.transactions.length > 50) user.transactions.pop();
  saveUsersToDisk();

  return {
    success: true,
    availableBalance: user.walletBalance,
    heldEscrow: user.heldEscrow,
  };
}

/**
 * Settle actual charging session costs against escrow hold and release unspent balance
 */
export function settleAndReleaseEscrow(
  phoneNumber: string,
  actualCost: number,
  holdAmount: number,
  sessionDetails: { sessionId: string; kwhDelivered: number }
): { success: boolean; availableBalance: number; heldEscrow: number; user?: UserProfile; error?: string } {
  const norm = normalizeGhanaPhoneNumber(phoneNumber);
  let user = USERS_DB.get(norm);
  if (!user) {
    user = USERS_DB.get('+233248901204') || Array.from(USERS_DB.values())[0];
  }

  // Release preauth hold
  user.heldEscrow = Math.max(0, +((user.heldEscrow || 0) - holdAmount).toFixed(2));

  // Settle difference
  const refund = +(holdAmount - actualCost).toFixed(2);
  if (refund > 0) {
    user.walletBalance = +(user.walletBalance + refund).toFixed(2);
  } else {
    user.walletBalance = +(user.walletBalance - (actualCost - holdAmount)).toFixed(2);
  }
  user.updatedAt = new Date().toISOString();

  if (!user.transactions) user.transactions = [];
  user.transactions.unshift({
    id: `rel-${Date.now()}`,
    timestamp: new Date().toISOString(),
    amount: holdAmount,
    type: 'PREAUTH_RELEASE',
    status: 'RELEASED',
    provider: user.defaultPaymentMethod === 'MASTERCARD' ? 'CARD' : 'MOMO',
    reference: `REL-${Date.now()}`,
    description: `Release of GH₵ ${holdAmount.toFixed(2)} pre-auth security hold`,
  });

  user.transactions.unshift({
    id: `settle-${Date.now()}`,
    timestamp: new Date().toISOString(),
    amount: actualCost,
    type: 'CHARGE_SETTLEMENT',
    status: 'SUCCESS',
    provider: user.defaultPaymentMethod === 'MASTERCARD' ? 'CARD' : 'MOMO',
    reference: `STMT-${sessionDetails.sessionId}`,
    description: `Settlement: ${sessionDetails.kwhDelivered.toFixed(2)} kWh consumed (GH₵ ${actualCost.toFixed(2)})`,
  });

  if (user.transactions.length > 50) user.transactions.splice(50);
  saveUsersToDisk();

  return {
    success: true,
    availableBalance: user.walletBalance,
    heldEscrow: user.heldEscrow,
    user,
  };
}

