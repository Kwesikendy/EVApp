import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BatteryCharging,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  Cpu,
  CreditCard,
  Gauge,
  KeyRound,
  Layers,
  LocateFixed,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Navigation,
  Phone,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SlidersHorizontal,
  Square,
  Sun,
  Terminal,
  Trash2,
  Unlock,
  User,
  Wallet,
  Wifi,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { MastercardLogo, MtnMomoLogo, TelecelLogo } from './PaymentLogos';
import { NavigationView } from './NavigationView';

type View = 'home' | 'discover' | 'charging' | 'wallet' | 'operator';
type AuthStep = 'entry' | 'otp';
type AccountType = 'personal' | 'fleet' | 'operator';
type MomoChannel = 'MTN' | 'TELECEL' | 'CARD';
type ThemeMode = 'night' | 'mint' | 'light';

interface Connector {
  id?: number;
  connectorId: number;
  label?: string;
  type: 'CCS2' | 'GB/T' | 'Type2' | 'CHAdeMO';
  maxPowerKw: number;
  currentPowerKw?: number;
  status: string;
  errorCode?: string;
  tariffPerKwh: number;
  reservedByIdTag?: string;
  reservationId?: number;
  reservationExpiryDate?: string;
}

interface Station {
  id: string;
  stationId: string;
  pileNumber?: string;
  name: string;
  operator?: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  isOnline: boolean;
  ocppVersion?: string;
  vendor?: string;
  model?: string;
  firmwareVersion?: string;
  serialNumber?: string;
  networkMode?: string;
  rating?: number;
  amenities: string[];
  connectors: Connector[];
}

interface WalletTx {
  id: string;
  timestamp: string;
  amount: number;
  type: 'TOPUP' | 'CHARGE_SETTLEMENT' | 'PREAUTH_HOLD' | 'REFUND';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  provider: 'MOMO' | 'CARD';
  reference: string;
  description: string;
}

interface WalletState {
  availableBalance: number;
  heldBalance: number;
  phoneNumber: string;
  transactions: WalletTx[];
}

interface ActiveSession {
  sessionId: string;
  transactionId?: number;
  stationId: string;
  stationName?: string;
  connectorId: number;
  connectorLabel?: string;
  connectorType?: string;
  idTag?: string;
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
  elapsedSeconds: number;
  remainingMinutes?: number;
  preauthHoldAmount: number;
  status: string;
}

interface RegisteredVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  connectorType: 'CCS2' | 'Type2' | 'CHAdeMO' | 'GB/T';
  batteryCapacityKwh: number;
  licensePlate: string;
  vin?: string;
}

interface DriverSession {
  phoneNumber: string;
  displayName: string;
  accountType: AccountType;
  vehiclePlate: string;
  email?: string;
  avatarUrl?: string;
  ghanaCardId?: string;
  targetChargeLimit?: number;
  smsReceiptsEnabled?: boolean;
  defaultPaymentMethod?: 'MTN_MOMO' | 'TELECEL_CASH' | 'MASTERCARD';
  registeredVehicles?: RegisteredVehicle[];
}

const SESSION_KEY = 'wilpower_web_session_v1';
const THEME_KEY = 'wilpower_theme_v1';
const LOGO_REVERSE = '/willpower/WillPower_Logo_Reverse_V3.svg';
const HERO_PHOTO = '/willpower/Photo_Concept_Only.jpg';
const COMMISSIONING_IMAGE = '/ocpp-commissioning-guide.jpeg';

const defaultStation: Station = {
  id: 'st-01',
  stationId: 'CL-KSI-001',
  pileNumber: '19046744073709551615',
  name: 'Greenwood Event Center',
  operator: 'Wilpower Charge Network',
  address: 'Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi',
  latitude: 6.6697479,
  longitude: -1.5995679,
  distanceKm: 1.4,
  isOnline: true,
  ocppVersion: '1.6J',
  vendor: 'MaxPower',
  model: 'VCP160 Dual-Gun DC Fast Charger (160kW)',
  firmwareVersion: 'MP-VCP160-OCPP16J-v2.4.8',
  serialNumber: 'MP160-GH-KSI-2026001',
  networkMode: '2.Ethernet (4G/LAN)',
  rating: 5.0,
  amenities: ['Event Center', 'Parking Bay', 'Security', '24/7 Operation', 'Opoku Bandoh Plaza', 'OCPP 1.6J Live'],
  connectors: [
    {
      id: 101,
      connectorId: 1,
      label: 'Outlet A',
      type: 'GB/T',
      maxPowerKw: 160,
      currentPowerKw: 0,
      status: 'Available',
      errorCode: 'NoError',
      tariffPerKwh: 4.5,
    },
    {
      id: 102,
      connectorId: 2,
      label: 'Outlet B',
      type: 'CCS2',
      maxPowerKw: 160,
      currentPowerKw: 0,
      status: 'Available',
      errorCode: 'NoError',
      tariffPerKwh: 4.5,
    },
  ],
};

const defaultWallet: WalletState = {
  availableBalance: 145.5,
  heldBalance: 0,
  phoneNumber: '+233248901204',
  transactions: [
    {
      id: 'tx-welcome-01',
      timestamp: new Date(Date.now() - 86_400_000).toISOString(),
      amount: 100,
      type: 'TOPUP',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: 'WP-MOMO-894120',
      description: 'MTN MoMo wallet top-up',
    },
    {
      id: 'tx-charge-02',
      timestamp: new Date(Date.now() - 42_000_000).toISOString(),
      amount: 31.5,
      type: 'CHARGE_SETTLEMENT',
      status: 'SUCCESS',
      provider: 'MOMO',
      reference: 'WP-CHG-503912',
      description: '7.0 kWh session settlement',
    },
  ],
};

function formatGhs(amount: number): string {
  return `GH₵ ${Number(amount || 0).toFixed(2)}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor((seconds || 0) / 60);
  const secs = Math.floor((seconds || 0) % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+233')) return digits;
  if (digits.startsWith('233')) return `+${digits}`;
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return digits || '+233248901204';
}

function formatLocalPhone(phone: string): string {
  const normalized = normalizePhone(phone).replace('+233', '0');
  return normalized.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
}

function loadSavedDriver(): DriverSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as DriverSession) : null;
  } catch {
    return null;
  }
}

function loadSavedTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'night' || raw === 'mint' || raw === 'light') return raw;
  } catch {
    // Storage can be blocked in private contexts.
  }
  return 'night';
}

export interface WillPowerAppProps {
  user?: any;
  onSignOut?: () => void;
  onUpdateUser?: (updated: any) => void;
}

function normalizeDriverSession(raw: any): DriverSession {
  if (!raw) {
    return {
      phoneNumber: '+233248901204',
      displayName: 'Kofi Mensah',
      accountType: 'personal',
      vehiclePlate: 'GT-8842-26',
    };
  }
  const plate =
    raw.vehiclePlate ||
    raw.licensePlate ||
    raw.plate ||
    raw.registeredVehicles?.[0]?.licensePlate ||
    raw.registeredVehicles?.[0]?.plate ||
    'GT-8842-26';
  const name = raw.displayName || raw.name || 'Kofi Mensah';
  const accountType = (raw.accountType || 'personal') as AccountType;
  return {
    ...raw,
    phoneNumber: raw.phoneNumber || '+233248901204',
    displayName: name,
    accountType: accountType,
    vehiclePlate: plate,
  };
}

export function WillPowerApp({ user, onSignOut, onUpdateUser }: WillPowerAppProps = {}) {
  const [driver, setDriver] = useState<DriverSession>(() => normalizeDriverSession(user || loadSavedDriver()));

  useEffect(() => {
    if (user) {
      setDriver(normalizeDriverSession(user));
    }
  }, [user]);
  const [theme, setTheme] = useState<ThemeMode>(() => loadSavedTheme());
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [view, setView] = useState<View>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stations, setStations] = useState<Station[]>([defaultStation]);
  const [selectedStationId, setSelectedStationId] = useState<string>(defaultStation.id);
  const [selectedConnectorId, setSelectedConnectorId] = useState<number>(1);
  const [search, setSearch] = useState('');
  const [connectorFilter, setConnectorFilter] = useState<'ALL' | 'CCS2' | 'GB/T'>('ALL');
  const [wallet, setWallet] = useState<WalletState>(defaultWallet);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [ocppLogs, setOcppLogs] = useState<any[]>([]);
  const [ocppStatus, setOcppStatus] = useState<any>(null);
  const [hmiTab, setHmiTab] = useState<'outletA' | 'outletB' | 'setup'>('outletA');
  const [configEditKey, setConfigEditKey] = useState<string>('HeartbeatInterval');
  const [configEditValue, setConfigEditValue] = useState<string>('60');
  const [backendOnline, setBackendOnline] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [navigationStation, setNavigationStation] = useState<Station | null>(null);

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authStep, setAuthStep] = useState<AuthStep>('entry');
  const [phoneInput, setPhoneInput] = useState('024 890 1204');
  const [nameInput, setNameInput] = useState('Kofi Mensah');
  const [plateInput, setPlateInput] = useState('GT-8842-26');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [otpInput, setOtpInput] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('50');
  const [topupChannel, setTopupChannel] = useState<MomoChannel>('MTN');
  const [topupPhone, setTopupPhone] = useState('024 890 1204');
  const [topupPin, setTopupPin] = useState('1234');
  const [topupReference, setTopupReference] = useState<string | null>(null);
  const [topupPrompt, setTopupPrompt] = useState<string | null>(null);
  const [topupBusy, setTopupBusy] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileCardId, setProfileCardId] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(undefined);
  const [profileTargetLimit, setProfileTargetLimit] = useState(85);
  const [profileSmsReceipts, setProfileSmsReceipts] = useState(true);
  const [profilePaymentMethod, setProfilePaymentMethod] = useState<'MTN_MOMO' | 'TELECEL_CASH' | 'MASTERCARD'>('MTN_MOMO');
  const [profileVehicles, setProfileVehicles] = useState<RegisteredVehicle[]>([]);
  const [newVehicleMake, setNewVehicleMake] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleConnector, setNewVehicleConnector] = useState<'CCS2' | 'GB/T' | 'Type2' | 'CHAdeMO'>('CCS2');
  const [newVehicleBattery, setNewVehicleBattery] = useState('75');

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId || station.stationId === selectedStationId) || stations[0] || defaultStation,
    [stations, selectedStationId]
  );

  const selectedConnector = useMemo(
    () =>
      selectedStation?.connectors?.find((c) => c.connectorId === selectedConnectorId) ||
      selectedStation?.connectors?.[0] ||
      defaultStation.connectors[0],
    [selectedStation, selectedConnectorId]
  );

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const matchesText =
        !search.trim() ||
        station.name.toLowerCase().includes(search.toLowerCase()) ||
        station.address.toLowerCase().includes(search.toLowerCase()) ||
        station.stationId.toLowerCase().includes(search.toLowerCase());
      const matchesConnector =
        connectorFilter === 'ALL' ||
        station.connectors.some((connector) => connector.type === connectorFilter);
      return matchesText && matchesConnector;
    });
  }, [stations, search, connectorFilter]);

  function notify(message: string) {
    setToast(message);
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-wp-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage failures.
    }
  }, [theme]);

  async function refreshPlatform(phoneNumber = driver?.phoneNumber || '+233248901204') {
    try {
      const [stationRes, walletRes, sessionRes, ocppRes, ocppStatusRes] = await Promise.all([
        fetch('/api/stations'),
        fetch(`/api/wallet?phoneNumber=${encodeURIComponent(phoneNumber)}`),
        fetch('/api/session/active'),
        fetch('/api/ocpp/logs'),
        fetch('/api/ocpp/status'),
      ]);

      if (stationRes.ok) {
        const nextStations = await stationRes.json();
        if (Array.isArray(nextStations) && nextStations.length > 0) {
          setStations(nextStations);
        }
      }
      if (walletRes.ok) {
        const nextWallet = await walletRes.json();
        if (typeof nextWallet?.availableBalance === 'number') {
          setWallet(nextWallet);
        }
      }
      if (sessionRes.ok) {
        const nextSession = await sessionRes.json();
        setActiveSession(nextSession?.session || null);
      }
      if (ocppRes.ok) {
        const nextLogs = await ocppRes.json();
        if (Array.isArray(nextLogs)) setOcppLogs(nextLogs.slice(0, 15));
      }
      if (ocppStatusRes.ok) {
        const nextStatus = await ocppStatusRes.json();
        setOcppStatus(nextStatus);
        if (Array.isArray(nextStatus?.recentFrames) && nextStatus.recentFrames.length > 0) {
          setOcppLogs(nextStatus.recentFrames.slice(0, 15));
        }
      }
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }

  useEffect(() => {
    refreshPlatform();
    const interval = window.setInterval(() => refreshPlatform(), 3000);
    return () => window.clearInterval(interval);
  }, [driver?.phoneNumber]);

  useEffect(() => {
    if (!driver) return;
    hydrateDriverFromProfile(driver.phoneNumber);
  }, [driver?.phoneNumber]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const reference = url.searchParams.get('reference') || url.searchParams.get('trxref');
    if (!reference) return;

    let cancelled = false;
    setTopupBusy(true);
    setView('wallet');
    fetch(`/api/wallet/paystack-verify?reference=${encodeURIComponent(reference)}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok || !data?.success) {
          notify(data?.error || 'Paystack payment could not be verified yet.');
          return;
        }
        if (data.wallet) setWallet(data.wallet);
        notify(`Paystack confirmed ${formatGhs(Number(data.amount || 0))}. Ref ${data.reference}.`);
      })
      .catch(() => {
        if (!cancelled) notify('Could not reach the server to verify Paystack payment.');
      })
      .finally(() => {
        if (cancelled) return;
        setTopupBusy(false);
        url.searchParams.delete('reference');
        url.searchParams.delete('trxref');
        const nextQuery = url.searchParams.toString();
        window.history.replaceState({}, document.title, `${url.pathname === '/payments/paystack/callback' ? '/' : url.pathname}${nextQuery ? `?${nextQuery}` : ''}`);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function saveDriver(nextDriver: DriverSession) {
    setDriver(nextDriver);
    setTopupPhone(formatLocalPhone(nextDriver.phoneNumber));
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextDriver));
    } catch {
      // Storage may be unavailable in restricted contexts; in-memory state still works.
    }
  }

  function syncDraftFromDriver(source: DriverSession) {
    setProfileName(source.displayName || 'Wilpower Driver');
    setProfileEmail(source.email || '');
    setProfileCardId(source.ghanaCardId || '');
    setProfileAvatar(source.avatarUrl);
    setProfileTargetLimit(source.targetChargeLimit || 85);
    setProfileSmsReceipts(source.smsReceiptsEnabled !== false);
    setProfilePaymentMethod(source.defaultPaymentMethod || 'MTN_MOMO');
    setProfileVehicles(
      source.registeredVehicles && source.registeredVehicles.length > 0
        ? source.registeredVehicles
        : [
            {
              id: 'veh-default',
              make: 'BYD',
              model: 'Atto 3',
              year: 2025,
              connectorType: 'CCS2',
              batteryCapacityKwh: 60.5,
              licensePlate: source.vehiclePlate || 'GT-8842-26',
            },
          ]
    );
  }

  async function hydrateDriverFromProfile(phoneNumber: string) {
    try {
      const res = await fetch(`/api/user/profile?phoneNumber=${encodeURIComponent(phoneNumber)}`);
      if (!res.ok) return;
      const profile = await res.json();
      const firstVehicle = Array.isArray(profile.registeredVehicles) ? profile.registeredVehicles[0] : undefined;
      saveDriver({
        phoneNumber: profile.phoneNumber || phoneNumber,
        displayName: profile.displayName || nameInput.trim() || 'Wilpower Driver',
        accountType: profile.accountType === 'fleet' ? 'fleet' : accountType,
        vehiclePlate: firstVehicle?.licensePlate || plateInput.trim() || 'GT-8842-26',
        email: profile.email || '',
        avatarUrl: profile.avatarUrl,
        ghanaCardId: profile.ghanaCardId,
        targetChargeLimit: profile.targetChargeLimit || 85,
        smsReceiptsEnabled: profile.smsReceiptsEnabled !== false,
        defaultPaymentMethod: profile.defaultPaymentMethod || 'MTN_MOMO',
        registeredVehicles: profile.registeredVehicles || [],
      });
    } catch {
      // Local session remains usable if profile endpoint is temporarily unreachable.
    }
  }

  function openProfileModal() {
    if (!driver) return;
    syncDraftFromDriver(driver);
    setProfileOpen(true);
    setMobileMenuOpen(false);
  }

  function handleAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Select a PNG, JPG, or WebP image for your profile photo.');
      return;
    }
    if (file.size > 320_000) {
      notify('Choose an image smaller than 320 KB so your profile loads fast.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setProfileAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function addDraftVehicle() {
    if (!newVehicleMake.trim() || !newVehicleModel.trim() || !newVehiclePlate.trim()) {
      notify('Enter vehicle make, model, and Ghana registration plate.');
      return;
    }
    const nextVehicle: RegisteredVehicle = {
      id: `veh-${Date.now()}`,
      make: newVehicleMake.trim(),
      model: newVehicleModel.trim(),
      year: 2026,
      connectorType: newVehicleConnector,
      batteryCapacityKwh: Math.max(20, Math.min(250, Number(newVehicleBattery) || 75)),
      licensePlate: newVehiclePlate.trim().toUpperCase(),
    };
    setProfileVehicles((current) => [...current, nextVehicle]);
    setNewVehicleMake('');
    setNewVehicleModel('');
    setNewVehiclePlate('');
  }

  function removeDraftVehicle(id: string) {
    setProfileVehicles((current) => current.filter((vehicle) => vehicle.id !== id));
  }

  async function saveProfileChanges(e: React.FormEvent) {
    e.preventDefault();
    if (!driver) return;
    setProfileBusy(true);
    const cleanedVehicles = profileVehicles.length > 0 ? profileVehicles : [
      {
        id: 'veh-default',
        make: 'BYD',
        model: 'Atto 3',
        year: 2025,
        connectorType: 'CCS2' as const,
        batteryCapacityKwh: 60.5,
        licensePlate: driver.vehiclePlate || 'GT-8842-26',
      },
    ];
    const nextDriver: DriverSession = {
      ...driver,
      displayName: profileName.trim() || driver.displayName,
      email: profileEmail.trim(),
      avatarUrl: profileAvatar,
      ghanaCardId: profileCardId.trim(),
      targetChargeLimit: profileTargetLimit,
      smsReceiptsEnabled: profileSmsReceipts,
      defaultPaymentMethod: profilePaymentMethod,
      registeredVehicles: cleanedVehicles,
      vehiclePlate: cleanedVehicles[0]?.licensePlate || driver.vehiclePlate,
    };

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: driver.phoneNumber,
          displayName: nextDriver.displayName,
          email: nextDriver.email,
          avatarUrl: nextDriver.avatarUrl || '',
          ghanaCardId: nextDriver.ghanaCardId,
          targetChargeLimit: nextDriver.targetChargeLimit,
          smsReceiptsEnabled: nextDriver.smsReceiptsEnabled,
          defaultPaymentMethod: nextDriver.defaultPaymentMethod,
          registeredVehicles: nextDriver.registeredVehicles,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notify(data.error || 'Profile saved on this device; server sync will retry.');
      } else {
        notify('Driver profile and vehicle preferences updated.');
      }
    } catch {
      notify('Profile saved on this device; server sync will retry.');
    } finally {
      saveDriver(nextDriver);
      setProfileBusy(false);
      setProfileOpen(false);
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    const normalized = normalizePhone(phoneInput);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: normalized }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDemoOtp(data.devCode || '123456');
        setOtpInput(data.devCode || '123456');
        setAuthStep('otp');
        notify(data.message || 'Gateway notice. Use code 123456 to continue.');
        return;
      }
      setDemoOtp(data.devCode || data.demoCode || '123456');
      if (data.devCode || data.demoCode) setOtpInput(String(data.devCode || data.demoCode));
      setAuthStep('otp');
      notify(`Verification code ready for ${formatLocalPhone(normalized)}`);
    } catch {
      setDemoOtp('428190');
      setOtpInput('428190');
      setAuthStep('otp');
      notify('Gateway offline fallback active. Use code 428190.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    const normalized = normalizePhone(phoneInput);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: normalized,
          code: otpInput.trim(),
          metadata: {
            displayName: nameInput.trim() || 'Wilpower Driver',
            accountType: accountType === 'fleet' ? 'fleet' : 'personal',
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (otpInput.trim() === demoOtp || otpInput.trim() === '123456' || otpInput.trim() === '428190') {
          saveDriver({
            phoneNumber: normalized,
            displayName: nameInput.trim() || 'Wilpower Driver',
            accountType,
            vehiclePlate: plateInput.trim() || 'GT-8842-26',
          });
          return;
        }
        setAuthError(data.error || 'Invalid verification code.');
        return;
      }

      saveDriver({
        phoneNumber: normalized,
        displayName: data.user?.displayName || nameInput.trim() || 'Wilpower Driver',
        accountType,
        vehiclePlate: plateInput.trim() || 'GT-8842-26',
        email: data.user?.email || '',
        avatarUrl: data.user?.avatarUrl,
        ghanaCardId: data.user?.ghanaCardId,
        targetChargeLimit: data.user?.targetChargeLimit || 85,
        smsReceiptsEnabled: data.user?.smsReceiptsEnabled !== false,
        defaultPaymentMethod: data.user?.defaultPaymentMethod || 'MTN_MOMO',
        registeredVehicles: data.user?.registeredVehicles || [],
      });
      await refreshPlatform(normalized);
      notify('Wilpower driver cockpit unlocked.');
    } catch {
      saveDriver({
        phoneNumber: normalized,
        displayName: nameInput.trim() || 'Wilpower Driver',
        accountType,
        vehiclePlate: plateInput.trim() || 'GT-8842-26',
      });
    } finally {
      setAuthLoading(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem(SESSION_KEY);
    setDriver(null);
    setAuthStep('entry');
    setOtpInput('');
    setView('home');
  }

  async function startCharging(station: Station, connectorIdOverride?: number) {
    const targetConnId = connectorIdOverride || selectedConnectorId || 1;
    const connector =
      station.connectors.find((item) => item.connectorId === targetConnId) ||
      station.connectors.find((item) => item.status === 'Available' || item.status === 'Reserved') ||
      station.connectors[0];

    if (!station.isOnline || !connector || (connector.status !== 'Available' && connector.status !== 'Reserved')) {
      notify(`${station.name} (${connector?.label || `Outlet ${targetConnId}`}) is currently ${connector?.status || 'Offline'}.`);
      return;
    }

    try {
      const res = await fetch('/api/ocpp/remote-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: station.stationId,
          connectorId: connector.connectorId,
          phoneNumber: driver?.phoneNumber || wallet.phoneNumber,
          preauthHoldAmount: 25,
          isFleet: driver?.accountType === 'fleet',
          idTag: driver?.vehiclePlate || 'VID-GH-8842-A',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.message || data.error || 'Unable to start charging session.');
        if (res.status === 402) setTopupOpen(true);
        return;
      }
      setActiveSession(data.session);
      if (data.wallet) setWallet(data.wallet);
      setView('charging');
      refreshPlatform();
      notify(`Charging started on ${connector.label || `Outlet ${connector.connectorId}`} (${connector.type}).`);
    } catch {
      notify('Could not reach OCPP 1.6J CSMS.');
    }
  }

  async function stopCharging() {
    try {
      const res = await fetch('/api/ocpp/remote-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: driver?.phoneNumber || wallet.phoneNumber,
          reason: 'Remote',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'No active session to stop.');
        return;
      }
      setActiveSession(null);
      if (data.wallet) setWallet(data.wallet);
      refreshPlatform();
      notify('Session settled via OCPP 1.6J StopTransaction. Unused escrow returned.');
    } catch {
      notify('Unable to stop session right now.');
    }
  }

  async function reserveOutlet(station: Station, connectorId: number) {
    try {
      const res = await fetch('/api/ocpp/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: station.stationId,
          connectorId,
          idTag: driver?.vehiclePlate || 'VID-GH-8842-A',
          durationMinutes: 30,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(`Reservation response: ${data.status || data.error || 'Rejected'}`);
        return;
      }
      await refreshPlatform();
      notify(`Reserved Outlet ${connectorId === 1 ? 'A (GB/T)' : 'B (CCS2)'} for 30 minutes (Reservation #${data.reservationId}).`);
    } catch {
      notify('Could not dispatch OCPP 1.6J ReserveNow command.');
    }
  }

  async function cancelOutletReservation(station: Station, reservationId?: number) {
    if (!reservationId) return;
    try {
      const res = await fetch('/api/ocpp/cancel-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: station.stationId,
          reservationId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshPlatform();
        notify(`Reservation #${reservationId} cancelled. Outlet returned to Available.`);
      }
    } catch {
      notify('Could not cancel reservation.');
    }
  }

  async function unlockOutletConnector(stationId: string, connectorId: number) {
    try {
      const res = await fetch('/api/ocpp/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId, connectorId }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshPlatform();
        notify(`OCPP 1.6J UnlockConnector.conf: ${data.status || 'Unlocked'} (Outlet ${connectorId === 1 ? 'A' : 'B'}).`);
      }
    } catch {
      notify('Could not send UnlockConnector command.');
    }
  }

  async function sendHmiFrame(action: string, payload: Record<string, any>) {
    try {
      const res = await fetch('/api/ocpp/frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chargeBoxId: 'CL-KSI-001',
          action,
          payload,
        }),
      });
      const data = await res.json();
      await refreshPlatform();
      if (res.ok) {
        notify(`MaxPower VCP160 -> CSMS [2, "${action}"] acknowledged.`);
      } else {
        notify(data.error || 'Frame rejected.');
      }
    } catch {
      notify('Could not dispatch OCPP 1.6J frame.');
    }
  }

  async function sendCsmsCommand(action: string, payload: Record<string, any>) {
    try {
      const res = await fetch('/api/ocpp/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chargeBoxId: 'CL-KSI-001',
          action,
          payload,
        }),
      });
      const data = await res.json();
      await refreshPlatform();
      if (res.ok) {
        notify(`CSMS -> VCP160 [${action}]: ${data?.responsePayload?.status || 'Accepted'}`);
      } else {
        notify(data.error || 'Command failed.');
      }
    } catch {
      notify('Could not dispatch Central System command.');
    }
  }

  async function saveOcppConfigKey(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/ocpp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chargeBoxId: 'CL-KSI-001',
          key: configEditKey,
          value: configEditValue,
        }),
      });
      const data = await res.json();
      await refreshPlatform();
      notify(`ChangeConfiguration(${configEditKey} = ${configEditValue}) -> ${data.status || 'Accepted'}`);
    } catch {
      notify('Could not update OCPP 1.6 configuration key.');
    }
  }

  async function initiateTopup(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify('Enter a valid Ghana Cedi top-up amount.');
      return;
    }
    setTopupBusy(true);
    const phone = normalizePhone(topupPhone || driver?.phoneNumber || wallet.phoneNumber);

    try {
      if (topupChannel === 'CARD') {
        const paystackRes = await fetch('/api/wallet/paystack-initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            phone,
            email: driver?.email,
            displayName: driver?.displayName,
          }),
        });
        const paystackData = await paystackRes.json();
        if (paystackRes.ok && paystackData.authorizationUrl) {
          notify('Redirecting to Paystack secure Ghana Cedi checkout...');
          window.location.assign(paystackData.authorizationUrl);
          return;
        }
        notify(paystackData.error || 'Could not initialize Paystack checkout.');
        return;
      }

      const res = await fetch('/api/wallet/momo-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, provider: topupChannel, phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.error || 'Unable to initiate Mobile Money prompt.');
        return;
      }
      setTopupReference(data.transactionId);
      setTopupPrompt(data.ussdPrompt);
    } catch {
      setTopupReference(`WP-SIM-${Date.now()}`);
      setTopupPrompt(`Approve ${formatGhs(amount)} to CHARGELINK GH LTD with your 4-digit MoMo PIN.`);
    } finally {
      setTopupBusy(false);
    }
  }

  async function confirmTopup() {
    const amount = parseFloat(topupAmount);
    const phone = normalizePhone(topupPhone || driver?.phoneNumber || wallet.phoneNumber);
    setTopupBusy(true);

    try {
      const res = await fetch('/api/wallet/momo-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: topupReference,
          amount,
          provider: topupChannel,
          phone,
          pin: topupPin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        notify(data.error || 'Payment confirmation failed.');
        return;
      }
      if (data.wallet) setWallet(data.wallet);
      setTopupOpen(false);
      setTopupReference(null);
      setTopupPrompt(null);
      notify(`${formatGhs(amount)} credited to your Wilpower wallet.`);
    } catch {
      setWallet((current) => ({
        ...current,
        availableBalance: Number((current.availableBalance + amount).toFixed(2)),
      }));
      setTopupOpen(false);
      setTopupReference(null);
      setTopupPrompt(null);
      notify(`${formatGhs(amount)} credited in local mode.`);
    } finally {
      setTopupBusy(false);
    }
  }

  function openStationDirections(station: Station) {
    setNavigationStation(station);
    notify(`Calculating live route to ${station.name}.`);
  }

  if (!driver) {
    return (
      <div className="wp-auth">
        <aside className="wp-auth-aside">
          <div className="wp-auth-brand">
            <img src={LOGO_REVERSE} alt="Wilpower" />
          </div>
          <div className="wp-auth-aside-copy">
            <span className="wp-kicker">GHANA ELECTRIC MOBILITY NETWORK</span>
            <h1>Clean power for every corridor.</h1>
            <p>
              Locate high-output DC chargers, authorize Ghana Cedi Mobile Money escrow, and track live OCPP 1.6J energy delivery from one calm driver cockpit.
            </p>
          </div>
          <div className="wp-auth-aside-foot">
            <span className="wp-status-dot" />
            <span>Kumasi Greenwood Hub · MaxPower VCP160 160 kW · OCPP 1.6J Online</span>
          </div>
        </aside>

        <main className="wp-auth-panel">
          {authStep === 'entry' ? (
            <form className="wp-auth-form" onSubmit={handleRequestOtp}>
              <div className="wp-auth-mobile-brand">
                <img src={LOGO_REVERSE} alt="Wilpower" />
              </div>

              <div className="wp-auth-heading">
                <span className="wp-kicker">DRIVER ACCESS</span>
                <h2>{authMode === 'signin' ? 'Sign in to Wilpower' : 'Create your driver pass'}</h2>
                <p>Use your Ghana mobile number to receive a six-digit Moolre SMS verification code.</p>
              </div>

              <div className="wp-auth-switch" role="tablist" aria-label="Authentication mode">
                <button
                  type="button"
                  className={authMode === 'signin' ? 'is-active' : ''}
                  onClick={() => setAuthMode('signin')}
                >
                  Existing Driver
                </button>
                <button
                  type="button"
                  className={authMode === 'register' ? 'is-active' : ''}
                  onClick={() => setAuthMode('register')}
                >
                  New Enrollment
                </button>
              </div>

              {authMode === 'register' && (
                <>
                  <label className="wp-field">
                    <span>Full Name</span>
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Kofi Mensah"
                      required
                    />
                  </label>

                  <div className="wp-field">
                    <span>Account Profile</span>
                    <div className="wp-choice-grid">
                      {[
                        { id: 'personal', label: 'Personal EV', desc: 'MoMo & card wallet', icon: User },
                        { id: 'fleet', label: 'Fleet Pass', desc: 'Corporate VIN billing', icon: Building2 },
                        { id: 'operator', label: 'Site Host', desc: 'OCPP 1.6J telemetry', icon: Gauge },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            className={`wp-choice ${accountType === item.id ? 'is-selected' : ''}`}
                            onClick={() => setAccountType(item.id as AccountType)}
                          >
                            <Icon size={16} />
                            <strong>{item.label}</strong>
                            <small>{item.desc}</small>
                            {accountType === item.id && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="wp-field">
                    <span>Primary Vehicle Plate</span>
                    <input
                      value={plateInput}
                      onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                      placeholder="GT-8842-26"
                    />
                  </label>
                </>
              )}

              <label className="wp-field">
                <span>Ghana Mobile Number</span>
                <div className="wp-input-wrap">
                  <span className="wp-country">GH <small>+233</small></span>
                  <Phone size={16} />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="024 890 1204"
                    required
                  />
                </div>
              </label>

              {authError && <div className="wp-alert wp-alert-error">{authError}</div>}

              <button className="wp-primary-button" type="submit" disabled={authLoading}>
                <span>{authLoading ? 'Dispatching SMS...' : 'Send Verification Code'}</span>
                <ChevronRight size={17} />
              </button>

              <div className="wp-auth-demo">
                <span>Presenting to a client?</span>
                <button
                  type="button"
                  onClick={() => {
                    saveDriver({
                      phoneNumber: '+233248901204',
                      displayName: 'Kofi Mensah',
                      accountType: 'personal',
                      vehiclePlate: 'GT-8842-26',
                    });
                    notify('Entered client demonstration mode.');
                  }}
                >
                  Enter instant demo session
                </button>
              </div>
            </form>
          ) : (
            <form className="wp-auth-form wp-otp-form" onSubmit={handleVerifyOtp}>
              <button type="button" className="wp-back-button" onClick={() => setAuthStep('entry')}>
                <ChevronLeft size={16} />
                <span>Change number</span>
              </button>

              <div className="wp-otp-icon">
                <KeyRound size={22} />
              </div>

              <div className="wp-auth-heading">
                <span className="wp-kicker">SMS VERIFICATION</span>
                <h2>Enter 6-digit code</h2>
                <p>Sent via Moolre SMS Gateway to <strong>{normalizePhone(phoneInput)}</strong></p>
              </div>

              {demoOtp && (
                <div className="wp-demo-code">
                  <span>Sandbox OTP: <strong>{demoOtp}</strong></span>
                  <button type="button" onClick={() => setOtpInput(demoOtp)}>Auto-fill</button>
                </div>
              )}

              <label className="wp-field">
                <span>Verification Code</span>
                <input
                  className="wp-otp-input"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>

              {authError && <div className="wp-alert wp-alert-error">{authError}</div>}

              <button className="wp-primary-button" type="submit" disabled={authLoading || otpInput.length < 4}>
                <span>{authLoading ? 'Verifying...' : 'Unlock Wilpower'}</span>
                <ArrowUpRight size={17} />
              </button>
            </form>
          )}
        </main>
      </div>
    );
  }

  const navItems: Array<{ id: View; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'home', label: 'Overview', icon: Sparkles },
    { id: 'discover', label: 'Find Charger', icon: Compass },
    { id: 'charging', label: 'Charging', icon: BatteryCharging },
    { id: 'wallet', label: 'MoMo Wallet', icon: Wallet },
    { id: 'operator', label: 'OCPP 1.6J Hub', icon: Cpu },
  ];

  const themeOptions: Array<{ id: ThemeMode; label: string; detail: string; icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'night', label: 'Night Drive', detail: 'Deep forest editorial', icon: Moon },
    { id: 'mint', label: 'Mint Daylight', detail: 'Soft sage showroom', icon: Sparkles },
    { id: 'light', label: 'Paper Light', detail: 'Bright client review', icon: Sun },
  ];
  const currentTheme = themeOptions.find((option) => option.id === theme) || themeOptions[0];
  const CurrentThemeIcon = currentTheme.icon;

  const hmiConnector = selectedStation?.connectors?.find((c) => c.connectorId === (hmiTab === 'outletB' ? 2 : 1)) || selectedStation?.connectors?.[0] || defaultStation.connectors[0];
  const isHmiOutletCharging = Boolean(activeSession && activeSession.connectorId === hmiConnector?.connectorId);
  const wsPrimaryUrl =
    ocppStatus?.websocketEndpoints?.primary ||
    `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ocpp/1.6/CL-KSI-001`;

  return (
    <div className="wp-app">
      <aside className={`wp-sidebar ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="wp-sidebar-top">
          <div className="wp-sidebar-brand">
            <img src={LOGO_REVERSE} alt="Wilpower" />
          </div>
          <button type="button" className="wp-mobile-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <span className="wp-side-label">DRIVER COCKPIT</span>
        <nav className="wp-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={view === item.id ? 'is-active' : ''}
                onClick={() => {
                  setView(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.id === 'charging' && activeSession && <em className="wp-nav-dot" />}
              </button>
            );
          })}
        </nav>

        <div className="wp-sidebar-bottom">
          <div className="wp-side-message">
            <span className="wp-kicker">GREENWOOD HUB LIVE</span>
            <p>MaxPower VCP160 160 kW DC Fast Charger commissioned on OCPP 1.6J at Kumasi.</p>
          </div>

          <div className="wp-user-card">
            <button type="button" className="wp-user-card-main" onClick={openProfileModal} title="Edit driver profile">
              {driver.avatarUrl ? (
                <img className="wp-avatar wp-avatar-image" src={driver.avatarUrl} alt={driver.displayName || 'Driver'} />
              ) : (
                <div className="wp-avatar">{((driver.displayName || 'DR').slice(0, 2)).toUpperCase()}</div>
              )}
              <span>
                <strong>{driver.displayName || 'Driver'}</strong>
                <small>{formatLocalPhone(driver.phoneNumber || '+233248901204')} · {driver.vehiclePlate || 'GT-8842-26'}</small>
              </span>
            </button>
            <button type="button" onClick={openProfileModal} title="Driver settings">
              <SlidersHorizontal size={16} />
            </button>
            <button type="button" onClick={handleSignOut} title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="wp-content">
        <header className="wp-topbar">
          <button type="button" className="wp-mobile-menu" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={19} />
          </button>

          <div className="wp-breadcrumb">
            <span>Wilpower</span>
            <i>/</i>
            <strong>{navItems.find((item) => item.id === view)?.label}</strong>
          </div>

          <div className="wp-topbar-actions">
            <div className="wp-location">
              <span className="wp-topbar-pulse" />
              <MapPin size={13} />
              <span>Kumasi · Greenwood Event Center</span>
            </div>
            <div className="wp-status-badge">
              {backendOnline ? 'OCPP 1.6J ONLINE' : 'LOCAL MODE'}
            </div>
            <div className="wp-theme-control">
              <button
                type="button"
                className="wp-theme-trigger"
                onClick={() => setThemeMenuOpen((open) => !open)}
                aria-expanded={themeMenuOpen}
                aria-label="Change visual theme"
              >
                <CurrentThemeIcon size={15} />
                <span>{currentTheme.label}</span>
                <ChevronDown size={14} />
              </button>
              {themeMenuOpen && (
                <div className="wp-theme-menu" role="menu" aria-label="Theme options">
                  {themeOptions.map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <button
                        type="button"
                        key={option.id}
                        role="menuitem"
                        className={theme === option.id ? 'is-active' : ''}
                        onClick={() => {
                          setTheme(option.id);
                          setThemeMenuOpen(false);
                        }}
                      >
                        <OptionIcon size={15} />
                        <span>
                          <strong>{option.label}</strong>
                          <small>{option.detail}</small>
                        </span>
                        {theme === option.id && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button type="button" className="wp-icon-button" onClick={openProfileModal} title="Driver profile and vehicle settings">
              <User size={15} />
            </button>
            <button type="button" className="wp-icon-button" onClick={() => refreshPlatform()} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
        </header>

        <main className="wp-main">
          {view === 'home' && (
            <section className="wp-page">
              <div className="wp-page-header">
                <div>
                  <span className="wp-kicker">WILPOWER DRIVER COCKPIT</span>
                  <h1>Good day, {(driver.displayName || 'Driver').split(' ')[0]}.</h1>
                  <p>Everything needed to locate a charger, fund your Ghana Cedi wallet, and monitor your EV session on OCPP 1.6 Edition 2.</p>
                </div>
                <div className="wp-page-header-side">
                  <button type="button" className="wp-outline-button" onClick={() => setTopupOpen(true)}>
                    <Plus size={15} />
                    <span>Top up wallet</span>
                  </button>
                </div>
              </div>

              <div className="wp-hero">
                <div className="wp-hero-copy">
                  <div className="wp-hero-signal">
                    <span className="wp-status-dot" />
                    <span>{(selectedStation?.name || 'Greenwood Event Center').toUpperCase()}</span>
                    <span>{selectedStation?.isOnline ? 'ONLINE · OCPP 1.6J' : 'OFFLINE'}</span>
                  </div>
                  <h2>160 kW DC fast charging, built for Ghana.</h2>
                  <p>
                    {selectedStation?.address || 'Greenwood Event Center, Kumasi'}. Dual-gun MaxPower VCP160 hardware commissioned with Outlet A (GB/T) and Outlet B (CCS2) at {formatGhs(4.5)}/kWh.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="wp-primary-button"
                      onClick={() => startCharging(selectedStation, 1)}
                    >
                      <Zap size={16} />
                      <span>Charge on Outlet A (GB/T)</span>
                      <ArrowUpRight size={17} />
                    </button>
                    <button
                      type="button"
                      className="wp-outline-button"
                      onClick={() => startCharging(selectedStation, 2)}
                    >
                      <Zap size={16} />
                      <span>Charge on Outlet B (CCS2)</span>
                    </button>
                  </div>

                  <div className="wp-hero-stats">
                    <div>
                      <strong>160 kW</strong>
                      <span>Shared DC Output</span>
                    </div>
                    <div>
                      <strong>{formatGhs(4.5)}</strong>
                      <span>Energy Tariff / kWh</span>
                    </div>
                    <div>
                      <strong>Outlet A + B</strong>
                      <span>GB/T & CCS2 Ready</span>
                    </div>
                  </div>
                </div>

                <div className="wp-hero-image">
                  <div className="wp-hero-image-grid" />
                  <img src={HERO_PHOTO} alt="Wilpower charging concept" />
                  <b>PILE ID · {selectedStation?.stationId || 'CL-KSI-001'}</b>
                  <span>WILPOWER · KUMASI CORRIDOR</span>
                </div>
              </div>

              <div className="wp-home-intro">
                <h2>Essential Actions</h2>
                <span>Three clear steps for every charging stop</span>
              </div>

              <div className="wp-essential-grid">
                <button type="button" className="wp-essential-card" onClick={() => setView('discover')}>
                  <span>
                    <span>01 · Locate</span>
                    <Compass size={18} />
                  </span>
                  <strong>{selectedStation?.name || 'Greenwood Station'}</strong>
                  <small>Outlet A ({selectedStation?.connectors?.[0]?.status || 'Available'}) · Outlet B ({selectedStation?.connectors?.[1]?.status || 'Available'})</small>
                </button>

                <button type="button" className="wp-essential-card" onClick={() => setTopupOpen(true)}>
                  <span>
                    <span>02 · Fund Wallet</span>
                    <Wallet size={18} />
                  </span>
                  <strong><em>{formatGhs(wallet?.availableBalance ?? 0)}</em></strong>
                  <small>
                    {(wallet?.heldBalance ?? 0) > 0
                      ? `${formatGhs(wallet.heldBalance)} held in active session escrow`
                      : 'MTN MoMo, Telecel Cash, and Mastercard ready'}
                  </small>
                </button>

                <button
                  type="button"
                  className={`wp-essential-card ${activeSession ? 'is-live' : ''}`}
                  onClick={() => setView('charging')}
                >
                  <span>
                    <span>03 · Session</span>
                    <BatteryCharging size={18} />
                  </span>
                  <strong>
                    {activeSession
                      ? `${Math.round(activeSession.currentSocPercent || 0)}% SoC · ${(activeSession.currentPowerKw || 0).toFixed(0)} kW`
                      : 'Ready for plug-in'}
                  </strong>
                  <small>
                    {activeSession
                      ? `${activeSession.connectorLabel || 'Outlet A'} · ${(activeSession.kwhDelivered || 0).toFixed(2)} kWh · ${formatGhs(activeSession.accruedCost || 0)}`
                      : `${formatGhs(25)} escrow pre-authorization before unlock`}
                  </small>
                </button>
              </div>

              <div className="wp-home-lower">
                <div className="wp-balance-card">
                  <div className="wp-balance-top">
                    <div>
                      <span className="wp-kicker">GHANA CEDI WALLET</span>
                      <h3>{formatGhs(wallet?.availableBalance ?? 0)}</h3>
                    </div>
                    <CreditCard size={20} />
                  </div>
                  <p>
                    Pre-authorized deposits are held safely during charging and reconciled immediately when the connector locks back into the pedestal.
                  </p>
                  <button type="button" onClick={() => setView('wallet')}>
                    <span>Open wallet ledger</span>
                    <ChevronRight size={15} />
                  </button>
                </div>

                <div className="wp-next-card">
                  <div className="wp-card-heading">
                    <div>
                      <span className="wp-kicker">REGISTERED VEHICLE</span>
                      <h3>{driver?.vehiclePlate || 'GT-8842-26'}</h3>
                    </div>
                    <ShieldCheck size={20} />
                  </div>
                  <div className="wp-vehicle-meta">
                    <span>Account</span>
                    <strong>{(driver?.accountType || 'personal').toUpperCase()}</strong>
                  </div>
                  <div className="wp-vehicle-meta">
                    <span>Idle grace policy</span>
                    <strong>5 min free · {formatGhs(0.5)}/min cap {formatGhs(10)}</strong>
                  </div>
                  <div className="wp-vehicle-line">
                    <span className="wp-status-dot wp-status-dot-green" />
                    <span>OCPP 1.6 Edition 2 JSON-over-WebSocket active ({selectedStation?.stationId || 'CL-KSI-001'})</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === 'discover' && (
            <section className="wp-page">
              <div className="wp-page-header">
                <div>
                  <span className="wp-kicker">CHARGING NETWORK</span>
                  <h1>Find a Wilpower hub.</h1>
                  <p>Select Outlet A (GB/T) or Outlet B (CCS2), reserve a connector ahead of arrival, or start an OCPP 1.6J session immediately.</p>
                </div>
              </div>

              <div className="wp-discover-grid">
                <div className="wp-station-panel">
                  <div className="wp-search">
                    <Search size={16} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search Kumasi, Asokwa, station ID..."
                    />
                  </div>

                  <div className="wp-filter-row">
                    {(['ALL', 'GB/T', 'CCS2'] as const).map((type) => (
                      <button
                        type="button"
                        key={type}
                        className={connectorFilter === type ? 'is-active' : ''}
                        onClick={() => setConnectorFilter(type)}
                      >
                        {type === 'ALL' ? 'All Connectors' : type}
                      </button>
                    ))}
                  </div>

                  <div className="wp-panel-divider" />

                  <div className="wp-list-heading">
                    <strong>Stations ({filteredStations.length})</strong>
                    <span>Tariff in GH₵</span>
                  </div>

                  <div className="wp-station-list">
                    {filteredStations.map((station) => (
                      <button
                        type="button"
                        key={station.id}
                        className={`wp-station-item ${selectedStation.id === station.id ? 'is-selected' : ''}`}
                        onClick={() => setSelectedStationId(station.id)}
                      >
                        <div className="wp-station-item-top">
                          <strong>{station.name}</strong>
                          <span className={`wp-status-chip ${station.isOnline ? 'is-good' : ''}`}>
                            {station.isOnline ? 'Online · 1.6J' : 'Offline'}
                          </span>
                        </div>
                        <span className="wp-station-address">{station.address}</span>
                        <span className="wp-station-connectors">
                          {station.connectors
                            .map(
                              (c) =>
                                `${c.label || `Gun ${c.connectorId}`}: ${c.type} ${c.maxPowerKw}kW (${c.status})`
                            )
                            .join(' · ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="wp-map-panel">
                  <div className="wp-map-grid">
                    <span className="wp-map-label wp-map-label-one">ASOKWA BYPASS</span>
                    <span className="wp-map-label wp-map-label-two">KUMASI METROPOLIS</span>
                    {filteredStations.map((station, index) => (
                      <button
                        type="button"
                        key={station.id}
                        className={`wp-map-pin ${selectedStation.id === station.id ? 'is-selected' : ''}`}
                        style={{ top: `${44 + index * 12}%`, left: `${52 + index * 10}%` }}
                        onClick={() => setSelectedStationId(station.id)}
                      >
                        <Zap size={17} />
                      </button>
                    ))}
                  </div>

                  <div className="wp-map-sheet">
                    <span className="wp-kicker">
                      {selectedStation?.stationId || 'CL-KSI-001'} · PILE ID {selectedStation?.pileNumber || '19046744073709551615'}
                    </span>
                    <h3>{selectedStation?.name || 'Greenwood Event Center'}</h3>
                    <p>{selectedStation?.address || 'Greenwood Event Center, Kumasi'}</p>

                    <div className="wp-connector-selector">
                      {(selectedStation?.connectors || []).map((c) => {
                        const active = (selectedConnector?.connectorId ?? 1) === c.connectorId;
                        const label = c.label || (c.connectorId === 1 ? 'Outlet A' : 'Outlet B');
                        return (
                          <button
                            type="button"
                            key={c.connectorId}
                            className={`wp-connector-option ${active ? 'is-active' : ''}`}
                            onClick={() => setSelectedConnectorId(c.connectorId)}
                          >
                            <strong>{label} · {c.type}</strong>
                            <span>{c.maxPowerKw} kW DC · {formatGhs(c.tariffPerKwh)}/kWh</span>
                            <small>{c.status}</small>
                          </button>
                        );
                      })}
                    </div>

                    <div className="wp-map-sheet-meta">
                      <span>{selectedStation?.distanceKm || 1.4} km away</span>
                      <span>MaxPower VCP160</span>
                      <span>OCPP {selectedStation?.ocppVersion || '1.6J'}</span>
                    </div>

                    <div className="wp-map-actions">
                      <button
                        type="button"
                        className="wp-outline-button"
                        onClick={() => openStationDirections(selectedStation)}
                      >
                        <Navigation size={15} />
                        <span>Navigate</span>
                      </button>
                      {selectedConnector?.status === 'Reserved' ? (
                        <button
                          type="button"
                          className="wp-outline-button"
                          onClick={() => cancelOutletReservation(selectedStation, selectedConnector.reservationId)}
                        >
                          <X size={15} />
                          <span>Release Hold</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="wp-outline-button"
                          onClick={() => reserveOutlet(selectedStation, selectedConnector.connectorId)}
                        >
                          <Clock size={15} />
                          <span>Reserve 30m</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="wp-primary-button"
                        onClick={() => startCharging(selectedStation, selectedConnector?.connectorId || 1)}
                      >
                        <Zap size={15} />
                        <span>Start {selectedConnector?.label || `Outlet ${selectedConnector?.connectorId || 1}`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === 'charging' && (
            <section className="wp-page">
              <div className="wp-page-header">
                <div>
                  <span className="wp-kicker">LIVE OCPP 1.6 EDITION 2 TELEMETRY</span>
                  <h1>{activeSession ? 'Charging in progress.' : 'No active session.'}</h1>
                  <p>
                    {activeSession
                      ? `Streaming real-time MaxPower VCP160 MeterValues from ${activeSession.stationId} (${activeSession.connectorLabel || `Outlet ${activeSession.connectorId}`}).`
                      : 'Select Outlet A (GB/T) or Outlet B (CCS2) on Greenwood Event Center to initiate a 160 kW DC fast charge.'}
                  </p>
                </div>
              </div>

              {activeSession ? (
                <div className="wp-charging-grid">
                  <div className="wp-charge-card">
                    <div className="wp-charge-card-top">
                      <div>
                        <span className="wp-kicker">
                          {activeSession.stationId} · {activeSession.connectorLabel || `OUTLET ${activeSession.connectorId}`} ({activeSession.connectorType || 'GB/T'})
                        </span>
                        <h2>{selectedStation.name}</h2>
                      </div>
                      <span className="wp-live-badge">
                        <span className="wp-status-dot" />
                        TX #{activeSession.transactionId || 98421}
                      </span>
                    </div>

                    <div
                      className="wp-charge-ring"
                      style={{
                        background: `conic-gradient(var(--wp-lime) ${Math.min(100, activeSession.currentSocPercent)}%, rgba(255,255,255,0.08) 0)`,
                      }}
                    >
                      <div>
                        <strong>{Math.round(activeSession.currentSocPercent)}%</strong>
                        <span>Target {activeSession.targetSocPercent}% SoC</span>
                      </div>
                    </div>

                    <div className="wp-charge-stats">
                      <div>
                        <strong>{activeSession.currentPowerKw.toFixed(1)} kW</strong>
                        <span>Active Power</span>
                      </div>
                      <div>
                        <strong>{activeSession.kwhDelivered.toFixed(2)} kWh</strong>
                        <span>Charge Capacity</span>
                      </div>
                      <div>
                        <strong>{formatGhs(activeSession.accruedCost)}</strong>
                        <span>Consumption</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <button type="button" className="wp-danger-button" onClick={stopCharging}>
                        <Square size={15} />
                        <span>Stop & Settle</span>
                      </button>
                      <button
                        type="button"
                        className="wp-outline-button"
                        onClick={() => unlockOutletConnector(activeSession.stationId, activeSession.connectorId)}
                      >
                        <Unlock size={15} />
                        <span>Unlock Cable</span>
                      </button>
                    </div>
                  </div>

                  <div className="wp-detail-card">
                    <h2>MaxPower VCP160 HMI & Escrow Readout</h2>
                    <div className="wp-detail-row">
                      <span>Charging voltage</span>
                      <strong>{activeSession.voltageV.toFixed(1)} V</strong>
                    </div>
                    <div className="wp-detail-row">
                      <span>Charging current</span>
                      <strong>{activeSession.currentA.toFixed(1)} A</strong>
                    </div>
                    <div className="wp-detail-row">
                      <span>Charge capacity (Energy.Active.Import)</span>
                      <strong>{activeSession.kwhDelivered.toFixed(2)} kWh ({activeSession.meterStopWh || 142550} Wh)</strong>
                    </div>
                    <div className="wp-detail-row">
                      <span>Charging time / Remaining time</span>
                      <strong>{formatDuration(activeSession.elapsedSeconds)} / {activeSession.remainingMinutes ?? 22} min</strong>
                    </div>
                    <div className="wp-detail-row">
                      <span>Amount of consumption</span>
                      <strong>{formatGhs(activeSession.accruedCost)}</strong>
                    </div>
                    <div className="wp-detail-row">
                      <span>Card / Wallet balance</span>
                      <strong>{formatGhs(activeSession.cardBalanceGhs ?? wallet.availableBalance)}</strong>
                    </div>
                    <div className="wp-detail-row">
                      <span>Current electricity price</span>
                      <strong>{formatGhs(activeSession.tariffPerKwh || 4.5)} / kWh</strong>
                    </div>
                    <div className="wp-detail-row">
                      <span>Pre-authorization escrow hold</span>
                      <strong>{formatGhs(activeSession.preauthHoldAmount)}</strong>
                    </div>
                    <div className="wp-detail-row">
                      <span>Estimated wallet refund</span>
                      <strong>{formatGhs(Math.max(0, activeSession.preauthHoldAmount - activeSession.accruedCost))}</strong>
                    </div>
                    <div className="wp-detail-row">
                      <span>Pile / Stake ID & Temperature</span>
                      <strong>{selectedStation?.pileNumber || '19046744073709551615'} · {(activeSession?.temperatureC || 34.8).toFixed(1)} °C</strong>
                    </div>
                    <div className="wp-notice">
                      <ShieldCheck size={17} />
                      <span>
                        OCPP 1.6J MeterValues.req sampled every 3 seconds. Unused escrow returns automatically to your Wilpower wallet upon StopTransaction.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="wp-empty-session">
                  <div className="wp-empty-icon">
                    <BatteryCharging size={26} />
                  </div>
                  <h2>Ready when the cable is connected</h2>
                  <p>
                    Greenwood Event Center ({selectedStation?.stationId || 'CL-KSI-001'}) is ONLINE on OCPP 1.6J. Choose Outlet A (GB/T 160 kW) or Outlet B (CCS2 160 kW) to begin charging immediately.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="wp-primary-button"
                      onClick={() => startCharging(selectedStation, 1)}
                    >
                      <Zap size={16} />
                      <span>Start Outlet A (GB/T 160 kW)</span>
                    </button>
                    <button
                      type="button"
                      className="wp-outline-button"
                      onClick={() => startCharging(selectedStation, 2)}
                    >
                      <Zap size={16} />
                      <span>Start Outlet B (CCS2 160 kW)</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {view === 'wallet' && (
            <section className="wp-page">
              <div className="wp-page-header">
                <div>
                  <span className="wp-kicker">GHANA MOBILE MONEY ESCROW</span>
                  <h1>Wallet & settlements.</h1>
                  <p>Instant Ghana Cedi top-ups with MTN MoMo, Telecel Cash, and Mastercard.</p>
                </div>
                <div className="wp-page-header-side">
                  <button type="button" className="wp-primary-button" onClick={() => setTopupOpen(true)}>
                    <Plus size={16} />
                    <span>Add funds</span>
                  </button>
                </div>
              </div>

              <div className="wp-wallet-grid">
                <div className="wp-credit-card">
                  <div className="wp-credit-heading">
                    <div>
                      <span className="wp-kicker">AVAILABLE BALANCE</span>
                      <h2>{formatGhs(wallet.availableBalance)}</h2>
                    </div>
                    <Wallet size={22} />
                  </div>

                  <div className="wp-payment-logos">
                    <MtnMomoLogo className="h-6" />
                    <TelecelLogo className="h-6" />
                    <MastercardLogo className="h-6" />
                  </div>

                  <div className="wp-credit-footer">
                    <span>Escrow hold: {formatGhs(wallet.heldBalance)}</span>
                    <span>{formatLocalPhone(driver.phoneNumber)}</span>
                  </div>
                </div>

                <div className="wp-ledger">
                  {wallet.transactions.length === 0 ? (
                    <div className="wp-empty">
                      <p>No wallet transactions recorded yet.</p>
                    </div>
                  ) : (
                    wallet.transactions.slice(0, 8).map((tx) => {
                      const isCredit = tx.type === 'TOPUP' || tx.type === 'REFUND';
                      return (
                        <div className="wp-ledger-row" key={tx.id}>
                          <div className={`wp-ledger-icon ${isCredit ? 'is-credit' : ''}`}>
                            <ArrowUpRight size={15} />
                          </div>
                          <div className="wp-ledger-copy">
                            <strong>{tx.description}</strong>
                            <span>{tx.reference} · {new Date(tx.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className={`wp-ledger-amount ${isCredit ? 'is-credit' : ''}`}>
                            {isCredit ? '+' : '-'}{formatGhs(tx.amount)}
                            <small>{tx.status}</small>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          )}

          {view === 'operator' && (
            <section className="wp-page">
              <div className="wp-page-header">
                <div>
                  <span className="wp-kicker">OCPP 1.6 EDITION 2 · HARDWARE INGRESS & COMMISSIONING</span>
                  <h1>MaxPower VCP160 CSMS Hub.</h1>
                  <p>
                    Complete OCPP 1.6J Central System console, interactive Virtual VCP160 Charger HMI, and the 5-step physical commissioning workflow for Greenwood Event Center.
                  </p>
                </div>
                <div className="wp-page-header-side">
                  <button
                    type="button"
                    className="wp-outline-button"
                    onClick={() => sendHmiFrame('Heartbeat', { chargeBoxId: 'CL-KSI-001', pileNumber: '19046744073709551615' })}
                  >
                    <Radio size={15} />
                    <span>Emit Heartbeat.req</span>
                  </button>
                  <button
                    type="button"
                    className="wp-primary-button"
                    onClick={() =>
                      sendHmiFrame('BootNotification', {
                        chargePointVendor: 'MaxPower',
                        chargePointModel: 'VCP160',
                        chargePointSerialNumber: 'MP160-GH-KSI-2026001',
                        firmwareVersion: 'MP-VCP160-OCPP16J-v2.4.8',
                        meterType: 'DC-DIN-4Q-160KW',
                      })
                    }
                  >
                    <Zap size={15} />
                    <span>Send BootNotification</span>
                  </button>
                </div>
              </div>

              <div className="wp-metric-grid">
                <div className="wp-metric">
                  <div>
                    <span>CHARGE POINT STATUS</span>
                    <Activity size={16} />
                  </div>
                  <strong>{selectedStation?.isOnline ? 'ONLINE' : 'OFFLINE'}</strong>
                  <small>{selectedStation?.stationId || 'CL-KSI-001'} · Pile ID {selectedStation?.pileNumber || '19046744073709551615'}</small>
                </div>
                <div className="wp-metric">
                  <div>
                    <span>OCPP 1.6 EDITION 2</span>
                    <Cpu size={16} />
                  </div>
                  <strong>160 kW</strong>
                  <small>Outlet A (GB/T) & Outlet B (CCS2) · Dynamic Load Split</small>
                </div>
                <div className="wp-metric">
                  <div>
                    <span>PUBLISHED TARIFF</span>
                    <Zap size={16} />
                  </div>
                  <strong>{formatGhs(selectedStation?.connectors?.[0]?.tariffPerKwh || 4.5)}</strong>
                  <small>Per kWh · 5 min grace then {formatGhs(0.5)}/min</small>
                </div>
              </div>

              {/* VIRTUAL MAXPOWER VCP160 HMI + CSMS REMOTE COMMAND CONSOLE */}
              <div className="wp-hmi-shell">
                <div className="wp-hmi-screen">
                  <div className="wp-card-heading">
                    <div>
                      <span className="wp-kicker">VIRTUAL MAXPOWER VCP160 TOUCHSCREEN HMI</span>
                      <h3>{hmiTab === 'setup' ? 'System Administrator · OCPP Setup (Step 5)' : `${hmiConnector.label || 'Outlet A'} (${hmiConnector.type} · 160 kW)`}</h3>
                    </div>
                    <span className={`wp-status-chip ${hmiConnector.status === 'Faulted' ? '' : 'is-good'}`}>
                      {hmiConnector.status} {hmiConnector.errorCode && hmiConnector.errorCode !== 'NoError' ? `· ${hmiConnector.errorCode}` : ''}
                    </span>
                  </div>

                  <div className="wp-hmi-tabs">
                    <button
                      type="button"
                      className={hmiTab === 'outletA' ? 'is-active' : ''}
                      onClick={() => setHmiTab('outletA')}
                    >
                      Outlet A (GB/T 160 kW)
                    </button>
                    <button
                      type="button"
                      className={hmiTab === 'outletB' ? 'is-active' : ''}
                      onClick={() => setHmiTab('outletB')}
                    >
                      Outlet B (CCS2 160 kW)
                    </button>
                    <button
                      type="button"
                      className={hmiTab === 'setup' ? 'is-active' : ''}
                      onClick={() => setHmiTab('setup')}
                    >
                      OCPP Setup Screen
                    </button>
                  </div>

                  {hmiTab !== 'setup' ? (
                    <>
                      <div className="wp-hmi-readout-grid">
                        <div className="wp-hmi-cell">
                          <span>Charging voltage</span>
                          <strong>{isHmiOutletCharging ? `${activeSession.voltageV.toFixed(1)} V` : '0.0 V'}</strong>
                        </div>
                        <div className="wp-hmi-cell">
                          <span>Charging current</span>
                          <strong>{isHmiOutletCharging ? `${activeSession.currentA.toFixed(1)} A` : '0.0 A'}</strong>
                        </div>
                        <div className="wp-hmi-cell">
                          <span>Charge capacity</span>
                          <strong>{isHmiOutletCharging ? `${activeSession.kwhDelivered.toFixed(2)} kWh` : '0.00 kWh'}</strong>
                        </div>
                        <div className="wp-hmi-cell">
                          <span>Charging time</span>
                          <strong>{isHmiOutletCharging ? `${Math.max(1, Math.floor(activeSession.elapsedSeconds / 60))} min` : '0 min'}</strong>
                        </div>
                        <div className="wp-hmi-cell">
                          <span>Remaining time</span>
                          <strong>{isHmiOutletCharging ? `${activeSession.remainingMinutes ?? 22} min` : '0 min'}</strong>
                        </div>
                        <div className="wp-hmi-cell">
                          <span>Amount of consumption</span>
                          <strong>{isHmiOutletCharging ? formatGhs(activeSession.accruedCost) : 'GH₵ 0.00'}</strong>
                        </div>
                        <div className="wp-hmi-cell">
                          <span>Card balance</span>
                          <strong>{formatGhs(wallet.availableBalance)}</strong>
                        </div>
                        <div className="wp-hmi-cell">
                          <span>Electricity price</span>
                          <strong>{formatGhs(hmiConnector.tariffPerKwh)} /kWh</strong>
                        </div>
                        <div className="wp-hmi-cell">
                          <span>Pile / Stake ID</span>
                          <strong style={{ fontSize: 11 }}>19046744073709551615</strong>
                        </div>
                      </div>

                      <span className="wp-kicker" style={{ marginTop: 10 }}>
                        EMIT CHARGE POINT -&gt; CSMS OCPP 1.6J FRAMES (SECTION 4)
                      </span>
                      <div className="wp-hmi-actions">
                        <button
                          type="button"
                          onClick={() =>
                            sendHmiFrame('Authorize', { idTag: driver.vehiclePlate || 'VID-GH-8842-A' })
                          }
                        >
                          Authorize.req
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            sendHmiFrame('StatusNotification', {
                              connectorId: hmiConnector.connectorId,
                              status: 'Preparing',
                              errorCode: 'NoError',
                              info: `${hmiConnector.label} EV cable plugged in`,
                            })
                          }
                        >
                          Status: Preparing
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            startCharging(selectedStation, hmiConnector.connectorId)
                          }
                        >
                          StartTransaction.req
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            sendHmiFrame('MeterValues', {
                              connectorId: hmiConnector.connectorId,
                              transactionId: activeSession?.transactionId || 98421,
                              meterValue: [
                                {
                                  timestamp: new Date().toISOString(),
                                  sampledValue: [
                                    { value: String((activeSession?.kwhDelivered || 1.25) + 0.45), measurand: 'Energy.Active.Import.Register', unit: 'kWh' },
                                    { value: '142.5', measurand: 'Power.Active.Import', unit: 'kW' },
                                    { value: '402.1', measurand: 'Voltage', unit: 'V' },
                                    { value: '354.4', measurand: 'Current.Import', unit: 'A' },
                                  ],
                                },
                              ],
                            })
                          }
                        >
                          MeterValues.req
                        </button>
                        <button type="button" onClick={stopCharging}>
                          StopTransaction.req
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            sendHmiFrame('StatusNotification', {
                              connectorId: hmiConnector.connectorId,
                              status: hmiConnector.status === 'Faulted' ? 'Available' : 'Faulted',
                              errorCode: hmiConnector.status === 'Faulted' ? 'NoError' : 'OtherError',
                              info: hmiConnector.status === 'Faulted' ? 'EPO cleared' : '[B] EPO Fault triggered on HMI',
                            })
                          }
                        >
                          {hmiConnector.status === 'Faulted' ? 'Clear EPO Fault' : 'Simulate EPO Fault'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginTop: 10 }}>
                      <div className="wp-detail-row">
                        <span>OCPP connection (Enabled/disabled)</span>
                        <strong style={{ color: 'var(--wp-lime)' }}>Enable</strong>
                      </div>
                      <div className="wp-detail-row">
                        <span>URL setting (CSMS WebSocket)</span>
                        <strong>{wsPrimaryUrl}</strong>
                      </div>
                      <div className="wp-detail-row">
                        <span>Port</span>
                        <strong>5173 (or 443 wss)</strong>
                      </div>
                      <div className="wp-detail-row">
                        <span>Pile number (Stake number)</span>
                        <strong>CL-KSI-001 / 19046744073709551615</strong>
                      </div>
                      <div className="wp-detail-row">
                        <span>Administrator password</span>
                        <strong>1</strong>
                      </div>
                      <div className="wp-detail-row">
                        <span>Login status</span>
                        <strong style={{ color: 'var(--wp-lime)' }}>ONLINE (Accepted)</strong>
                      </div>
                      <div className="wp-detail-row">
                        <span>Network mode (4G SIM or LAN cable)</span>
                        <strong>2.Ethernet (4G/LAN)</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                        <button
                          type="button"
                          className="wp-outline-button"
                          onClick={() => {
                            navigator.clipboard?.writeText(wsPrimaryUrl);
                            notify(`Copied OCPP 1.6J URL: ${wsPrimaryUrl}`);
                          }}
                        >
                          <Copy size={14} />
                          <span>Copy OCPP URL</span>
                        </button>
                        <button
                          type="button"
                          className="wp-primary-button"
                          onClick={() => {
                            navigator.clipboard?.writeText('CL-KSI-001');
                            notify('Copied Stake / Pile Number: CL-KSI-001');
                          }}
                        >
                          <Copy size={14} />
                          <span>Copy Pile Number</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CENTRAL SYSTEM (CSMS) INITIATED COMMANDS (SECTION 5) */}
                <div className="wp-detail-card">
                  <span className="wp-kicker">CENTRAL SYSTEM -&gt; CHARGE POINT (SECTION 5)</span>
                  <h2>CSMS Command & Smart Charging Console</h2>
                  <p style={{ fontSize: 12, color: 'var(--wp-muted)', marginTop: -10, marginBottom: 14 }}>
                    Dispatch OCPP 1.6 Edition 2 Central System commands directly to MaxPower VCP160 (CL-KSI-001).
                  </p>

                  <div className="wp-hmi-actions">
                    <button
                      type="button"
                      onClick={() =>
                        sendCsmsCommand('ChangeAvailability', { connectorId: 1, type: 'Operative' })
                      }
                    >
                      Outlet A: Operative
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendCsmsCommand('ChangeAvailability', { connectorId: 2, type: 'Operative' })
                      }
                    >
                      Outlet B: Operative
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendCsmsCommand('UnlockConnector', { connectorId: hmiConnector.connectorId })
                      }
                    >
                      UnlockConnector ({hmiConnector.label})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendCsmsCommand('TriggerMessage', {
                          requestedMessage: 'StatusNotification',
                          connectorId: hmiConnector.connectorId,
                        })
                      }
                    >
                      Trigger StatusNotification
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendCsmsCommand('TriggerMessage', {
                          requestedMessage: 'MeterValues',
                          connectorId: hmiConnector.connectorId,
                        })
                      }
                    >
                      Trigger MeterValues
                    </button>
                    <button
                      type="button"
                      onClick={() => sendCsmsCommand('ClearCache', {})}
                    >
                      ClearCache.req
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendCsmsCommand('SetChargingProfile', {
                          connectorId: 0,
                          limitWatts: 80000,
                        })
                      }
                    >
                      SmartCharge: Split 80kW/80kW
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        sendCsmsCommand('SetChargingProfile', {
                          connectorId: 0,
                          limitWatts: 160000,
                        })
                      }
                    >
                      SmartCharge: Full 160kW
                    </button>
                    <button
                      type="button"
                      onClick={() => sendCsmsCommand('Reset', { type: 'Soft' })}
                    >
                      Reset (Soft)
                    </button>
                    <button
                      type="button"
                      onClick={() => sendCsmsCommand('Reset', { type: 'Hard' })}
                    >
                      Reset (Hard)
                    </button>
                  </div>

                  <form onSubmit={saveOcppConfigKey} style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--wp-line)' }}>
                    <span className="wp-kicker">SECTION 9 · CHANGE CONFIGURATION KEY</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr auto', gap: 8, marginTop: 10 }}>
                      <select
                        value={configEditKey}
                        onChange={(e) => {
                          const nextKey = e.target.value;
                          setConfigEditKey(nextKey);
                          const existing = ocppStatus?.configurationKeys?.find((k: any) => k.key === nextKey);
                          if (existing) setConfigEditValue(existing.value);
                        }}
                        style={{
                          minHeight: 42,
                          padding: '0 10px',
                          borderRadius: 10,
                          border: '1px solid var(--wp-line)',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--wp-white)',
                          fontSize: 11,
                        }}
                      >
                        {(ocppStatus?.configurationKeys || [
                          { key: 'HeartbeatInterval', value: '60', readonly: false },
                          { key: 'MeterValueSampleInterval', value: '5', readonly: false },
                          { key: 'ConnectionTimeOut', value: '60', readonly: false },
                          { key: 'MaxPower.PileNumber', value: 'CL-KSI-001', readonly: false },
                          { key: 'MaxPower.ElectricityPriceGhsPerKwh', value: '4.50', readonly: false },
                          { key: 'MaxPower.NetworkMode', value: '2.Ethernet (4G/LAN)', readonly: false },
                        ])
                          .filter((k: any) => !k.readonly)
                          .map((k: any) => (
                            <option key={k.key} value={k.key} style={{ background: '#0d1710', color: '#f8fbf4' }}>
                              {k.key}
                            </option>
                          ))}
                      </select>
                      <input
                        value={configEditValue}
                        onChange={(e) => setConfigEditValue(e.target.value)}
                        placeholder="Value"
                        style={{
                          minHeight: 42,
                          padding: '0 12px',
                          borderRadius: 10,
                          border: '1px solid var(--wp-line)',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--wp-white)',
                          fontSize: 12,
                        }}
                      />
                      <button type="submit" className="wp-primary-button" style={{ minHeight: 42, padding: '0 14px' }}>
                        Apply
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* 5-STEP MAXPOWER VCP160 PHYSICAL COMMISSIONING GUIDE */}
              <div className="wp-commissioning-card">
                <div className="wp-card-heading">
                  <div>
                    <span className="wp-kicker">MAXPOWER VCP160 · FIELD ENGINEER COMMISSIONING RUNBOOK</span>
                    <h3>5-Step Physical Charger HMI Setup Guide</h3>
                  </div>
                  <Wrench size={18} />
                </div>

                <div className="wp-commissioning-layout">
                  <div>
                    <img
                      src={COMMISSIONING_IMAGE}
                      alt="MaxPower VCP160 5-Step OCPP 1.6J Commissioning Guide"
                      className="wp-commissioning-image"
                    />
                  </div>
                  <div className="wp-step-list">
                    <div className="wp-step-item">
                      <span className="wp-step-badge">1</span>
                      <div>
                        <strong>Click Menu on Main HMI</strong>
                        <p>
                          On the charger touchscreen (displaying Outlet A & Outlet B voltage, current, kWh capacity, charging time, remaining time, consumption, card balance, price /kWh, and ID 19046744073709551615), tap the bottom-left <b>Menu</b> button.
                        </p>
                      </div>
                    </div>
                    <div className="wp-step-item">
                      <span className="wp-step-badge">2</span>
                      <div>
                        <strong>Click System administrator</strong>
                        <p>
                          From the 8-tile Menu screen (Charge record, Alarm record, Version information, Customer service hotline, Card inquiry, Auxiliary power, Module status, System administrator), tap <b>System administrator</b>.
                        </p>
                      </div>
                    </div>
                    <div className="wp-step-item">
                      <span className="wp-step-badge">3</span>
                      <div>
                        <strong>Enter password 1, and click OK</strong>
                        <p>
                          At the administrator password prompt, enter <b>1</b> and tap <b>OK</b> to unlock the engineering menu.
                        </p>
                      </div>
                    </div>
                    <div className="wp-step-item">
                      <span className="wp-step-badge">4</span>
                      <div>
                        <strong>Click OCPP setup</strong>
                        <p>
                          In the System administrator grid, tap the bottom-right <b>OCPP setup</b> icon.
                        </p>
                      </div>
                    </div>
                    <div className="wp-step-item">
                      <span className="wp-step-badge">5</span>
                      <div>
                        <strong>Set the OCPP URL and stake number on this page</strong>
                        <p>
                          Set <b>OCPP connection</b> to <b>Enable</b>, set <b>URL setting</b> to <code>{wsPrimaryUrl}</code>, <b>port</b> to <code>5173</code>, <b>pile number</b> to <code>CL-KSI-001</code> (or factory ID <code>19046744073709551615</code>), and <b>Network mode</b> to <b>Ethernet</b> (used for both 4G card and LAN cable). Confirm <b>Login status</b> reads <b>ONLINE</b>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE OCPP 1.6J JSON-RPC TELEMETRY STREAM */}
              <div className="wp-section-heading">
                <h2>Live OCPP 1.6J JSON-RPC Frame Stream</h2>
                <span>RFC 6455 WebSocket [MessageTypeId, UniqueId, Action, Payload]</span>
              </div>

              <div className="wp-frame-list">
                {ocppLogs.map((log) => (
                  <div className="wp-frame-item" key={log.id}>
                    <div className="wp-frame-head">
                      <strong style={{ color: log.direction === 'INCOMING' ? 'var(--wp-lime)' : '#79d1ff' }}>
                        {log.direction === 'INCOMING' ? 'CHARGE POINT -> CSMS' : 'CSMS -> CHARGE POINT'} · {log.action}
                      </strong>
                      <span style={{ color: 'var(--wp-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()} · {log.chargeBoxId || 'CL-KSI-001'}
                      </span>
                    </div>
                    <pre className="wp-frame-code">
                      {JSON.stringify(
                        [log.messageTypeId || 2, log.uniqueId || log.id, log.action, log.payload],
                        null,
                        2
                      )}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <nav className="wp-mobile-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={view === item.id ? 'is-active' : ''}
                onClick={() => setView(item.id)}
              >
                <Icon size={17} />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {topupOpen && (
        <div className="wp-modal-scrim" role="dialog" aria-modal="true">
          <div className="wp-modal">
            <div className="wp-modal-heading">
              <div>
                <span className="wp-kicker">GHANA CEDI TOP-UP</span>
                <h2>Fund Wilpower Wallet</h2>
              </div>
              <button
                type="button"
                className="wp-icon-button"
                onClick={() => {
                  setTopupOpen(false);
                  setTopupReference(null);
                  setTopupPrompt(null);
                }}
              >
                <X size={16} />
              </button>
            </div>

            {!topupReference ? (
              <form onSubmit={initiateTopup}>
                <div className="wp-field">
                  <span>Payment Channel</span>
                  <div className="wp-payment-grid">
                    <button
                      type="button"
                      className={`wp-payment ${topupChannel === 'MTN' ? 'is-selected' : ''}`}
                      onClick={() => setTopupChannel('MTN')}
                    >
                      <MtnMomoLogo className="h-6" />
                      <span>MTN MoMo</span>
                    </button>
                    <button
                      type="button"
                      className={`wp-payment ${topupChannel === 'TELECEL' ? 'is-selected' : ''}`}
                      onClick={() => setTopupChannel('TELECEL')}
                    >
                      <TelecelLogo className="h-6" />
                      <span>Telecel</span>
                    </button>
                    <button
                      type="button"
                      className={`wp-payment ${topupChannel === 'CARD' ? 'is-selected' : ''}`}
                      onClick={() => setTopupChannel('CARD')}
                    >
                      <MastercardLogo className="h-6" />
                      <span>Card</span>
                    </button>
                  </div>
                </div>

                <div className="wp-field">
                  <span>Amount (GH₵)</span>
                  <div className="wp-topup-presets">
                    {['25', '50', '100', '250'].map((preset) => (
                      <button type="button" key={preset} onClick={() => setTopupAmount(preset)}>
                        GH₵ {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="wp-field">
                  <span>Custom Amount</span>
                  <div className="wp-input-wrap">
                    <span className="wp-currency">GH₵</span>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      required
                    />
                  </div>
                </label>

                <label className="wp-field">
                  <span>Subscriber Number</span>
                  <input
                    value={topupPhone}
                    onChange={(e) => setTopupPhone(e.target.value)}
                    placeholder="024 890 1204"
                    required
                  />
                </label>

                <button type="submit" className="wp-primary-button wp-primary-wide" disabled={topupBusy}>
                  <span>
                    {topupBusy
                      ? 'Connecting gateway...'
                      : topupChannel === 'CARD'
                        ? `Pay ${formatGhs(parseFloat(topupAmount) || 0)} with Paystack`
                        : `Request ${formatGhs(parseFloat(topupAmount) || 0)} USSD Push`}
                  </span>
                  <ArrowUpRight size={17} />
                </button>
              </form>
            ) : (
              <div>
                <div className="wp-ussd-card">
                  <span className="wp-kicker">USSD AUTHORIZATION</span>
                  <strong>{topupPrompt}</strong>
                  <small>Reference: {topupReference}</small>
                </div>

                <label className="wp-field">
                  <span>MoMo PIN (demo accepts 4 digits)</span>
                  <input
                    type="password"
                    maxLength={4}
                    value={topupPin}
                    onChange={(e) => setTopupPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                </label>

                <button type="button" className="wp-primary-button wp-primary-wide" onClick={confirmTopup} disabled={topupBusy}>
                  <span>{topupBusy ? 'Settling...' : `Authorize ${formatGhs(parseFloat(topupAmount) || 0)}`}</span>
                  <Check size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="wp-modal-scrim" role="dialog" aria-modal="true" aria-label="Driver profile and vehicle settings">
          <div className="wp-modal wp-profile-modal">
            <div className="wp-modal-heading">
              <div>
                <span className="wp-kicker">DRIVER PROFILE & GARAGE</span>
                <h2>{driver.displayName || 'Driver'}</h2>
              </div>
              <button type="button" className="wp-icon-button" onClick={() => setProfileOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveProfileChanges}>
              <div className="wp-profile-avatar-row">
                <div className="wp-profile-avatar-preview">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt={profileName || driver.displayName || 'Driver'} />
                  ) : (
                    <span>{((profileName || driver.displayName || 'DR').slice(0, 2)).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <strong>Profile Photo</strong>
                  <p>Used in your driver cockpit and session receipts.</p>
                  <div className="wp-profile-avatar-actions">
                    <label className="wp-outline-button wp-upload-button">
                      <Camera size={14} />
                      <span>Upload photo</span>
                      <input type="file" accept="image/*" onChange={handleAvatarSelected} hidden />
                    </label>
                    {profileAvatar && (
                      <button type="button" className="wp-text-button" onClick={() => setProfileAvatar(undefined)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="wp-profile-grid">
                <label className="wp-field">
                  <span>Full Name</span>
                  <input value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                </label>
                <label className="wp-field">
                  <span>Ghana Mobile (Verified)</span>
                  <input value={formatLocalPhone(driver.phoneNumber)} disabled />
                </label>
                <label className="wp-field">
                  <span>Email for Receipts</span>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="driver@wilpower.gh"
                  />
                </label>
                <label className="wp-field">
                  <span>Ghana Card ID <em>(Optional)</em></span>
                  <input
                    value={profileCardId}
                    onChange={(e) => setProfileCardId(e.target.value.toUpperCase())}
                    placeholder="GHA-000000000-0"
                  />
                </label>
              </div>

              <div className="wp-field">
                <span>Preferred Payment Channel</span>
                <div className="wp-payment-grid">
                  <button
                    type="button"
                    className={`wp-payment ${profilePaymentMethod === 'MTN_MOMO' ? 'is-selected' : ''}`}
                    onClick={() => setProfilePaymentMethod('MTN_MOMO')}
                  >
                    <MtnMomoLogo className="h-6" />
                    <span>MTN MoMo</span>
                  </button>
                  <button
                    type="button"
                    className={`wp-payment ${profilePaymentMethod === 'TELECEL_CASH' ? 'is-selected' : ''}`}
                    onClick={() => setProfilePaymentMethod('TELECEL_CASH')}
                  >
                    <TelecelLogo className="h-6" />
                    <span>Telecel Cash</span>
                  </button>
                  <button
                    type="button"
                    className={`wp-payment ${profilePaymentMethod === 'MASTERCARD' ? 'is-selected' : ''}`}
                    onClick={() => setProfilePaymentMethod('MASTERCARD')}
                  >
                    <MastercardLogo className="h-6" />
                    <span>Paystack Card</span>
                  </button>
                </div>
              </div>

              <div className="wp-field">
                <span>Target Charge Limit ({profileTargetLimit}% SoC)</span>
                <div className="wp-topup-presets">
                  {[70, 80, 85, 90, 100].map((limit) => (
                    <button
                      type="button"
                      key={limit}
                      className={profileTargetLimit === limit ? 'is-selected' : ''}
                      onClick={() => setProfileTargetLimit(limit)}
                    >
                      {limit}%
                    </button>
                  ))}
                </div>
              </div>

              <label className="wp-toggle-row">
                <span>
                  <strong>Moolre SMS Session Receipts</strong>
                  <small>Send Ghana Cedi settlement summaries after each charge.</small>
                </span>
                <input
                  type="checkbox"
                  checked={profileSmsReceipts}
                  onChange={(e) => setProfileSmsReceipts(e.target.checked)}
                />
              </label>

              <div className="wp-garage-box">
                <div className="wp-garage-head">
                  <div>
                    <span className="wp-kicker">REGISTERED VEHICLES</span>
                    <strong>EV Garage ({profileVehicles.length})</strong>
                  </div>
                </div>

                <div className="wp-vehicle-list">
                  {profileVehicles.map((vehicle) => (
                    <div className="wp-vehicle-pill" key={vehicle.id}>
                      <div>
                        <strong>{vehicle.make} {vehicle.model}</strong>
                        <span>{vehicle.licensePlate} · {vehicle.connectorType} · {vehicle.batteryCapacityKwh} kWh</span>
                      </div>
                      {profileVehicles.length > 1 && (
                        <button type="button" onClick={() => removeDraftVehicle(vehicle.id)} title="Remove vehicle">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="wp-vehicle-add-grid">
                  <input
                    value={newVehicleMake}
                    onChange={(e) => setNewVehicleMake(e.target.value)}
                    placeholder="Make (e.g. BYD)"
                  />
                  <input
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    placeholder="Model (e.g. Dolphin)"
                  />
                  <input
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="Plate (GT-1024-26)"
                  />
                  <select
                    value={newVehicleConnector}
                    onChange={(e) => setNewVehicleConnector(e.target.value as any)}
                  >
                    <option value="CCS2">CCS2</option>
                    <option value="GB/T">GB/T</option>
                    <option value="Type2">Type 2</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                  </select>
                  <input
                    type="number"
                    min="20"
                    max="250"
                    value={newVehicleBattery}
                    onChange={(e) => setNewVehicleBattery(e.target.value)}
                    placeholder="kWh"
                  />
                  <button type="button" className="wp-outline-button" onClick={addDraftVehicle}>
                    <Plus size={14} />
                    <span>Add EV</span>
                  </button>
                </div>
              </div>

              <button type="submit" className="wp-primary-button wp-primary-wide" disabled={profileBusy}>
                <span>{profileBusy ? 'Saving profile...' : 'Save Driver Profile'}</span>
                <Check size={17} />
              </button>
            </form>
          </div>
        </div>
      )}

      {navigationStation && (
        <NavigationView
          station={navigationStation}
          onClose={() => setNavigationStation(null)}
          onNotify={notify}
        />
      )}

      {toast && <div className="wp-toast">{toast}</div>}
    </div>
  );
}

export default WillPowerApp;
