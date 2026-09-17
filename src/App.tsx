import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { ModernHeader } from './components/ModernHeader';
import { ModernBottomNav, TabKey } from './components/ModernBottomNav';
import { LiveChargeScreen } from './components/LiveChargeScreen';
import { StationMapScreen } from './components/StationMapScreen';
import { WalletScreen } from './components/WalletScreen';
import { FleetScreen } from './components/FleetScreen';
import { AdminStationManager } from './components/AdminStationManager';
import { X, Building2, ShieldCheck, Car } from 'lucide-react';
import type { ChargingStation, ActiveTelemetrySession } from './types';

export default function App() {
  // Splash screen state (can be replayed from header)
  const [showSplash, setShowSplash] = useState<boolean>(false);

  // Active navigation tab (Strict 4-tab spec: 'map' | 'charge' | 'wallet' | 'fleet')
  const [activeTab, setActiveTab] = useState<TabKey>('map');

  // Viewport mode: 'phone' shell (~390px) or 'fluid' fullscreen
  const [deviceMode, setDeviceMode] = useState<'phone' | 'fluid'>('fluid');

  // Backend state for real telemetry & admin
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveTelemetrySession | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('FL-08 Nordic');

  // Load live data from server
  const loadData = async () => {
    try {
      const [stRes, sesRes] = await Promise.all([
        fetch('/api/stations?lat=5.5900&lng=-0.1850'),
        fetch('/api/session/active'),
      ]);
      if (stRes.ok) setStations(await stRes.json());
      if (sesRes.ok) {
        const sesData = await sesRes.json();
        setActiveSession(sesData.activeSession || null);
      }
    } catch {
      // Offline / initial fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStopCharging = async () => {
    try {
      await fetch('/api/charge/stop', { method: 'POST' });
      setActiveSession(null);
      alert('Session ramped down safely. Cable unlatched.');
    } catch {
      alert('Charge stopped locally.');
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0a0e14] text-slate-100 flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* 1. Launch Splash Screen with Video and Cinematic Animation */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* 2. Main Mobile Frame / Responsive Container */}
      <div
        id="xcharge-app-container"
        className={`w-full h-full flex flex-col overflow-hidden transition-all duration-300 relative ${
          deviceMode === 'phone'
            ? 'max-w-[430px] max-h-[920px] rounded-none sm:rounded-[40px] sm:border sm:border-white/10 sm:shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:ring-8 sm:ring-[#141820]'
            : 'max-w-none max-h-none'
        }`}
      >
        {/* Device Notch on phone shell */}
        {deviceMode === 'phone' && (
          <div className="hidden sm:flex justify-center bg-[#10141a] pt-2 shrink-0">
            <div className="w-28 h-4 bg-[#0a0e14] rounded-full border border-white/5" />
          </div>
        )}

        {/* Persistent Header */}
        <ModernHeader
          vehicleBadge={selectedVehicle}
          deviceMode={deviceMode}
          onToggleDeviceMode={() => setDeviceMode(deviceMode === 'phone' ? 'fluid' : 'phone')}
          onReplaySplash={() => setShowSplash(true)}
          onOpenVehicleSelect={() => setIsVehicleModalOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />

        {/* Main Content Area (4 Modernized Screens) */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0a0e14]">
          {activeTab === 'map' && (
            <StationMapScreen
              onNavigateToCharge={() => setActiveTab('charge')}
            />
          )}

          {activeTab === 'charge' && (
            <LiveChargeScreen
              session={activeSession}
              onStopCharging={handleStopCharging}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletScreen />
          )}

          {activeTab === 'fleet' && (
            <FleetScreen
              onLocateVehicle={(vin) => {
                setActiveTab('map');
              }}
            />
          )}
        </main>

        {/* Persistent Bottom Navigation (4 Tabs) */}
        <ModernBottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isCharging={true}
        />
      </div>

      {/* Vehicle Selector Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#10141a] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-[#00f0ff]" />
                <h3 className="text-sm font-bold text-white">Select Active Vehicle Profile</h3>
              </div>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#181c24] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { name: 'FL-08 Nordic', model: 'Polestar 3 Performance', soc: '68%', status: 'Charging' },
                { name: 'HV-04 Nordic', model: 'Volvo FH Electric Truck', soc: '92%', status: 'Ready' },
                { name: 'VN-12 Nordic', model: 'Ford E-Transit Cargo', soc: '41%', status: 'On Route' },
              ].map(veh => (
                <button
                  key={veh.name}
                  onClick={() => {
                    setSelectedVehicle(veh.name);
                    setIsVehicleModalOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedVehicle === veh.name
                      ? 'bg-[#181c24] border-[#00f0ff] glow-cyan-sm'
                      : 'bg-[#141820] border-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-white font-mono">{veh.name}</span>
                    <p className="text-[11px] text-[#94a3b8]">{veh.model}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#00f0ff]">{veh.soc}</span>
                    <p className="text-[10px] text-[#00e699] font-mono">{veh.status}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Station Management Sheet / Drawer */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-2xl h-[90vh] bg-[#10141a] border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#141820] border-b border-white/[0.08] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#00f0ff]" />
                <h3 className="text-sm font-bold text-white">XCharge Operator & Station Admin</h3>
              </div>
              <button
                id="btn-close-admin-modal"
                onClick={() => setIsAdminOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181c24] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AdminStationManager
                stations={stations}
                onRefreshStations={loadData}
                onSwitchToMap={() => {
                  setIsAdminOpen(false);
                  setActiveTab('map');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
