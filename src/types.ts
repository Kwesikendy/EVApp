export type ConnectorType = 'CCS2' | 'CHAdeMO' | 'Type2' | 'GB/T';
export type ConnectorStatus = 'Available' | 'Preparing' | 'Charging' | 'SuspendedEV' | 'Finishing' | 'Faulted' | 'Unavailable';

export interface Connector {
  id: number;
  connectorId: number; // 1, 2, etc.
  type: ConnectorType;
  maxPowerKw: number;
  currentPowerKw?: number;
  status: ConnectorStatus;
  tariffPerKwh: number; // in USD or local currency
  tariffCurrency: string;
}

export interface ChargingStation {
  id: string;
  stationId: string; // e.g. "XC-NAI-001"
  name: string;
  operator: string;
  address: string;
  latitude: number;
  longitude: number;
  connectors: Connector[];
  isOnline: boolean;
  distanceKm?: number;
  rating: number;
  amenities: string[];
}

export interface UserWallet {
  userId: string;
  currency: string;
  availableBalance: number;
  heldBalance: number; // Pre-authorization hold for active session
  momoProvider?: 'MTN' | 'Vodafone' | 'M-Pesa' | 'AirtelTigo';
  phoneNumber?: string;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  timestamp: string;
  amount: number;
  type: 'TOPUP' | 'PREAUTH_HOLD' | 'PREAUTH_RELEASE' | 'CHARGE_SETTLEMENT';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RELEASED';
  provider: 'MOMO' | 'CARD' | 'FLEET_LEDGER';
  reference: string;
  description: string;
}

export interface FleetAccount {
  id: string;
  companyName: string;
  fleetCode: string;
  billingAccountNo: string;
  creditLimit: number;
  currentUtilization: number;
  vehicles: FleetVehicle[];
}

export interface FleetVehicle {
  vin: string;
  licensePlate: string;
  model: string;
  make: string;
  batteryCapacityKwh: number;
  assignedDriver: string;
  driverPhone: string;
}

export interface ActiveTelemetrySession {
  sessionId: string;
  stationId: string;
  connectorId: number;
  userId: string;
  isFleetSession: boolean;
  fleetVin?: string;
  startTime: number;
  elapsedSeconds: number;
  currentSocPercent: number; // State of charge %
  targetSocPercent: number;
  currentPowerKw: number;
  voltageV: number;
  currentA: number;
  kwhDelivered: number;
  accruedCost: number;
  currency: string;
  preauthHoldAmount: number;
  status: 'Starting' | 'Charging' | 'Stopping' | 'Completed';
  meterValuesLog: {
    timestamp: string;
    soc: number;
    powerKw: number;
    kwhTotal: number;
  }[];
}

export interface OcppMessage {
  id: string;
  timestamp: string;
  direction: 'INCOMING' | 'OUTGOING';
  action: 'BootNotification' | 'StatusNotification' | 'MeterValues' | 'RemoteStartTransaction' | 'RemoteStopTransaction' | 'Authorize' | 'Heartbeat' | 'SimulatedSessionStarted' | 'SimulatedSessionCompleted';
  payload: Record<string, unknown>;
}
