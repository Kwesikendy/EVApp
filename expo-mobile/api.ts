import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determine the most reliable backend API host
function getDefaultBackendUrl(): string {
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3000`;
      }
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
  } catch (_e) {
    // fallback
  }
  return 'http://localhost:3000';
}

export let BACKEND_URL = getDefaultBackendUrl();

export function setBackendUrl(url: string) {
  let cleaned = url.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  BACKEND_URL = cleaned;
}

export interface ApiStation {
  id: string;
  stationId: string;
  name: string;
  operator: string;
  address: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  rating: number;
  amenities: string[];
  distanceKm?: number;
  connectors: {
    id: number;
    connectorId: number;
    type: 'CCS2' | 'CHAdeMO' | 'Type2' | 'GB/T';
    maxPowerKw: number;
    currentPowerKw: number;
    status: 'Available' | 'Preparing' | 'Charging' | 'Faulted';
    tariffPerKwh: number;
    tariffCurrency: string;
  }[];
}

export interface ApiWallet {
  userId: string;
  currency: string;
  availableBalance: number;
  heldBalance: number;
  momoProvider: string;
  phoneNumber: string;
  transactions: {
    id: string;
    timestamp: string;
    amount: number;
    type: 'TOPUP' | 'CHARGE_SETTLEMENT' | 'PREAUTH_HOLD' | 'PREAUTH_RELEASE';
    status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'RELEASED';
    provider: 'MOMO' | 'CARD';
    reference: string;
    description: string;
  }[];
}

export interface ApiFleetVehicle {
  vin: string;
  licensePlate: string;
  model: string;
  make: string;
  batteryCapacityKwh: number;
  assignedDriver: string;
  driverPhone: string;
}

export interface ApiFleetAccount {
  id: string;
  companyName: string;
  fleetCode: string;
  billingAccountNo: string;
  creditLimit: number;
  currentUtilization: number;
  vehicles: ApiFleetVehicle[];
}

export interface ApiActiveSession {
  sessionId: string;
  stationId: string;
  connectorId: number;
  userId: string;
  isFleetSession: boolean;
  fleetVin?: string;
  startTime: number;
  elapsedSeconds: number;
  currentSocPercent: number;
  targetSocPercent: number;
  currentPowerKw: number;
  voltageV: number;
  currentA: number;
  kwhDelivered: number;
  accruedCost: number;
  currency: string;
  preauthHoldAmount: number;
  status: string;
  meterValuesLog?: {
    timestamp: string;
    soc: number;
    powerKw: number;
    kwhTotal: number;
  }[];
}

// Timeout fetch wrapper
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const api = {
  async getHealth(): Promise<{ status: string; citrineOsBridge: string; ocppVersion: string; activeSessions: number } | null> {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/health`, { method: 'GET' }, 3000);
      if (res.ok) return await res.json();
    } catch (_err) {
      // Offline / Unreachable
    }
    return null;
  },

  async getStations(): Promise<ApiStation[] | null> {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/stations`, { method: 'GET' }, 3500);
      if (res.ok) return await res.json();
    } catch (_err) {
      // Return null to fallback to local data
    }
    return null;
  },

  async getWallet(): Promise<ApiWallet | null> {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/wallet`, { method: 'GET' }, 3500);
      if (res.ok) return await res.json();
    } catch (_err) {
      // Fallback
    }
    return null;
  },

  async topupWallet(amount: number, provider: string, phone: string): Promise<{ success: boolean; wallet: ApiWallet } | null> {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, provider, phone }),
      }, 5000);
      if (res.ok) return await res.json();
    } catch (_err) {
      // Fallback
    }
    return null;
  },

  async getFleet(): Promise<ApiFleetAccount | null> {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/fleet`, { method: 'GET' }, 3500);
      if (res.ok) return await res.json();
    } catch (_err) {
      // Fallback
    }
    return null;
  },

  async getActiveSession(): Promise<ApiActiveSession | null> {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/session/active`, { method: 'GET' }, 3000);
      if (res.ok) {
        const data = await res.json();
        return data.session;
      }
    } catch (_err) {
      // Fallback
    }
    return null;
  },

  async remoteStartSession(params: {
    stationId: string;
    connectorId: number;
    isFleet: boolean;
    vin?: string;
    preauthHoldAmount?: number;
  }): Promise<{ success: boolean; session?: ApiActiveSession; error?: string } | null> {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/ocpp/remote-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }, 5000);
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to initiate charging session' };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to CSMS backend' };
    }
  },

  async remoteStopSession(): Promise<{ success: boolean; error?: string } | null> {
    try {
      const res = await fetchWithTimeout(`${BACKEND_URL}/api/ocpp/remote-stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, 5000);
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error stopping session' };
    }
  },
};
