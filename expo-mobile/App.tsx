import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Modal, Alert, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';

interface Connector {
  id: number;
  connectorId: number;
  type: 'CCS2' | 'CHAdeMO' | 'Type2' | 'GB/T';
  maxPowerKw: number;
  status: 'Available' | 'Preparing' | 'Charging' | 'Faulted';
  tariffPerKwh: number;
}

interface Station {
  id: string;
  stationId: string;
  name: string;
  address: string;
  distanceKm: number;
  connectors: Connector[];
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'map' | 'telemetry' | 'wallet' | 'fleet'>('map');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isFleetMode, setIsFleetMode] = useState<boolean>(false);
  const [kwhConsumed, setKwhConsumed] = useState<number>(0.0);
  const [currentKw] = useState<number>(120.0);
  const [batterySoc, setBatterySoc] = useState<number>(34);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(45.50);
  const [heldBalance, setHeldBalance] = useState<number>(0.00);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCharging) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setKwhConsumed((prev) => +(prev + 120 / 3600).toFixed(3));
        setBatterySoc((prev) => (prev < 80 ? +(prev + 0.05).toFixed(1) : 80));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCharging]);

  const handleStartCharging = (station: Station, connector: Connector) => {
    const PREAUTH_HOLD = 20.00;
    if (!isFleetMode && walletBalance < PREAUTH_HOLD) {
      Alert.alert('Insufficient Balance', `XCharge requires a $${PREAUTH_HOLD.toFixed(2)} pre-authorization hold. Please top up.`, [{ text: 'Top Up', onPress: () => setActiveTab('wallet') }]);
      return;
    }
    if (!isFleetMode) {
      setWalletBalance((prev) => +(prev - PREAUTH_HOLD).toFixed(2));
      setHeldBalance(PREAUTH_HOLD);
    }
    setIsCharging(true);
    setSelectedStation(null);
    setActiveTab('telemetry');
    Alert.alert('Connector Unlocked', `OCPP RemoteStart → ${station.stationId} #${connector.connectorId}`);
  };

  const handleStopCharging = () => {
    const finalCost = +(kwhConsumed * 0.32).toFixed(2);
    if (!isFleetMode) {
      const refund = +(heldBalance - finalCost).toFixed(2);
      setWalletBalance((prev) => +(prev + refund).toFixed(2));
      setHeldBalance(0);
    }
    setIsCharging(false);
    Alert.alert('Session Complete', `${kwhConsumed} kWh delivered • $${finalCost.toFixed(2)} settled`);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stations: Station[] = [
    {
      id: 'st-01', stationId: 'XC-AFR-001', name: 'XCharge Superhub – Airport City',
      address: 'Liberation Rd, Terminal District', distanceKm: 1.2,
      connectors: [
        { id: 1, connectorId: 1, type: 'CCS2', maxPowerKw: 160, status: 'Available', tariffPerKwh: 0.32 },
        { id: 2, connectorId: 2, type: 'CCS2', maxPowerKw: 160, status: 'Charging', tariffPerKwh: 0.32 },
      ],
    },
    {
      id: 'st-02', stationId: 'XC-CBD-002', name: 'XCharge Express – Financial Plaza',
      address: 'High Street Commercial Core', distanceKm: 3.8,
      connectors: [{ id: 3, connectorId: 1, type: 'CCS2', maxPowerKw: 200, status: 'Available', tariffPerKwh: 0.35 }],
    },
  ];

  const tabs = [
    { key: 'map', label: 'Map' },
    { key: 'telemetry', label: 'Charge HUD' },
    { key: 'wallet', label: 'MoMo Wallet' },
    { key: 'fleet', label: 'Fleet VIN' },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>XCharge EV</Text>
          <Text style={s.headerSub}>{isFleetMode ? 'Fleet: APEX-LOGISTICS' : 'Personal Driver Account'}</Text>
        </View>
        <TouchableOpacity onPress={() => setIsFleetMode(!isFleetMode)} style={[s.badge, isFleetMode ? s.badgeFleet : s.badgePersonal]}>
          <Text style={[s.badgeText, isFleetMode ? s.badgeFleetText : s.badgePersonalText]}>
            {isFleetMode ? 'FLEET: VIN MODE' : 'PERSONAL'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Tab */}
      <View style={s.content}>
        {activeTab === 'map' && (
          <View style={s.pad}>
            <View style={s.mapPlaceholder}>
              <Text style={s.mapTitle}>XCharge Station Map</Text>
              <Text style={s.mapSub}>PostGIS + React Native Maps with live connector indicators</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <View style={[s.statusBadge, { backgroundColor: '#065f46', borderColor: '#10b981' }]}>
                  <Text style={{ color: '#34d399', fontSize: 12 }}>● 8 Available</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' }]}>
                  <Text style={{ color: '#60a5fa', fontSize: 12 }}>● 3 Charging</Text>
                </View>
              </View>
            </View>

            <Text style={s.sectionTitle}>NEARBY FAST CHARGERS</Text>
            <ScrollView>
              {stations.map((station) => (
                <TouchableOpacity key={station.id} onPress={() => setSelectedStation(station)} style={s.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={s.cardTitle}>{station.name}</Text>
                    <Text style={s.distText}>{station.distanceKm} km</Text>
                  </View>
                  <Text style={s.cardSub}>{station.address}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ color: '#34d399', fontSize: 12 }}>160 kW CCS2 Ultra-Fast</Text>
                    <Text style={s.cardSub}>$0.32 / kWh</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Telemetry Tab */}
        {activeTab === 'telemetry' && (
          <View style={[s.pad, { justifyContent: 'space-between' }]}>
            <View>
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Text style={s.sectionTitle}>LIVE BATTERY TELEMETRY</Text>
                <Text style={s.bigSoc}>{batterySoc}%</Text>
                <Text style={s.cardSub}>Target SoC: 80% • 398.2V • 142A</Text>
              </View>
              <View style={s.card}>
                {[
                  { label: 'Active Charge Speed', value: `${currentKw.toFixed(1)} kW`, color: '#f1f5f9' },
                  { label: 'Energy Consumed', value: `${kwhConsumed.toFixed(3)} kWh`, color: '#34d399' },
                  { label: 'Elapsed Duration', value: formatTime(elapsedSeconds), color: '#f1f5f9' },
                  { label: 'Accrued Cost', value: `$${(kwhConsumed * 0.32).toFixed(2)}`, color: '#fbbf24' },
                ].map((row, i, arr) => (
                  <View key={row.label} style={[s.row, i < arr.length - 1 && s.rowBorder]}>
                    <Text style={s.cardSub}>{row.label}</Text>
                    <Text style={{ color: row.color, fontWeight: 'bold', fontSize: 14 }}>{row.value}</Text>
                  </View>
                ))}
              </View>
              {!isFleetMode && (
                <View style={s.preAuthBox}>
                  <Text style={{ color: '#7dd3fc', fontSize: 12 }}>💳 Pre-Auth Hold: ${heldBalance.toFixed(2)} active. Surplus unlocks on completion.</Text>
                </View>
              )}
            </View>
            {isCharging ? (
              <TouchableOpacity onPress={handleStopCharging} style={[s.btn, { backgroundColor: '#e11d48' }]}>
                <Text style={s.btnText}>Stop Charging & Release Connector</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setActiveTab('map')} style={[s.btn, { backgroundColor: '#0284c7' }]}>
                <Text style={s.btnText}>Select Charger on Map</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <ScrollView style={s.pad}>
            <View style={[s.card, { backgroundColor: '#0c1a2e', padding: 20, marginBottom: 20 }]}>
              <Text style={[s.sectionTitle, { marginBottom: 4 }]}>XCHARGE DRIVER WALLET</Text>
              <Text style={{ fontSize: 40, fontWeight: '900', color: '#fff' }}>${walletBalance.toFixed(2)}</Text>
              <Text style={{ color: '#fbbf24', fontSize: 12, marginTop: 6 }}>Held for Pre-Auth: ${heldBalance.toFixed(2)}</Text>
            </View>
            <Text style={[s.cardTitle, { marginBottom: 12 }]}>Top Up via Mobile Money</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['MTN MoMo', 'Vodafone Cash', 'M-Pesa'].map((momo) => (
                <TouchableOpacity key={momo} onPress={() => { setWalletBalance((prev) => +(prev + 25).toFixed(2)); Alert.alert('Top-up Success', `$25.00 loaded via ${momo}`); }} style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 14 }]}>
                  <Text style={s.cardSub}>{momo}</Text>
                  <Text style={{ color: '#34d399', fontSize: 12, marginTop: 4 }}>+$25</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Fleet Tab */}
        {activeTab === 'fleet' && (
          <ScrollView style={s.pad}>
            <View style={[s.card, { marginBottom: 20 }]}>
              <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: 'bold' }}>COMMERCIAL FLEET MANAGEMENT</Text>
              <Text style={s.cardTitle}>Apex Logistics EV Fleet</Text>
              <Text style={s.cardSub}>Corporate Billing: CORP-XC-88402</Text>
            </View>
            <Text style={[s.sectionTitle, { marginBottom: 12 }]}>ASSIGNED VEHICLES (VIN)</Text>
            {[
              { vin: '1FTFW1ED8NFA02941', model: 'Ford E-Transit 350', plate: 'GT-4491-24', driver: 'Kwame Mensah' },
              { vin: '7SAYGDEE4PF889120', model: 'Tesla Model Y LR', plate: 'GW-8920-23', driver: 'Ama Osei' },
              { vin: 'LGX1C23D8M1093847', model: 'BYD T3 Cargo Van', plate: 'GN-1002-24', driver: 'Kofi Boateng' },
            ].map((v) => (
              <View key={v.vin} style={[s.card, { marginBottom: 12 }]}>
                <Text style={s.cardTitle}>{v.model}</Text>
                <Text style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}>VIN: {v.vin}</Text>
                <View style={[s.row, s.rowBorder, { marginTop: 8, paddingTop: 8 }]}>
                  <Text style={s.cardSub}>Plate: {v.plate}</Text>
                  <Text style={s.cardSub}>Driver: {v.driver}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Bottom Nav */}
      <View style={[s.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key as any)} style={[s.navItem, activeTab === tab.key && s.navItemActive]}>
            <Text style={[s.navLabel, activeTab === tab.key && s.navLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Station Modal */}
      {selectedStation && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={s.cardTitle}>{selectedStation.name}</Text>
                <TouchableOpacity onPress={() => setSelectedStation(null)}>
                  <Text style={{ color: '#94a3b8', fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[s.cardSub, { marginBottom: 16 }]}>{selectedStation.address}</Text>
              <Text style={[s.sectionTitle, { marginBottom: 8 }]}>AVAILABLE CONNECTORS</Text>
              {selectedStation.connectors.map((c) => (
                <View key={c.id} style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, backgroundColor: '#020817' }]}>
                  <View>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{c.type} • {c.maxPowerKw} kW</Text>
                    <Text style={s.cardSub}>${c.tariffPerKwh} / kWh</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleStartCharging(selectedStation, c)} style={[s.btn, { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#059669', marginBottom: 0 }]}>
                    <Text style={[s.btnText, { fontSize: 12 }]}>Unlock & Charge</Text>
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
    // Progress bar animates for up to 10s (safety max)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10000,
      useNativeDriver: false,
    }).start();

    // Dots cycling text
    let dotCount = 0;
    const dotInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      setDotText('.'.repeat(dotCount));
    }, 400);

    // Safety timeout: transition after 10s even if video hasn't ended
    const safetyTimer = setTimeout(finish, 10000);

    // Listen for video end
    const sub = player.addListener('playingChange', (event) => {
      if (!event.isPlaying && hasFinished.current === false) {
        // small delay so last frame stays visible briefly
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

      {/* Fullscreen video */}
      <VideoView
        player={player}
        style={ss.splashVideo}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Dark gradient overlay at bottom */}
      <View style={ss.splashOverlay}>
        {/* XCharge branding */}
        <View style={ss.splashBrand}>
          <Text style={ss.splashBrandSymbol}>⚡</Text>
          <Text style={ss.splashBrandName}>XCharge</Text>
        </View>

        {/* Loading bar + text */}
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
  loadingSubtext: {
    fontSize: 11,
    color: '#334155',
    marginTop: 6,
    letterSpacing: 0.5,
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
  root: { flex: 1, backgroundColor: '#020817' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#0f172a' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#38bdf8' },
  headerSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeFleet: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b' },
  badgePersonal: { backgroundColor: 'rgba(14,165,233,0.15)', borderColor: '#0ea5e9' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeFleetText: { color: '#fbbf24' },
  badgePersonalText: { color: '#38bdf8' },
  content: { flex: 1 },
  pad: { flex: 1, padding: 16 },
  mapPlaceholder: { height: 180, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mapTitle: { color: '#cbd5e1', fontWeight: '600', fontSize: 14 },
  mapSub: { color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  card: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#f1f5f9' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  distText: { fontSize: 12, color: '#38bdf8', fontWeight: '600' },
  bigSoc: { fontSize: 64, fontWeight: '900', color: '#38bdf8' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#1e293b' },
  preAuthBox: { backgroundColor: 'rgba(14,165,233,0.1)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.2)', borderRadius: 10, padding: 12, marginTop: 12 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, minHeight: 48, justifyContent: 'center' },
  navItemActive: { backgroundColor: 'rgba(14,165,233,0.15)' },
  navLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  navLabelActive: { color: '#38bdf8' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.75)' },
  modalSheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderTopWidth: 1, borderColor: '#1e293b' },
});
