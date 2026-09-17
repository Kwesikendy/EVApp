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
  Switch,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import {
  Zap,
  MapPin,
  CreditCard,
  Truck,
  Car,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Plus,
  Battery,
  Flame,
  ArrowUpRight,
  Sliders,
  X,
  Lock,
  Unlock,
  Radio,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Check,
} from 'lucide-react-native';

export interface Connector {
  id: number;
  connectorId: number;
  type: 'CCS2' | 'CHAdeMO' | 'Type2' | 'GB/T';
  maxPowerKw: number;
  status: 'Available' | 'Preparing' | 'Charging' | 'Faulted';
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
}

const ACCRA_STATIONS: Station[] = [
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
    ],
    amenities: ['24/7 Security', 'Coffee Lounge', 'Free Wi-Fi', 'Restrooms'],
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
      { id: 4, connectorId: 1, type: 'CCS2', maxPowerKw: 200, status: 'Available', tariffPerKwh: 4.20 },
      { id: 5, connectorId: 2, type: 'CCS2', maxPowerKw: 200, status: 'Charging', tariffPerKwh: 4.20 },
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
      { id: 6, connectorId: 1, type: 'CCS2', maxPowerKw: 160, status: 'Available', tariffPerKwh: 3.60 },
      { id: 7, connectorId: 2, type: 'CHAdeMO', maxPowerKw: 50, status: 'Available', tariffPerKwh: 3.20 },
      { id: 8, connectorId: 3, type: 'Type2', maxPowerKw: 22, status: 'Available', tariffPerKwh: 2.80 },
    ],
    amenities: ['Solar Canopy', 'EV Care Workshop', 'Café'],
  },
];

const INITIAL_FLEET: FleetVehicle[] = [
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

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
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

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b1324' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#020817' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d1f2d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2563eb' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e3a8a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#172554' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020817' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#38bdf8' }] },
];

function AppContent() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'map' | 'telemetry' | 'wallet' | 'fleet'>('map');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [mapFilter, setMapFilter] = useState<'all' | 'ultra' | 'available'>('all');

  // Charging session state
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isFleetMode, setIsFleetMode] = useState<boolean>(false);
  const [currentKw, setCurrentKw] = useState<number>(138.4);
  const [kwhConsumed, setKwhConsumed] = useState<number>(18.42);
  const [batterySoc, setBatterySoc] = useState<number>(68);
  const [targetSoc, setTargetSoc] = useState<number>(80);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(872); // ~14m 32s
  const [packVoltage, setPackVoltage] = useState<number>(412.8);
  const [packCurrent, setPackCurrent] = useState<number>(335.2);
  const [activeStationName, setActiveStationName] = useState<string>('XCharge Superhub – Airport City');
  const [activeConnectorType, setActiveConnectorType] = useState<string>('CCS2 · 350 kW Ultra-Fast');

  // Wallet & MoMo state
  const [walletBalance, setWalletBalance] = useState<number>(145.50);
  const [heldBalance, setHeldBalance] = useState<number>(25.00);
  const [selectedMomoProvider, setSelectedMomoProvider] = useState<'mtn' | 'telecel' | 'at'>('mtn');
  const [customTopupAmount, setCustomTopupAmount] = useState<string>('');
  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);

  // Fleet state
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>(INITIAL_FLEET);

  // Live charging ticker loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCharging) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setKwhConsumed((prev) => +(prev + 138 / 3600).toFixed(3));
        setBatterySoc((prev) => {
          if (prev >= targetSoc) return prev;
          return +(prev + 0.04).toFixed(1);
        });
        // Slight fluctuation for real automotive telemetry realism
        setCurrentKw(+(138.4 + (Math.random() * 2 - 1)).toFixed(1));
        setPackVoltage(+(412.8 + (Math.random() * 1.5 - 0.75)).toFixed(1));
        setPackCurrent(+(335.2 + (Math.random() * 3 - 1.5)).toFixed(1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCharging, targetSoc]);

  const handleStartCharging = (station: Station, connector: Connector) => {
    const PREAUTH_HOLD = 25.00;
    if (!isFleetMode && walletBalance < PREAUTH_HOLD) {
      Alert.alert(
        'Insufficient MoMo Balance',
        `XCharge requires a GH₵ ${PREAUTH_HOLD.toFixed(2)} pre-authorization hold to lock the connector. Please top up your wallet.`,
        [
          { text: 'Top Up MoMo', onPress: () => setActiveTab('wallet') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!isFleetMode) {
      setWalletBalance((prev) => +(prev - PREAUTH_HOLD).toFixed(2));
      setHeldBalance(PREAUTH_HOLD);
    }

    setActiveStationName(station.name);
    setActiveConnectorType(`${connector.type} · ${connector.maxPowerKw} kW Ultra-Fast`);
    setIsCharging(true);
    setSelectedStation(null);
    setActiveTab('telemetry');

    Alert.alert(
      'Cable Latch Engaged',
      `OCPP 2.0.1 RemoteStart successful.\nConnected to ${station.stationId} #${connector.connectorId}.\nSafety handshake complete at 350 kW rating.`,
      [{ text: 'View Telemetry', style: 'default' }]
    );
  };

  const handleStopCharging = () => {
    Alert.alert(
      'Stop Charging Session?',
      'Power delivery will ramp down safely, communication session will end, and the connector latch will release.',
      [
        { text: 'Continue Charging', style: 'cancel' },
        {
          text: 'Ramp Down & Release',
          style: 'destructive',
          onPress: () => {
            const finalCost = +(kwhConsumed * 3.80).toFixed(2);
            if (!isFleetMode) {
              const refund = +(heldBalance - Math.min(heldBalance, finalCost)).toFixed(2);
              setWalletBalance((prev) => +(prev + refund).toFixed(2));
              setHeldBalance(0);
            }

            // Record transaction
            const newTx: WalletTransaction = {
              id: `tx-${Date.now()}`,
              title: activeStationName,
              subtitle: activeConnectorType,
              timestamp: 'Just now',
              amount: finalCost,
              isCredit: false,
              kwh: kwhConsumed,
            };
            setTransactions((prev) => [newTx, ...prev]);

            setIsCharging(false);
            Alert.alert(
              'Session Settled',
              `${kwhConsumed} kWh transferred in ${formatTime(elapsedSeconds)}.\nTotal settled: GH₵ ${finalCost.toFixed(2)}.\nCable unlocked safely.`
            );
          },
        },
      ]
    );
  };

  const handleTopUp = (amountNum: number) => {
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please specify a valid top-up amount in GH₵.');
      return;
    }

    const providerNames = {
      mtn: 'MTN Mobile Money',
      telecel: 'Telecel Cash',
      at: 'AT Money',
    };

    Alert.alert(
      'Approve Mobile Money Prompt',
      `A USSD push notification of GH₵ ${amountNum.toFixed(2)} has been dispatched via ${providerNames[selectedMomoProvider]} to your registered phone number.\n\nEnter your MoMo PIN on your handset to approve.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'PIN Approved',
          onPress: () => {
            setWalletBalance((prev) => +(prev + amountNum).toFixed(2));
            const newTx: WalletTransaction = {
              id: `tx-topup-${Date.now()}`,
              title: `MoMo Load (${providerNames[selectedMomoProvider]})`,
              subtitle: `Instant Wallet Credit · Ref: GH-${Math.floor(100000 + Math.random() * 900000)}`,
              timestamp: 'Just now',
              amount: amountNum,
              isCredit: true,
            };
            setTransactions((prev) => [newTx, ...prev]);
            setCustomTopupAmount('');
            Alert.alert('Top-Up Successful', `GH₵ ${amountNum.toFixed(2)} credited to your XCharge pass.`);
          },
        },
      ]
    );
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

  // Filtered stations for map
  const filteredStations = ACCRA_STATIONS.filter((st) => {
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
    { key: 'telemetry', label: 'Charge HUD', icon: Zap },
    { key: 'wallet', label: 'MoMo Wallet', icon: CreditCard },
    { key: 'fleet', label: 'Fleet VIN', icon: Truck },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#020817" />

      {/* Global Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.brandLogoBadge}>
            <Zap size={18} color="#38bdf8" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.headerTitle}>XCharge</Text>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>LIVE</Text>
            </View>
            <Text style={s.headerSub}>
              {isFleetMode ? 'Fleet: APEX LOGISTICS GH' : 'Driver Pass · Accra Core'}
            </Text>
          </View>
        </View>

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
      </View>

      {/* Content Body */}
      <View style={s.content}>
        {/* ===================================================
            TAB 1: INTERACTIVE MAP (react-native-maps)
        ==================================================== */}
        {activeTab === 'map' && (
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Filter Pills Header */}
            <View style={s.mapFilterBar}>
              <TouchableOpacity
                style={[s.filterChip, mapFilter === 'all' && s.filterChipActive]}
                onPress={() => setMapFilter('all')}
              >
                <Text style={[s.filterChipText, mapFilter === 'all' && s.filterChipTextActive]}>
                  All Superhubs ({ACCRA_STATIONS.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.filterChip, mapFilter === 'ultra' && s.filterChipActive]}
                onPress={() => setMapFilter('ultra')}
              >
                <Zap size={11} color={mapFilter === 'ultra' ? '#38bdf8' : '#94a3b8'} style={{ marginRight: 4 }} />
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
            </View>

            {/* Native Map Component */}
            <MapView
              style={{ width: '100%', height: '100%' }}
              provider={PROVIDER_DEFAULT}
              initialRegion={{
                latitude: 5.5850,
                longitude: -0.1850,
                latitudeDelta: 0.09,
                longitudeDelta: 0.09,
              }}
              customMapStyle={DARK_MAP_STYLE}
              showsUserLocation={false}
              showsCompass={false}
            >
              {filteredStations.map((station) => {
                const maxPower = Math.max(...station.connectors.map((c) => c.maxPowerKw));
                const isSelected = selectedStation?.id === station.id;
                const hasAvailable = station.connectors.some((c) => c.status === 'Available');

                return (
                  <Marker
                    key={station.id}
                    coordinate={{ latitude: station.latitude, longitude: station.longitude }}
                    onPress={() => setSelectedStation(station)}
                    tracksViewChanges={false}
                  >
                    <View style={[s.customMarker, isSelected && s.customMarkerSelected]}>
                      <View style={[s.markerBadge, hasAvailable ? s.markerBadgeGreen : s.markerBadgeBlue]}>
                        <Zap size={10} color={hasAvailable ? '#22c55e' : '#38bdf8'} />
                        <Text style={[s.markerBadgeText, { color: hasAvailable ? '#22c55e' : '#38bdf8' }]}>
                          {maxPower} kW
                        </Text>
                      </View>
                      <View style={[s.markerPinStem, isSelected && s.markerPinStemSelected]} />
                    </View>
                  </Marker>
                );
              })}
            </MapView>

            {/* Floating Station Quick Card (When selected or bottom drawer) */}
            <View style={s.mapOverlayBottom}>
              {selectedStation ? (
                <View style={s.floatingStationCard}>
                  <View style={s.stationCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.stationCardTitle}>{selectedStation.name}</Text>
                      </View>
                      <Text style={s.stationCardAddress}>{selectedStation.address}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedStation(null)} style={s.closeBtn}>
                      <X size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>

                  {/* Connectors availability pills */}
                  <View style={s.connectorPillRow}>
                    {selectedStation.connectors.map((c) => (
                      <View
                        key={c.id}
                        style={[
                          s.connectorMiniChip,
                          c.status === 'Available' ? s.connectorChipGreen : s.connectorChipBlue,
                        ]}
                      >
                        <Zap size={10} color={c.status === 'Available' ? '#22c55e' : '#60a5fa'} />
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

                  {/* CTA Actions */}
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
                        const availableConn = selectedStation.connectors.find((c) => c.status === 'Available') || selectedStation.connectors[0];
                        handleStartCharging(selectedStation, availableConn);
                      }}
                    >
                      <Zap size={14} color="#020817" />
                      <Text style={s.chargeActionBtnText}>Connect & Charge</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={s.floatingNearbyPrompt}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MapPin size={16} color="#38bdf8" />
                    <Text style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 13 }}>
                      3 Accra Fast Charging Hubs Online
                    </Text>
                  </View>
                  <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                    Tap any marker to inspect live 350 kW power rating, tariffs, and unlatch cable.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ===================================================
            TAB 2: AUTOMOTIVE CHARGE HUD (Telemetry)
        ==================================================== */}
        {activeTab === 'telemetry' && (
          <ScrollView style={s.tabScroll} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            {/* Battery SoC Circle Gauge */}
            <View style={s.hudGaugeContainer}>
              <View style={s.socOuterGlowRing}>
                <View style={s.socInnerDial}>
                  <View style={s.chargingBoltBadge}>
                    <Zap size={16} color={isCharging ? '#22c55e' : '#38bdf8'} />
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

            {/* 4-Tile Automotive Bento Grid */}
            <View style={s.telemetryGrid}>
              <View style={s.telemetryTile}>
                <View style={s.tileHeader}>
                  <Battery size={14} color="#22c55e" />
                  <Text style={s.tileLabel}>DELIVERED</Text>
                </View>
                <Text style={[s.tileValue, { color: '#22c55e' }]}>{kwhConsumed} kWh</Text>
                <Text style={s.tileSub}>+1.2 kWh / min</Text>
              </View>

              <View style={s.telemetryTile}>
                <View style={s.tileHeader}>
                  <Clock size={14} color="#f8fafc" />
                  <Text style={s.tileLabel}>DURATION</Text>
                </View>
                <Text style={s.tileValue}>{formatTime(elapsedSeconds)}</Text>
                <Text style={s.tileSub}>Ramp: ISO 15118</Text>
              </View>

              <View style={s.telemetryTile}>
                <View style={s.tileHeader}>
                  <Zap size={14} color="#38bdf8" />
                  <Text style={s.tileLabel}>PACK SPECS</Text>
                </View>
                <Text style={[s.tileValue, { fontSize: 16, color: '#38bdf8' }]}>
                  {packVoltage}V
                </Text>
                <Text style={s.tileSub}>{packCurrent}A DC Flow</Text>
              </View>

              <View style={s.telemetryTile}>
                <View style={s.tileHeader}>
                  <CreditCard size={14} color="#fbbf24" />
                  <Text style={s.tileLabel}>ACCRUED COST</Text>
                </View>
                <Text style={[s.tileValue, { color: '#fbbf24' }]}>
                  GH₵ {(kwhConsumed * 3.80).toFixed(2)}
                </Text>
                <Text style={s.tileSub}>GH₵ 3.80 / kWh</Text>
              </View>
            </View>

            {/* Active Session & Hardware Status */}
            <View style={s.hardwareStatusBox}>
              <View style={s.statusRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="#38bdf8" />
                  <Text style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 'bold' }}>
                    OCPP 2.0.1 Secure Session
                  </Text>
                </View>
                <View style={s.connectedPill}>
                  <View style={s.activePulseDot} />
                  <Text style={s.connectedPillText}>LATCH LOCKED</Text>
                </View>
              </View>
              <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
                Station: {activeStationName} · {activeConnectorType}
              </Text>
              {!isFleetMode && (
                <View style={s.preAuthNoticeRow}>
                  <CreditCard size={12} color="#7dd3fc" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#7dd3fc', fontSize: 11, flex: 1 }}>
                    Pre-auth hold of GH₵ {heldBalance.toFixed(2)} active. Remaining balance unlocks upon stop.
                  </Text>
                </View>
              )}
            </View>

            {/* Stop / Start Primary Action Button */}
            {isCharging ? (
              <TouchableOpacity
                onPress={handleStopCharging}
                style={[s.primaryActionButton, { backgroundColor: '#e11d48' }]}
                activeOpacity={0.85}
              >
                <X size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={s.primaryActionText}>Stop Charging & Release Connector</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setActiveTab('map')}
                style={[s.primaryActionButton, { backgroundColor: '#0284c7' }]}
                activeOpacity={0.85}
              >
                <Navigation size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={s.primaryActionText}>Select Charger on Map</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* ===================================================
            TAB 3: MOMO DRIVER WALLET
        ==================================================== */}
        {activeTab === 'wallet' && (
          <ScrollView style={s.tabScroll} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            {/* Embossed Virtual Driver Pass Card */}
            <View style={s.walletVirtualCard}>
              <View style={s.cardTopRow}>
                <View>
                  <Text style={s.virtualCardBrand}>XCHARGE PASS</Text>
                  <Text style={s.virtualCardType}>Commercial Driver EV Smart Card</Text>
                </View>
                <View style={s.cardChipIcon}>
                  <Sparkles size={20} color="#fbbf24" />
                </View>
              </View>

              <View style={{ marginVertical: 20 }}>
                <Text style={s.walletBalanceLabel}>AVAILABLE BALANCE</Text>
                <Text style={s.walletBalanceNumber}>GH₵ {walletBalance.toFixed(2)}</Text>
                <View style={s.preAuthBadgeInline}>
                  <Lock size={10} color="#fbbf24" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: '700' }}>
                    GH₵ {heldBalance.toFixed(2)} Pre-Auth Hold
                  </Text>
                </View>
              </View>

              <View style={s.cardBottomRow}>
                <View>
                  <Text style={s.cardHolderLabel}>CARDHOLDER</Text>
                  <Text style={s.cardHolderName}>KWAME MENSAH</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.cardHolderLabel}>ID CODE</Text>
                  <Text style={s.cardHolderMono}>XC-8840-GH</Text>
                </View>
              </View>
            </View>

            {/* MoMo Provider Top-Up Channels */}
            <Text style={s.sectionHeaderTitle}>INSTANT MOBILE MONEY TOP-UP</Text>
            <View style={s.momoProviderGrid}>
              <TouchableOpacity
                style={[s.momoChannelCard, selectedMomoProvider === 'mtn' && s.momoChannelActiveMtn]}
                onPress={() => setSelectedMomoProvider('mtn')}
              >
                <View style={[s.momoBrandIcon, { backgroundColor: '#eab308' }]}>
                  <Text style={{ fontWeight: '900', color: '#000', fontSize: 10 }}>MTN</Text>
                </View>
                <Text style={s.momoChannelName}>MTN MoMo</Text>
                {selectedMomoProvider === 'mtn' && <Check size={14} color="#eab308" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.momoChannelCard, selectedMomoProvider === 'telecel' && s.momoChannelActiveTelecel]}
                onPress={() => setSelectedMomoProvider('telecel')}
              >
                <View style={[s.momoBrandIcon, { backgroundColor: '#ef4444' }]}>
                  <Text style={{ fontWeight: '900', color: '#fff', fontSize: 9 }}>T-CEL</Text>
                </View>
                <Text style={s.momoChannelName}>Telecel Cash</Text>
                {selectedMomoProvider === 'telecel' && <Check size={14} color="#ef4444" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.momoChannelCard, selectedMomoProvider === 'at' && s.momoChannelActiveAt]}
                onPress={() => setSelectedMomoProvider('at')}
              >
                <View style={[s.momoBrandIcon, { backgroundColor: '#38bdf8' }]}>
                  <Text style={{ fontWeight: '900', color: '#000', fontSize: 10 }}>AT</Text>
                </View>
                <Text style={s.momoChannelName}>AT Money</Text>
                {selectedMomoProvider === 'at' && <Check size={14} color="#38bdf8" />}
              </TouchableOpacity>
            </View>

            {/* Quick Top-Up Preset Chips */}
            <View style={s.quickAmountRow}>
              {[25, 50, 100, 200].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={s.amountChip}
                  onPress={() => handleTopUp(amt)}
                  activeOpacity={0.8}
                >
                  <Text style={s.amountChipText}>+GH₵ {amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount Input */}
            <View style={s.customAmountRow}>
              <TextInput
                style={s.customAmountInput}
                placeholder="Enter custom GH₵ amount"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={customTopupAmount}
                onChangeText={setCustomTopupAmount}
              />
              <TouchableOpacity
                style={s.customAmountBtn}
                onPress={() => handleTopUp(parseFloat(customTopupAmount))}
              >
                <Plus size={16} color="#020817" />
                <Text style={s.customAmountBtnText}>Authorize</Text>
              </TouchableOpacity>
            </View>

            {/* Transaction Ledger */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
              <Text style={s.sectionHeaderTitle}>RECENT CHARGE TRANSACTIONS</Text>
              <Text style={{ fontSize: 11, color: '#38bdf8' }}>CSMS Synced</Text>
            </View>

            {transactions.map((tx) => (
              <View key={tx.id} style={s.txCard}>
                <View style={s.txIconBox}>
                  {tx.isCredit ? <Plus size={16} color="#22c55e" /> : <Zap size={16} color="#38bdf8" />}
                </View>
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={s.txTitle}>{tx.title}</Text>
                  <Text style={s.txSubtitle}>{tx.subtitle}</Text>
                  <Text style={s.txDate}>{tx.timestamp}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.txAmount, { color: tx.isCredit ? '#22c55e' : '#f1f5f9' }]}>
                    {tx.isCredit ? '+' : '-'}GH₵ {tx.amount.toFixed(2)}
                  </Text>
                  {tx.kwh && <Text style={s.txKwhText}>{tx.kwh} kWh</Text>}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ===================================================
            TAB 4: FLEET VIN MANAGEMENT & ISO 15118
        ==================================================== */}
        {activeTab === 'fleet' && (
          <ScrollView style={s.tabScroll} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            {/* Commercial Fleet Summary */}
            <View style={s.fleetHeaderCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: 'bold' }}>
                    COMMERCIAL FLEET ACCOUNT
                  </Text>
                  <Text style={s.fleetTitle}>Apex Logistics Ghana Ltd.</Text>
                </View>
                <View style={s.fleetActiveBadge}>
                  <ShieldCheck size={14} color="#22c55e" />
                  <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '700' }}>Active</Text>
                </View>
              </View>
              <View style={s.fleetDetailsRow}>
                <Text style={s.fleetSubtext}>Billing Account: CORP-XC-88402</Text>
                <Text style={s.fleetSubtext}>3 Registered Vehicles</Text>
              </View>
            </View>

            <Text style={s.sectionHeaderTitle}>ASSIGNED FLEET VEHICLES & PLUG & CHARGE</Text>

            {fleetVehicles.map((vehicle) => (
              <View key={vehicle.vin} style={s.vehicleCard}>
                <View style={s.vehicleCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.vehicleModel}>{vehicle.model}</Text>
                    <Text style={s.vehiclePlate}>Plate: {vehicle.plate} · Driver: {vehicle.driver}</Text>
                  </View>
                  <View style={s.vehicleSocBadge}>
                    <Battery size={12} color={vehicle.soc > 50 ? '#22c55e' : '#fbbf24'} />
                    <Text style={[s.vehicleSocText, { color: vehicle.soc > 50 ? '#22c55e' : '#fbbf24' }]}>
                      {vehicle.soc}%
                    </Text>
                  </View>
                </View>

                {/* Battery level indicator bar */}
                <View style={s.batteryProgressBarTrack}>
                  <View
                    style={[
                      s.batteryProgressBarFill,
                      {
                        width: `${vehicle.soc}%`,
                        backgroundColor: vehicle.soc > 50 ? '#22c55e' : '#fbbf24',
                      },
                    ]}
                  />
                </View>

                {/* VIN & Hardware Details */}
                <View style={s.vinSpecsBox}>
                  <Text style={s.vinLabel}>CHASSIS VIN:</Text>
                  <Text style={s.vinMonoText}>{vehicle.vin}</Text>
                </View>

                {/* ISO 15118 Plug & Charge Switcher */}
                <View style={s.plugAndChargeRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Radio size={14} color={vehicle.isPlugAndChargeEnabled ? '#22c55e' : '#64748b'} />
                      <Text style={s.plugAndChargeTitle}>ISO 15118 Plug & Charge</Text>
                    </View>
                    <Text style={s.plugAndChargeSub}>
                      {vehicle.isPlugAndChargeEnabled
                        ? 'TLS certificate installed. Auto-authorizes instantly.'
                        : 'Manual authentication required at charger.'}
                    </Text>
                  </View>
                  <Switch
                    value={vehicle.isPlugAndChargeEnabled}
                    onValueChange={() => togglePlugAndCharge(vehicle.vin)}
                    trackColor={{ false: '#1e293b', true: '#059669' }}
                    thumbColor={vehicle.isPlugAndChargeEnabled ? '#34d399' : '#94a3b8'}
                  />
                </View>

                {/* Vehicle Actions */}
                <View style={s.vehicleActionsRow}>
                  <TouchableOpacity
                    style={s.locateVehicleBtn}
                    onPress={() => {
                      setActiveTab('map');
                    }}
                  >
                    <MapPin size={12} color="#38bdf8" />
                    <Text style={s.locateVehicleBtnText}>Route to Nearest Hub</Text>
                  </TouchableOpacity>

                  <Text style={s.lastChargedText}>Last: {vehicle.lastCharged}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Bottom Navigation Bar (4 Native Tabs) */}
      <View style={[s.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={[s.navItem, isActive && s.navItemActive]}
              activeOpacity={0.8}
            >
              <Icon size={20} color={isActive ? '#38bdf8' : '#64748b'} />
              <Text style={[s.navLabel, isActive && s.navLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Connector Selection Modal */}
      {selectedStation && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalStationTitle}>{selectedStation.name}</Text>
                  <Text style={s.modalStationSub}>{selectedStation.address}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedStation(null)} style={s.modalCloseBtn}>
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={s.modalSectionLabel}>CHOOSE FAST CONNECTOR</Text>

              {selectedStation.connectors.map((c) => (
                <View key={c.id} style={s.connectorChoiceCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.connectorTypeTitle}>{c.type} · {c.maxPowerKw} kW</Text>
                      <View
                        style={[
                          s.miniStatusPill,
                          c.status === 'Available' ? s.miniStatusGreen : s.miniStatusBlue,
                        ]}
                      >
                        <Text
                          style={[
                            s.miniStatusText,
                            { color: c.status === 'Available' ? '#22c55e' : '#60a5fa' },
                          ]}
                        >
                          {c.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.connectorTariffSub}>GH₵ {c.tariffPerKwh.toFixed(2)} / kWh</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleStartCharging(selectedStation, c)}
                    style={[
                      s.unlockChargeBtn,
                      c.status !== 'Available' && { backgroundColor: '#1e293b' },
                    ]}
                    disabled={c.status !== 'Available'}
                  >
                    <Text style={s.unlockChargeBtnText}>
                      {c.status === 'Available' ? 'Unlock & Charge' : 'In Use'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </Modal>
      )}
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
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Fullscreen Video */}
      <VideoView
        player={player}
        style={ss.splashVideo}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Dark gradient overlay at bottom */}
      <View style={ss.splashOverlay}>
        <View style={ss.splashBrand}>
          <Zap size={28} color="#38bdf8" />
          <Text style={ss.splashBrandName}>XCharge</Text>
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

        <Text style={ss.versionText}>v1.0.0</Text>
      </View>
    </Animated.View>
  );
}

export default function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);

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
  splashBrandSymbol: {
    fontSize: 28,
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
    paddingVertical: 12,
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
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#22c55e',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  content: {
    flex: 1,
  },
  tabScroll: {
    flex: 1,
    backgroundColor: '#020817',
  },

  // Map Styles
  mapFilterBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 19, 36, 0.92)',
    borderWidth: 1,
    borderColor: '#1e293b',
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
  customMarker: {
    alignItems: 'center',
  },
  customMarkerSelected: {
    transform: [{ scale: 1.15 }],
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#0b1324',
  },
  markerBadgeGreen: {
    borderColor: '#22c55e',
  },
  markerBadgeBlue: {
    borderColor: '#38bdf8',
  },
  markerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  markerPinStem: {
    width: 2,
    height: 6,
    backgroundColor: '#38bdf8',
  },
  markerPinStemSelected: {
    height: 8,
    backgroundColor: '#22c55e',
  },
  mapOverlayBottom: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
  },
  floatingStationCard: {
    backgroundColor: 'rgba(11, 19, 36, 0.96)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingNearbyPrompt: {
    backgroundColor: 'rgba(11, 19, 36, 0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  stationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stationCardTitle: {
    fontSize: 15,
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
    marginTop: 10,
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
    borderColor: 'rgba(34,197,94,0.3)',
  },
  connectorChipBlue: {
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderColor: 'rgba(56,189,248,0.3)',
  },
  connectorMiniText: {
    fontSize: 10,
    fontWeight: '600',
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  amenityText: {
    fontSize: 10,
    color: '#64748b',
  },
  stationActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  navigateBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  chargeActionBtn: {
    flex: 1.4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#38bdf8',
  },
  chargeActionBtnText: {
    color: '#020817',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Telemetry HUD Styles
  hudGaugeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  socOuterGlowRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  socInnerDial: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#0b1324',
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  chargingBoltBadge: {
    marginBottom: 4,
  },
  socPercentageText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
  },
  socStateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
    textAlign: 'center',
  },
  socTargetText: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  powerMeterCard: {
    width: '100%',
    backgroundColor: '#0b1324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginTop: 18,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  powerValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#22c55e',
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
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  smallSub: {
    fontSize: 9,
    color: '#475569',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  telemetryTile: {
    width: '48%',
    backgroundColor: '#0b1324',
    borderRadius: 14,
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
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
  },
  tileSub: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
  },
  hardwareStatusBox: {
    backgroundColor: '#0b1324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginTop: 14,
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
    marginTop: 20,
    elevation: 4,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    fontSize: 36,
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
    fontFamily: 'monospace',
    color: '#38bdf8',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 11,
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
  momoChannelActiveMtn: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  momoChannelActiveTelecel: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  momoChannelActiveAt: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  momoBrandIcon: {
    width: 32,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  momoChannelName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  amountChip: {
    flex: 1,
    backgroundColor: '#0b1324',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  amountChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#22c55e',
  },
  customAmountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customAmountInput: {
    flex: 1,
    backgroundColor: '#0b1324',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
  },
  customAmountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  customAmountBtnText: {
    color: '#020817',
    fontSize: 12,
    fontWeight: '800',
  },
  txCard: {
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
  txDate: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  txKwhText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  // Fleet Styles
  fleetHeaderCard: {
    backgroundColor: '#0b1324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 16,
  },
  fleetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 2,
  },
  fleetActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  fleetDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  fleetSubtext: {
    fontSize: 11,
    color: '#64748b',
  },
  vehicleCard: {
    backgroundColor: '#0b1324',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 12,
  },
  vehicleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleModel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  vehiclePlate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  vehicleSocBadge: {
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
  vehicleSocText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  batteryProgressBarTrack: {
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
    fontFamily: 'monospace',
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
  vehicleActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  locateVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locateVehicleBtnText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '700',
  },
  lastChargedText: {
    fontSize: 10,
    color: '#475569',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modalSheet: {
    backgroundColor: '#0b1324',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalStationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  modalStationSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 10,
  },
  connectorChoiceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020817',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 10,
  },
  connectorTypeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  miniStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniStatusGreen: {
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  miniStatusBlue: {
    backgroundColor: 'rgba(56,189,248,0.15)',
  },
  miniStatusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  connectorTariffSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  unlockChargeBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unlockChargeBtnText: {
    color: '#020817',
    fontSize: 11,
    fontWeight: '800',
  },
});
