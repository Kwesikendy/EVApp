import fs from 'fs';
import path from 'path';

// Self-contained OCPP 1.6 Edition 2 Serverless Handler for Vercel
const DATA_DIR = process.env.VERCEL ? '/tmp/xcharge-data' : path.join(process.cwd(), 'data');
const OCPP_STATE_FILE = path.join(DATA_DIR, 'ocpp-state.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const COMMISSIONING_GUIDE = {
  stationId: 'CL-KSI-001',
  internalId: 'st-01',
  stationName: 'Greenwood Event Center',
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
  networkMode: '2.Ethernet (4G/LAN)',
  networkModeNote:
    'Choose Ethernet when using 4G card or network cable. Available network model: 1.WIFI, 2.Ethnet',
  outlets: [
    { connectorId: 1, hmiTab: 'Outlet A', type: 'GB/T', maxPowerKw: 160, tariffGhsPerKwh: 4.5 },
    { connectorId: 2, hmiTab: 'Outlet B', type: 'CCS2', maxPowerKw: 160, tariffGhsPerKwh: 4.5 },
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

const STATION_2 = {
  id: 'st-02',
  stationId: 'CL-KSI-002',
  chargeBoxId: 'CL-KSI-002',
  pileNumber: 'CL-KSI-002',
  name: 'Greenwood Event Center Station 2',
  imageUrl: '/stations/station2-40kw.jpg',
  operator: 'ChargeLink GH',
  address: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi',
  latitude: 6.6697479,
  longitude: -1.5995679,
  isOnline: false,
  ocppVersion: '1.6J',
  vendor: 'MaxPower',
  model: 'DC Fast Charger (40kW)',
  firmwareVersion: 'Awaiting BootNotification',
  serialNumber: 'Awaiting BootNotification',
  meterType: 'DC-40KW',
  networkMode: '2.Ethernet (4G/LAN)',
  rating: 5.0,
  amenities: ['Event Center', 'Parking Bay', 'Security', '24/7 Operation', 'Opoku Bandoh Plaza', 'OCPP 1.6J Live'],
  connectors: [
    {
      id: 201,
      connectorId: 1,
      label: 'Outlet A',
      type: 'GB/T',
      maxPowerKw: 40,
      currentPowerKw: 0,
      status: 'Available',
      errorCode: 'NoError',
      tariffPerKwh: 4.5,
      tariffGhsPerKwh: 4.5,
      tariffCurrency: 'GHS',
    },
  ],
};

function emptyTelemetry(s: any) {
  return {
    hasRealConnection: false,
    socketCount: 0,
    chargeBoxId: s.stationId,
    pileNumber: s.pileNumber,
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
    realHardwareLogs: [] as any[],
  };
}

function createDefaultState() {
  return {
    nextTransactionId: 98421,
    nextReservationId: 501,
    stations: [
      {
        id: 'st-01',
        stationId: 'CL-KSI-001',
        chargeBoxId: 'CL-KSI-001',
        pileNumber: '19046744073709551615',
        name: 'Greenwood Event Center Station 1',
        imageUrl: '/stations/greenwood-site.jpg',
        operator: 'ChargeLink GH',
        address: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi',
        latitude: 6.6697479,
        longitude: -1.5995679,
        isOnline: false,
        ocppVersion: '1.6J',
        lastHeartbeat: new Date().toISOString(),
        vendor: 'MaxPower',
        model: 'VCP160 Dual-Gun DC Fast Charger (160kW)',
        firmwareVersion: 'MP-VCP160-OCPP16J-v2.4.8',
        serialNumber: 'MP160-GH-KSI-2026001',
        meterType: 'DC-DIN-4Q-160KW',
        networkMode: '2.Ethernet (4G/LAN)',
        rating: 5.0,
        amenities: [
          'Event Center',
          'Parking Bay',
          'Security',
          '24/7 Operation',
          'Opoku Bandoh Plaza',
          'OCPP 1.6J Live',
        ],
        connectors: [
          {
            id: 101,
            connectorId: 1,
            label: 'Outlet A',
            imageUrl: '/stations/station1-outlet-a.jpg',
            type: 'GB/T',
            maxPowerKw: 160,
            currentPowerKw: 0,
            status: 'Available',
            errorCode: 'NoError',
            tariffPerKwh: 4.50,
            tariffGhsPerKwh: 4.50,
            tariffCurrency: 'GHS',
          },
          {
            id: 102,
            connectorId: 2,
            label: 'Outlet B',
            imageUrl: '/stations/station1-outlet-b.jpg',
            type: 'CCS2',
            maxPowerKw: 160,
            currentPowerKw: 0,
            status: 'Available',
            errorCode: 'NoError',
            tariffPerKwh: 4.50,
            tariffGhsPerKwh: 4.50,
            tariffCurrency: 'GHS',
          },
        ],
      },
      STATION_2,
    ],
    activeSession: null as any,
    reservations: [] as any[],
    chargingProfiles: [
      {
        chargingProfileId: 1,
        stackLevel: 0,
        chargingProfilePurpose: 'ChargePointMaxProfile',
        chargingProfileKind: 'Absolute',
        chargingSchedule: {
          chargingRateUnit: 'W',
          chargingSchedulePeriod: [{ startPeriod: 0, limit: 160000, numberPhases: 3 }],
        },
      },
    ],
    configurationKeys: [
      { key: 'HeartbeatInterval', readonly: false, value: '60', description: 'Interval (in seconds) between Heartbeat.req PDUs' },
      { key: 'MeterValueSampleInterval', readonly: false, value: '5', description: 'Interval between sampling of metering data (seconds)' },
      { key: 'MeterValuesSampledData', readonly: false, value: 'Energy.Active.Import.Register,Power.Active.Import,Voltage,Current.Import,SoC,Temperature', description: 'Sampled measurands included in MeterValues.req' },
      { key: 'ConnectionTimeOut', readonly: false, value: '60', description: 'Timeout (seconds) from RemoteStartTransaction until cable plug-in' },
      { key: 'AuthorizeRemoteTxRequests', readonly: false, value: 'true', description: 'Whether remote start requires Authorize.req' },
      { key: 'LocalAuthorizeOffline', readonly: false, value: 'true', description: 'Authorize offline transactions for locally known idTags' },
      { key: 'LocalPreAuthorize', readonly: false, value: 'true', description: 'Start transaction immediately using Local Auth List' },
      { key: 'StopTransactionOnEVSideDisconnect', readonly: false, value: 'true', description: 'Stop transaction when EV disconnects cable' },
      { key: 'UnlockConnectorOnEVSideDisconnect', readonly: false, value: 'true', description: 'Unlock physical connector when EV unplugs' },
      { key: 'NumberOfConnectors', readonly: true, value: '2', description: 'Physical outlets (Outlet A: GB/T, Outlet B: CCS2)' },
      { key: 'SupportedFeatureProfiles', readonly: true, value: 'Core,FirmwareManagement,LocalAuthListManagement,Reservation,SmartCharging,RemoteTrigger', description: 'OCPP 1.6 Edition 2 Feature Profiles' },
      { key: 'MaxPower.PileNumber', readonly: false, value: 'CL-KSI-001', description: 'MaxPower HMI Stake/Pile Number (CL-KSI-001 / 19046744073709551615)' },
      { key: 'MaxPower.ElectricityPriceGhsPerKwh', readonly: false, value: '4.50', description: 'Current electricity price on charger HMI (GH₵ / kWh)' },
      { key: 'MaxPower.NetworkMode', readonly: false, value: '2.Ethernet (4G/LAN)', description: 'Selected HMI Network Mode (1.WIFI or 2.Ethernet)' },
    ],
    logs: [
      {
        id: 'ocpp-05',
        timestamp: new Date(Date.now() - 15000).toISOString(),
        chargeBoxId: 'CL-KSI-001',
        direction: 'INCOMING',
        action: 'Heartbeat',
        messageTypeId: 2,
        uniqueId: 'hb-1002',
        payload: { chargeBoxId: 'CL-KSI-001', pileNumber: '19046744073709551615' },
      },
      {
        id: 'ocpp-04',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        chargeBoxId: 'CL-KSI-001',
        direction: 'INCOMING',
        action: 'StatusNotification',
        messageTypeId: 2,
        uniqueId: 'stat-1002',
        payload: {
          connectorId: 2,
          connectorLabel: 'Outlet B',
          errorCode: 'NoError',
          status: 'Available',
          info: 'MaxPower VCP160 Outlet B (CCS2 160kW) Ready',
        },
      },
      {
        id: 'ocpp-03',
        timestamp: new Date(Date.now() - 125000).toISOString(),
        chargeBoxId: 'CL-KSI-001',
        direction: 'INCOMING',
        action: 'StatusNotification',
        messageTypeId: 2,
        uniqueId: 'stat-1001',
        payload: {
          connectorId: 1,
          connectorLabel: 'Outlet A',
          errorCode: 'NoError',
          status: 'Available',
          info: 'MaxPower VCP160 Outlet A (GB/T 160kW) Ready',
        },
      },
      {
        id: 'ocpp-01',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        chargeBoxId: 'CL-KSI-001',
        direction: 'INCOMING',
        action: 'BootNotification',
        messageTypeId: 2,
        uniqueId: 'boot-1001',
        payload: {
          chargePointVendor: 'MaxPower',
          chargePointModel: 'VCP160',
          chargePointSerialNumber: 'MP160-GH-KSI-2026001',
          firmwareVersion: 'MP-VCP160-OCPP16J-v2.4.8',
          chargeBoxId: 'CL-KSI-001',
          pileNumber: '19046744073709551615',
        },
      },
    ],
  };
}

function loadState() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(OCPP_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(OCPP_STATE_FILE, 'utf8'));
    }
  } catch {
    // Fallback
  }
  const initial = createDefaultState();
  saveState(initial);
  return initial;
}

function saveState(state: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(OCPP_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Ignore write errors
  }
}

function normalizeGhanaPhone(raw: string): string {
  const cleaned = String(raw || '').replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+233')) return cleaned;
  if (cleaned.startsWith('233')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+233${cleaned.substring(1)}`;
  if (cleaned.length === 9) return `+233${cleaned}`;
  return cleaned || '+233248901204';
}

function getOrUpdateUserWallet(phone: string, updater?: (u: any) => void) {
  const norm = normalizeGhanaPhone(phone);
  let usersObj: Record<string, any> = {};
  try {
    if (fs.existsSync(USERS_FILE)) {
      usersObj = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } else {
      const seedPath = path.join(process.cwd(), 'data', 'users.json');
      if (fs.existsSync(seedPath)) {
        usersObj = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      }
    }
  } catch {
    usersObj = {};
  }

  if (!usersObj[norm]) {
    usersObj[norm] = {
      id: `usr-${Date.now()}`,
      phoneNumber: norm,
      displayName: 'Kofi Mensah',
      walletBalance: 145.5,
      heldBalance: 0,
      transactions: [],
    };
  }
  if (updater) {
    updater(usersObj[norm]);
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(USERS_FILE, JSON.stringify(usersObj, null, 2), 'utf8');
    } catch {
      // Ignore write error
    }
  }
  const u = usersObj[norm];
  return {
    userId: u.id,
    currency: 'GHS',
    availableBalance: Number(u.walletBalance ?? 145.5),
    heldBalance: Number(u.heldBalance ?? 0),
    momoProvider: 'MTN',
    phoneNumber: u.phoneNumber,
    transactions: u.transactions || [],
  };
}

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const urlPath = String(req.url || '').split('?')[0];
  const state = loadState();
  if (!state.stations.find((s: any) => s.id === 'st-02')) state.stations.push(STATION_2);
  const station = state.stations[0];
  const host = req.headers?.host || 'localhost:5173';
  const wsScheme = host.includes('.vercel.app') || host.includes('.run.app') ? 'wss' : 'ws';

  // 1. GET /api/ocpp/status
  if (urlPath.endsWith('/status') && req.method === 'GET') {
    return res.status(200).json({
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
          state.stations.map((s: any) => [s.stationId, `${wsScheme}://${host}/ocpp/1.6/${s.stationId}`])
        ),
      },
      commissioning: COMMISSIONING_GUIDE,
      greenwoodStation: station,
      allStations: state.stations,
      realHardwareByBox: Object.fromEntries(state.stations.map((s: any) => [s.stationId, emptyTelemetry(s)])),
      connectedSockets: [],
      realHardware: {
        hasRealConnection: false,
        socketCount: 0,
        chargeBoxId: 'CL-KSI-001',
        pileNumber: '19046744073709551615',
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
      },
      activeSession: state.activeSession,
      configurationKeys: state.configurationKeys,
      reservations: state.reservations,
      chargingProfiles: state.chargingProfiles,
      localAuthListVersion: 4,
      diagnosticsStatus: 'Idle',
      firmwareStatus: 'Idle',
      recentFrames: state.logs.slice(0, 25),
    });
  }

  // 2. GET /api/ocpp/logs
  if (urlPath.endsWith('/logs') && req.method === 'GET') {
    return res.status(200).json(state.logs);
  }

  // 3. GET / POST /api/ocpp/config
  if (urlPath.endsWith('/config')) {
    if (req.method === 'GET') {
      return res.status(200).json({ configurationKey: state.configurationKeys, unknownKey: [] });
    }
    const { key, value } = req.body || {};
    const found = state.configurationKeys.find(
      (k: any) => k.key.toLowerCase() === String(key || '').toLowerCase()
    );
    if (!found) {
      return res.status(200).json({ success: false, status: 'NotSupported', configurationKeys: state.configurationKeys });
    }
    if (found.readonly) {
      return res.status(200).json({ success: false, status: 'Rejected', configurationKeys: state.configurationKeys });
    }
    found.value = String(value);
    if (found.key === 'MaxPower.ElectricityPriceGhsPerKwh') {
      const rate = parseFloat(String(value));
      if (!isNaN(rate) && rate > 0) {
        station.connectors.forEach((c: any) => {
          c.tariffPerKwh = Number(rate.toFixed(2));
          c.tariffGhsPerKwh = Number(rate.toFixed(2));
        });
      }
    }
    state.logs.unshift({
      id: `cfg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chargeBoxId: 'CL-KSI-001',
      direction: 'OUTGOING',
      action: 'ChangeConfiguration',
      messageTypeId: 2,
      uniqueId: `cfg-${Date.now()}`,
      payload: { key, value, status: 'Accepted' },
    });
    saveState(state);
    return res.status(200).json({ success: true, status: 'Accepted', configurationKeys: state.configurationKeys });
  }

  // 4. POST /api/ocpp/remote-start
  if (urlPath.endsWith('/remote-start') && req.method === 'POST') {
    const {
      connectorId = 1,
      isFleet = false,
      vin,
      preauthHoldAmount = 25,
      phoneNumber = '+233248901204',
      idTag = 'VID-GH-8842-A',
    } = req.body || {};

    if (state.activeSession && state.activeSession.status === 'Charging') {
      return res.status(400).json({ error: 'An active charging session is already in progress' });
    }

    const walletCheck = getOrUpdateUserWallet(phoneNumber);
    if (!isFleet && walletCheck.availableBalance < preauthHoldAmount) {
      return res.status(402).json({
        error: 'Insufficient wallet balance for pre-authorization hold',
        required: preauthHoldAmount,
        available: walletCheck.availableBalance,
      });
    }

    const wallet = getOrUpdateUserWallet(phoneNumber, (u) => {
      if (!isFleet) {
        u.walletBalance = Number((Number(u.walletBalance || 145.5) - preauthHoldAmount).toFixed(2));
        u.heldBalance = Number((Number(u.heldBalance || 0) + preauthHoldAmount).toFixed(2));
        u.transactions = u.transactions || [];
        u.transactions.unshift({
          id: `tx-hold-${Date.now()}`,
          timestamp: new Date().toISOString(),
          amount: preauthHoldAmount,
          type: 'PREAUTH_HOLD',
          status: 'SUCCESS',
          provider: 'MOMO',
          reference: `HOLD-GH-${Math.floor(100000 + Math.random() * 900000)}`,
          description: `Pre-Auth Escrow Hold @ ${station.name}`,
        });
      }
    });

    const connector =
      station.connectors.find((c: any) => c.connectorId === Number(connectorId)) ||
      station.connectors[0];
    connector.status = 'Charging';
    connector.errorCode = 'NoError';
    connector.currentPowerKw = 120;

    const transactionId = ++state.nextTransactionId;
    const meterStartWh = 142500;

    state.activeSession = {
      sessionId: `ses-${Date.now()}`,
      transactionId,
      stationId: station.stationId,
      stationName: station.name,
      chargeBoxId: station.stationId,
      connectorId: connector.connectorId,
      connectorLabel: connector.label || (connector.connectorId === 1 ? 'Outlet A' : 'Outlet B'),
      connectorType: connector.type,
      idTag,
      userId: phoneNumber,
      driverPhone: phoneNumber,
      isFleetSession: !!isFleet,
      fleetVin: vin,
      startTime: Date.now(),
      elapsedSeconds: 0,
      remainingMinutes: 24,
      currentSocPercent: 28,
      targetSocPercent: 85,
      currentPowerKw: 120,
      voltageV: 400.2,
      currentA: 299.9,
      kwhDelivered: 0.05,
      meterStartWh,
      meterStopWh: meterStartWh + 50,
      temperatureC: 34.5,
      accruedCost: 0.23,
      tariffPerKwh: connector.tariffPerKwh || 4.5,
      cardBalanceGhs: wallet.availableBalance,
      currency: 'GHS',
      preauthHoldAmount: isFleet ? 0 : preauthHoldAmount,
      status: 'Charging',
      meterValuesLog: [
        { timestamp: new Date().toISOString(), soc: 28, powerKw: 120, kwhTotal: 0.05 },
      ],
    };

    state.logs.unshift({
      id: `ocpp-start-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chargeBoxId: station.stationId,
      direction: 'INCOMING',
      action: 'StartTransaction',
      messageTypeId: 2,
      uniqueId: `stx-${transactionId}`,
      payload: {
        connectorId: connector.connectorId,
        connectorLabel: state.activeSession.connectorLabel,
        idTag,
        meterStart: meterStartWh,
        transactionId,
      },
    });

    saveState(state);
    return res.status(200).json({
      success: true,
      message: `Connector ${state.activeSession.connectorLabel} (${connector.type}) unlocked via OCPP 1.6J RemoteStartTransaction.`,
      session: state.activeSession,
      wallet,
    });
  }

  // 5. POST /api/ocpp/remote-stop
  if (urlPath.endsWith('/remote-stop') && req.method === 'POST') {
    if (!state.activeSession) {
      return res.status(400).json({ error: 'No active session to stop' });
    }
    const completed = { ...state.activeSession };
    const driverPhone = req.body?.phoneNumber || completed.driverPhone || '+233248901204';
    const conn = station.connectors.find((c: any) => c.connectorId === completed.connectorId);
    if (conn) {
      conn.status = 'Available';
      conn.errorCode = 'NoError';
      conn.currentPowerKw = 0;
    }

    const wallet = getOrUpdateUserWallet(driverPhone, (u) => {
      const actualCost = Number(completed.accruedCost || 0.23);
      const holdAmt = Number(completed.preauthHoldAmount || 25);
      const refund = Math.max(0, Number((holdAmt - actualCost).toFixed(2)));
      u.heldBalance = Math.max(0, Number((Number(u.heldBalance || 0) - holdAmt).toFixed(2)));
      u.walletBalance = Number((Number(u.walletBalance || 145.5) + refund).toFixed(2));
      u.transactions = u.transactions || [];
      u.transactions.unshift({
        id: `tx-settle-${Date.now()}`,
        timestamp: new Date().toISOString(),
        amount: actualCost,
        type: 'CHARGE_SETTLEMENT',
        status: 'SUCCESS',
        provider: 'MOMO',
        reference: `SES-GH-${Math.floor(100000 + Math.random() * 900000)}`,
        description: `OCPP 1.6J Settlement: ${Number(completed.kwhDelivered || 0.05).toFixed(2)} kWh @ ${station.name}`,
      });
    });

    state.logs.unshift({
      id: `ocpp-stop-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chargeBoxId: station.stationId,
      direction: 'INCOMING',
      action: 'StopTransaction',
      messageTypeId: 2,
      uniqueId: `stoptx-${completed.transactionId || 98421}`,
      payload: {
        transactionId: completed.transactionId || 98421,
        meterStop: completed.meterStopWh || 143000,
        reason: req.body?.reason || 'Remote',
      },
    });

    state.activeSession = null;
    saveState(state);
    return res.status(200).json({
      success: true,
      message: 'Session terminated via OCPP 1.6J StopTransaction. Connector unlatched and escrow settled.',
      completedSession: completed,
      wallet,
    });
  }

  // 6. POST /api/ocpp/reserve
  if (urlPath.endsWith('/reserve') && req.method === 'POST') {
    const { connectorId = 1, idTag = 'VID-GH-8842-A', durationMinutes = 30 } = req.body || {};
    const conn =
      station.connectors.find((c: any) => c.connectorId === Number(connectorId)) ||
      station.connectors[0];
    const reservationId = ++state.nextReservationId;
    const expiryDate = new Date(Date.now() + Number(durationMinutes) * 60 * 1000).toISOString();

    conn.status = 'Reserved';
    conn.reservedByIdTag = idTag;
    conn.reservationId = reservationId;
    conn.reservationExpiryDate = expiryDate;

    const record = {
      reservationId,
      stationId: station.stationId,
      chargeBoxId: station.stationId,
      connectorId: conn.connectorId,
      connectorLabel: conn.label || (conn.connectorId === 1 ? 'Outlet A' : 'Outlet B'),
      idTag,
      expiryDate,
      status: 'Active',
    };
    state.reservations.unshift(record);
    state.logs.unshift({
      id: `res-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chargeBoxId: station.stationId,
      direction: 'OUTGOING',
      action: 'ReserveNow',
      messageTypeId: 2,
      uniqueId: `res-${reservationId}`,
      payload: record,
    });
    saveState(state);
    return res.status(200).json({
      success: true,
      status: 'Accepted',
      reservationId,
      expiryDate,
      reservations: state.reservations,
      station,
    });
  }

  // 7. POST /api/ocpp/cancel-reservation
  if (urlPath.endsWith('/cancel-reservation') && req.method === 'POST') {
    const { reservationId } = req.body || {};
    const resItem = state.reservations.find((r: any) => r.reservationId === Number(reservationId));
    if (resItem) {
      resItem.status = 'Cancelled';
      const conn = station.connectors.find((c: any) => c.connectorId === resItem.connectorId);
      if (conn && conn.status === 'Reserved') {
        conn.status = 'Available';
        conn.reservedByIdTag = undefined;
        conn.reservationId = undefined;
        conn.reservationExpiryDate = undefined;
      }
    }
    saveState(state);
    return res.status(200).json({
      success: true,
      status: 'Accepted',
      reservations: state.reservations,
      station,
    });
  }

  // 8. POST /api/ocpp/unlock
  if (urlPath.endsWith('/unlock') && req.method === 'POST') {
    const { connectorId = 1 } = req.body || {};
    const conn = station.connectors.find((c: any) => c.connectorId === Number(connectorId));
    if (conn) {
      conn.status = 'Available';
      conn.errorCode = 'NoError';
      conn.currentPowerKw = 0;
    }
    if (state.activeSession && state.activeSession.connectorId === Number(connectorId)) {
      state.activeSession = null;
    }
    state.logs.unshift({
      id: `unl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chargeBoxId: station.stationId,
      direction: 'OUTGOING',
      action: 'UnlockConnector',
      messageTypeId: 2,
      uniqueId: `unl-${Date.now()}`,
      payload: { connectorId: Number(connectorId), status: 'Unlocked' },
    });
    saveState(state);
    return res.status(200).json({
      success: true,
      status: 'Unlocked',
      station,
      activeSession: state.activeSession,
    });
  }

  // 9. POST /api/ocpp/frame or /api/ocpp/command or /api/ocpp/inject-event
  if (
    (urlPath.endsWith('/frame') || urlPath.endsWith('/command') || urlPath.endsWith('/inject-event')) &&
    req.method === 'POST'
  ) {
    const { action = 'Heartbeat', payload = {}, direction = 'INCOMING' } = req.body || {};
    const uniqueId = `msg-${Date.now()}`;

    if (action === 'StatusNotification' && payload.connectorId) {
      const conn = station.connectors.find((c: any) => c.connectorId === Number(payload.connectorId));
      if (conn && payload.status) {
        conn.status = payload.status;
        conn.errorCode = payload.errorCode || 'NoError';
      }
    } else if (action === 'ChangeAvailability') {
      const avail = payload.type === 'Inoperative' ? 'Unavailable' : 'Available';
      if (Number(payload.connectorId) === 0) {
        station.isOnline = avail === 'Available';
        station.connectors.forEach((c: any) => (c.status = avail));
      } else {
        const conn = station.connectors.find((c: any) => c.connectorId === Number(payload.connectorId));
        if (conn) conn.status = avail;
      }
    } else if (action === 'Reset') {
      station.isOnline = true;
      station.connectors.forEach((c: any) => {
        c.status = 'Available';
        c.errorCode = 'NoError';
      });
      state.activeSession = null;
    }

    const logMsg = {
      id: `ocpp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chargeBoxId: 'CL-KSI-001',
      direction: urlPath.endsWith('/command') ? 'OUTGOING' : direction,
      action,
      messageTypeId: 2,
      uniqueId,
      payload,
    };
    state.logs.unshift(logMsg);
    saveState(state);

    const responsePayload =
      action === 'BootNotification'
        ? { status: 'Accepted', currentTime: new Date().toISOString(), interval: 60 }
        : action === 'Heartbeat'
        ? { currentTime: new Date().toISOString() }
        : { status: 'Accepted' };

    return res.status(200).json({
      success: true,
      uniqueId,
      chargeBoxId: 'CL-KSI-001',
      action,
      requestPayload: payload,
      responsePayload,
      responseFrame: [3, uniqueId, responsePayload],
      station,
      activeSession: state.activeSession,
    });
  }

  return res.status(200).json({ status: 'ok', protocol: 'OCPP 1.6 Edition 2' });
}
