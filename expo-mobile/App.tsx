import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Modal, Alert } from 'react-native';
// NativeWind allows standard Tailwind classes on React Native components (className="...")

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

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'telemetry' | 'wallet' | 'fleet'>('map');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isFleetMode, setIsFleetMode] = useState<boolean>(false);
  
  // Real-time ticking telemetry state
  const [kwhConsumed, setKwhConsumed] = useState<number>(0.0);
  const [currentKw, setCurrentKw] = useState<number>(120.0);
  const [batterySoc, setBatterySoc] = useState<number>(34);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(45.50);
  const [heldBalance, setHeldBalance] = useState<number>(0.00);

  // Ticking Telemetry Loop
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
      Alert.alert(
        'Insufficient Balance',
        `XCharge requires a $${PREAUTH_HOLD.toFixed(2)} pre-authorization credit check/hold before firing the OCPP unlock request. Please top up your Mobile Money wallet.`,
        [{ text: 'Top Up Wallet', onPress: () => setActiveTab('wallet') }]
      );
      return;
    }

    if (!isFleetMode) {
      setWalletBalance((prev) => +(prev - PREAUTH_HOLD).toFixed(2));
      setHeldBalance(PREAUTH_HOLD);
    }

    setIsCharging(true);
    setSelectedStation(null);
    setActiveTab('telemetry');
    Alert.alert('Connector Unlocked', `CitrineOS CSMS fired RemoteStartTransaction to ${station.stationId} Connector #${connector.connectorId}.`);
  };

  const handleStopCharging = () => {
    const finalCost = +(kwhConsumed * 0.32).toFixed(2);
    if (!isFleetMode) {
      const refund = +(heldBalance - finalCost).toFixed(2);
      setWalletBalance((prev) => +(prev + refund).toFixed(2));
      setHeldBalance(0);
    }
    setIsCharging(false);
    Alert.alert('Session Completed', `Charging stopped. Total delivered: ${kwhConsumed} kWh ($${finalCost.toFixed(2)} settled). Connector relocked.`);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      
      {/* Top Header Bar */}
      <View className="px-5 py-3 border-b border-slate-800 flex-row justify-between items-center bg-slate-900">
        <View>
          <Text className="text-xl font-bold text-sky-400">XCharge EV</Text>
          <Text className="text-xs text-slate-400">
            {isFleetMode ? 'Commercial Fleet: APEX-LOGISTICS' : 'Personal Driver Account'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsFleetMode(!isFleetMode)}
          className={`px-3 py-1.5 rounded-full border ${isFleetMode ? 'bg-amber-500/20 border-amber-500' : 'bg-sky-500/20 border-sky-500'}`}
        >
          <Text className={`text-xs font-semibold ${isFleetMode ? 'text-amber-400' : 'text-sky-400'}`}>
            {isFleetMode ? 'FLEET: VIN MODE' : 'PERSONAL'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Areas */}
      <View className="flex-1">
        {activeTab === 'map' && (
          <View className="flex-1 px-4 py-3">
            <View className="h-48 bg-slate-900 rounded-2xl border border-slate-800 p-4 justify-center items-center mb-4">
              <Text className="text-slate-300 font-semibold mb-1">XCharge Heavy Map Canvas</Text>
              <Text className="text-xs text-slate-500 text-center">
                React-Native-Maps / OpenStreetMap with PostGIS clustering & live connector indicators
              </Text>
              <View className="mt-3 flex-row space-x-2">
                <View className="px-2 py-1 bg-emerald-500/20 rounded border border-emerald-500">
                  <Text className="text-emerald-400 text-xs">● 8 Available</Text>
                </View>
                <View className="px-2 py-1 bg-blue-500/20 rounded border border-blue-500">
                  <Text className="text-blue-400 text-xs">● 3 Charging</Text>
                </View>
              </View>
            </View>

            <Text className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Nearby Fast Chargers</Text>
            <ScrollView className="flex-1">
              {[
                {
                  id: 'st-01',
                  stationId: 'XC-AFR-001',
                  name: 'XCharge Superhub - Airport City',
                  address: 'Liberation Rd, Terminal District',
                  distanceKm: 1.2,
                  connectors: [
                    { id: 1, connectorId: 1, type: 'CCS2', maxPowerKw: 160, status: 'Available', tariffPerKwh: 0.32 },
                    { id: 2, connectorId: 2, type: 'CCS2', maxPowerKw: 160, status: 'Charging', tariffPerKwh: 0.32 }
                  ]
                },
                {
                  id: 'st-02',
                  stationId: 'XC-CBD-002',
                  name: 'XCharge Express - Financial Plaza',
                  address: 'High Street Commercial Core',
                  distanceKm: 3.8,
                  connectors: [
                    { id: 3, connectorId: 1, type: 'CCS2', maxPowerKw: 200, status: 'Available', tariffPerKwh: 0.35 }
                  ]
                }
              ].map((station: any) => (
                <TouchableOpacity
                  key={station.id}
                  onPress={() => setSelectedStation(station)}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-bold text-slate-100">{station.name}</Text>
                    <Text className="text-xs text-sky-400 font-semibold">{station.distanceKm} km</Text>
                  </View>
                  <Text className="text-xs text-slate-400 mb-2">{station.address}</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-emerald-400">160 kW CCS2 Ultra-Fast</Text>
                    <Text className="text-xs text-slate-400">$0.32 / kWh</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {activeTab === 'telemetry' && (
          <View className="flex-1 p-5 justify-between">
            <View>
              <View className="items-center py-6">
                <Text className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Live Battery Telemetry</Text>
                <Text className="text-6xl font-extrabold text-sky-400">{batterySoc}%</Text>
                <Text className="text-xs text-slate-500 mt-1">Target SoC: 80% • 398.2V • 142A</Text>
              </View>

              <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                <View className="flex-row justify-between py-2 border-b border-slate-800">
                  <Text className="text-slate-400 text-sm">Active Charge Speed</Text>
                  <Text className="text-slate-100 font-bold text-sm">{currentKw.toFixed(1)} kW</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-slate-800">
                  <Text className="text-slate-400 text-sm">Energy Consumed</Text>
                  <Text className="text-emerald-400 font-bold text-sm">{kwhConsumed.toFixed(3)} kWh</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-slate-800">
                  <Text className="text-slate-400 text-sm">Elapsed Session Duration</Text>
                  <Text className="text-slate-100 font-bold text-sm">{formatTime(elapsedSeconds)}</Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-slate-400 text-sm">Accrued Cost</Text>
                  <Text className="text-amber-400 font-bold text-sm">${(kwhConsumed * 0.32).toFixed(2)}</Text>
                </View>
              </View>

              {!isFleetMode && (
                <View className="bg-sky-950/40 border border-sky-800/40 rounded-xl p-3">
                  <Text className="text-xs text-sky-300">
                    💳 Pre-Auth Hold: ${heldBalance.toFixed(2)} active. Surplus funds will automatically unlock upon charging completion.
                  </Text>
                </View>
              )}
            </View>

            {isCharging ? (
              <TouchableOpacity
                onPress={handleStopCharging}
                className="bg-rose-600 rounded-xl py-4 items-center mb-4"
              >
                <Text className="text-white font-bold text-base">Stop Charging & Release Connector</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setActiveTab('map')}
                className="bg-sky-600 rounded-xl py-4 items-center mb-4"
              >
                <Text className="text-white font-bold text-base">Select Charger on Map</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === 'wallet' && (
          <ScrollView className="flex-1 p-5">
            <View className="bg-gradient-to-r from-sky-900 to-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
              <Text className="text-xs text-slate-400 uppercase font-bold">XCharge Driver Wallet</Text>
              <Text className="text-4xl font-extrabold text-white mt-1">${walletBalance.toFixed(2)}</Text>
              <Text className="text-xs text-amber-400 mt-2">Held for Pre-Authorization: ${heldBalance.toFixed(2)}</Text>
            </View>

            <Text className="text-sm font-bold text-slate-200 mb-3">Top Up via Mobile Money</Text>
            <View className="flex-row space-x-2 mb-4">
              {['MTN MoMo', 'Vodafone Cash', 'M-Pesa'].map((momo) => (
                <TouchableOpacity
                  key={momo}
                  onPress={() => {
                    setWalletBalance((prev) => +(prev + 25).toFixed(2));
                    Alert.alert('MoMo Top-up', `Successfully loaded $25.00 via ${momo}.`);
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 py-3 rounded-xl items-center"
                >
                  <Text className="text-xs text-slate-200 font-semibold">{momo}</Text>
                  <Text className="text-xs text-emerald-400 mt-1">+$25</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {activeTab === 'fleet' && (
          <ScrollView className="flex-1 p-5">
            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
              <Text className="text-xs text-amber-400 font-bold uppercase">Commercial Fleet Management</Text>
              <Text className="text-lg font-bold text-white mt-1">Apex Logistics EV Fleet</Text>
              <Text className="text-xs text-slate-400 mt-1">Corporate Billing Account: CORP-XC-88402</Text>
            </View>

            <Text className="text-sm font-bold text-slate-200 mb-3">Assigned Vehicle Identification (VIN)</Text>
            {[
              { vin: '1FTFW1ED8NFA02941', model: 'Ford E-Transit 350', plate: 'GT-4491-24', driver: 'Kwame Mensah' },
              { vin: '7SAYGDEE4PF889120', model: 'Tesla Model Y Long Range', plate: 'GW-8920-23', driver: 'Ama Osei' },
              { vin: 'LGX1C23D8M1093847', model: 'BYD T3 Cargo Van', plate: 'GN-1002-24', driver: 'Kofi Boateng' }
            ].map((v) => (
              <View key={v.vin} className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3">
                <Text className="text-sm font-bold text-slate-100">{v.model}</Text>
                <Text className="text-xs text-sky-400 font-mono mt-0.5">VIN: {v.vin}</Text>
                <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-800">
                  <Text className="text-xs text-slate-400">Plate: {v.plate}</Text>
                  <Text className="text-xs text-slate-400">Driver: {v.driver}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View className="flex-row bg-slate-900 border-t border-slate-800 py-2 px-3 justify-around">
        {[
          { key: 'map', label: 'Map' },
          { key: 'telemetry', label: 'Charge HUD' },
          { key: 'wallet', label: 'MoMo Wallet' },
          { key: 'fleet', label: 'Fleet VIN' }
        ].map((tab: any) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg items-center ${activeTab === tab.key ? 'bg-sky-500/20' : ''}`}
          >
            <Text className={`text-xs font-semibold ${activeTab === tab.key ? 'text-sky-400' : 'text-slate-400'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Station Bottom Sheet Modal */}
      {selectedStation && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View className="flex-1 justify-end bg-black/70">
            <View className="bg-slate-900 rounded-t-3xl p-5 border-t border-slate-800">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-white">{selectedStation.name}</Text>
                <TouchableOpacity onPress={() => setSelectedStation(null)}>
                  <Text className="text-slate-400 font-bold">✕</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-slate-400 mb-4">{selectedStation.address}</Text>

              <Text className="text-xs font-bold text-slate-300 uppercase mb-2">Available Connectors</Text>
              {selectedStation.connectors.map((c) => (
                <View key={c.id} className="flex-row justify-between items-center bg-slate-950 p-3 rounded-xl mb-2 border border-slate-800">
                  <View>
                    <Text className="text-white font-bold">{c.type} • {c.maxPowerKw} kW</Text>
                    <Text className="text-xs text-slate-400">${c.tariffPerKwh} / kWh</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleStartCharging(selectedStation, c)}
                    className="bg-emerald-600 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white text-xs font-bold">Unlock & Charge</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
