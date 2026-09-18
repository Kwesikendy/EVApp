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

// User persistence model
export interface UserProfile {
  id: string;
  phoneNumber: string;
  displayName: string;
  email?: string;
  walletBalance: number;
  heldEscrow: number;
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
  createdAt: string;
  updatedAt: string;
}

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function loadUsersFromDisk(): Map<string, UserProfile> {
  const map = new Map<string, UserProfile>();
  const defaultDriver: UserProfile = {
    id: 'usr-gh-001',
    phoneNumber: '+233248901204',
    displayName: 'Kofi Mensah',
    email: 'kofi.mensah@xcharge.africa',
    walletBalance: 245.50,
    heldEscrow: 0.00,
    defaultPaymentMethod: 'MTN_MOMO',
    registeredVehicles: [
      {
        id: 'veh-01',
        make: 'BYD',
        model: 'Atto 3 EV',
        year: 2024,
        batteryCapacityKwh: 60.5,
        connectorType: 'CCS2',
        licensePlate: 'GW 4821 - 24',
        isDefault: true,
      },
      {
        id: 'veh-02',
        make: 'Tesla',
        model: 'Model Y Long Range',
        year: 2023,
        batteryCapacityKwh: 75.0,
        connectorType: 'CCS2',
        licensePlate: 'ER 1904 - 23',
        isDefault: false,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  map.set(defaultDriver.phoneNumber, defaultDriver);

  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const records: UserProfile[] = JSON.parse(content);
      if (Array.isArray(records)) {
        for (const user of records) {
          if (user && user.phoneNumber) {
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
  const digits = rawPhone.replace(/\D/g, '');
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

/**
 * Send OTP via Moolre Ghana Messaging API (https://api.moolre.com/open/sms/send) or dev sandbox
 */
export async function sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; devCode?: string }> {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  
  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  OTP_STORE.set(normalized, {
    code,
    expiresAt,
    attempts: 0,
  });

  const moolreVasKey = process.env.MOOLRE_VAS_KEY || process.env.MOOLRE_API_KEY;
  const moolreSenderId = process.env.MOOLRE_SENDER_ID || 'XCharge';
  const rawRecipient = normalized.startsWith('+') ? normalized.substring(1) : normalized;

  // If live Moolre API/VAS key is configured, dispatch live SMS via Moolre
  if (moolreVasKey) {
    try {
      const messageText = `Your XCharge EV code is ${code}. Valid for 5 minutes.`;
      const url = new URL('https://api.moolre.com/open/sms/send');
      url.searchParams.append('type', '1');
      url.searchParams.append('senderid', moolreSenderId);
      url.searchParams.append('recipient', rawRecipient);
      url.searchParams.append('message', messageText);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-VASKEY': moolreVasKey,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      console.log(`[Moolre SMS Gateway] Dispatched to ${normalized}:`, data);
      return { success: true, message: `OTP sent via Moolre SMS to ${normalized}` };
    } catch (err: any) {
      console.error('[Moolre SMS Gateway Error]', err);
      return {
        success: true,
        message: `OTP generated (Moolre SMS gateway network note: ${err.message})`,
        devCode: code,
      };
    }
  }

  // Developer sandbox mode (No Moolre key configured yet)
  console.log(`[XCharge Auth Sandbox] OTP for ${normalized} is: ${code}`);
  return {
    success: true,
    message: `Verification code generated for ${normalized}. (Moolre sandbox active)`,
    devCode: code,
  };
}

export interface VerifyOtpMetadata {
  displayName?: string;
  email?: string;
  selectedEv?: string;
  selectedGateway?: string;
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
  const record = OTP_STORE.get(normalized);

  // Allow standard developer test bypass code '123456' for rapid testing
  const isDevBypass = inputCode === '123456';

  if (!isDevBypass) {
    if (!record) {
      return { success: false, error: 'No verification code requested for this number or code expired.' };
    }

    if (Date.now() > record.expiresAt) {
      OTP_STORE.delete(normalized);
      return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }

    if (record.code !== inputCode.trim()) {
      record.attempts += 1;
      if (record.attempts >= 4) {
        OTP_STORE.delete(normalized);
        return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
      }
      return { success: false, error: `Invalid verification code. ${4 - record.attempts} attempts remaining.` };
    }

    // Success - consume OTP
    OTP_STORE.delete(normalized);
  }

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
      displayName: metadata?.displayName || `Driver ${normalized.slice(-4)}`,
      email: metadata?.email || `${normalized.replace(/\D/g, '')}@xcharge.africa`,
      walletBalance: 100.00, // Welcome promotional credit
      heldEscrow: 0.00,
      defaultPaymentMethod: defaultPayment,
      registeredVehicles: [
        {
          id: `veh-${Date.now().toString(36)}`,
          make,
          model,
          year: 2024,
          batteryCapacityKwh,
          connectorType,
          licensePlate: `GX ${Math.floor(1000 + Math.random() * 9000)} - 24`,
          isDefault: true,
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    USERS_DB.set(normalized, user);
    saveUsersToDisk();
  } else if (metadata && (metadata.displayName || metadata.email || metadata.selectedEv)) {
    if (metadata.displayName) user.displayName = metadata.displayName;
    if (metadata.email) user.email = metadata.email;
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
