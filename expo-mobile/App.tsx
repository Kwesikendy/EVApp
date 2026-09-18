import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
  Platform,
  AppState,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as NavigationBar from 'expo-navigation-bar';
import {
  Plug,
  Gauge,
  BatteryCharging,
  Activity,
  MapPin,
  CreditCard,
  Truck,
  Car,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Plus,
  Battery,
  Flame,
  X,
  Lock,
  Unlock,
  Radio,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Check,
  List,
  Map as MapIcon,
  Server,
  Wifi,
  WifiOff,
  Settings,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Bell,
  Sliders,
  Shield,
  Smartphone,
  Zap,
  Play,
  Square,
  Coins,
  FileText,
  Send,
} from 'lucide-react-native';

import StationMap, { MapStation } from './StationMap';
import { api, ApiFleetAccount, BACKEND_URL, setBackendUrl, CLOUD_BACKEND_URL } from './api';
import { MtnMomoLogoNative, TelecelLogoNative, MastercardLogoNative } from './PaymentLogosNative';
import { XChargeLogoNative, XChargeMarkNative } from './XChargeLogoNative';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { OtpVerificationScreen } from './screens/OtpVerificationScreen';
import { OtpSuccessScreen } from './screens/OtpSuccessScreen';
import { SessionStorage } from './storage';

export interface Connector {
  id: number;
  connectorId: number;
  type: string;
  maxPowerKw: number;
  status: string;
  tariffPerKwh: number;
}

export interface Station {
  id: string;
  stationId: string;
  name: string;
  address: string;
  distanceKm: number;
  etaMins: number;
  latitude: number;
  longitude: number;
  connectors: Connector[];
  amenities: string[];
}

export interface FleetVehicle {
  vin: string;
  model: string;
  plate: string;
  driver: string;
  soc: number;
  isPlugAndChargeEnabled: boolean;
  maxKw: number;
  batteryCapacityKwh: number;
  lastCharged: string;
}

export interface WalletTransaction {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  amount: number;
  isCredit: boolean;
  kwh?: number;
  type?: string;
}

const DEFAULT_STATIONS: Station[] = [
  {
    id: 'st-01',
    stationId: 'XC-ACC-001',
    name: 'XCharge Superhub – Airport City',
    address: 'Liberation Rd, Terminal 3 District, Accra',
    distanceKm: 1.2,
    etaMins: 4,
    latitude: 5.6050,
    longitude: -0.1720,
    connectors: [
      { id: 1, connectorId: 1, type: 'CCS2', maxPowerKw: 350, status: 'Available', tariffPerKwh: 3.80 },
      { id: 2, connectorId: 2, type: 'CCS2', maxPowerKw: 160, status: 'Available', tariffPerKwh: 3.50 },
      { id: 3, connectorId: 3, type: 'CCS2', maxPowerKw: 160, status: 'Charging', tariffPerKwh: 3.50 },
      { id: 4, connectorId: 4, type: 'CHAdeMO', maxPowerKw: 60, status: 'Available', tariffPerKwh: 3.20 },
    ],
    amenities: ['24/7 Security', 'Coffee Lounge', 'Free Wi-Fi', 'Restrooms', 'EV Detailing'],
  },
  {
    id: 'st-02',
    stationId: 'XC-ACC-002',
    name: 'XCharge Express – Financial Plaza',
    address: 'High Street Commercial Core, Accra Central',
    distanceKm: 3.8,
    etaMins: 9,
    latitude: 5.5520,
    longitude: -0.1980,
    connectors: [
      { id: 5, connectorId: 1, type: 'CCS2', maxPowerKw: 200, status: 'Available', tariffPerKwh: 4.20 },
      { id: 6, connectorId: 2, type: 'CCS2', maxPowerKw: 200, status: 'Charging', tariffPerKwh: 4.20 },
    ],
    amenities: ['Covered Canopy', 'ATM Banking', '24/7 Lighting'],
  },
  {
    id: 'st-03',
    stationId: 'XC-ACC-003',
    name: 'XCharge Hub – Ridge Tech Zone',
    address: 'GIMPA Bypass, Ridge Ambassadorial Enclave',
    distanceKm: 2.4,
    etaMins: 6,
    latitude: 5.5780,
    longitude: -0.1910,
    connectors: [
      { id: 7, connectorId: 1, type: 'CCS2', maxPowerKw: 160, status: 'Available', tariffPerKwh: 3.60 },
      { id: 8, connectorId: 2, type: 'CHAdeMO', maxPowerKw: 50, status: 'Available', tariffPerKwh: 3.20 },
      { id: 9, connectorId: 3, type: 'Type2', maxPowerKw: 22, status: 'Available', tariffPerKwh: 2.80 },
    ],
    amenities: ['Solar Canopy', 'EV Care Workshop', 'Café'],
  },
  {
    id: 'st-04',
    stationId: 'XC-ACC-004',
    name: 'XCharge Fleet Depot – Heavy Logistics Hub',
    address: 'Industrial Ring Rd West, Heavy Transport Corridor',
    distanceKm: 5.1,
    etaMins: 12,
    latitude: 5.5890,
    longitude: -0.2450,
    connectors: [
      { id: 10, connectorId: 1, type: 'CCS2', maxPowerKw: 350, status: 'Available', tariffPerKwh: 3.20 },
      { id: 11, connectorId: 2, type: 'CCS2', maxPowerKw: 350, status: 'Charging', tariffPerKwh: 3.20 },
      { id: 12, connectorId: 3, type: 'GB/T', maxPowerKw: 120, status: 'Available', tariffPerKwh: 3.00 },
    ],
    amenities: ['Commercial Truck Bay', 'Driver Rest Lounge', 'High Clearance Canopy'],
  },
];

const DEFAULT_FLEET: FleetVehicle[] = [
  {
    vin: '1FTFW1ED8NFA02941',
    model: 'Ford E-Transit 350',
    plate: 'GT-4491-24',
    driver: 'Kwame Mensah',
    soc: 74,
    isPlugAndChargeEnabled: true,
    maxKw: 115,
    batteryCapacityKwh: 68,
    lastCharged: 'Today, 08:30 AM',
  },
  {
    vin: 'LGX1C23D8M1093847',
    model: 'BYD T3 Electric Cargo Van',
    plate: 'GN-1002-24',
    driver: 'Kofi Boateng',
    soc: 42,
    isPlugAndChargeEnabled: true,
    maxKw: 50,
    batteryCapacityKwh: 44.9,
    lastCharged: 'Yesterday, 18:45 PM',
  },
  {
    vin: '7SAYGDEE4PF889120',
    model: 'Tesla Model Y Long Range',
    plate: 'GW-8920-23',
    driver: 'Ama Osei',
    soc: 89,
    isPlugAndChargeEnabled: false,
    maxKw: 250,
    batteryCapacityKwh: 82,
    lastCharged: 'Today, 07:15 AM',
  },
];

const DEFAULT_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-01',
    title: 'XCharge Superhub – Airport City',
    subtitle: 'CCS2 #1 · 350 kW Ultra-Fast',
    timestamp: 'Today, 11:20 AM',
    amount: 93.48,
    isCredit: false,
    kwh: 24.6,
  },
  {
    id: 'tx-02',
    title: 'MoMo Top-Up (MTN Mobile Money)',
    subtitle: 'Ref: MTN-GH-882910 · Instant Load',
    timestamp: 'Today, 10:45 AM',
    amount: 100.00,
    isCredit: true,
  },
  {
    id: 'tx-03',
    title: 'XCharge Express – Financial Plaza',
    subtitle: 'CCS2 #2 · 200 kW Fast',
    timestamp: 'Yesterday, 16:15 PM',
    amount: 76.44,
    isCredit: false,
    kwh: 18.2,
  },
  {
    id: 'tx-04',
    title: 'Fleet Reimbursement',
    subtitle: 'Apex Logistics Corporate Credit',
    timestamp: 'Sep 15, 09:30 AM',
    amount: 150.00,
    isCredit: true,
  },
];

function AppContent() {
  const insets = useSafeAreaInsets();

  // Persistent Driver Authentication & Onboarding
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | 'otp' | 'otp_success'>('login');
  const [authParams, setAuthParams] = useState<any>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Restore stored session on mobile app startup
  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await SessionStorage.getSession();
        if (session && session.user) {
          setCurrentUser(session.user);
          if (session.user.walletBalance !== undefined) {
            setWalletBalance(session.user.walletBalance);
          }
          if (session.user.registeredVehicles && session.user.registeredVehicles.length > 0) {
            const mappedVehicles: FleetVehicle[] = session.user.registeredVehicles.map((v: any, idx: number) => ({
              vin: v.id || `VIN-GH-${idx}`,
              model: `${v.make || ''} ${v.model || ''}`.trim() || 'EV',
              plate: v.licensePlate || `GW ${idx + 1}00 - 24`,
              driver: session.user.displayName || 'Driver',
              soc: 78,
              status: 'idle',
              batteryCapacityKwh: v.batteryCapacityKwh || 60,
              assignedStation: 'Spintex Ultra Hub',
            }));
            setFleetVehicles(mappedVehicles);
          }
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Session restore error:', err);
      } finally {
        setIsCheckingSession(false);
      }
    }
    restoreSession();
  }, []);

  const [activeTab, setActiveTab] = useState<'map' | 'telemetry' | 'wallet' | 'fleet'>('map');
  const [mapViewMode, setMapViewMode] = useState<'map' | 'list'>('map');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [mapFilter, setMapFilter] = useState<'all' | 'ultra' | 'available'>('all');

  // Backend connection & CitrineOS state
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [citrineInfo, setCitrineInfo] = useState<string>('Secure Charging Protocol Active');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [customBackendInput, setCustomBackendInput] = useState<string>(BACKEND_URL);

  // User App Preferences (Encapsulated)
  const [autoUnlockCable, setAutoUnlockCable] = useState<boolean>(true);
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState<boolean>(true);
  const [smsReceiptsEnabled, setSmsReceiptsEnabled] = useState<boolean>(true);
  const [devModeUnlocked, setDevModeUnlocked] = useState<boolean>(false);
  const [devTapCount, setDevTapCount] = useState<number>(0);

  // Stations & Fleet
  const [stations, setStations] = useState<Station[]>(DEFAULT_STATIONS);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>(DEFAULT_FLEET);
  const [fleetAccount, setFleetAccount] = useState<ApiFleetAccount | null>(null);

  // Charging session state
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isFleetMode, setIsFleetMode] = useState<boolean>(false);
  const [currentKw, setCurrentKw] = useState<number>(138.4);
  const [kwhConsumed, setKwhConsumed] = useState<number>(18.42);
  const [batterySoc, setBatterySoc] = useState<number>(68);
  const [targetSoc, setTargetSoc] = useState<number>(80);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(872);
  const [packVoltage, setPackVoltage] = useState<number>(412.8);
  const [packCurrent, setPackCurrent] = useState<number>(335.2);
  const [activeStationName, setActiveStationName] = useState<string>('XCharge Superhub – Airport City');
  const [activeConnectorType, setActiveConnectorType] = useState<string>('CCS2 · 350 kW Ultra-Fast');

  // Real-time Station Hardware Simulator state
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [simStationId, setSimStationId] = useState<string>('st-01');
  const [simPowerKw, setSimPowerKw] = useState<number>(160);
  const [simInitialSoc, setSimInitialSoc] = useState<number>(24);
  const [recentOcppPackets, setRecentOcppPackets] = useState<
    { id: string; time: string; action: string; summary: string }[]
  >([
    { id: '1', time: '10:45:12', action: 'Heartbeat', summary: 'CSMS connection verified (OCPP 2.0.1)' },
    { id: '2', time: '10:45:15', action: 'StatusNotification', summary: 'Connector 1: Available (CCS2 160 kW)' },
  ]);

  // Wallet & MoMo state
  const [walletBalance, setWalletBalance] = useState<number>(145.50);
  const [heldBalance, setHeldBalance] = useState<number>(25.00);
  const [selectedMomoProvider, setSelectedMomoProvider] = useState<'mtn' | 'telecel' | 'at'>('mtn');
  const [customTopupAmount, setCustomTopupAmount] = useState<string>('');
  const [transactions, setTransactions] = useState<WalletTransaction[]>(DEFAULT_TRANSACTIONS);

  // Real-time Tariff & Session Billing State (Ghana Cedis GHS)
  const [activeTariffRate, setActiveTariffRate] = useState<number>(4.20);
  const [accruedCost, setAccruedCost] = useState<number>(77.36);

  // Real-time Interactive Mobile Money Checkout & USSD Push State
  const [showMomoPaymentModal, setShowMomoPaymentModal] = useState<boolean>(false);
  const [momoStep, setMomoStep] = useState<'INPUT' | 'DISPATCHING' | 'USSD_PROMPT' | 'RECEIPT'>('INPUT');
  const [momoAmount, setMomoAmount] = useState<number>(50);
  const [momoPhone, setMomoPhone] = useState<string>('+233 24 981 4421');
  const [momoPin, setMomoPin] = useState<string>('');
  const [momoNetworkRef, setMomoNetworkRef] = useState<string>('GH-MTN-984210');
  const [momoTxId, setMomoTxId] = useState<string>('');
  const [momoCountdown, setMomoCountdown] = useState<number>(45);
  const [momoReceiptData, setMomoReceiptData] = useState<any>(null);

  // Real-time Charging Session Settlement Modal State
  const [showSettlementModal, setShowSettlementModal] = useState<boolean>(false);
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [settlementPaymentMethod, setSettlementPaymentMethod] = useState<'WALLET' | 'MOMO_MTN' | 'MOMO_TELECEL' | 'CARD_MASTERCARD'>('MOMO_MTN');

  // Activate Android Immersive Mode (hide navigation bar and control panel completely)
  const activateImmersive = async () => {
    if (Platform.OS === 'android') {
      try {
        if (typeof (NavigationBar as any).setPositionAsync === 'function') {
          await (NavigationBar as any).setPositionAsync('absolute').catch(() => {});
        }
        if (typeof (NavigationBar as any).setBehaviorAsync === 'function') {
          await (NavigationBar as any).setBehaviorAsync('overlay-swipe').catch(() => {});
        }
        if (typeof NavigationBar.setVisibilityAsync === 'function') {
          await NavigationBar.setVisibilityAsync('hidden').catch(() => {});
        }
        if (typeof (NavigationBar as any).setBackgroundColorAsync === 'function') {
          await (NavigationBar as any).setBackgroundColorAsync('#00000000').catch(() => {});
        }
      } catch (_e) {
        // Safe catch
      }
    }
    StatusBar.setHidden(true, 'none');
  };

  useEffect(() => {
    activateImmersive();
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        activateImmersive();
      }
    });
    return () => appStateSub.remove();
  }, []);

  // Sync data with live backend
  const syncBackendData = async () => {
    setIsSyncing(true);
    try {
      const health = await api.getHealth();
      setIsBackendOnline(!!health);
      if (health) {
        setCitrineInfo(`CitrineOS ${health.citrineOsBridge} · ${health.ocppVersion}`);
      }

      const [stationsData, walletData, fleetData, sessionData] = await Promise.all([
        api.getStations(),
        api.getWallet(),
        api.getFleet(),
        api.getActiveSession(),
      ]);

      if (stationsData && stationsData.length > 0) {
        setStations(
          stationsData.map((st) => ({
            id: st.id,
            stationId: st.stationId,
            name: st.name,
            address: st.address,
            distanceKm: st.distanceKm || 1.8,
            etaMins: Math.max(3, Math.round((st.distanceKm || 1.8) * 2.5)),
            latitude: st.latitude,
            longitude: st.longitude,
            connectors: st.connectors.map((c) => ({
              id: c.id,
              connectorId: c.connectorId,
              type: c.type,
              maxPowerKw: c.maxPowerKw,
              status: c.status,
              tariffPerKwh: c.tariffPerKwh,
            })),
            amenities: st.amenities,
          }))
        );
      }

      if (walletData) {
        setWalletBalance(walletData.availableBalance);
        setHeldBalance(walletData.heldBalance);
        if (walletData.transactions && walletData.transactions.length > 0) {
          setTransactions(
            walletData.transactions.map((tx) => ({
              id: tx.id,
              title: tx.description.split('(')[0] || tx.description,
              subtitle: `Ref: ${tx.reference} · ${tx.provider}`,
              timestamp: new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              amount: tx.amount,
              isCredit: tx.type === 'TOPUP' || tx.type === 'PREAUTH_RELEASE',
              type: tx.type,
            }))
          );
        }
      }

      if (fleetData) {
        setFleetAccount(fleetData);
        if (fleetData.vehicles && fleetData.vehicles.length > 0) {
          setFleetVehicles(
            fleetData.vehicles.map((v, i) => ({
              vin: v.vin,
              model: `${v.make} ${v.model}`,
              plate: v.licensePlate,
              driver: v.assignedDriver,
              soc: i === 0 ? 74 : i === 1 ? 42 : 89,
              isPlugAndChargeEnabled: true,
              maxKw: i === 0 ? 115 : i === 1 ? 50 : 250,
              batteryCapacityKwh: v.batteryCapacityKwh,
              lastCharged: 'Today, 08:30 AM',
            }))
          );
        }
      }

      if (sessionData && sessionData.status === 'Charging') {
        setIsCharging(true);
        setCurrentKw(sessionData.currentPowerKw);
        setKwhConsumed(sessionData.kwhDelivered);
        setBatterySoc(sessionData.currentSocPercent);
        setTargetSoc(sessionData.targetSocPercent);
        setElapsedSeconds(sessionData.elapsedSeconds);
        setPackVoltage(sessionData.voltageV);
        setPackCurrent(sessionData.currentA);
        if (sessionData.accruedCost !== undefined) {
          setAccruedCost(sessionData.accruedCost);
        }

        if (sessionData.meterValuesLog && sessionData.meterValuesLog.length > 0) {
          const recentLogs = sessionData.meterValuesLog.slice(-5).reverse();
          setRecentOcppPackets(
            recentLogs.map((m, idx) => ({
              id: `mv-${idx}-${m.timestamp}`,
              time: new Date(m.timestamp).toLocaleTimeString(),
              action: 'MeterValues',
              summary: `${m.powerKw.toFixed(0)} kW · ${m.soc.toFixed(1)}% SoC · ${m.kwhTotal.toFixed(2)} kWh`,
            }))
          );
        }
      }
    } catch (err) {
      console.warn('Backend sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncBackendData();
    const interval = setInterval(syncBackendData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Live charging telemetry and real-time billing ticker loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCharging) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        const addedKwh = (currentKw / 3600) * simSpeed;
        setKwhConsumed((prev) => {
          const nextKwh = +(prev + addedKwh).toFixed(3);
          setAccruedCost(+(nextKwh * activeTariffRate).toFixed(2));
          return nextKwh;
        });
        setBatterySoc((prev) => {
          if (prev >= targetSoc) return prev;
          // Approximate standard 75 kWh EV pack
          const socDelta = (addedKwh / 75) * 100;
          return +Math.min(targetSoc, +(prev + socDelta).toFixed(1));
        });
        const nextV = +(410 + Math.sin(Date.now() / 2000) * 3).toFixed(1);
        setPackVoltage(nextV);
        setPackCurrent(+((currentKw * 1000) / nextV).toFixed(1));

        // Append live simulated OCPP packet
        const nowStr = new Date().toLocaleTimeString();
        setRecentOcppPackets((prev) => [
          {
            id: `pkt-${Date.now()}`,
            time: nowStr,
            action: 'MeterValues',
            summary: `${currentKw.toFixed(0)} kW · ${nextV}V · ${batterySoc.toFixed(0)}% SoC · ${(kwhConsumed + addedKwh).toFixed(2)} kWh`,
          },
          ...prev.slice(0, 4),
        ]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCharging, targetSoc, currentKw, simSpeed, batterySoc, kwhConsumed, activeTariffRate]);

  // Mobile Money USSD Interactive Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (momoStep === 'USSD_PROMPT' && momoCountdown > 0) {
      timer = setInterval(() => {
        setMomoCountdown((prev) => prev - 1);
      }, 1000);
    } else if (momoCountdown === 0 && momoStep === 'USSD_PROMPT') {
      Alert.alert('USSD Timeout', 'The Mobile Money authentication session timed out. Please try again.');
      setMomoStep('INPUT');
    }
    return () => clearInterval(timer);
  }, [momoStep, momoCountdown]);

  const handleSetSimSpeed = async (multiplier: number) => {
    setSimSpeed(multiplier);
    await api.setSimulatorSpeed(multiplier);
  };

  const handleSetSimPower = async (kw: number) => {
    setSimPowerKw(kw);
    setCurrentKw(kw);
    const nextV = 412.8;
    setPackCurrent(+((kw * 1000) / nextV).toFixed(1));
    await api.setSimulatorPower(kw);
  };

  const handleLaunchSimulatedSession = async (customSoc?: number, customPower?: number, stationId?: string) => {
    const targetStation = stations.find((s) => s.stationId === (stationId || simStationId)) || stations[0];
    const targetConnector = targetStation.connectors[0];
    const startingSoc = customSoc !== undefined ? customSoc : simInitialSoc;
    const power = customPower || simPowerKw || targetConnector.maxPowerKw;

    setBatterySoc(startingSoc);
    setCurrentKw(power);
    setKwhConsumed(0);
    setElapsedSeconds(0);

    // Call start simulation endpoint
    await api.startSimulation({
      stationId: targetStation.stationId,
      connectorId: targetConnector.connectorId,
      initialSoc: startingSoc,
      targetSoc: targetSoc,
      powerKw: power,
      speedMultiplier: simSpeed,
      isFleet: isFleetMode,
    }).catch(() => {});

    handleStartCharging(targetStation, { ...targetConnector, maxPowerKw: power });
  };

  const handleStartCharging = async (station: Station, connector: Connector) => {
    const PREAUTH_HOLD = 25.00;
    const rate = connector.tariffPerKwh || 4.20;
    setActiveTariffRate(rate);

    if (!isFleetMode && walletBalance < PREAUTH_HOLD) {
      Alert.alert(
        'Insufficient MoMo Balance',
        `XCharge requires a GH₵ ${PREAUTH_HOLD.toFixed(2)} pre-authorization hold to lock the connector. Please top up your wallet.`,
        [
          { text: 'Top Up MoMo', onPress: () => handleOpenMomoModal(PREAUTH_HOLD) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    // Optimistic state
    if (!isFleetMode) {
      setWalletBalance((prev) => +(prev - PREAUTH_HOLD).toFixed(2));
      setHeldBalance(PREAUTH_HOLD);
    }

    setActiveStationName(station.name);
    setActiveConnectorType(`${connector.type} · ${connector.maxPowerKw} kW Ultra-Fast`);
    setIsCharging(true);
    setSelectedStation(null);
    setActiveTab('telemetry');

    // Notify backend simulator as well
    await api.startSimulation({
      stationId: station.stationId,
      connectorId: connector.connectorId,
      initialSoc: batterySoc,
      targetSoc: targetSoc,
      powerKw: connector.maxPowerKw,
      speedMultiplier: simSpeed,
      isFleet: isFleetMode,
    }).catch(() => {});

    // Call CitrineOS CSMS backend
    const res = await api.remoteStartSession({
      stationId: station.stationId,
      connectorId: connector.connectorId,
      isFleet: isFleetMode,
      vin: isFleetMode && fleetVehicles[0] ? fleetVehicles[0].vin : undefined,
      preauthHoldAmount: PREAUTH_HOLD,
    });

    if (res && res.success) {
      Alert.alert(
        'Cable Latch Engaged',
        `OCPP 2.0.1 RemoteStart successful.\nConnected to ${station.stationId} #${connector.connectorId}.\nTariff: GH₵ ${rate.toFixed(2)}/kWh.\nPre-auth hold: GH₵ ${PREAUTH_HOLD.toFixed(2)}.`,
        [{ text: 'View Telemetry', style: 'default' }]
      );
    } else {
      Alert.alert(
        'Session Active',
        `Connector #${connector.connectorId} engaged at ${station.name}.\nReal-time billing active @ GH₵ ${rate.toFixed(2)}/kWh.`
      );
    }
  };

  const handleStopCharging = () => {
    // Open real-time settlement & unlatch modal
    setShowSettlementModal(true);
  };

  const handleExecuteSettlement = async () => {
    setIsSettling(true);
    const finalCost = +(kwhConsumed * activeTariffRate).toFixed(2);
    try {
      if (!isFleetMode) {
        if (settlementPaymentMethod === 'WALLET') {
          const refund = +(heldBalance - finalCost).toFixed(2);
          if (refund > 0) {
            setWalletBalance((prev) => +(prev + refund).toFixed(2));
          } else {
            setWalletBalance((prev) => +(prev - (finalCost - heldBalance)).toFixed(2));
          }
          setHeldBalance(0);
        } else {
          setHeldBalance(0);
        }
      }

      const newTx: WalletTransaction = {
        id: `tx-settle-${Date.now()}`,
        title: activeStationName,
        subtitle: `${activeConnectorType} · ${kwhConsumed.toFixed(2)} kWh`,
        timestamp: 'Just now',
        amount: finalCost,
        isCredit: false,
        kwh: kwhConsumed,
      };
      setTransactions((prev) => [newTx, ...prev]);

      // Call backend remoteStop and simulator stop
      await Promise.all([
        api.remoteStopSession().catch(() => {}),
        api.stopSimulation().catch(() => {}),
      ]);
      await syncBackendData();

      setIsCharging(false);
      setShowSettlementModal(false);

      Alert.alert(
        'Charging Settlement Complete',
        `Official Receipt: STMT-XC-${Math.floor(10000 + Math.random() * 90000)}\n\n` +
        `• Energy Consumed: ${kwhConsumed.toFixed(2)} kWh\n` +
        `• Billed Tariff: GH₵ ${activeTariffRate.toFixed(2)} / kWh\n` +
        `• Total Settled: GH₵ ${finalCost.toFixed(2)}\n` +
        `• Pre-Auth Escrow: Reconciled & Released\n\n` +
        `Connector solenoid unlatched. Cable is safe to remove.`
      );
    } catch (err: any) {
      Alert.alert('Settlement Error', err.message || 'Failed to settle session.');
    } finally {
      setIsSettling(false);
    }
  };

  const handleOpenMomoModal = (presetAmount?: number) => {
    const amt = presetAmount || parseFloat(customTopupAmount) || 50;
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please specify a valid top-up amount in GH₵.');
      return;
    }
    setMomoAmount(amt);
    setMomoStep('INPUT');
    setMomoPin('');
    setMomoCountdown(45);
    setShowMomoPaymentModal(true);
  };

  const handleDispatchMomoUssd = async () => {
    setMomoStep('DISPATCHING');
    try {
      const res = await api.initiateMomoPayment({
        amount: momoAmount,
        provider: selectedMomoProvider.toUpperCase(),
        phone: momoPhone,
      });
      if (res && res.networkReference) {
        setMomoNetworkRef(res.networkReference);
        setMomoTxId(res.transactionId);
      } else {
        setMomoNetworkRef(`GH-${selectedMomoProvider.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
        setMomoTxId(`tx-momo-${Date.now()}`);
      }
      setMomoCountdown(45);
      setMomoStep('USSD_PROMPT');
    } catch (_e) {
      setMomoNetworkRef(`GH-${selectedMomoProvider.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
      setMomoTxId(`tx-momo-${Date.now()}`);
      setMomoCountdown(45);
      setMomoStep('USSD_PROMPT');
    }
  };

  const handleConfirmMomoPin = async (customPin?: string) => {
    const pinToUse = customPin || momoPin || '1234';
    setMomoStep('DISPATCHING');
    try {
      const res = await api.confirmMomoPayment({
        transactionId: momoTxId,
        amount: momoAmount,
        provider: selectedMomoProvider.toUpperCase(),
        phone: momoPhone,
        pin: pinToUse,
      });

      if (res && res.wallet) {
        setWalletBalance(res.wallet.availableBalance);
        setHeldBalance(res.wallet.heldBalance);
        setMomoReceiptData(res);
        await syncBackendData();
      } else {
        setWalletBalance((prev) => +(prev + momoAmount).toFixed(2));
        const approvalCode = `${selectedMomoProvider.toUpperCase()}-AUTH-${Math.floor(10000000 + Math.random() * 90000000)}`;
        const fallbackReceipt = {
          approvalCode,
          graTaxInvoice: `GRA-ELEV-EXEMPT-${Math.floor(10000 + Math.random() * 90000)}`,
          settledAmount: momoAmount,
        };
        setMomoReceiptData(fallbackReceipt);
        const newTx: WalletTransaction = {
          id: `tx-topup-${Date.now()}`,
          title: `MoMo Top-Up (${selectedMomoProvider.toUpperCase()})`,
          subtitle: `Ref: ${approvalCode}`,
          timestamp: 'Just now',
          amount: momoAmount,
          isCredit: true,
        };
        setTransactions((prev) => [newTx, ...prev]);
      }

      setCustomTopupAmount('');
      setMomoStep('RECEIPT');
    } catch (_e) {
      setWalletBalance((prev) => +(prev + momoAmount).toFixed(2));
      setMomoStep('RECEIPT');
    }
  };

  const handleTopUp = async (amountNum: number) => {
    handleOpenMomoModal(amountNum);
  };

  const togglePlugAndCharge = (vin: string) => {
    setFleetVehicles((prev) =>
      prev.map((v) => {
        if (v.vin === vin) {
          const nextState = !v.isPlugAndChargeEnabled;
          Alert.alert(
            nextState ? 'ISO 15118 Activated' : 'Plug & Charge Suspended',
            nextState
              ? `Digital certificate for ${v.model} (${v.plate}) is active. Vehicle will automatically authenticate upon cable insertion.`
              : `Plug & Charge disabled for ${v.model}. Manual app verification will be required at chargers.`
          );
          return { ...v, isPlugAndChargeEnabled: nextState };
        }
        return v;
      })
    );
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredStations = stations.filter((st) => {
    if (mapFilter === 'ultra') {
      return st.connectors.some((c) => c.maxPowerKw >= 200);
    }
    if (mapFilter === 'available') {
      return st.connectors.some((c) => c.status === 'Available');
    }
    return true;
  });

  const tabs = [
    { key: 'map', label: 'Map', icon: MapPin },
    { key: 'telemetry', label: 'Charge HUD', icon: Plug },
    { key: 'wallet', label: 'MoMo Wallet', icon: CreditCard },
    { key: 'fleet', label: 'Fleet VIN', icon: Truck },
  ];

  if (isCheckingSession) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0e14', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar hidden={true} translucent={true} backgroundColor="#0a0e14" />
        <XChargeMarkNative size={54} />
        <ActivityIndicator size="small" color="#00f0ff" style={{ marginTop: 24, marginBottom: 12 }} />
        <Text style={{ color: '#00f0ff', fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>INITIALIZING TELEMETRY NODE...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authScreen === 'login') {
      return (
        <LoginScreen
          onNavigate={(screen, params) => {
            if (params) setAuthParams(params);
            setAuthScreen(screen);
          }}
        />
      );
    }
    if (authScreen === 'signup') {
      return (
        <SignUpScreen
          onNavigate={(screen, params) => {
            if (params) setAuthParams(params);
            setAuthScreen(screen);
          }}
        />
      );
    }
    if (authScreen === 'otp') {
      return (
        <OtpVerificationScreen
          onNavigate={(screen, params) => {
            if (params) setAuthParams(params);
            setAuthScreen(screen);
          }}
          onVerified={async (user) => {
            setCurrentUser(user);
            await SessionStorage.saveSession(user);
            if (user?.walletBalance !== undefined) {
              setWalletBalance(user.walletBalance);
            }
            if (user?.registeredVehicles && user.registeredVehicles.length > 0) {
              const mappedVehicles: FleetVehicle[] = user.registeredVehicles.map((v: any, idx: number) => ({
                vin: v.id || `VIN-GH-${idx}`,
                model: `${v.make} ${v.model}`,
                plate: v.licensePlate || `GW ${idx + 1}00 - 24`,
                driver: user.displayName || 'Driver',
                soc: 78,
                status: 'idle',
                batteryCapacityKwh: v.batteryCapacityKwh || 60,
                assignedStation: 'Spintex Ultra Hub',
              }));
              setFleetVehicles(mappedVehicles);
            }
          }}
          routeParams={authParams}
        />
      );
    }
    if (authScreen === 'otp_success') {
      return (
        <OtpSuccessScreen
          user={currentUser || authParams?.user}
          onEnterDashboard={async () => {
            const userToSave = currentUser || authParams?.user;
            if (userToSave) {
              await SessionStorage.saveSession(userToSave);
            }
            setIsAuthenticated(true);
            setAuthScreen('login');
          }}
        />
      );
    }
  }

  return (
    <View style={s.root}>
      {/* Status Bar completely hidden for true edge-to-edge immersive view */}
      <StatusBar hidden={true} translucent={true} backgroundColor="#020817" />

      {/* Global High-Tech Header */}
      <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={s.headerLeft}>
          <View style={s.brandLogoBadge}>
            <XChargeMarkNative size={22} />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <XChargeLogoNative width={112} height={32} showSubtitle={false} />
              <TouchableOpacity
                style={[s.backendStatusPill, isBackendOnline ? s.backendOnline : s.backendOffline]}
                onPress={() => setShowSettingsModal(true)}
                activeOpacity={0.7}
              >
                <View style={[s.onlineDot, { backgroundColor: isBackendOnline ? '#22c55e' : '#f59e0b' }]} />
                <Text style={[s.onlineText, { color: isBackendOnline ? '#22c55e' : '#f59e0b' }]}>
                  {isBackendOnline ? 'ONLINE' : 'CONNECTING'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={s.headerSub}>
              {isFleetMode ? 'Fleet: APEX LOGISTICS GH' : 'Driver Pass · Accra Hub'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setIsFleetMode(!isFleetMode)}
            style={[s.modeToggleBadge, isFleetMode ? s.badgeFleet : s.badgePersonal]}
            activeOpacity={0.8}
          >
            {isFleetMode ? (
              <Truck size={12} color="#fbbf24" style={{ marginRight: 4 }} />
            ) : (
              <Car size={12} color="#38bdf8" style={{ marginRight: 4 }} />
            )}
            <Text style={[s.badgeText, isFleetMode ? s.badgeFleetText : s.badgePersonalText]}>
              {isFleetMode ? 'FLEET: VIN' : 'PERSONAL'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSettingsModal(true)}
            style={s.settingsIconButton}
            activeOpacity={0.7}
          >
            <Settings size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Screen Body */}
      <View style={s.content}>
        {/* ===================================================
            TAB 1: INTERACTIVE MAP & STATIONS LIST
        ==================================================== */}
        {activeTab === 'map' && (
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Filter Pills & Map/List Switcher Header */}
            <View style={s.mapFilterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
                <TouchableOpacity
                  style={[s.filterChip, mapFilter === 'all' && s.filterChipActive]}
                  onPress={() => setMapFilter('all')}
                >
                  <Text style={[s.filterChipText, mapFilter === 'all' && s.filterChipTextActive]}>
                    All Superhubs ({stations.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.filterChip, mapFilter === 'ultra' && s.filterChipActive]}
                  onPress={() => setMapFilter('ultra')}
                >
                  <Gauge size={11} color={mapFilter === 'ultra' ? '#38bdf8' : '#94a3b8'} style={{ marginRight: 4 }} />
                  <Text style={[s.filterChipText, mapFilter === 'ultra' && s.filterChipTextActive]}>
                    200+ kW Ultra
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.filterChip, mapFilter === 'available' && s.filterChipActive]}
                  onPress={() => setMapFilter('available')}
                >
                  <View style={[s.statusDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={[s.filterChipText, mapFilter === 'available' && s.filterChipTextActive]}>
                    Available Now
                  </Text>
                </TouchableOpacity>

                {/* Map / List View Toggle */}
                <TouchableOpacity
                  style={[s.filterChip, s.viewToggleChip]}
                  onPress={() => setMapViewMode(mapViewMode === 'map' ? 'list' : 'map')}
                >
                  {mapViewMode === 'map' ? (
                    <>
                      <List size={11} color="#38bdf8" style={{ marginRight: 4 }} />
                      <Text style={[s.filterChipText, { color: '#38bdf8' }]}>List View</Text>
                    </>
                  ) : (
                    <>
                      <MapIcon size={11} color="#38bdf8" style={{ marginRight: 4 }} />
                      <Text style={[s.filterChipText, { color: '#38bdf8' }]}>Map View</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Render View: Interactive WebMap OR List */}
            {mapViewMode === 'map' ? (
              <StationMap
                stations={filteredStations}
                selectedStation={selectedStation}
                onSelectStation={(st) => setSelectedStation(st as Station)}
                onStartCharge={(st) => {
                  const avail = st.connectors.find((c) => c.status === 'Available') || st.connectors[0];
                  handleStartCharging(st as Station, avail);
                }}
              />
            ) : (
              <ScrollView style={s.tabScroll} contentContainerStyle={{ padding: 14, paddingTop: 60, paddingBottom: 32 }}>
                <Text style={s.listSectionHeader}>ACCRA CHARGING HUBS ({filteredStations.length})</Text>
                {filteredStations.map((station) => {
                  const maxKw = Math.max(...station.connectors.map((c) => c.maxPowerKw));
                  const availableConns = station.connectors.filter((c) => c.status === 'Available');

                  return (
                    <TouchableOpacity
                      key={station.id}
                      style={s.stationListCard}
                      onPress={() => setSelectedStation(station)}
                      activeOpacity={0.85}
                    >
                      <View style={s.stationListHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.stationListTitle}>{station.name}</Text>
                          <Text style={s.stationListAddress}>{station.address}</Text>
                        </View>
                        <View style={s.powerHighlightPill}>
                          <Gauge size={12} color="#38bdf8" />
                          <Text style={s.powerHighlightText}>{maxKw} kW</Text>
                        </View>
                      </View>

                      <View style={s.stationListMetaRow}>
                        <View style={s.metaItem}>
                          <MapPin size={12} color="#94a3b8" />
                          <Text style={s.metaItemText}>{station.distanceKm} km · ~{station.etaMins} mins</Text>
                        </View>
                        <View style={s.metaItem}>
                          <View
                            style={[
                              s.statusDot,
                              { backgroundColor: availableConns.length > 0 ? '#22c55e' : '#f59e0b' },
                            ]}
                          />
                          <Text style={s.metaItemText}>
                            {availableConns.length}/{station.connectors.length} Available
                          </Text>
                        </View>
                      </View>

                      <View style={s.connectorChipsRow}>
                        {station.connectors.map((c) => (
                          <View
                            key={c.id}
                            style={[
                              s.miniConnectorChip,
                              c.status === 'Available' ? s.miniChipAvailable : s.miniChipBusy,
                            ]}
                          >
                            <Text
                              style={[
                                s.miniConnectorText,
                                { color: c.status === 'Available' ? '#22c55e' : '#94a3b8' },
                              ]}
                            >
                              {c.type} {c.maxPowerKw}kW · GH₵{c.tariffPerKwh.toFixed(2)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={s.stationListActions}>
                        <TouchableOpacity
                          style={s.listRouteBtn}
                          onPress={() => {
                            Alert.alert('Navigation Route', `Starting turn-by-turn guidance to ${station.name}. ETA: ${station.etaMins} mins.`);
                          }}
                        >
                          <Navigation size={13} color="#38bdf8" />
                          <Text style={s.listRouteText}>Route</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={s.listChargeBtn}
                          onPress={() => {
                            const avail = station.connectors.find((c) => c.status === 'Available') || station.connectors[0];
                            handleStartCharging(station, avail);
                          }}
                        >
                          <Plug size={13} color="#020817" />
                          <Text style={s.listChargeText}>Connect & Charge</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Bottom Station Floating Drawer (Visible on Map Mode) */}
            {mapViewMode === 'map' && (
              <View style={s.mapOverlayBottom}>
                {selectedStation ? (
                  <View style={s.floatingStationCard}>
                    <View style={s.stationCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.stationCardTitle}>{selectedStation.name}</Text>
                        <Text style={s.stationCardAddress}>{selectedStation.address}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedStation(null)} style={s.closeBtn}>
                        <X size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>

                    {/* Connectors pills */}
                    <View style={s.connectorPillRow}>
                      {selectedStation.connectors.map((c) => (
                        <View
                          key={c.id}
                          style={[
                            s.connectorMiniChip,
                            c.status === 'Available' ? s.connectorChipGreen : s.connectorChipBlue,
                          ]}
                        >
                          <Plug size={10} color={c.status === 'Available' ? '#22c55e' : '#60a5fa'} />
                          <Text
                            style={[
                              s.connectorMiniText,
                              { color: c.status === 'Available' ? '#22c55e' : '#93c5fd' },
                            ]}
                          >
                            {c.type} {c.maxPowerKw}kW · {c.status}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Amenities Row */}
                    <View style={s.amenitiesRow}>
                      {selectedStation.amenities.map((item, idx) => (
                        <Text key={idx} style={s.amenityText}>
                          • {item}
                        </Text>
                      ))}
                    </View>

                    {/* Actions */}
                    <View style={s.stationActions}>
                      <TouchableOpacity
                        style={s.navigateBtn}
                        onPress={() => {
                          Alert.alert(
                            'Turn-by-Turn Navigation',
                            `Navigating to ${selectedStation.name} via Liberation Rd.\nEstimated arrival: in ${selectedStation.etaMins} minutes (${selectedStation.distanceKm} km).`
                          );
                        }}
                      >
                        <Navigation size={14} color="#38bdf8" />
                        <Text style={s.navigateBtnText}>Route ({selectedStation.distanceKm} km)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.chargeActionBtn}
                        onPress={() => {
                          const availableConn =
                            selectedStation.connectors.find((c) => c.status === 'Available') || selectedStation.connectors[0];
                          handleStartCharging(selectedStation, availableConn);
                        }}
                      >
                        <Plug size={14} color="#020817" />
                        <Text style={s.chargeActionBtnText}>Connect & Charge</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={s.floatingNearbyPrompt}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MapPin size={16} color="#38bdf8" />
                        <Text style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 13 }}>
                          {stations.length} Accra Fast Charging Hubs Online
                        </Text>
                      </View>
                      <TouchableOpacity onPress={syncBackendData} style={{ padding: 4 }}>
                        <RefreshCw size={14} color="#38bdf8" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
                      Tap any glowing charger pin to inspect live 350 kW telemetry, tariffs, or unlatch cable.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ===================================================
            TAB 2: AUTOMOTIVE CHARGE HUD (Telemetry)
        ==================================================== */}
        {activeTab === 'telemetry' && (
          <ScrollView style={s.tabScroll} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
            {/* Battery SoC Circular Gauge */}
            <View style={s.hudGaugeContainer}>
              <View style={s.socOuterGlowRing}>
                <View style={s.socInnerDial}>
                  <View style={s.chargingBoltBadge}>
                    <BatteryCharging size={16} color={isCharging ? '#22c55e' : '#38bdf8'} />
                  </View>
                  <Text style={s.socPercentageText}>{batterySoc}%</Text>
                  <Text style={s.socStateLabel}>
                    {isCharging ? '350 kW ULTRA-FAST CHARGE' : 'CONNECTED · STANDBY'}
                  </Text>
                  <Text style={s.socTargetText}>
                    Target SoC: {targetSoc}% · ~{Math.max(1, Math.round((targetSoc - batterySoc) * 0.7))} mins left
                  </Text>
                </View>
              </View>

              {/* Dynamic Power Output Meter */}
              <View style={s.powerMeterCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={s.metricLabel}>LIVE POWER DELIVERY</Text>
                  <Text style={s.powerValueHighlight}>{currentKw} kW</Text>
                </View>
                <View style={s.powerProgressBarTrack}>
                  <View
                    style={[
                      s.powerProgressBarFill,
                      { width: `${Math.min(100, Math.round((currentKw / 350) * 100))}%` },
                    ]}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={s.smallSub}>0 kW</Text>
                  <Text style={s.smallSub}>PEAK: 350 kW CCS2</Text>
                </View>
              </View>
            </View>

            {/* High-Precision Automotive Metrics Grid */}
            <View style={s.telemetryGrid}>
              <View style={s.telemetryTile}>
                <View style={s.tileHeader}>
                  <Clock size={13} color="#94a3b8" />
                  <Text style={s.tileLabel}>ELAPSED TIME</Text>
                </View>
                <Text style={s.tileValue}>{formatTime(elapsedSeconds)}</Text>
                <Text style={s.tileSub}>Safety Protocol v2.0</Text>
              </View>

              <View style={s.telemetryTile}>
                <View style={s.tileHeader}>
                  <Activity size={13} color="#22c55e" />
                  <Text style={s.tileLabel}>ENERGY TRANSFERRED</Text>
                </View>
                <Text style={s.tileValue}>{kwhConsumed.toFixed(2)} kWh</Text>
                <Text style={s.tileSub}>Tariff: GH₵ {activeTariffRate.toFixed(2)}/kWh</Text>
              </View>

              <View style={s.telemetryTile}>
                <View style={s.tileHeader}>
                  <Flame size={13} color="#f59e0b" />
                  <Text style={s.tileLabel}>PACK VOLTAGE</Text>
                </View>
                <Text style={s.tileValue}>{packVoltage} V</Text>
                <Text style={s.tileSub}>Nominal: 400V - 800V Architecture</Text>
              </View>

              <View style={s.telemetryTile}>
                <View style={s.tileHeader}>
                  <Battery size={13} color="#38bdf8" />
                  <Text style={s.tileLabel}>PACK CURRENT</Text>
                </View>
                <Text style={s.tileValue}>{packCurrent} A</Text>
                <Text style={s.tileSub}>Liquid-Cooled Cable Active</Text>
              </View>
            </View>

            {/* REAL-TIME BILLING & ESCROW METER */}
            <View style={s.realtimeBillingCard}>
              <View style={s.billingCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Coins size={15} color="#38bdf8" />
                  <Text style={s.billingCardTitle}>REAL-TIME BILLING & ESCROW METER</Text>
                </View>
                <View style={s.billingLiveTag}>
                  <View style={s.billingLiveDot} />
                  <Text style={s.billingLiveTagText}>LIVE CSMS TARIFF</Text>
                </View>
              </View>

              <View style={s.billingAmountRow}>
                <View>
                  <Text style={s.billingAmountLabel}>ACCRUED CHARGE COST</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <Text style={s.billingCurrencySymbol}>GH₵</Text>
                    <Text style={s.billingLiveAmount}>{(kwhConsumed * activeTariffRate).toFixed(2)}</Text>
                  </View>
                </View>

                <View style={s.billingVelocityBox}>
                  <Text style={s.billingVelocityLabel}>RATE OF CHARGE</Text>
                  <Text style={s.billingVelocityVal}>
                    GH₵ {((currentKw / 60) * (activeTariffRate / 60) * 60).toFixed(2)}/hr
                  </Text>
                  <Text style={s.billingVelocitySub}>@ GH₵ {activeTariffRate.toFixed(2)} per kWh</Text>
                </View>
              </View>

              {/* Dynamic Pre-Auth Escrow Tracker */}
              <View style={s.escrowBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Lock size={12} color="#f59e0b" />
                    <Text style={s.escrowLabel}>Pre-Auth Deposit Held:</Text>
                  </View>
                  <Text style={s.escrowDepositValue}>GH₵ {heldBalance.toFixed(2)}</Text>
                </View>

                <View style={s.escrowDivider} />

                {(kwhConsumed * activeTariffRate) <= heldBalance ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.escrowRefundLabel}>Estimated Refund on Unplug:</Text>
                    <Text style={s.escrowRefundValue}>
                      +GH₵ {(heldBalance - (kwhConsumed * activeTariffRate)).toFixed(2)}
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.escrowOverageLabel}>Additional Due at Cable Release:</Text>
                    <Text style={s.escrowOverageValue}>
                      GH₵ {((kwhConsumed * activeTariffRate) - heldBalance).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={s.billingFooterRow}>
                <Smartphone size={12} color="#64748b" />
                <Text style={s.billingFooterText}>
                  Linked: MTN Mobile Money (+233 24 981 4421) · Zero idle fees
                </Text>
              </View>
            </View>

            {/* Target Battery SoC Slider */}
            <View style={s.targetSocSection}>
              <Text style={s.sectionTitle}>TARGET BATTERY LIMIT (OPTIMAL LIFESPAN)</Text>
              <View style={s.targetButtonRow}>
                {[80, 90, 100].map((socValue) => (
                  <TouchableOpacity
                    key={socValue}
                    style={[s.targetSocBtn, targetSoc === socValue && s.targetSocBtnActive]}
                    onPress={() => setTargetSoc(socValue)}
                  >
                    <Text style={[s.targetSocBtnText, targetSoc === socValue && s.targetSocBtnTextActive]}>
                      {socValue}% {socValue === 80 ? '(Daily)' : socValue === 100 ? '(Trip)' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.socAdviceText}>
                Setting an 80% daily target preserves lithium pack health across Ghana's tropical climate conditions.
              </Text>
            </View>


            {/* Secure Protocol & Hardware Verification Banner */}
            <View style={s.csmsBridgeBanner}>
              <View style={s.statusRow}>
                <View style={s.connectedPill}>
                  <ShieldCheck size={12} color="#22c55e" style={{ marginRight: 4 }} />
                  <Text style={s.connectedPillText}>{citrineInfo}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#64748b' }}>Hardware Meter Verified</Text>
              </View>
              <View style={s.preAuthNoticeRow}>
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                  Station: {activeStationName} · Pre-Auth Hold: GH₵ {heldBalance.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[
                s.primaryActionButton,
                isCharging ? { backgroundColor: '#ef4444' } : { backgroundColor: '#22c55e' },
              ]}
              onPress={() => {
                if (isCharging) {
                  handleStopCharging();
                } else {
                  const defaultSt = stations[0];
                  handleStartCharging(defaultSt, defaultSt.connectors[0]);
                }
              }}
            >
              {isCharging ? (
                <>
                  <Lock size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={s.primaryActionText}>DISENGAGE CABLE & SETTLE SESSION</Text>
                </>
              ) : (
                <>
                  <Plug size={18} color="#020817" style={{ marginRight: 8 }} />
                  <Text style={[s.primaryActionText, { color: '#020817' }]}>INITIATE CHARGE AT AIRPORT CITY</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ===================================================
            TAB 3: MOMO WALLET & PRE-AUTH ESCROW
        ==================================================== */}
        {activeTab === 'wallet' && (
          <ScrollView style={s.tabScroll} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
            {/* Holographic Virtual EV Smart Card */}
            <View style={s.walletVirtualCard}>
              <View style={s.cardTopRow}>
                <View>
                  <Text style={s.virtualCardBrand}>XCHARGE PASS</Text>
                  <Text style={s.virtualCardType}>Commercial Driver EV Smart Card</Text>
                </View>
                <View style={s.cardChipIcon}>
                  <Radio size={24} color="#f59e0b" />
                </View>
              </View>

              <View style={{ marginVertical: 14 }}>
                <Text style={s.walletBalanceLabel}>AVAILABLE EV CREDITS</Text>
                <Text style={s.walletBalanceNumber}>GH₵ {walletBalance.toFixed(2)}</Text>
                {heldBalance > 0 && (
                  <View style={s.preAuthBadgeInline}>
                    <Lock size={10} color="#f59e0b" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: 'bold' }}>
                      GH₵ {heldBalance.toFixed(2)} Pre-Auth Held on Terminal
                    </Text>
                  </View>
                )}
              </View>

              <View style={s.cardBottomRow}>
                <View>
                  <Text style={s.cardHolderLabel}>ACCOUNT HOLDER</Text>
                  <Text style={s.cardHolderName}>Kwame Mensah</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.cardHolderLabel}>TERMINAL ID</Text>
                  <Text style={s.cardHolderMono}>XC-GH-0982-PASS</Text>
                </View>
              </View>
            </View>

            {/* Quick MoMo Top-Up Channels */}
            <View style={{ marginBottom: 20 }}>
              <Text style={s.sectionHeaderTitle}>INSTANT MOBILE MONEY TOP-UP</Text>

              {/* Provider Selection */}
              <View style={s.momoProviderGrid}>
                {[
                  { id: 'mtn', name: 'MTN MoMo', code: '*170#', logo: <MtnMomoLogoNative size="sm" /> },
                  { id: 'telecel', name: 'Telecel Cash', code: '*110#', logo: <TelecelLogoNative size="sm" /> },
                  { id: 'at', name: 'Mastercard', code: 'Debit/Credit', logo: <MastercardLogoNative size="sm" /> },
                ].map((prov) => (
                  <TouchableOpacity
                    key={prov.id}
                    style={[s.momoChannelCard, selectedMomoProvider === prov.id && s.momoChannelCardActive]}
                    onPress={() => setSelectedMomoProvider(prov.id as any)}
                  >
                    <View style={{ marginBottom: 6, alignItems: 'center' }}>
                      {prov.logo}
                    </View>
                    <Text style={s.channelName}>{prov.name}</Text>
                    <Text style={s.channelCode}>{prov.code}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preset Amounts */}
              <View style={s.presetAmountRow}>
                {[20, 50, 100, 200].map((amt) => (
                  <TouchableOpacity key={amt} style={s.presetAmountBtn} onPress={() => handleTopUp(amt)}>
                    <Text style={s.presetAmountText}>+GH₵ {amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Amount Top-Up */}
              <View style={s.customAmountInputContainer}>
                <TextInput
                  style={s.customAmountField}
                  placeholder="Enter custom amount in GH₵"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={customTopupAmount}
                  onChangeText={setCustomTopupAmount}
                />
                <TouchableOpacity
                  style={s.customTopupBtn}
                  onPress={() => {
                    handleTopUp(parseFloat(customTopupAmount));
                  }}
                >
                  <Plus size={16} color="#020817" />
                  <Text style={s.customTopupBtnText}>Top Up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pre-Authorization Security Explanation */}
            <View style={s.securityNoticeBox}>
              <ShieldCheck size={16} color="#22c55e" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.securityTitle}>Automated Pre-Auth Escrow System</Text>
                <Text style={s.securityDesc}>
                  Charging dispensers require a GH₵ 25.00 temporary hold to authenticate line safety. Any unconsumed balance is instantly credited back upon cable detachment.
                </Text>
              </View>
            </View>

            {/* Transaction Ledger */}
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={s.sectionHeaderTitle}>TRANSACTION LEDGER</Text>
                <TouchableOpacity onPress={syncBackendData} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={12} color="#38bdf8" />
                  <Text style={{ fontSize: 11, color: '#38bdf8' }}>Sync</Text>
                </TouchableOpacity>
              </View>

              {transactions.map((tx) => (
                <View key={tx.id} style={s.transactionRowCard}>
                  <View style={s.txIconBox}>
                    {tx.isCredit ? <ArrowUpRight size={16} color="#22c55e" /> : <Plug size={16} color="#38bdf8" />}
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={s.txTitle}>{tx.title}</Text>
                    <Text style={s.txSubtitle}>{tx.subtitle}</Text>
                    <Text style={s.txTimestamp}>{tx.timestamp}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.txAmount, { color: tx.isCredit ? '#22c55e' : '#f8fafc' }]}>
                      {tx.isCredit ? '+' : '-'}GH₵ {tx.amount.toFixed(2)}
                    </Text>
                    {tx.kwh && <Text style={s.txKwh}>{tx.kwh} kWh</Text>}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ===================================================
            TAB 4: COMMERCIAL FLEET VIN MANAGEMENT (ISO 15118)
        ==================================================== */}
        {activeTab === 'fleet' && (
          <ScrollView style={s.tabScroll} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
            {/* Corporate Credit Overview */}
            <View style={s.fleetCreditCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={s.fleetCreditTitle}>
                    {fleetAccount?.companyName || 'Apex Logistics & Express EV Fleet'}
                  </Text>
                  <Text style={s.fleetCreditAccount}>
                    Account: {fleetAccount?.billingAccountNo || 'CORP-XC-88402'} · ISO 15118
                  </Text>
                </View>
                <View style={s.fleetStatusBadge}>
                  <Text style={s.fleetStatusText}>ACTIVE FLEET</Text>
                </View>
              </View>

              <View style={s.creditProgressBarContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={s.creditMetricLabel}>CORPORATE CREDIT UTILIZATION</Text>
                  <Text style={s.creditMetricValue}>
                    GH₵ {fleetAccount?.currentUtilization.toFixed(2) || '1,420.50'} / GH₵ {fleetAccount?.creditLimit.toFixed(2) || '5,000.00'}
                  </Text>
                </View>
                <View style={s.creditTrack}>
                  <View
                    style={[
                      s.creditFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((fleetAccount?.currentUtilization || 1420.5) / (fleetAccount?.creditLimit || 5000)) * 100
                          )
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Vehicle List */}
            <View style={{ marginTop: 20 }}>
              <Text style={s.sectionHeaderTitle}>REGISTERED FLEET VEHICLES ({fleetVehicles.length})</Text>

              {fleetVehicles.map((vehicle) => (
                <View key={vehicle.vin} style={s.vehicleCard}>
                  <View style={s.vehicleTopRow}>
                    <View style={s.vehicleIconBadge}>
                      <Car size={18} color="#38bdf8" />
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={s.vehicleModel}>{vehicle.model}</Text>
                      <Text style={s.vehiclePlate}>Plate: {vehicle.plate} · Driver: {vehicle.driver}</Text>
                    </View>
                    <View style={s.socPill}>
                      <Battery size={12} color={vehicle.soc > 50 ? '#22c55e' : '#f59e0b'} />
                      <Text style={[s.socText, { color: vehicle.soc > 50 ? '#22c55e' : '#f59e0b' }]}>
                        {vehicle.soc}%
                      </Text>
                    </View>
                  </View>

                  <View style={s.batteryProgressBar}>
                    <View
                      style={[
                        s.batteryProgressBarFill,
                        {
                          width: `${vehicle.soc}%`,
                          backgroundColor: vehicle.soc > 50 ? '#22c55e' : '#f59e0b',
                        },
                      ]}
                    />
                  </View>

                  <View style={s.vinSpecsBox}>
                    <Text style={s.vinLabel}>CHASSIS VIN:</Text>
                    <Text style={s.vinMonoText}>{vehicle.vin}</Text>
                  </View>

                  {/* ISO 15118 Plug & Charge Toggle */}
                  <View style={s.plugAndChargeRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Plug size={14} color={vehicle.isPlugAndChargeEnabled ? '#22c55e' : '#94a3b8'} />
                        <Text style={s.plugAndChargeTitle}>ISO 15118 Plug & Charge</Text>
                      </View>
                      <Text style={s.plugAndChargeSub}>
                        Automatic TLS 1.3 cryptographic handshake upon cable insertion.
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => togglePlugAndCharge(vehicle.vin)}
                      style={[
                        s.miniToggleBtn,
                        vehicle.isPlugAndChargeEnabled ? s.miniToggleActive : s.miniToggleInactive,
                      ]}
                    >
                      <Text
                        style={[
                          s.miniToggleText,
                          { color: vehicle.isPlugAndChargeEnabled ? '#22c55e' : '#94a3b8' },
                        ]}
                      >
                        {vehicle.isPlugAndChargeEnabled ? 'ENABLED' : 'DISABLED'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Edge-to-Edge Bottom Navigation Bar */}
      <View style={[s.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.navItem, isActive && s.navItemActive]}
              onPress={() => {
                setActiveTab(tab.key as any);
                activateImmersive();
              }}
              activeOpacity={0.7}
            >
              <Icon size={20} color={isActive ? '#38bdf8' : '#64748b'} />
              <Text style={[s.navLabel, isActive && s.navLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Driver Preferences & Settings Modal (Encapsulated) */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Settings size={18} color="#38bdf8" />
                <Text style={s.modalStationTitle}>Driver Preferences & Settings</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)} style={s.modalCloseBtn}>
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Authenticated Node Profile */}
              <View style={{ backgroundColor: '#0a0e14', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#00f0ff33', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#00f0ff', letterSpacing: 1 }}>AUTHENTICATED NODE</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#00e676' }} />
                    <Text style={{ fontSize: 10, color: '#00e676', fontWeight: '700' }}>ONLINE</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>
                  {currentUser?.displayName || 'Kofi Mensah'}
                </Text>
                <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
                  {currentUser?.phoneNumber || '+233 24 890 1204'} · {currentUser?.accountType === 'fleet' ? 'Fleet Operator' : 'Personal Driver'}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#181c22',
                    borderWidth: 1,
                    borderColor: '#ff4d4d44',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                  onPress={async () => {
                    await SessionStorage.clearSession();
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                    setAuthScreen('login');
                    setShowSettingsModal(false);
                  }}
                >
                  <Text style={{ color: '#ff4d4d', fontSize: 12, fontWeight: '700' }}>← Sign Out / Switch Account</Text>
                </TouchableOpacity>
              </View>

              {/* Charging Preferences */}
              <Text style={s.modalSectionLabel}>CHARGING & HARDWARE PREFERENCES</Text>

              <View style={s.prefRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={s.prefTitle}>Auto-Release Charging Cable</Text>
                  <Text style={s.prefSubtitle}>Automatically disengage physical connector lock once session is settled</Text>
                </View>
                <Switch
                  value={autoUnlockCable}
                  onValueChange={setAutoUnlockCable}
                  trackColor={{ false: '#1e293b', true: '#0369a1' }}
                  thumbColor={autoUnlockCable ? '#38bdf8' : '#94a3b8'}
                />
              </View>

              <View style={s.prefDivider} />

              <View style={s.prefRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={s.prefTitle}>Push Charging Alerts</Text>
                  <Text style={s.prefSubtitle}>Real-time push notifications when battery reaches 80% or charge stops</Text>
                </View>
                <Switch
                  value={pushAlertsEnabled}
                  onValueChange={setPushAlertsEnabled}
                  trackColor={{ false: '#1e293b', true: '#0369a1' }}
                  thumbColor={pushAlertsEnabled ? '#38bdf8' : '#94a3b8'}
                />
              </View>

              <View style={s.prefDivider} />

              <View style={s.prefRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={s.prefTitle}>MoMo SMS Receipts</Text>
                  <Text style={s.prefSubtitle}>Dispatches instant payment confirmation to registered mobile number</Text>
                </View>
                <Switch
                  value={smsReceiptsEnabled}
                  onValueChange={setSmsReceiptsEnabled}
                  trackColor={{ false: '#1e293b', true: '#0369a1' }}
                  thumbColor={smsReceiptsEnabled ? '#38bdf8' : '#94a3b8'}
                />
              </View>

              {/* Cloud Connection & Safety */}
              <Text style={[s.modalSectionLabel, { marginTop: 16 }]}>SYSTEM & CLOUD SYNCHRONIZATION</Text>
              <View style={s.statusCardBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} color={isBackendOnline ? '#22c55e' : '#f59e0b'} />
                    <Text style={{ color: isBackendOnline ? '#22c55e' : '#f59e0b', fontWeight: 'bold', fontSize: 13 }}>
                      {isBackendOnline ? 'CitrineOS Cloud CSMS Online' : 'Connecting to Cloud Backend...'}
                    </Text>
                  </View>
                  <View style={[s.onlineDot, { backgroundColor: isBackendOnline ? '#22c55e' : '#f59e0b' }]} />
                </View>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
                  Endpoint: {BACKEND_URL}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>
                  Real-time OCPP 2.0.1 telemetry, simulated EV charging curve physics, and MoMo pre-auth billing active.
                </Text>

                {/* Quick 1-Tap Connect and Ping Actions */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[s.settingsResetBtn, { flex: 1, backgroundColor: '#0f2744', borderColor: '#38bdf8' }]}
                    onPress={() => {
                      setBackendUrl(CLOUD_BACKEND_URL);
                      setCustomBackendInput(CLOUD_BACKEND_URL);
                      syncBackendData();
                      Alert.alert('Cloud Backend Active', 'Connected to production Cloud Run CSMS server.');
                    }}
                  >
                    <Text style={[s.settingsResetText, { color: '#38bdf8' }]}>Cloud CSMS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.settingsResetBtn, { flex: 1 }]}
                    onPress={async () => {
                      const t0 = Date.now();
                      try {
                        const h = await api.checkHealth();
                        const latency = Date.now() - t0;
                        if (h.online) {
                          Alert.alert('Ping Success', `Backend reachable at ${latency}ms latency.\nCitrineOS version: ${h.version || 'v2.4.1'}`);
                        } else {
                          Alert.alert('Ping Failed', 'Server did not return healthy status. Check device internet connection.');
                        }
                      } catch (e: any) {
                        Alert.alert('Connection Error', `Could not reach ${BACKEND_URL}. Ensure device has internet access.`);
                      }
                      syncBackendData();
                    }}
                  >
                    <Text style={s.settingsResetText}>Ping Server</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Developer Custom Host Override */}
              <TouchableOpacity
                style={{ marginTop: 14, alignItems: 'center', paddingVertical: 6 }}
                onPress={() => setDevModeUnlocked(!devModeUnlocked)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#64748b', fontSize: 11 }}>
                  {devModeUnlocked ? '▲ Hide Custom IP Settings' : '▼ Configure Custom Server IP / Wi-Fi'}
                </Text>
              </TouchableOpacity>

              {devModeUnlocked && (
                <View style={{ marginTop: 8, padding: 12, backgroundColor: '#020817', borderRadius: 10, borderWidth: 1, borderColor: '#334155' }}>
                  <Text style={[s.modalSectionLabel, { color: '#f59e0b' }]}>CUSTOM SERVER IP (LOCAL DEV)</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>
                    Enter your computer's local Wi-Fi IP (e.g., http://192.168.1.50:3000) if hosting backend locally:
                  </Text>
                  <TextInput
                    style={s.settingsInput}
                    value={customBackendInput}
                    onChangeText={setCustomBackendInput}
                    placeholder="http://192.168.1.X:3000"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={s.settingsResetBtn}
                      onPress={() => {
                        setCustomBackendInput(CLOUD_BACKEND_URL);
                        setBackendUrl(CLOUD_BACKEND_URL);
                        syncBackendData();
                        Alert.alert('Reset Complete', 'Restored to Cloud Run endpoint.');
                      }}
                    >
                      <Text style={s.settingsResetText}>Reset to Cloud</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.settingsApplyBtn}
                      onPress={() => {
                        setBackendUrl(customBackendInput);
                        syncBackendData();
                        Alert.alert('Backend Updated', `Connecting to ${customBackendInput}`);
                      }}
                    >
                      <Text style={s.settingsApplyText}>Save & Apply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[s.settingsApplyBtn, { width: '100%', marginTop: 16, marginBottom: 8, paddingVertical: 14 }]}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={s.settingsApplyText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===================================================
          REAL-TIME GHANA MOBILE MONEY CHECKOUT & USSD MODAL
      ==================================================== */}
      <Modal
        visible={showMomoPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (momoStep !== 'DISPATCHING') setShowMomoPaymentModal(false);
        }}
      >
        <View style={s.modalOverlayDark}>
          <View style={s.momoModalCard}>
            {/* Modal Top Header */}
            <View style={s.momoModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ borderRadius: 8, overflow: 'hidden' }}>
                  {selectedMomoProvider === 'mtn' ? (
                    <MtnMomoLogoNative size="icon" />
                  ) : selectedMomoProvider === 'telecel' ? (
                    <TelecelLogoNative size="icon" />
                  ) : (
                    <MastercardLogoNative size="icon" />
                  )}
                </View>
                <View>
                  <Text style={s.momoModalTitle}>
                    {momoStep === 'INPUT' ? 'MOBILE MONEY TOP-UP' :
                     momoStep === 'DISPATCHING' ? 'CONNECTING TELCO GATEWAY' :
                     momoStep === 'USSD_PROMPT' ? 'AUTHORIZE USSD PUSH' :
                     'PAYMENT RECEIPT'}
                  </Text>
                  <Text style={s.momoModalSub}>
                    {selectedMomoProvider === 'mtn' ? 'MTN MoMo (*170#)' :
                     selectedMomoProvider === 'telecel' ? 'Telecel Cash (*110#)' :
                     'Mastercard Debit'} · Instant Escrow
                  </Text>
                </View>
              </View>

              {momoStep !== 'DISPATCHING' && (
                <TouchableOpacity
                  style={s.momoCloseBtn}
                  onPress={() => setShowMomoPaymentModal(false)}
                >
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* STEP 1: INPUT & RECHARGE AMOUNT */}
            {momoStep === 'INPUT' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
                {/* Telco Selector Pills */}
                <Text style={s.momoFieldLabel}>SELECT PAYMENT GATEWAY / NETWORK</Text>
                <View style={s.momoNetPillRow}>
                  {[
                    { id: 'mtn', name: 'MTN MoMo', color: '#fbbf24', logo: <MtnMomoLogoNative size="icon" /> },
                    { id: 'telecel', name: 'Telecel', color: '#ef4444', logo: <TelecelLogoNative size="icon" /> },
                    { id: 'at', name: 'Mastercard', color: '#f59e0b', logo: <MastercardLogoNative size="icon" /> },
                  ].map((prov) => (
                    <TouchableOpacity
                      key={prov.id}
                      style={[
                        s.momoNetPill,
                        { paddingVertical: 6, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
                        selectedMomoProvider === prov.id && {
                          borderColor: prov.color,
                          backgroundColor: `${prov.color}20`,
                        },
                      ]}
                      onPress={() => setSelectedMomoProvider(prov.id as any)}
                    >
                      <View style={{ transform: [{ scale: 0.75 }] }}>
                        {prov.logo}
                      </View>
                      <Text style={[
                        s.momoNetPillText,
                        selectedMomoProvider === prov.id && { color: '#ffffff', fontWeight: 'bold' }
                      ]}>
                        {prov.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Amount Selection */}
                <Text style={[s.momoFieldLabel, { marginTop: 14 }]}>CHOOSE TOP-UP AMOUNT (GHS)</Text>
                <View style={s.momoPresetGrid}>
                  {[20, 50, 100, 200].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[
                        s.momoPresetChip,
                        momoAmount === amt && s.momoPresetChipActive,
                      ]}
                      onPress={() => setMomoAmount(amt)}
                    >
                      <Text style={[
                        s.momoPresetChipText,
                        momoAmount === amt && s.momoPresetChipTextActive,
                      ]}>
                        GH₵ {amt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Phone Number Input */}
                <Text style={[s.momoFieldLabel, { marginTop: 14 }]}>SUBSCRIBER MOBILE NUMBER</Text>
                <View style={s.momoPhoneRow}>
                  <View style={s.ghanaFlagBox}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#f8fafc' }}>🇬🇭 +233</Text>
                  </View>
                  <TextInput
                    style={s.momoPhoneInput}
                    value={momoPhone}
                    onChangeText={setMomoPhone}
                    placeholder="24 981 4421"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Bill Breakdown Summary */}
                <View style={s.momoSummaryBox}>
                  <View style={s.momoSummaryRow}>
                    <Text style={s.momoSummaryLabel}>Top-up Value:</Text>
                    <Text style={s.momoSummaryVal}>GH₵ {momoAmount.toFixed(2)}</Text>
                  </View>
                  <View style={s.momoSummaryRow}>
                    <Text style={s.momoSummaryLabel}>EV Mobility Subsidy:</Text>
                    <Text style={[s.momoSummaryVal, { color: '#22c55e' }]}>FREE (0% Fee)</Text>
                  </View>
                  <View style={s.momoSummaryDivider} />
                  <View style={s.momoSummaryRow}>
                    <Text style={s.momoSummaryTotalLabel}>Total Payable:</Text>
                    <Text style={s.momoSummaryTotalVal}>GH₵ {momoAmount.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={s.momoSubmitBtn}
                  onPress={handleDispatchMomoUssd}
                >
                  <Send size={16} color="#020817" />
                  <Text style={s.momoSubmitBtnText}>
                    DISPATCH LIVE USSD PUSH (GH₵ {momoAmount})
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* STEP 2: DISPATCHING / CONNECTING */}
            {momoStep === 'DISPATCHING' && (
              <View style={s.momoLoaderBox}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={s.momoLoaderTitle}>Connecting Telco Gateway...</Text>
                <Text style={s.momoLoaderSub}>
                  Sending encrypted USSD session request to {selectedMomoProvider.toUpperCase()} Network for GH₵ {momoAmount.toFixed(2)}.
                </Text>
              </View>
            )}

            {/* STEP 3: AUTHENTIC USSD PUSH DIALOG */}
            {momoStep === 'USSD_PROMPT' && (
              <View style={{ paddingVertical: 10 }}>
                {/* Ghana Telco USSD Box */}
                <View style={[
                  s.ussdContainer,
                  selectedMomoProvider === 'mtn' ? { borderColor: '#fbbf24' } :
                  selectedMomoProvider === 'telecel' ? { borderColor: '#ef4444' } :
                  { borderColor: '#38bdf8' }
                ]}>
                  {/* Telco USSD Banner */}
                  <View style={[
                    s.ussdBanner,
                    selectedMomoProvider === 'mtn' ? { backgroundColor: '#fbbf24' } :
                    selectedMomoProvider === 'telecel' ? { backgroundColor: '#ef4444' } :
                    { backgroundColor: '#38bdf8' }
                  ]}>
                    <Text style={s.ussdBannerTitle}>
                      {selectedMomoProvider === 'mtn' ? 'MTN MOBILE MONEY' :
                       selectedMomoProvider === 'telecel' ? 'TELECEL CASH' :
                       'AT MONEY'}
                    </Text>
                    <Text style={s.ussdPromptTimer}>Expires: {momoCountdown}s</Text>
                  </View>

                  {/* USSD Body Text */}
                  <View style={s.ussdContent}>
                    <Text style={s.ussdPromptText}>
                      Authorize transfer of GHS {momoAmount.toFixed(2)} to XCHARGE GHANA LTD?
                    </Text>
                    <Text style={s.ussdRefText}>
                      Ref: {momoNetworkRef} · Fee: GHS 0.00
                    </Text>

                    {/* PIN Display Dots */}
                    <View style={s.ussdPinDotsRow}>
                      {[0, 1, 2, 3].map((idx) => (
                        <View
                          key={idx}
                          style={[
                            s.ussdPinDot,
                            momoPin.length > idx && s.ussdPinDotFilled,
                          ]}
                        />
                      ))}
                    </View>

                    {/* Keypad */}
                    <View style={s.keypadGrid}>
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                        <TouchableOpacity
                          key={k}
                          style={s.keypadBtn}
                          onPress={() => {
                            if (k === '⌫') {
                              setMomoPin((prev) => prev.slice(0, -1));
                            } else if (k === 'C') {
                              setMomoPin('');
                            } else if (momoPin.length < 4) {
                              const next = momoPin + k;
                              setMomoPin(next);
                              if (next.length === 4) {
                                setTimeout(() => handleConfirmMomoPin(next), 200);
                              }
                            }
                          }}
                        >
                          <Text style={s.keypadBtnText}>{k}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Quick Fill & Authorize Button */}
                <TouchableOpacity
                  style={s.ussdQuickAuthBtn}
                  onPress={() => handleConfirmMomoPin('1234')}
                >
                  <CheckCircle2 size={16} color="#020817" />
                  <Text style={s.ussdQuickAuthText}>Quick Authorize (Auto-Verify PIN)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 4: RECEIPT & GRA INVOICE */}
            {momoStep === 'RECEIPT' && (
              <View style={s.receiptBox}>
                <View style={s.receiptSuccessIconBox}>
                  <CheckCircle2 size={42} color="#22c55e" />
                </View>
                <Text style={s.receiptTitle}>PAYMENT SETTLED</Text>
                <Text style={s.receiptAmountText}>GH₵ {momoAmount.toFixed(2)}</Text>
                <Text style={s.receiptSub}>Credited immediately to your XCharge pass</Text>

                {/* Official Invoice Card */}
                <View style={s.receiptInvoiceCard}>
                  <View style={s.invoiceRow}>
                    <Text style={s.invoiceLabel}>Transaction Ref:</Text>
                    <Text style={s.invoiceVal}>{momoNetworkRef}</Text>
                  </View>
                  <View style={s.invoiceRow}>
                    <Text style={s.invoiceLabel}>Approval Auth:</Text>
                    <Text style={s.invoiceVal}>{momoReceiptData?.approvalCode || 'MTN-AUTH-9182746'}</Text>
                  </View>
                  <View style={s.invoiceRow}>
                    <Text style={s.invoiceLabel}>GRA E-Levy Exemption:</Text>
                    <Text style={[s.invoiceVal, { color: '#22c55e' }]}>
                      {momoReceiptData?.graTaxInvoice || 'GRA-ELEV-EXEMPT-89142'}
                    </Text>
                  </View>
                  <View style={s.momoSummaryDivider} />
                  <View style={s.invoiceRow}>
                    <Text style={s.invoiceLabelBold}>Updated Available Balance:</Text>
                    <Text style={s.invoiceValBold}>GH₵ {walletBalance.toFixed(2)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={s.receiptCloseBtn}
                  onPress={() => setShowMomoPaymentModal(false)}
                >
                  <Text style={s.receiptCloseText}>RETURN TO WALLET</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ===================================================
          REAL-TIME CHARGING SESSION SETTLEMENT & UNLATCH MODAL
      ==================================================== */}
      <Modal
        visible={showSettlementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!isSettling) setShowSettlementModal(false);
        }}
      >
        <View style={s.modalOverlayDark}>
          <View style={s.settleModalCard}>
            {/* Header */}
            <View style={s.settleModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={s.settleIconBox}>
                  <Coins size={18} color="#38bdf8" />
                </View>
                <View>
                  <Text style={s.settleModalTitle}>SESSION SETTLEMENT</Text>
                  <Text style={s.settleModalSub}>Real-Time Energy Reconciliation</Text>
                </View>
              </View>

              {!isSettling && (
                <TouchableOpacity
                  style={s.momoCloseBtn}
                  onPress={() => setShowSettlementModal(false)}
                >
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
              {/* Station Info Chip */}
              <View style={s.settleStationChip}>
                <Plug size={14} color="#38bdf8" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={s.settleStationName}>{activeStationName}</Text>
                  <Text style={s.settleConnectorName}>{activeConnectorType}</Text>
                </View>
              </View>

              {/* Real-time Meter Reconciliation Table */}
              <View style={s.settleTable}>
                <View style={s.settleTableRow}>
                  <Text style={s.settleTableLabel}>Session Duration:</Text>
                  <Text style={s.settleTableVal}>{formatTime(elapsedSeconds)}</Text>
                </View>
                <View style={s.settleTableRow}>
                  <Text style={s.settleTableLabel}>Gross Energy Delivered:</Text>
                  <Text style={s.settleTableVal}>{kwhConsumed.toFixed(2)} kWh</Text>
                </View>
                <View style={s.settleTableRow}>
                  <Text style={s.settleTableLabel}>Applied Live Tariff:</Text>
                  <Text style={s.settleTableVal}>GH₵ {activeTariffRate.toFixed(2)} / kWh</Text>
                </View>
                <View style={s.settleTableRow}>
                  <Text style={s.settleTableLabelBold}>Gross Accrued Cost:</Text>
                  <Text style={s.settleTableValBold}>
                    GH₵ {(kwhConsumed * activeTariffRate).toFixed(2)}
                  </Text>
                </View>
                <View style={s.settleTableDivider} />
                <View style={s.settleTableRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Lock size={12} color="#f59e0b" />
                    <Text style={s.settleTableLabel}>Pre-Auth Deposit Held:</Text>
                  </View>
                  <Text style={[s.settleTableVal, { color: '#f59e0b' }]}>
                    -GH₵ {heldBalance.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Escrow Reconciliation Highlight Card */}
              {(kwhConsumed * activeTariffRate) <= heldBalance ? (
                <View style={s.settleRefundCard}>
                  <CheckCircle2 size={18} color="#22c55e" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={s.settleRefundTitle}>
                      REFUND TO WALLET: +GH₵ {(heldBalance - (kwhConsumed * activeTariffRate)).toFixed(2)}
                    </Text>
                    <Text style={s.settleRefundSub}>
                      Your pre-authorization deposit exceeded usage. Remaining credits are returned immediately.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={s.settleDueCard}>
                  <Lock size={18} color="#f59e0b" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={s.settleDueTitle}>
                      NET BALANCE DUE: GH₵ {((kwhConsumed * activeTariffRate) - heldBalance).toFixed(2)}
                    </Text>
                    <Text style={s.settleDueSub}>
                      Will be settled from your available MoMo balance upon connector release.
                    </Text>
                  </View>
                </View>
              )}

              {/* Settlement Channel Selector */}
              <Text style={[s.momoFieldLabel, { marginTop: 14 }]}>CHOOSE SETTLEMENT METHOD</Text>
              <View style={s.settleMethodList}>
                {/* MTN MoMo */}
                <TouchableOpacity
                  style={[
                    s.settleMethodOption,
                    settlementPaymentMethod === 'MOMO_MTN' && s.settleMethodOptionActive,
                  ]}
                  onPress={() => setSettlementPaymentMethod('MOMO_MTN')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MtnMomoLogoNative size="icon" />
                    <View>
                      <Text style={s.settleMethodText}>MTN Mobile Money (*170#)</Text>
                      <Text style={s.settleMethodSub}>Charge +233 24 981 4421 directly</Text>
                    </View>
                  </View>
                  <View style={[
                    s.settleRadioDot,
                    settlementPaymentMethod === 'MOMO_MTN' && s.settleRadioDotActive,
                  ]} />
                </TouchableOpacity>

                {/* Telecel Cash */}
                <TouchableOpacity
                  style={[
                    s.settleMethodOption,
                    settlementPaymentMethod === 'MOMO_TELECEL' && s.settleMethodOptionActive,
                  ]}
                  onPress={() => setSettlementPaymentMethod('MOMO_TELECEL')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TelecelLogoNative size="icon" />
                    <View>
                      <Text style={s.settleMethodText}>Telecel Cash (*110#)</Text>
                      <Text style={s.settleMethodSub}>Charge +233 20 412 8890 directly</Text>
                    </View>
                  </View>
                  <View style={[
                    s.settleRadioDot,
                    settlementPaymentMethod === 'MOMO_TELECEL' && s.settleRadioDotActive,
                  ]} />
                </TouchableOpacity>

                {/* Mastercard Debit */}
                <TouchableOpacity
                  style={[
                    s.settleMethodOption,
                    settlementPaymentMethod === 'CARD_MASTERCARD' && s.settleMethodOptionActive,
                  ]}
                  onPress={() => setSettlementPaymentMethod('CARD_MASTERCARD')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MastercardLogoNative size="icon" />
                    <View>
                      <Text style={s.settleMethodText}>Mastercard Debit (•••• 4091)</Text>
                      <Text style={s.settleMethodSub}>3D Secure Instant Clearing</Text>
                    </View>
                  </View>
                  <View style={[
                    s.settleRadioDot,
                    settlementPaymentMethod === 'CARD_MASTERCARD' && s.settleRadioDotActive,
                  ]} />
                </TouchableOpacity>

                {/* XCharge Pass Balance */}
                <TouchableOpacity
                  style={[
                    s.settleMethodOption,
                    settlementPaymentMethod === 'WALLET' && s.settleMethodOptionActive,
                  ]}
                  onPress={() => setSettlementPaymentMethod('WALLET')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#0284c7', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={18} color="#ffffff" />
                    </View>
                    <View>
                      <Text style={s.settleMethodText}>XCharge Pass Balance</Text>
                      <Text style={s.settleMethodSub}>Available: GH₵ {walletBalance.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={[
                    s.settleRadioDot,
                    settlementPaymentMethod === 'WALLET' && s.settleRadioDotActive,
                  ]} />
                </TouchableOpacity>
              </View>

              {/* Authorize & Unlatch Button */}
              <TouchableOpacity
                style={[s.settleSubmitBtn, isSettling && { opacity: 0.6 }]}
                disabled={isSettling}
                onPress={handleExecuteSettlement}
              >
                {isSettling ? (
                  <ActivityIndicator size="small" color="#020817" />
                ) : (
                  <Unlock size={18} color="#020817" />
                )}
                <Text style={s.settleSubmitText}>
                  {isSettling ? 'RELEASING CONNECTOR SOLENOID...' : 'AUTHORIZE PAYMENT & UNLATCH CABLE'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SPLASH_VIDEO = require('./assets/splash-video.mp4');

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [dotText, setDotText] = useState('');
  const { width, height } = Dimensions.get('window');
  const hasFinished = useRef(false);

  const player = useVideoPlayer(SPLASH_VIDEO, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  const finish = () => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => onFinish());
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      try { NavigationBar.setVisibilityAsync('hidden').catch(() => {}); } catch (e) {}
    }
    StatusBar.setHidden(true, 'none');

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 8000,
      useNativeDriver: false,
    }).start();

    let dotCount = 0;
    const dotInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      setDotText('.'.repeat(dotCount));
    }, 400);

    const safetyTimer = setTimeout(finish, 8000);

    const sub = player.addListener('playingChange', (event) => {
      if (!event.isPlaying && hasFinished.current === false) {
        setTimeout(finish, 300);
      }
    });

    return () => {
      clearInterval(dotInterval);
      clearTimeout(safetyTimer);
      sub.remove();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[ss.splashRoot, { opacity: fadeAnim, width, height }]}>
      <StatusBar hidden={true} translucent={true} backgroundColor="#000000" />
      <VideoView
        player={player}
        style={ss.splashVideo}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={ss.splashOverlay}>
        <View style={ss.splashBrand}>
          <XChargeLogoNative width={210} height={60} showSubtitle={true} />
        </View>

        <View style={ss.loadingSection}>
          <View style={ss.progressTrack}>
            <Animated.View style={[ss.progressBar, { width: progressWidth }]} />
          </View>
          <View style={ss.loadingTextRow}>
            <View style={ss.dot} />
            <Text style={ss.loadingText}>Loading</Text>
            <Text style={ss.loadingDots}>{dotText}</Text>
          </View>
        </View>

        <Text style={ss.versionText}>v1.0.0 · CitrineOS</Text>
      </View>
    </Animated.View>
  );
}

export default function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      try { NavigationBar.setVisibilityAsync('hidden').catch(() => {}); } catch (e) {}
    }
    StatusBar.setHidden(true, 'none');
  }, []);

  return (
    <SafeAreaProvider>
      {!isSplashDone ? (
        <SplashScreen onFinish={() => setIsSplashDone(true)} />
      ) : (
        <AppContent />
      )}
    </SafeAreaProvider>
  );
}

const ss = StyleSheet.create({
  splashRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#000',
  },
  splashVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  splashOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 56,
    paddingTop: 80,
    backgroundColor: 'rgba(2,8,23,0.72)',
    alignItems: 'center',
  },
  splashBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  splashBrandName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1.5,
  },
  loadingSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 2,
  },
  loadingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  loadingDots: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38bdf8',
    width: 20,
  },
  versionText: {
    position: 'absolute',
    bottom: 48,
    fontSize: 11,
    color: '#1e293b',
    letterSpacing: 1,
  },
});

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020817',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0b1324',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  backendStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  backendOnline: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  backendOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  modeToggleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeFleet: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: '#f59e0b',
  },
  badgePersonal: {
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderColor: '#38bdf8',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeFleetText: {
    color: '#fbbf24',
  },
  badgePersonalText: {
    color: '#38bdf8',
  },
  settingsIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#020817',
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  tabScroll: {
    flex: 1,
    backgroundColor: '#020817',
  },

  // Map Filter Bar
  mapFilterBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 15,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 19, 36, 0.95)',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  viewToggleChip: {
    backgroundColor: '#0f2744',
    borderColor: '#38bdf8',
  },
  filterChipActive: {
    backgroundColor: '#0f2744',
    borderColor: '#38bdf8',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterChipTextActive: {
    color: '#38bdf8',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  // List View Styles
  listSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 12,
  },
  stationListCard: {
    backgroundColor: '#0b1324',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 12,
  },
  stationListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stationListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  stationListAddress: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  powerHighlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  powerHighlightText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
  },
  stationListMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  connectorChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  miniConnectorChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniChipAvailable: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  miniChipBusy: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  miniConnectorText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stationListActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  listRouteBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#020817',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  listRouteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  listChargeBtn: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#38bdf8',
  },
  listChargeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#020817',
  },

  // Map Overlay Bottom Drawer
  mapOverlayBottom: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  floatingNearbyPrompt: {
    backgroundColor: 'rgba(11, 19, 36, 0.94)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingStationCard: {
    backgroundColor: '#0b1324',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  stationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stationCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  stationCardAddress: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  connectorPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  connectorMiniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  connectorChipGreen: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: '#22c55e',
  },
  connectorChipBlue: {
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderColor: '#38bdf8',
  },
  connectorMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  amenityText: {
    fontSize: 10,
    color: '#64748b',
  },
  stationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#020817',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
  },
  navigateBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  chargeActionBtn: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 10,
  },
  chargeActionBtnText: {
    color: '#020817',
    fontSize: 12,
    fontWeight: '800',
  },

  // Charge HUD Telemetry Styles
  hudGaugeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  socOuterGlowRing: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 3,
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56,189,248,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  socInnerDial: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#0b1324',
    borderWidth: 2,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  chargingBoltBadge: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(56,189,248,0.12)',
    marginBottom: 2,
  },
  socPercentageText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  socStateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
    marginTop: 2,
  },
  socTargetText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  powerMeterCard: {
    width: '100%',
    backgroundColor: '#0b1324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginTop: 16,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  powerValueHighlight: {
    fontSize: 14,
    fontWeight: '900',
    color: '#38bdf8',
  },
  powerProgressBarTrack: {
    height: 8,
    backgroundColor: '#020817',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  powerProgressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4,
  },
  smallSub: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  telemetryTile: {
    width: '48%',
    backgroundColor: '#0b1324',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  tileValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 2,
  },
  tileSub: {
    fontSize: 10,
    color: '#64748b',
  },
  targetSocSection: {
    backgroundColor: '#0b1324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 10,
  },
  targetButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  targetSocBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#020817',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  targetSocBtnActive: {
    backgroundColor: '#0f2744',
    borderColor: '#38bdf8',
  },
  targetSocBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  targetSocBtnTextActive: {
    color: '#38bdf8',
  },
  socAdviceText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 10,
    lineHeight: 14,
  },
  csmsBridgeBanner: {
    backgroundColor: '#0b1324',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  activePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  connectedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22c55e',
  },
  preAuthNoticeRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  primaryActionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Real-time Station Hardware Simulator & Telemetry Styles
  simPanelCard: {
    backgroundColor: '#0b1324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 16,
  },
  simPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  simPanelTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.8,
  },
  simLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  simLiveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f59e0b',
  },
  simExplainerText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 10,
  },
  simSubLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  simChipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  simChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#020817',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  simChipActive: {
    backgroundColor: '#0f2744',
    borderColor: '#38bdf8',
  },
  simChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  simChipTextActive: {
    color: '#38bdf8',
  },
  simLaunchBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
  },
  simLaunchBtnText: {
    color: '#020817',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ocppAuditBox: {
    backgroundColor: '#020817',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 8,
    gap: 6,
  },
  ocppRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    paddingBottom: 4,
  },
  ocppTime: {
    fontSize: 9,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ocppAction: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
  },
  ocppSummary: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 2,
  },

  // MoMo Wallet Styles
  walletVirtualCard: {
    backgroundColor: '#0a192f',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  virtualCardBrand: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  virtualCardType: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  cardChipIcon: {
    padding: 4,
  },
  walletBalanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  walletBalanceNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 4,
  },
  preAuthBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  cardHolderLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
  },
  cardHolderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 2,
  },
  cardHolderMono: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#38bdf8',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  momoProviderGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  momoChannelCard: {
    flex: 1,
    backgroundColor: '#0b1324',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    alignItems: 'center',
  },
  momoChannelCardActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f2744',
  },
  channelBrandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  channelName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  channelCode: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  presetAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetAmountBtn: {
    flex: 1,
    backgroundColor: '#0b1324',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 9,
    alignItems: 'center',
  },
  presetAmountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  customAmountInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  customAmountField: {
    flex: 1,
    backgroundColor: '#0b1324',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 12,
  },
  customTopupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  customTopupBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#020817',
  },
  securityNoticeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    padding: 12,
    marginTop: 10,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
  },
  transactionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1324',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 8,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#020817',
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  txSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  txTimestamp: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  txKwh: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  // Fleet VIN Management Styles
  fleetCreditCard: {
    backgroundColor: '#0b1324',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: 16,
  },
  fleetCreditTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  fleetCreditAccount: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  fleetStatusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  fleetStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
  },
  creditProgressBarContainer: {
    marginTop: 14,
  },
  creditMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  creditMetricValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  creditTrack: {
    height: 6,
    backgroundColor: '#020817',
    borderRadius: 3,
    overflow: 'hidden',
  },
  creditFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  vehicleCard: {
    backgroundColor: '#0b1324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 12,
  },
  vehicleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleModel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  vehiclePlate: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  socPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#020817',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  socText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  batteryProgressBar: {
    height: 4,
    backgroundColor: '#020817',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 10,
  },
  batteryProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  vinSpecsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020817',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  vinLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    marginRight: 6,
  },
  vinMonoText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#38bdf8',
  },
  plugAndChargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  plugAndChargeTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  plugAndChargeSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  miniToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniToggleActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  miniToggleInactive: {
    backgroundColor: '#020817',
    borderColor: '#1e293b',
  },
  miniToggleText: {
    fontSize: 9,
    fontWeight: '800',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0b1324',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },

  // Modal Settings
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0b1324',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalStationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 8,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  prefTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  prefSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 15,
  },
  prefDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 4,
  },
  statusCardBox: {
    backgroundColor: '#020817',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  settingsInput: {
    backgroundColor: '#020817',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 12,
  },
  settingsResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#020817',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  settingsResetText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsApplyBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#38bdf8',
    alignItems: 'center',
  },
  settingsApplyText: {
    color: '#020817',
    fontSize: 12,
    fontWeight: '800',
  },

  // ==========================================
  // REAL-TIME BILLING & ESCROW METER STYLES
  // ==========================================
  realtimeBillingCard: {
    backgroundColor: '#0b1324',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  billingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  billingCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.8,
  },
  billingLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 5,
  },
  billingLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  billingLiveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22c55e',
    letterSpacing: 0.5,
  },
  billingAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  billingAmountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  billingCurrencySymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38bdf8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  billingLiveAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  billingVelocityBox: {
    alignItems: 'flex-end',
  },
  billingVelocityLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  billingVelocityVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  billingVelocitySub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  escrowBox: {
    backgroundColor: '#020817',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  escrowLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  escrowDepositValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f59e0b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  escrowDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 8,
  },
  escrowRefundLabel: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  escrowRefundValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#22c55e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  escrowOverageLabel: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
  },
  escrowOverageValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f59e0b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  billingFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billingFooterText: {
    fontSize: 10,
    color: '#64748b',
  },

  // ==========================================
  // MOBILE MONEY USSD CHECKOUT MODAL STYLES
  // ==========================================
  momoModalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#0b1324',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  momoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  momoProviderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momoModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  momoModalSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  momoCloseBtn: {
    padding: 6,
  },
  momoFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 8,
  },
  momoNetPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  momoNetPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#020817',
    gap: 6,
  },
  momoDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  momoNetPillText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  momoPresetGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  momoPresetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#020817',
    alignItems: 'center',
  },
  momoPresetChipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  momoPresetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  momoPresetChipTextActive: {
    color: '#020817',
    fontWeight: '800',
  },
  momoPhoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ghanaFlagBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#020817',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
  },
  momoPhoneInput: {
    flex: 1,
    backgroundColor: '#020817',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  momoSummaryBox: {
    backgroundColor: '#020817',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 16,
  },
  momoSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  momoSummaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  momoSummaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  momoSummaryDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 8,
  },
  momoSummaryTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },
  momoSummaryTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38bdf8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  momoSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  momoSubmitBtnText: {
    color: '#020817',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // USSD Step Styles
  momoLoaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  momoLoaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 16,
  },
  momoLoaderSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  ussdContainer: {
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#020817',
    overflow: 'hidden',
    marginBottom: 12,
  },
  ussdBanner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ussdBannerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#020817',
    letterSpacing: 0.5,
  },
  ussdPromptTimer: {
    fontSize: 10,
    fontWeight: '800',
    color: '#020817',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ussdContent: {
    padding: 16,
    alignItems: 'center',
  },
  ussdPromptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    lineHeight: 18,
  },
  ussdRefText: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ussdPinDotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 14,
  },
  ussdPinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#64748b',
    backgroundColor: 'transparent',
  },
  ussdPinDotFilled: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  keypadBtn: {
    width: '30%',
    aspectRatio: 2.1,
    backgroundColor: '#0b1324',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  keypadBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ussdQuickAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  ussdQuickAuthText: {
    color: '#020817',
    fontSize: 12,
    fontWeight: '800',
  },

  // Receipt Step Styles
  receiptBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  receiptSuccessIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#22c55e',
    letterSpacing: 1,
  },
  receiptAmountText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    marginVertical: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  receiptSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 16,
  },
  receiptInvoiceCard: {
    width: '100%',
    backgroundColor: '#020817',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  invoiceLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  invoiceVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  invoiceLabelBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  invoiceValBold: {
    fontSize: 13,
    fontWeight: '900',
    color: '#38bdf8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  receiptCloseBtn: {
    width: '100%',
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  receiptCloseText: {
    color: '#020817',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ==========================================
  // CHARGING SESSION SETTLEMENT MODAL STYLES
  // ==========================================
  settleModalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#0b1324',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  settleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  settleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  settleModalSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  settleStationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020817',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  settleStationName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  settleConnectorName: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  settleTable: {
    backgroundColor: '#020817',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  settleTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  settleTableLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  settleTableVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  settleTableLabelBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  settleTableValBold: {
    fontSize: 14,
    fontWeight: '900',
    color: '#38bdf8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  settleTableDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 8,
  },
  settleRefundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: 12,
  },
  settleRefundTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#22c55e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  settleRefundSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  settleDueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 12,
  },
  settleDueTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f59e0b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  settleDueSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  settleMethodList: {
    gap: 8,
    marginBottom: 16,
  },
  settleMethodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020817',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  settleMethodOptionActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  settleMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  settleMethodSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  settleRadioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#64748b',
  },
  settleRadioDotActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#38bdf8',
  },
  settleSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  settleSubmitText: {
    color: '#020817',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
