// ==========================================
// 1. GEOGRAPHIC & STATION MODELS
// ==========================================

export type ConnectorType = 'CCS2' | 'Type2' | 'CHAdeMO' | 'GB/T';

export type ConnectorStatus =
  | 'Available'
  | 'Preparing'
  | 'Charging'
  | 'SuspendedEVSE'
  | 'SuspendedEV'
  | 'Finishing'
  | 'Reserved'
  | 'Unavailable'
  | 'Faulted';

export type ChargePointErrorCode =
  | 'ConnectorLockFailure'
  | 'EVCommunicationError'
  | 'GroundFailure'
  | 'HighTemperature'
  | 'InternalError'
  | 'LocalListConflict'
  | 'NoError'
  | 'OtherError'
  | 'OverCurrentFailure'
  | 'OverVoltage'
  | 'PowerMeterFailure'
  | 'PowerSwitchFailure'
  | 'ReaderFailure'
  | 'ResetFailure'
  | 'UnderVoltage'
  | 'WeakSignal';

export type OcppStopReason =
  | 'DeAuthorized'
  | 'EmergencyStop'
  | 'EVDisconnected'
  | 'HardReset'
  | 'Local'
  | 'Other'
  | 'PowerLoss'
  | 'Reboot'
  | 'Remote'
  | 'SoftReset'
  | 'UnlockCommand';

export type OcppFeatureProfile =
  | 'Core'
  | 'FirmwareManagement'
  | 'LocalAuthListManagement'
  | 'Reservation'
  | 'SmartCharging'
  | 'RemoteTrigger';

export interface Connector {
  id: number;
  connectorId: number;
  type: ConnectorType;
  maxPowerKw: number;
  currentPowerKw?: number;
  status: ConnectorStatus;
  tariffPerKwh: number;
  tariffGhsPerKwh?: number;
  tariffCurrency?: string;
  label?: string; // 'Outlet A' or 'Outlet B' (MaxPower VCP160 HMI)
  errorCode?: ChargePointErrorCode;
  info?: string;
  vendorId?: string;
  vendorErrorCode?: string;
  reservedByIdTag?: string;
  reservationId?: number;
  reservationExpiryDate?: string;
}

export interface ChargingStation {
  id: string;
  stationId: string; // OCPP ChargeBoxId (e.g. 'CL-KSI-001')
  chargeBoxId?: string;
  pileNumber?: string; // MaxPower VCP160 Stake/Pile Number ('19046744073709551615' or 'CL-KSI-001')
  name: string;
  operator: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  isOnline: boolean;
  rating: number;
  amenities: string[];
  connectors: Connector[];
  ocppVersion?: '1.6J' | '2.0.1';
  lastHeartbeat?: string;
  vendor?: string;
  model?: string;
  firmwareVersion?: string;
  serialNumber?: string;
  meterType?: string;
  networkMode?: '1.WIFI' | '2.Ethernet (4G/LAN)';
}

export type Station = ChargingStation;

// ==========================================
// 2. OCPP 1.6 EDITION 2 TELEMETRY & MESSAGING
// ==========================================

export type OcppAction =
  // Charge Point Initiated Operations (Section 4)
  | 'Authorize'
  | 'BootNotification'
  | 'DataTransfer'
  | 'DiagnosticsStatusNotification'
  | 'FirmwareStatusNotification'
  | 'Heartbeat'
  | 'MeterValues'
  | 'StartTransaction'
  | 'StatusNotification'
  | 'StopTransaction'
  // Central System Initiated Operations (Section 5)
  | 'CancelReservation'
  | 'ChangeAvailability'
  | 'ChangeConfiguration'
  | 'ClearCache'
  | 'ClearChargingProfile'
  | 'GetCompositeSchedule'
  | 'GetConfiguration'
  | 'GetDiagnostics'
  | 'GetLocalListVersion'
  | 'RemoteStartTransaction'
  | 'RemoteStopTransaction'
  | 'ReserveNow'
  | 'Reset'
  | 'SendLocalList'
  | 'SetChargingProfile'
  | 'TriggerMessage'
  | 'UnlockConnector'
  | 'UpdateFirmware'
  // Simulation & Legacy Actions
  | 'TransactionEvent'
  | 'SimulatedSessionStarted'
  | 'SimulatedSessionCompleted';

export interface OcppMessage {
  id: string;
  timestamp: string;
  chargeBoxId?: string;
  direction: 'INCOMING' | 'OUTGOING';
  action: OcppAction | string;
  messageTypeId?: 2 | 3 | 4; // 2=CALL, 3=CALLRESULT, 4=CALLERROR
  uniqueId?: string;
  payload: Record<string, any>;
}

export type OcppLogMessage = OcppMessage;

export interface OcppConfigurationKey {
  key: string;
  readonly: boolean;
  value: string;
  description?: string;
}

export interface ConnectorReservation {
  reservationId: number;
  stationId: string;
  chargeBoxId: string;
  connectorId: number;
  connectorLabel?: string;
  idTag: string;
  expiryDate: string;
  status: 'Active' | 'Used' | 'Cancelled' | 'Expired';
}

export interface ChargingProfile {
  chargingProfileId: number;
  transactionId?: number;
  stackLevel: number;
  chargingProfilePurpose: 'ChargePointMaxProfile' | 'TxDefaultProfile' | 'TxProfile';
  chargingProfileKind: 'Absolute' | 'Recurring' | 'Relative';
  chargingSchedule: {
    chargingRateUnit: 'W' | 'A';
    chargingSchedulePeriod: Array<{
      startPeriod: number;
      limit: number;
      numberPhases?: number;
    }>;
  };
}

export interface ActiveTelemetrySession {
  sessionId: string;
  transactionId?: number; // OCPP 1.6 integer transactionId
  stationId: string;
  stationName?: string;
  chargeBoxId?: string;
  connectorId: number;
  connectorLabel?: string; // 'Outlet A' or 'Outlet B'
  connectorType?: ConnectorType;
  idTag?: string;
  userId: string;
  driverPhone?: string;
  isFleetSession: boolean;
  fleetVin?: string;
  startTime: number;
  elapsedSeconds: number;
  remainingMinutes?: number;
  currentSocPercent: number;
  targetSocPercent: number;
  currentPowerKw: number;
  voltageV: number;
  currentA: number;
  kwhDelivered: number;
  meterStartWh?: number;
  meterStopWh?: number;
  temperatureC?: number;
  accruedCost: number;
  tariffPerKwh?: number;
  cardBalanceGhs?: number;
  currency: string;
  preauthHoldAmount: number;
  status: 'Preparing' | 'Charging' | 'SuspendedEVSE' | 'SuspendedEV' | 'Finishing' | 'Completed';
  stopReason?: OcppStopReason;
  meterValuesLog: Array<{
    timestamp: string;
    soc: number;
    powerKw: number;
    kwhTotal: number;
  }>;
}

export type ActiveSession = ActiveTelemetrySession;

// ==========================================
// 3. GHANA MOBILE MONEY (MoMo) & WALLET
// ==========================================

export type MomoProvider = 'MTN_MOMO' | 'TELECEL_CASH' | 'AT_MONEY';

export interface WalletTransaction {
  id: string;
  timestamp: string;
  type:
    | 'TOPUP'
    | 'CHARGE_SETTLEMENT'
    | 'PREAUTH_HOLD'
    | 'PREAUTH_RELEASE'
    | 'REFUND'
    | 'TOP_UP'
    | 'CHARGE_PAYMENT'
    | 'PRE_AUTH_HOLD';
  amount: number;
  amountGhs?: number;
  provider: string;
  phoneNumber?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'COMPLETED' | 'PENDING_USSD';
  reference: string;
  description?: string;
  stationName?: string;
  kwhBilled?: number;
}

export interface UserWallet {
  userId?: string;
  currency?: string;
  availableBalance: number;
  heldBalance: number;
  balanceGhs?: number;
  heldEscrowGhs?: number;
  momoProvider?: string;
  preferredProvider?: MomoProvider;
  phoneNumber: string;
  transactions: WalletTransaction[];
}

// ==========================================
// 4. FLEET & VIN TELEMATICS
// ==========================================

export interface FleetVehicle {
  id?: string;
  vin: string;
  make?: string;
  model?: string;
  makeModel?: string;
  licensePlate: string;
  batteryCapacityKwh: number;
  currentSoc?: number;
  plugAndChargeEnabled?: boolean;
  assignedDriver: string;
  driverPhone?: string;
  status?: 'Charging' | 'Driving' | 'Idle';
  monthlyKwhConsumed?: number;
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
