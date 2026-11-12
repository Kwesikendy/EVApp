import http from 'http';
import crypto from 'crypto';
import type { Duplex } from 'stream';
import type {
  ChargingStation,
  ActiveTelemetrySession,
  OcppMessage,
  OcppAction,
  OcppConfigurationKey,
  ConnectorReservation,
  ChargingProfile,
  ConnectorStatus,
  ChargePointErrorCode,
  OcppStopReason,
} from '../src/types';

// ==========================================
// 1. MAXPOWER VCP160 COMMISSIONING METADATA
//    (Extracted from image-reference.jpeg & OCPP 1.6 Ed. 2)
// ==========================================

export const MAXPOWER_VCP160_COMMISSIONING = {
  stationId: 'CL-KSI-001',
  internalId: 'st-01',
  stationName: 'Greenwood Event Center Station A',
  locationAddress: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi',
  chargeBoxId: 'CL-KSI-001',
  factoryPileNumber: '19046744073709551615',
  vendor: 'MaxPower',
  model: 'VCP160 Dual-Gun DC Fast Charger (160kW)',
  firmwareVersion: 'MP-VCP160-OCPP16J-v2.4.8',
  serialNumber: 'MP160-GH-KSI-2026001',
  meterType: 'DC-DIN-4Q-160KW',
  ocppProtocol: 'OCPP 1.6 Edition 2 (OCPP-J JSON over WebSocket)',
  subprotocol: 'ocpp1.6',
  adminPassword: '1',
  defaultPort: 5173,
  networkMode: '2.Ethernet (4G/LAN)' as const,
  networkModeNote:
    'Choose Ethernet when using 4G card or network cable. Available network model: 1.WIFI, 2.Ethnet',
  outlets: [
    {
      connectorId: 1,
      hmiTab: 'Outlet A',
      type: 'GB/T' as const,
      maxPowerKw: 160,
      tariffGhsPerKwh: 4.5,
    },
    {
      connectorId: 2,
      hmiTab: 'Outlet B',
      type: 'CCS2' as const,
      maxPowerKw: 160,
      tariffGhsPerKwh: 4.5,
    },
  ],
  steps: [
    {
      step: 1,
      title: 'Click Menu on Main HMI',
      instruction:
        'On the charger touchscreen (showing Outlet A & Outlet B telemetry: Charging voltage V, Charging current A, Charge capacity kWh, Charging time min, Remaining time min, Amount of consumption, Card balance, Current electricity price /kWh, and Pile ID 19046744073709551615), tap the bottom-left "Menu" button.',
    },
    {
      step: 2,
      title: 'Click System administrator',
      instruction:
        'In the Menu grid (Charge record, Alarm record, Version information, Customer service hotline, Card inquiry, Auxiliary power, Module status, System administrator), tap "System administrator".',
    },
    {
      step: 3,
      title: 'Enter password 1, and click OK',
      instruction:
        'When prompted "Please enter the administrator password", enter password "1" using the on-screen keypad and tap "OK".',
    },
    {
      step: 4,
      title: 'Click OCPP setup',
      instruction:
        'Inside the System administrator menu (Charge record, Alarm record, Electricity price setting, System setting, Basic setup, Card management, Network setup, Parameter setting, Insulation detection, Module setting, Record debugging, OCPP setup), tap the bottom-right "OCPP setup" tile.',
    },
    {
      step: 5,
      title: 'Set the OCPP URL and stake number on this page',
      instruction:
        'Set OCPP connection to "Enable", enter the CSMS WebSocket URL in "URL setting", set port to 5173 (or 443 for TLS), set pile number (stake number) to "CL-KSI-001" (or keep factory ID "19046744073709551615"), and select Network mode "Ethernet" (used for both 4G SIM card and LAN cable). Verify Login status turns ONLINE.',
    },
  ],
};

// ==========================================
// 2. OCPP 1.6 EDITION 2 STANDARD CONFIGURATION KEYS
//    (Section 9 of OCPP 1.6 Edition 2 Specification)
// ==========================================

export function createDefaultOcpp16Config(): OcppConfigurationKey[] {
  return [
    {
      key: 'AllowOfflineTxForUnknownId',
      readonly: false,
      value: 'true',
      description: 'Allow offline authorization for unknown RFID/idTags when cellular backhaul drops',
    },
    {
      key: 'AuthorizationCacheEnabled',
      readonly: false,
      value: 'true',
      description: 'Enable local authorization cache inside Charge Point',
    },
    {
      key: 'AuthorizeRemoteTxRequests',
      readonly: false,
      value: 'true',
      description: 'Whether a remote request to start a transaction needs prior Authorize.req',
    },
    {
      key: 'ClockAlignedDataInterval',
      readonly: false,
      value: '900',
      description: 'Size (in seconds) of clock-aligned data interval (15 min)',
    },
    {
      key: 'ConnectionTimeOut',
      readonly: false,
      value: '60',
      description: 'Interval (in seconds) from RemoteStartTransaction until EV cable must be plugged in',
    },
    {
      key: 'GetConfigurationMaxKeys',
      readonly: true,
      value: '50',
      description: 'Maximum number of keys requested in a single GetConfiguration.req',
    },
    {
      key: 'HeartbeatInterval',
      readonly: false,
      value: '60',
      description: 'Interval (in seconds) of inactivity between Heartbeat.req PDUs',
    },
    {
      key: 'LocalAuthorizeOffline',
      readonly: false,
      value: 'true',
      description: 'Whether the Charge Point starts a transaction offline for locally authorized idTags',
    },
    {
      key: 'LocalPreAuthorize',
      readonly: false,
      value: 'true',
      description: 'Start transaction immediately using Local Authorization List before CSMS response',
    },
    {
      key: 'MeterValuesAlignedData',
      readonly: false,
      value: 'Energy.Active.Import.Register,Power.Active.Import',
      description: 'Clock-aligned measurands reported in MeterValues.req',
    },
    {
      key: 'MeterValuesSampledData',
      readonly: false,
      value: 'Energy.Active.Import.Register,Power.Active.Import,Voltage,Current.Import,SoC,Temperature',
      description: 'Sampled measurands included in every MeterValues.req during charging',
    },
    {
      key: 'MeterValueSampleInterval',
      readonly: false,
      value: '5',
      description: 'Interval between sampling of metering data (in seconds)',
    },
    {
      key: 'MinimumStatusDuration',
      readonly: false,
      value: '2',
      description: 'Minimum duration (seconds) a ConnectorStatus must be stable before StatusNotification.req',
    },
    {
      key: 'NumberOfConnectors',
      readonly: true,
      value: '2',
      description: 'Number of physical charging outlets (Outlet A: GB/T, Outlet B: CCS2)',
    },
    {
      key: 'ResetRetries',
      readonly: false,
      value: '3',
      description: 'Number of times to retry an unsuccessful Charge Point reset',
    },
    {
      key: 'StopTransactionOnEVSideDisconnect',
      readonly: false,
      value: 'true',
      description: 'Automatically stop transaction when EV disconnects cable',
    },
    {
      key: 'StopTransactionOnInvalidId',
      readonly: false,
      value: 'true',
      description: 'Stop ongoing transaction if Central System returns non-Accepted in StartTransaction.conf',
    },
    {
      key: 'SupportedFeatureProfiles',
      readonly: true,
      value: 'Core,FirmwareManagement,LocalAuthListManagement,Reservation,SmartCharging,RemoteTrigger',
      description: 'Supported OCPP 1.6 Edition 2 Feature Profiles',
    },
    {
      key: 'TransactionMessageAttempts',
      readonly: false,
      value: '3',
      description: 'How often Charge Point attempts to submit Start/StopTransaction PDUs',
    },
    {
      key: 'TransactionMessageRetryInterval',
      readonly: false,
      value: '30',
      description: 'How long (seconds) Charge Point waits before resubmitting transaction PDUs',
    },
    {
      key: 'UnlockConnectorOnEVSideDisconnect',
      readonly: false,
      value: 'true',
      description: 'Unlock physical connector lock when EV unplugs cable at vehicle side',
    },
    {
      key: 'WebSocketPingInterval',
      readonly: false,
      value: '45',
      description: 'Interval (seconds) between RFC 6455 WebSocket ping frames',
    },
    {
      key: 'LocalAuthListEnabled',
      readonly: false,
      value: 'true',
      description: 'Whether the Local Authorization List is enabled',
    },
    {
      key: 'ChargeProfileMaxStackLevel',
      readonly: true,
      value: '5',
      description: 'Max allowed stackLevel for a SmartCharging ChargingProfile',
    },
    {
      key: 'ChargingScheduleAllowedChargingRateUnit',
      readonly: true,
      value: 'Current,Power',
      description: 'Supported units for SmartCharging schedules (A or W)',
    },
    {
      key: 'MaxChargingProfilesInstalled',
      readonly: true,
      value: '10',
      description: 'Maximum number of ChargingProfiles installed at any time',
    },
    // MaxPower VCP160 Vendor-Specific Keys
    {
      key: 'MaxPower.PileNumber',
      readonly: false,
      value: 'CL-KSI-001',
      description: 'MaxPower HMI Stake/Pile Number (supports CL-KSI-001 or 19046744073709551615)',
    },
    {
      key: 'MaxPower.ElectricityPriceGhsPerKwh',
      readonly: false,
      value: '4.50',
      description: 'Current electricity price displayed on charger HMI (GH₵ / kWh)',
    },
    {
      key: 'MaxPower.NetworkMode',
      readonly: false,
      value: '2.Ethernet (4G/LAN)',
      description: 'Selected HMI Network Mode (1.WIFI or 2.Ethernet for 4G SIM / LAN cable)',
    },
  ];
}

// ==========================================
// 3. OCPP 1.6 ENGINE STATE & CALLBACKS
// ==========================================

export interface ConnectedChargePointSocket {
  chargeBoxId: string;
  pileNumber: string;
  remoteAddress: string;
  connectedAt: string;
  lastSeenAt: string;
  subprotocol: string;
  socket: Duplex;
}

export interface LocalAuthEntry {
  idTag: string;
  idTagInfo: {
    status: 'Accepted' | 'Blocked' | 'Expired' | 'Invalid' | 'ConcurrentTx';
    expiryDate?: string;
    parentIdTag?: string;
  };
}

export interface RealHardwareTelemetry {
  hasRealConnection: boolean;
  socketCount: number;
  chargeBoxId: string;
  pileNumber: string;
  remoteAddress: string | null;
  subprotocol: string | null;
  connectedAt: string | null;
  lastSeenAt: string | null;
  vendor: string | null;
  model: string | null;
  firmwareVersion: string | null;
  serialNumber: string | null;
  meterType: string | null;
  lastBootNotification: {
    receivedAt: string;
    chargePointVendor?: string;
    chargePointModel?: string;
    chargePointSerialNumber?: string;
    firmwareVersion?: string;
    meterType?: string;
    rawPayload: Record<string, any>;
  } | null;
  lastHeartbeat: string | null;
  lastStatusNotification: {
    receivedAt: string;
    connectorId: number;
    status: string;
    errorCode: string;
    info?: string;
    rawPayload: Record<string, any>;
  } | null;
  lastMeterValues: {
    receivedAt: string;
    connectorId: number;
    transactionId?: number;
    voltageV?: number;
    currentA?: number;
    powerKw?: number;
    socPercent?: number;
    energyKwh?: number;
    temperatureC?: number;
  } | null;
  lastStartTransaction: {
    receivedAt: string;
    transactionId: number;
    connectorId: number;
    idTag: string;
    meterStartWh: number;
  } | null;
  lastStopTransaction: {
    receivedAt: string;
    transactionId: number;
    meterStopWh: number;
    reason: string;
    totalEnergyKwh: number;
    totalCostGhs: number;
  } | null;
  realHardwareLogs: Array<{
    id: string;
    timestamp: string;
    direction: 'INCOMING' | 'OUTGOING';
    action: string;
    payload: any;
    remoteAddress: string;
    uniqueId?: string;
  }>;
}

export interface Ocpp16EngineContext {
  getStations: () => ChargingStation[];
  getActiveSession: () => ActiveTelemetrySession | null;
  setActiveSession: (session: ActiveTelemetrySession | null) => void;
  getLogs: () => OcppMessage[];
  pushLog: (
    chargeBoxId: string,
    direction: 'INCOMING' | 'OUTGOING',
    action: OcppAction | string,
    payload: Record<string, any>,
    messageTypeId?: 2 | 3 | 4,
    uniqueId?: string
  ) => OcppMessage;
  onRemoteStartSession?: (params: {
    station: ChargingStation;
    connectorId: number;
    idTag: string;
    transactionId: number;
  }) => ActiveTelemetrySession;
  onRemoteStopSession?: (params: {
    reason: OcppStopReason;
    meterStopWh?: number;
  }) => { session: ActiveTelemetrySession | null; totalCostGhs: number };
}

export class Ocpp16Engine {
  private ctx: Ocpp16EngineContext;
  private configKeys: OcppConfigurationKey[] = createDefaultOcpp16Config();
  private reservations: ConnectorReservation[] = [];
  private chargingProfiles: ChargingProfile[] = [
    {
      chargingProfileId: 1,
      stackLevel: 0,
      chargingProfilePurpose: 'ChargePointMaxProfile',
      chargingProfileKind: 'Absolute',
      chargingSchedule: {
        chargingRateUnit: 'W',
        chargingSchedulePeriod: [
          {
            startPeriod: 0,
            limit: 160000, // 160 kW MaxPower VCP160 total cabinet limit
            numberPhases: 3,
          },
        ],
      },
    },
  ];
  private localAuthListVersion = 4;
  private localAuthList: LocalAuthEntry[] = [
    {
      idTag: 'VID-GH-8842-A',
      idTagInfo: { status: 'Accepted', expiryDate: '2028-12-31T23:59:59.000Z', parentIdTag: 'WILPOWER-GH' },
    },
    {
      idTag: 'USER-RFID-991',
      idTagInfo: { status: 'Accepted', expiryDate: '2028-12-31T23:59:59.000Z', parentIdTag: 'WILPOWER-GH' },
    },
    {
      idTag: 'RFID-KOFI-001',
      idTagInfo: { status: 'Accepted', expiryDate: '2028-12-31T23:59:59.000Z', parentIdTag: 'WILPOWER-GH' },
    },
    {
      idTag: '19046744073709551615',
      idTagInfo: { status: 'Accepted', expiryDate: '2028-12-31T23:59:59.000Z', parentIdTag: 'MAXPOWER-VCP160' },
    },
  ];
  private nextTransactionId = 98420;
  private nextReservationId = 501;
  private diagnosticsStatus: 'Idle' | 'Uploaded' | 'UploadFailed' | 'Uploading' = 'Idle';
  private firmwareStatus:
    | 'Downloaded'
    | 'DownloadFailed'
    | 'Downloading'
    | 'Idle'
    | 'InstallationFailed'
    | 'Installing'
    | 'Installed' = 'Idle';
  private sockets = new Map<string, ConnectedChargePointSocket>();
  private realHardwareMap = new Map<string, RealHardwareTelemetry>();

  /** Per-charger real hardware telemetry (one record per chargeBoxId). */
  private rh(rawChargeBoxId: string): RealHardwareTelemetry {
    const id = this.normalizeChargeBoxId(rawChargeBoxId);
    let t = this.realHardwareMap.get(id);
    if (!t) {
      const st = this.ctx.getStations().find((s) => s.stationId === id);
      t = {
        hasRealConnection: false,
        socketCount: 0,
        chargeBoxId: id,
        pileNumber: st?.pileNumber || id,
        remoteAddress: null,
        subprotocol: null,
        connectedAt: null,
        lastSeenAt: null,
        vendor: null,
        model: null,
        firmwareVersion: null,
        serialNumber: null,
        meterType: null,
        lastBootNotification: null,
        lastHeartbeat: null,
        lastStatusNotification: null,
        lastMeterValues: null,
        lastStartTransaction: null,
        lastStopTransaction: null,
        realHardwareLogs: [],
      };
      this.realHardwareMap.set(id, t);
    }
    return t;
  }

  private watchdogTimer?: NodeJS.Timeout;

  public getRealHardwareSnapshot(chargeBoxId = 'CL-KSI-001'): RealHardwareTelemetry {
    const t = this.rh(chargeBoxId);
    return {
      ...t,
      socketCount: this.sockets.has(t.chargeBoxId) ? 1 : 0,
      realHardwareLogs: t.realHardwareLogs.slice(0, 30),
    };
  }

  public getAllRealHardwareSnapshots(): Record<string, RealHardwareTelemetry> {
    const out: Record<string, RealHardwareTelemetry> = {};
    for (const st of this.ctx.getStations()) {
      out[st.stationId] = this.getRealHardwareSnapshot(st.stationId);
    }
    return out;
  }

  public startHeartbeatWatchdog(timeoutMs = 60000) {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    this.watchdogTimer = setInterval(() => {
      this.checkHeartbeatTimeout(timeoutMs);
    }, 5000);
  }

  public checkHeartbeatTimeout(timeoutMs = 60000) {
    for (const t of this.realHardwareMap.values()) {
      if (!t.hasRealConnection) continue;
      const last = t.lastSeenAt || t.lastHeartbeat;
      if (!last) continue;
      const elapsed = Date.now() - new Date(last).getTime();
      if (elapsed <= timeoutMs) continue;
      console.warn(`[OCPP Watchdog] Physical charger ${t.chargeBoxId} heartbeat timed out (${Math.round(elapsed / 1000)}s > 60s). Marking OFFLINE/Faulted.`);
      t.hasRealConnection = false;
      const station = this.findStation(t.chargeBoxId);
      if (station) {
        station.isOnline = false;
        station.connectors.forEach((cn) => {
          cn.status = 'Faulted';
          cn.errorCode = 'OtherError';
          cn.info = 'Physical charger heartbeat timeout (>60s)';
        });
      }
      this.ctx.pushLog(
        t.chargeBoxId,
        'INCOMING',
        'StatusNotification',
        { status: 'Faulted', errorCode: 'OtherError', info: 'Heartbeat timeout > 60s. Physical charger disconnected.' },
        2,
        `watchdog-${Date.now()}`
      );
    }
  }

  private pendingCalls = new Map<
    string,
    {
      action: OcppAction;
      chargeBoxId: string;
      resolve: (payload: Record<string, any>) => void;
      reject: (err: Error) => void;
      timer: NodeJS.Timeout;
    }
  >();

  constructor(ctx: Ocpp16EngineContext) {
    this.ctx = ctx;
    this.startHeartbeatWatchdog(60000);
  }

  public normalizeChargeBoxId(rawId: string): string {
    const cleaned = decodeURIComponent(String(rawId || '').trim());
    if (!cleaned || cleaned === '19046744073709551615') {
      return 'CL-KSI-001';
    }
    const stations = this.ctx.getStations();
    const matched = stations.find(
      (s) =>
        s.stationId.toLowerCase() === cleaned.toLowerCase() ||
        s.id.toLowerCase() === cleaned.toLowerCase() ||
        (s.pileNumber && s.pileNumber === cleaned)
    );
    return matched ? matched.stationId : cleaned;
  }

  public findStation(chargeBoxIdOrStationId: string): ChargingStation | undefined {
    const normalized = this.normalizeChargeBoxId(chargeBoxIdOrStationId);
    const stations = this.ctx.getStations();
    return (
      stations.find(
        (s) =>
          s.stationId === normalized ||
          s.id === chargeBoxIdOrStationId ||
          s.pileNumber === chargeBoxIdOrStationId
      ) || (chargeBoxIdOrStationId ? undefined : stations[0])
    );
  }

  public allocateTransactionId(): number {
    this.nextTransactionId += 1;
    return this.nextTransactionId;
  }

  public getConfigurationKeys(requestedKeys?: string[]): {
    configurationKey: OcppConfigurationKey[];
    unknownKey: string[];
  } {
    if (!requestedKeys || requestedKeys.length === 0) {
      return { configurationKey: [...this.configKeys], unknownKey: [] };
    }
    const configurationKey: OcppConfigurationKey[] = [];
    const unknownKey: string[] = [];
    for (const k of requestedKeys) {
      const found = this.configKeys.find((item) => item.key.toLowerCase() === k.toLowerCase());
      if (found) {
        configurationKey.push(found);
      } else {
        unknownKey.push(k);
      }
    }
    return { configurationKey, unknownKey };
  }

  public changeConfigurationKey(
    key: string,
    value: string
  ): 'Accepted' | 'Rejected' | 'RebootRequired' | 'NotSupported' {
    const found = this.configKeys.find((item) => item.key.toLowerCase() === key.toLowerCase());
    if (!found) {
      return 'NotSupported';
    }
    if (found.readonly) {
      return 'Rejected';
    }
    found.value = String(value);

    // Sync live tariff if MaxPower.ElectricityPriceGhsPerKwh is updated
    if (found.key === 'MaxPower.ElectricityPriceGhsPerKwh') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > 0) {
        for (const station of this.ctx.getStations()) {
          station.connectors.forEach((c) => {
            c.tariffPerKwh = Number(parsed.toFixed(2));
            c.tariffGhsPerKwh = Number(parsed.toFixed(2));
          });
        }
      }
    }
    return 'Accepted';
  }

  public getReservations(): ConnectorReservation[] {
    return this.reservations;
  }

  public getChargingProfiles(): ChargingProfile[] {
    return this.chargingProfiles;
  }

  public getConnectedChargePoints() {
    return Array.from(this.sockets.values()).map((s) => ({
      chargeBoxId: s.chargeBoxId,
      pileNumber: s.pileNumber,
      remoteAddress: s.remoteAddress,
      connectedAt: s.connectedAt,
      lastSeenAt: s.lastSeenAt,
      subprotocol: s.subprotocol,
    }));
  }

  public getStatusSnapshot(hostHeader?: string, chargeBoxId = 'CL-KSI-001') {
    const host = hostHeader || 'localhost:5173';
    const isSecure = host.includes('.vercel.app') || host.includes('.run.app');
    const wsScheme = isSecure ? 'wss' : 'ws';
    const station = this.findStation(chargeBoxId);
    return {
      protocol: 'OCPP 1.6 Edition 2 (OCPP-J)',
      subprotocol: 'ocpp1.6',
      supportedFeatureProfiles: [
        'Core',
        'FirmwareManagement',
        'LocalAuthListManagement',
        'Reservation',
        'SmartCharging',
        'RemoteTrigger',
      ],
      websocketEndpoints: {
        primary: `${wsScheme}://${host}/ocpp/1.6/CL-KSI-001`,
        factoryPileAlias: `${wsScheme}://${host}/ocpp/1.6/19046744073709551615`,
        shortPath: `${wsScheme}://${host}/ocpp/CL-KSI-001`,
        byStation: Object.fromEntries(
          this.ctx.getStations().map((s) => [s.stationId, `${wsScheme}://${host}/ocpp/1.6/${s.stationId}`])
        ),
      },
      commissioning: MAXPOWER_VCP160_COMMISSIONING,
      greenwoodStation: station,
      connectedSockets: this.getConnectedChargePoints(),
      realHardware: this.getRealHardwareSnapshot(chargeBoxId),
      realHardwareByBox: this.getAllRealHardwareSnapshots(),
      allStations: this.ctx.getStations(),
      activeSession: this.ctx.getActiveSession(),
      configurationKeys: this.configKeys,
      reservations: this.reservations,
      chargingProfiles: this.chargingProfiles,
      localAuthListVersion: this.localAuthListVersion,
      diagnosticsStatus: this.diagnosticsStatus,
      firmwareStatus: this.firmwareStatus,
      recentFrames: this.ctx.getLogs().slice(0, 25),
    };
  }

  // ==========================================
  // 4. HANDLE CHARGE POINT -> CENTRAL SYSTEM (SECTION 4)
  // ==========================================

  public handleChargePointCall(
    rawChargeBoxId: string,
    action: OcppAction,
    payload: Record<string, any> = {},
    uniqueId: string = `msg-${Date.now()}`,
    isRealHardware = false,
    remoteAddress?: string
  ): [3, string, Record<string, any>] | [4, string, string, string, Record<string, any>] {
    const chargeBoxId = this.normalizeChargeBoxId(rawChargeBoxId);
    const station = this.findStation(chargeBoxId);
    const nowIso = new Date().toISOString();

    if (station) {
      station.isOnline = true;
      station.lastHeartbeat = nowIso;
    }

    const rhw = this.rh(chargeBoxId);
    if (isRealHardware) {
      rhw.hasRealConnection = true;
      rhw.lastSeenAt = nowIso;
      if (remoteAddress) rhw.remoteAddress = remoteAddress;

      rhw.realHardwareLogs.unshift({
        id: `rh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowIso,
        action,
        direction: 'INCOMING',
        payload,
        remoteAddress: remoteAddress || '127.0.0.1',
        uniqueId,
      });
      if (rhw.realHardwareLogs.length > 50) {
        rhw.realHardwareLogs.pop();
      }
    }

    this.ctx.pushLog(chargeBoxId, 'INCOMING', action, payload, 2, uniqueId);

    let responsePayload: Record<string, any> = {};

    switch (action) {
      case 'BootNotification': {
        if (station) {
          station.vendor = payload.chargePointVendor || station.vendor || 'MaxPower';
          station.model = payload.chargePointModel || station.model || 'VCP160';
          station.firmwareVersion =
            payload.firmwareVersion || station.firmwareVersion || 'MP-VCP160-OCPP16J-v2.4.8';
          station.serialNumber =
            payload.chargePointSerialNumber || station.serialNumber || 'MP160-GH-KSI-2026001';
          station.meterType = payload.meterType || station.meterType || 'DC-DIN-4Q-160KW';
          station.isOnline = true;
          station.lastHeartbeat = nowIso;
          station.connectors.forEach((c) => {
            if (c.status === 'Unavailable') {
              c.status = 'Available';
              c.errorCode = 'NoError';
            }
          });
        }
        if (isRealHardware) {
          rhw.lastBootNotification = {
            receivedAt: nowIso,
            chargePointVendor: payload.chargePointVendor,
            chargePointModel: payload.chargePointModel,
            chargePointSerialNumber: payload.chargePointSerialNumber,
            firmwareVersion: payload.firmwareVersion,
            meterType: payload.meterType,
            rawPayload: payload,
          };
          if (payload.chargePointVendor) rhw.vendor = payload.chargePointVendor;
          if (payload.chargePointModel) rhw.model = payload.chargePointModel;
          if (payload.firmwareVersion) rhw.firmwareVersion = payload.firmwareVersion;
          if (payload.chargePointSerialNumber) rhw.serialNumber = payload.chargePointSerialNumber;
          if (payload.meterType) rhw.meterType = payload.meterType;
        }

        const heartbeatKey = this.configKeys.find((k) => k.key === 'HeartbeatInterval');
        const intervalSec = heartbeatKey ? parseInt(heartbeatKey.value, 10) || 60 : 60;
        responsePayload = {
          status: 'Accepted',
          currentTime: nowIso,
          interval: intervalSec,
        };
        break;
      }

      case 'Heartbeat': {
        if (station) {
          station.isOnline = true;
          station.lastHeartbeat = nowIso;
        }
        if (isRealHardware) {
          rhw.lastHeartbeat = nowIso;
        }
        responsePayload = {
          currentTime: nowIso,
        };
        break;
      }

      case 'Authorize': {
        const idTag = String(payload.idTag || 'VID-GH-8842-A');
        const entry = this.localAuthList.find((e) => e.idTag === idTag);
        responsePayload = {
          idTagInfo: entry
            ? entry.idTagInfo
            : {
                status: 'Accepted',
                expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
                parentIdTag: 'WILPOWER-GH',
              },
        };
        break;
      }

      case 'StatusNotification': {
        const connectorId = Number(payload.connectorId ?? 1);
        const status = (payload.status || 'Available') as ConnectorStatus;
        const errorCode = (payload.errorCode || 'NoError') as ChargePointErrorCode;

        if (station) {
          if (connectorId === 0) {
            station.isOnline = status !== 'Unavailable';
            if (status === 'Faulted' || status === 'Unavailable') {
              station.connectors.forEach((c) => {
                c.status = status;
                c.errorCode = errorCode;
              });
            } else if (status === 'Available') {
              station.connectors.forEach((c) => {
                if (c.status === 'Faulted' || c.status === 'Unavailable') {
                  c.status = 'Available';
                  c.errorCode = 'NoError';
                }
              });
            }
          } else {
            const conn = station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId);
            if (conn) {
              conn.status = status;
              conn.errorCode = errorCode;
              if (payload.info) conn.info = String(payload.info);
            }
          }
        }
        if (isRealHardware) {
          rhw.lastStatusNotification = {
            receivedAt: nowIso,
            connectorId,
            status,
            errorCode,
            info: payload.info ? String(payload.info) : undefined,
            rawPayload: payload,
          };
        }

        responsePayload = {};
        break;
      }

      case 'StartTransaction': {
        const connectorId = Number(payload.connectorId || 1);
        const idTag = String(payload.idTag || 'VID-GH-8842-A');
        const meterStartWh = Number(payload.meterStart || 0);
        const transactionId = this.allocateTransactionId();

        if (station) {
          const conn =
            station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId) ||
            station.connectors[0];
          if (conn) {
            conn.status = 'Charging';
            conn.errorCode = 'NoError';
            conn.reservedByIdTag = undefined;
            conn.reservationId = undefined;
            conn.reservationExpiryDate = undefined;
          }

          if (payload.reservationId) {
            const res = this.reservations.find((r) => r.reservationId === Number(payload.reservationId));
            if (res) res.status = 'Used';
          }

          if (this.ctx.onRemoteStartSession) {
            const session = this.ctx.onRemoteStartSession({
              station,
              connectorId: conn ? conn.connectorId : 1,
              idTag,
              transactionId,
            });
            session.meterStartWh = meterStartWh;
          }
        }

        if (isRealHardware) {
          rhw.lastStartTransaction = {
            receivedAt: nowIso,
            transactionId,
            connectorId,
            idTag,
            meterStartWh,
          };
        }

        responsePayload = {
          transactionId,
          idTagInfo: {
            status: 'Accepted',
            expiryDate: new Date(Date.now() + 86400000).toISOString(),
            parentIdTag: 'WILPOWER-GH',
          },
        };
        break;
      }

      case 'MeterValues': {
        const active = this.ctx.getActiveSession();
        if (active && Array.isArray(payload.meterValue)) {
          const rate = active.tariffPerKwh || 4.5;
          for (const mv of payload.meterValue) {
            const samples = Array.isArray(mv.sampledValue) ? mv.sampledValue : [];
            for (const sv of samples) {
              const val = parseFloat(sv.value);
              if (isNaN(val)) continue;
              const measurand = String(sv.measurand || 'Energy.Active.Import.Register');
              const unit = String(sv.unit || '');
              if (measurand === 'Energy.Active.Import.Register') {
                const kwh = unit === 'Wh' ? val / 1000 : val;
                active.kwhDelivered = Number(kwh.toFixed(3));
                active.meterStopWh = Math.round((active.meterStartWh || 0) + active.kwhDelivered * 1000);
                active.accruedCost = Number((active.kwhDelivered * rate).toFixed(2));
              } else if (measurand === 'Power.Active.Import') {
                const kw = unit === 'W' ? val / 1000 : val;
                active.currentPowerKw = Number(kw.toFixed(1));
              } else if (measurand === 'Voltage') {
                active.voltageV = Number(val.toFixed(1));
              } else if (measurand === 'Current.Import') {
                active.currentA = Number(val.toFixed(1));
              } else if (measurand === 'SoC') {
                active.currentSocPercent = Math.min(100, Math.max(0, Number(val.toFixed(1))));
              } else if (measurand === 'Temperature') {
                active.temperatureC = Number(val.toFixed(1));
              }
            }
          }
        }
        if (isRealHardware) {
          rhw.lastMeterValues = {
            receivedAt: nowIso,
            connectorId: Number(payload.connectorId ?? 1),
            transactionId: payload.transactionId ? Number(payload.transactionId) : undefined,
            voltageV: active?.voltageV,
            currentA: active?.currentA,
            powerKw: active?.currentPowerKw,
            socPercent: active?.currentSocPercent,
            energyKwh: active?.kwhDelivered,
            temperatureC: active?.temperatureC,
          };
        }

        responsePayload = {};
        break;
      }

      case 'StopTransaction': {
        const reason = (payload.reason || 'Local') as OcppStopReason;
        const meterStopWh = payload.meterStop !== undefined ? Number(payload.meterStop) : undefined;
        if (this.ctx.onRemoteStopSession) {
          this.ctx.onRemoteStopSession({ reason, meterStopWh });
        }
        if (isRealHardware) {
          const meterStop = meterStopWh ?? 0;
          const startWh = rhw.lastStartTransaction?.meterStartWh ?? 0;
          const energyKwh = Math.max(0, (meterStop - startWh) / 1000);
          rhw.lastStopTransaction = {
            receivedAt: nowIso,
            transactionId: Number(payload.transactionId || 1),
            meterStopWh: meterStop,
            reason: String(reason || 'Local'),
            totalEnergyKwh: Number(energyKwh.toFixed(3)),
            totalCostGhs: Number((energyKwh * 4.5).toFixed(2)),
          };
        }

        responsePayload = {
          idTagInfo: {
            status: 'Accepted',
          },
        };
        break;
      }

      case 'DiagnosticsStatusNotification': {
        this.diagnosticsStatus = payload.status || 'Uploaded';
        responsePayload = {};
        break;
      }

      case 'FirmwareStatusNotification': {
        this.firmwareStatus = payload.status || 'Installed';
        responsePayload = {};
        break;
      }

      case 'DataTransfer': {
        responsePayload = {
          status: 'Accepted',
          data: JSON.stringify({
            receivedAt: nowIso,
            vendorId: payload.vendorId || 'MaxPower',
            messageId: payload.messageId || 'HMISync',
          }),
        };
        break;
      }

      default: {
        responsePayload = { status: 'Accepted' };
        break;
      }
    }

    this.ctx.pushLog(chargeBoxId, 'OUTGOING', action, responsePayload, 3, uniqueId);
    return [3, uniqueId, responsePayload];
  }

  // ==========================================
  // 5. HANDLE CENTRAL SYSTEM -> CHARGE POINT (SECTION 5)
  // ==========================================

  public async dispatchCentralSystemCommand(
    rawChargeBoxId: string,
    action: OcppAction,
    payload: Record<string, any> = {}
  ): Promise<{
    uniqueId: string;
    chargeBoxId: string;
    action: OcppAction;
    requestPayload: Record<string, any>;
    responsePayload: Record<string, any>;
    deliveredViaWebSocket: boolean;
  }> {
    const chargeBoxId = this.normalizeChargeBoxId(rawChargeBoxId);
    const station = this.findStation(chargeBoxId);
    const uniqueId = `csms-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Log outgoing CALL [2, uniqueId, action, payload]
    this.ctx.pushLog(chargeBoxId, 'OUTGOING', action, payload, 2, uniqueId);

    // If a live physical WebSocket is connected for this Charge Point, send the frame over the wire
    const connected = this.sockets.get(chargeBoxId);
    if (connected && !connected.socket.destroyed) {
      try {
        const frameStr = JSON.stringify([2, uniqueId, action, payload]);
        sendWebSocketTextFrame(connected.socket, frameStr);
        const wsResponse = await new Promise<Record<string, any>>((resolve, reject) => {
          const timer = setTimeout(() => {
            this.pendingCalls.delete(uniqueId);
            reject(new Error('Charge Point WebSocket response timeout'));
          }, 4500);
          this.pendingCalls.set(uniqueId, {
            action,
            chargeBoxId,
            resolve,
            reject,
            timer,
          });
        });
        this.ctx.pushLog(chargeBoxId, 'INCOMING', action, wsResponse, 3, uniqueId);
        return {
          uniqueId,
          chargeBoxId,
          action,
          requestPayload: payload,
          responsePayload: wsResponse,
          deliveredViaWebSocket: true,
        };
      } catch {
        // Fall through to deterministic state-machine execution if hardware times out
      }
    }

    // Deterministic OCPP 1.6 Edition 2 state machine execution
    let responsePayload: Record<string, any> = { status: 'Accepted' };

    switch (action) {
      case 'RemoteStartTransaction': {
        const connectorId = Number(payload.connectorId || 1);
        const idTag = String(payload.idTag || 'VID-GH-8842-A');
        const transactionId = this.allocateTransactionId();
        if (station && this.ctx.onRemoteStartSession) {
          this.ctx.onRemoteStartSession({
            station,
            connectorId,
            idTag,
            transactionId,
          });
        }
        responsePayload = { status: 'Accepted', transactionId };
        break;
      }

      case 'RemoteStopTransaction': {
        if (this.ctx.onRemoteStopSession) {
          this.ctx.onRemoteStopSession({ reason: 'Remote' });
        }
        responsePayload = { status: 'Accepted' };
        break;
      }

      case 'ChangeAvailability': {
        const connectorId = Number(payload.connectorId ?? 0);
        const availType = payload.type === 'Inoperative' ? 'Unavailable' : 'Available';
        if (station) {
          if (connectorId === 0) {
            station.isOnline = availType === 'Available';
            station.connectors.forEach((c) => {
              if (c.status !== 'Charging') c.status = availType;
            });
          } else {
            const conn = station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId);
            if (conn && conn.status !== 'Charging') {
              conn.status = availType;
            }
          }
        }
        responsePayload = { status: 'Accepted' };
        break;
      }

      case 'GetConfiguration': {
        const keys = Array.isArray(payload.key) ? payload.key : undefined;
        responsePayload = this.getConfigurationKeys(keys);
        break;
      }

      case 'ChangeConfiguration': {
        const status = this.changeConfigurationKey(String(payload.key || ''), String(payload.value ?? ''));
        responsePayload = { status };
        break;
      }

      case 'ClearCache': {
        responsePayload = { status: 'Accepted' };
        break;
      }

      case 'UnlockConnector': {
        const connectorId = Number(payload.connectorId || 1);
        const active = this.ctx.getActiveSession();
        if (active && active.stationId === chargeBoxId && active.connectorId === connectorId && this.ctx.onRemoteStopSession) {
          this.ctx.onRemoteStopSession({ reason: 'UnlockCommand' });
        }
        if (station) {
          const conn = station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId);
          if (conn) {
            conn.status = 'Available';
            conn.errorCode = 'NoError';
            conn.currentPowerKw = 0;
          }
        }
        responsePayload = { status: 'Unlocked' };
        break;
      }

      case 'Reset': {
        const resetType = payload.type === 'Hard' ? 'Hard' : 'Soft';
        if (this.ctx.getActiveSession() && this.ctx.onRemoteStopSession) {
          this.ctx.onRemoteStopSession({ reason: resetType === 'Hard' ? 'HardReset' : 'SoftReset' });
        }
        if (station) {
          station.isOnline = true;
          station.lastHeartbeat = new Date().toISOString();
          station.connectors.forEach((c) => {
            c.status = 'Available';
            c.errorCode = 'NoError';
            c.currentPowerKw = 0;
          });
        }
        responsePayload = { status: 'Accepted' };
        break;
      }

      case 'TriggerMessage': {
        const requestedMessage = String(payload.requestedMessage || 'StatusNotification') as OcppAction;
        const connectorId = Number(payload.connectorId || 1);
        responsePayload = { status: 'Accepted' };
        this.ctx.pushLog(chargeBoxId, 'INCOMING', action, responsePayload, 3, uniqueId);

        if (requestedMessage === 'Heartbeat') {
          this.handleChargePointCall(chargeBoxId, 'Heartbeat', {});
        } else if (requestedMessage === 'BootNotification') {
          this.handleChargePointCall(chargeBoxId, 'BootNotification', {
            chargePointVendor: station?.vendor || 'MaxPower',
            chargePointModel: station?.model || 'VCP160',
            chargePointSerialNumber: station?.serialNumber || 'MP160-GH-KSI-2026001',
            firmwareVersion: station?.firmwareVersion || 'MP-VCP160-OCPP16J-v2.4.8',
          });
        } else if (requestedMessage === 'MeterValues') {
          const active = this.ctx.getActiveSession();
          this.handleChargePointCall(chargeBoxId, 'MeterValues', {
            connectorId,
            transactionId: active?.transactionId || this.nextTransactionId,
            meterValue: [
              {
                timestamp: new Date().toISOString(),
                sampledValue: [
                  {
                    value: String(active?.kwhDelivered ?? 0),
                    measurand: 'Energy.Active.Import.Register',
                    unit: 'kWh',
                  },
                  {
                    value: String(active?.currentPowerKw ?? 0),
                    measurand: 'Power.Active.Import',
                    unit: 'kW',
                  },
                  {
                    value: String(active?.voltageV ?? 0),
                    measurand: 'Voltage',
                    unit: 'V',
                  },
                  {
                    value: String(active?.currentA ?? 0),
                    measurand: 'Current.Import',
                    unit: 'A',
                  },
                ],
              },
            ],
          });
        } else {
          const conn = station?.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId);
          this.handleChargePointCall(chargeBoxId, 'StatusNotification', {
            connectorId,
            status: conn?.status || 'Available',
            errorCode: conn?.errorCode || 'NoError',
            timestamp: new Date().toISOString(),
          });
        }

        return {
          uniqueId,
          chargeBoxId,
          action,
          requestPayload: payload,
          responsePayload,
          deliveredViaWebSocket: false,
        };
      }

      case 'ReserveNow': {
        const connectorId = Number(payload.connectorId || 1);
        const idTag = String(payload.idTag || 'VID-GH-8842-A');
        const reservationId = Number(payload.reservationId || ++this.nextReservationId);
        const expiryDate =
          payload.expiryDate || new Date(Date.now() + 30 * 60 * 1000).toISOString();

        if (!station) {
          responsePayload = { status: 'Rejected' };
          break;
        }
        const conn =
          station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId) ||
          station.connectors[0];
        if (!conn) {
          responsePayload = { status: 'Rejected' };
          break;
        }
        if (conn.status === 'Faulted') {
          responsePayload = { status: 'Faulted' };
          break;
        }
        if (conn.status === 'Unavailable') {
          responsePayload = { status: 'Unavailable' };
          break;
        }
        if (conn.status === 'Charging' || conn.status === 'Preparing') {
          responsePayload = { status: 'Occupied' };
          break;
        }

        conn.status = 'Reserved';
        conn.reservedByIdTag = idTag;
        conn.reservationId = reservationId;
        conn.reservationExpiryDate = expiryDate;

        const existingIdx = this.reservations.findIndex((r) => r.reservationId === reservationId);
        const resRecord: ConnectorReservation = {
          reservationId,
          stationId: station.stationId,
          chargeBoxId: station.stationId,
          connectorId: conn.connectorId,
          connectorLabel: conn.label || (conn.connectorId === 1 ? 'Outlet A' : 'Outlet B'),
          idTag,
          expiryDate,
          status: 'Active',
        };
        if (existingIdx >= 0) {
          this.reservations[existingIdx] = resRecord;
        } else {
          this.reservations.unshift(resRecord);
        }
        responsePayload = { status: 'Accepted', reservationId, expiryDate };
        break;
      }

      case 'CancelReservation': {
        const reservationId = Number(payload.reservationId);
        const res = this.reservations.find((r) => r.reservationId === reservationId && r.status === 'Active');
        if (!res) {
          responsePayload = { status: 'Rejected' };
          break;
        }
        res.status = 'Cancelled';
        const targetStation = this.findStation(res.chargeBoxId);
        const conn = targetStation?.connectors.find((c) => c.connectorId === res.connectorId);
        if (conn && conn.status === 'Reserved') {
          conn.status = 'Available';
          conn.reservedByIdTag = undefined;
          conn.reservationId = undefined;
          conn.reservationExpiryDate = undefined;
        }
        responsePayload = { status: 'Accepted' };
        break;
      }

      case 'SetChargingProfile': {
        const csChargingProfiles = (payload.csChargingProfiles || {
          chargingProfileId: this.chargingProfiles.length + 1,
          stackLevel: 1,
          chargingProfilePurpose: 'TxDefaultProfile',
          chargingProfileKind: 'Absolute',
          chargingSchedule: {
            chargingRateUnit: 'W',
            chargingSchedulePeriod: [
              {
                startPeriod: 0,
                limit: Number(payload.limitWatts || 80000),
                numberPhases: 3,
              },
            ],
          },
        }) as ChargingProfile;

        const existingIdx = this.chargingProfiles.findIndex(
          (p) => p.chargingProfileId === csChargingProfiles.chargingProfileId
        );
        if (existingIdx >= 0) {
          this.chargingProfiles[existingIdx] = csChargingProfiles;
        } else {
          this.chargingProfiles.push(csChargingProfiles);
        }

        // If an active session is running, apply the new power ceiling immediately
        const active = this.ctx.getActiveSession();
        const newLimitW = csChargingProfiles.chargingSchedule?.chargingSchedulePeriod?.[0]?.limit;
        if (active && newLimitW && newLimitW > 0) {
          const newKw = csChargingProfiles.chargingSchedule.chargingRateUnit === 'W'
            ? newLimitW / 1000
            : (newLimitW * active.voltageV) / 1000;
          active.currentPowerKw = Number(Math.min(160, newKw).toFixed(1));
          active.currentA = Number(((active.currentPowerKw * 1000) / active.voltageV).toFixed(1));
        }

        responsePayload = { status: 'Accepted' };
        break;
      }

      case 'ClearChargingProfile': {
        const profileId = payload.id ? Number(payload.id) : undefined;
        if (profileId !== undefined) {
          this.chargingProfiles = this.chargingProfiles.filter((p) => p.chargingProfileId !== profileId);
        } else {
          this.chargingProfiles = this.chargingProfiles.slice(0, 1);
        }
        responsePayload = { status: 'Accepted' };
        break;
      }

      case 'GetCompositeSchedule': {
        const duration = Number(payload.duration || 3600);
        const connectorId = Number(payload.connectorId ?? 0);
        const activeLimit =
          this.chargingProfiles[this.chargingProfiles.length - 1]?.chargingSchedule
            ?.chargingSchedulePeriod?.[0]?.limit || 160000;
        responsePayload = {
          status: 'Accepted',
          connectorId,
          scheduleStart: new Date().toISOString(),
          chargingSchedule: {
            duration,
            chargingRateUnit: payload.chargingRateUnit || 'W',
            chargingSchedulePeriod: [
              {
                startPeriod: 0,
                limit: activeLimit,
                numberPhases: 3,
              },
            ],
          },
        };
        break;
      }

      case 'GetLocalListVersion': {
        responsePayload = { listVersion: this.localAuthListVersion };
        break;
      }

      case 'SendLocalList': {
        this.localAuthListVersion = Number(payload.listVersion || this.localAuthListVersion + 1);
        if (Array.isArray(payload.localAuthorizationList)) {
          for (const item of payload.localAuthorizationList) {
            if (item && item.idTag) {
              const idx = this.localAuthList.findIndex((e) => e.idTag === item.idTag);
              if (idx >= 0) {
                this.localAuthList[idx] = item;
              } else {
                this.localAuthList.push(item);
              }
            }
          }
        }
        responsePayload = { status: 'Accepted' };
        break;
      }

      case 'GetDiagnostics': {
        this.diagnosticsStatus = 'Uploaded';
        responsePayload = { fileName: `diag-${chargeBoxId}-${Date.now()}.log` };
        break;
      }

      case 'UpdateFirmware': {
        this.firmwareStatus = 'Installed';
        responsePayload = {};
        break;
      }

      default: {
        responsePayload = { status: 'Accepted' };
        break;
      }
    }

    this.ctx.pushLog(chargeBoxId, 'INCOMING', action, responsePayload, 3, uniqueId);

    return {
      uniqueId,
      chargeBoxId,
      action,
      requestPayload: payload,
      responsePayload,
      deliveredViaWebSocket: false,
    };
  }

  // ==========================================
  // 6. WEBSOCKET CONNECTION LIFECYCLE
  // ==========================================

  public registerWebSocketConnection(
    rawChargeBoxId: string,
    socket: Duplex,
    remoteAddress: string,
    subprotocol: string
  ) {
    const chargeBoxId = this.normalizeChargeBoxId(rawChargeBoxId);
    const nowIso = new Date().toISOString();
    const record: ConnectedChargePointSocket = {
      chargeBoxId,
      pileNumber: rawChargeBoxId,
      remoteAddress,
      connectedAt: nowIso,
      lastSeenAt: nowIso,
      subprotocol,
      socket,
    };
    this.sockets.set(chargeBoxId, record);

    const telemetry = this.rh(chargeBoxId);
    telemetry.remoteAddress = remoteAddress;
    telemetry.subprotocol = subprotocol;
    telemetry.connectedAt = nowIso;
    telemetry.socketCount = 1;

    const station = this.findStation(chargeBoxId);
    if (station) {
      station.isOnline = true;
      station.lastHeartbeat = nowIso;
    }

    socket.on('close', () => {
      const current = this.sockets.get(chargeBoxId);
      if (current && current.socket === socket) {
        this.sockets.delete(chargeBoxId);
      }
    });
  }

  public handleRawWebSocketText(rawChargeBoxId: string, text: string, socket: Duplex) {
    const chargeBoxId = this.normalizeChargeBoxId(rawChargeBoxId);
    const sockRecord = this.sockets.get(chargeBoxId);
    if (sockRecord) {
      sockRecord.lastSeenAt = new Date().toISOString();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const errFrame = JSON.stringify([
        4,
        '0',
        'FormationViolation',
        'Invalid JSON payload in OCPP 1.6J frame',
        {},
      ]);
      sendWebSocketTextFrame(socket, errFrame);
      return;
    }

    if (!Array.isArray(parsed) || parsed.length < 3) {
      const errFrame = JSON.stringify([
        4,
        '0',
        'ProtocolError',
        'OCPP-J frame must be a JSON array [MessageTypeId, UniqueId, ...]',
        {},
      ]);
      sendWebSocketTextFrame(socket, errFrame);
      return;
    }

    const messageTypeId = Number(parsed[0]);
    const uniqueId = String(parsed[1]);

    if (messageTypeId === 2) {
      const action = String(parsed[2]) as OcppAction;
      const payload = parsed[3] && typeof parsed[3] === 'object' ? parsed[3] : {};
      const reply = this.handleChargePointCall(chargeBoxId, action, payload, uniqueId, true, sockRecord?.remoteAddress);
      sendWebSocketTextFrame(socket, JSON.stringify(reply));
    } else if (messageTypeId === 3) {
      const payload = parsed[2] && typeof parsed[2] === 'object' ? parsed[2] : {};
      const pending = this.pendingCalls.get(uniqueId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingCalls.delete(uniqueId);
        pending.resolve(payload);
      }
    } else if (messageTypeId === 4) {
      const errorCode = String(parsed[2] || 'GenericError');
      const errorDesc = String(parsed[3] || '');
      const pending = this.pendingCalls.get(uniqueId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingCalls.delete(uniqueId);
        pending.reject(new Error(`${errorCode}: ${errorDesc}`));
      }
    }
  }
}

// ==========================================
// 7. RFC 6455 NATIVE WEBSOCKET SERVER
// ==========================================

const WS_MAGIC_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function sendWebSocketFrame(socket: Duplex, opcode: number, payloadBuf: Buffer) {
  if (socket.destroyed) return;
  const len = payloadBuf.length;
  let header: Buffer;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  socket.write(Buffer.concat([header, payloadBuf]));
}

export function sendWebSocketTextFrame(socket: Duplex, text: string) {
  sendWebSocketFrame(socket, 0x01, Buffer.from(text, 'utf8'));
}

export function attachOcpp16WebSocketServer(httpServer: http.Server, engine: Ocpp16Engine) {
  httpServer.on('upgrade', (req: http.IncomingMessage, socket: Duplex, head: Buffer) => {
    const rawUrl = req.url || '/';
    const pathname = rawUrl.split('?')[0];

    let chargeBoxId: string | null = null;
    const match16 = pathname.match(/^\/ocpp\/1\.6\/([^/]+)\/?$/i);
    const matchOcpp = pathname.match(/^\/ocpp\/([^/]+)\/?$/i);
    const matchRoot = pathname.match(/^\/(CL-[A-Z]+-\d+|19046744073709551615)\/?$/i);

    if (match16) {
      chargeBoxId = match16[1];
    } else if (matchOcpp && matchOcpp[1].toLowerCase() !== '1.6') {
      chargeBoxId = matchOcpp[1];
    } else if (matchRoot) {
      chargeBoxId = matchRoot[1];
    } else if (pathname === '/ocpp/1.6' || pathname === '/ocpp') {
      chargeBoxId = 'CL-KSI-001';
    }

    if (!chargeBoxId) {
      return;
    }

    const wsKey = req.headers['sec-websocket-key'];
    if (!wsKey || typeof wsKey !== 'string') {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(wsKey + WS_MAGIC_GUID)
      .digest('base64');

    const requestedProtocols = String(req.headers['sec-websocket-protocol'] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const selectedSubprotocol =
      requestedProtocols.find((p) => p.toLowerCase() === 'ocpp1.6') ||
      requestedProtocols[0] ||
      'ocpp1.6';

    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      `Sec-WebSocket-Protocol: ${selectedSubprotocol}`,
      '\r\n',
    ];

    socket.write(responseHeaders.join('\r\n'));

    const remoteAddress = req.socket.remoteAddress || '127.0.0.1';
    engine.registerWebSocketConnection(chargeBoxId, socket, remoteAddress, selectedSubprotocol);

    let buffer: Buffer = head && head.length > 0 ? Buffer.from(head) : Buffer.alloc(0);

    const processBuffer = () => {
      while (buffer.length >= 2) {
        const firstByte = buffer[0];
        const secondByte = buffer[1];
        const opcode = firstByte & 0x0f;
        const isMasked = (secondByte & 0x80) !== 0;
        let payloadLen = secondByte & 0x7f;
        let offset = 2;

        if (payloadLen === 126) {
          if (buffer.length < 4) return;
          payloadLen = buffer.readUInt16BE(2);
          offset = 4;
        } else if (payloadLen === 127) {
          if (buffer.length < 10) return;
          payloadLen = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }

        const maskLen = isMasked ? 4 : 0;
        if (buffer.length < offset + maskLen + payloadLen) {
          return;
        }

        const maskKey = isMasked ? buffer.subarray(offset, offset + 4) : null;
        offset += maskLen;

        const payload = Buffer.from(buffer.subarray(offset, offset + payloadLen));
        buffer = buffer.subarray(offset + payloadLen);

        if (isMasked && maskKey) {
          for (let i = 0; i < payload.length; i++) {
            payload[i] ^= maskKey[i % 4];
          }
        }

        if (opcode === 0x08) {
          sendWebSocketFrame(socket, 0x08, Buffer.alloc(0));
          socket.end();
          return;
        } else if (opcode === 0x09) {
          sendWebSocketFrame(socket, 0x0a, payload);
        } else if (opcode === 0x01) {
          const text = payload.toString('utf8');
          engine.handleRawWebSocketText(chargeBoxId!, text, socket);
        }
      }
    };

    if (buffer.length > 0) {
      processBuffer();
    }

    socket.on('data', (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      processBuffer();
    });

    socket.on('error', () => {
      socket.destroy();
    });
  });
}
