import React, { useState, useEffect, useCallback } from 'react';
import type { ChargingStation, ActiveTelemetrySession, UserWallet, FleetAccount, OcppMessage } from './types';
import { MapView } from './components/MapView';
import { ActiveChargingHUD } from './components/ActiveChargingHUD';
import { StationDetailModal } from './components/StationDetailModal';
import { WalletModal } from './components/WalletModal';
import { FleetVINProfile } from './components/FleetVINProfile';
import { OcppHardwareSimulator } from './components/OcppHardwareSimulator';
import { DevSetupDocs } from './components/DevSetupDocs';
import { ExpoMobileFrame } from './components/ExpoMobileFrame';
import {
  MapPin,
  Zap,
  Wallet,
  Truck,
  Terminal,
  Layers,
  Smartphone,
  Monitor,
  Activity,
  Radio,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [fleet, setFleet] = useState<FleetAccount | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveTelemetrySession | null>(null);
  const [ocppLogs, setOcppLogs] = useState<OcppMessage[]>([]);
  
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [activeRouteStationId, setActiveRouteStationId] = useState<string | null>(null);
  const [isFleetMode, setIsFleetMode] = useState<boolean>(false);
  const [activeVin, setActiveVin] = useState<string>('1FTFW1ED8NFA02941');
  
  const [activeTab, setActiveTab] = useState<'map' | 'hud' | 'wallet' | 'fleet' | 'ocpp' | 'workbench'>('map');
  const [deviceMode, setDeviceMode] = useState<'phone' | 'fluid'>('phone');
  
  const [isStartingCharge, setIsStartingCharge] = useState(false);
  const [isStoppingCharge, setIsStoppingCharge] = useState(false);
  const [appNotice, setAppNotice] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setAppNotice({ text, type });
    setTimeout(() => setAppNotice(null), 5000);
  };

  // 1. Initial Data Fetching
  const loadInitialData = useCallback(async () => {
    try {
      const [stRes, wRes, flRes, sesRes, logRes] = await Promise.all([
        fetch('/api/stations?lat=5.5900&lng=-0.1850'),
        fetch('/api/wallet'),
        fetch('/api/fleet'),
        fetch('/api/session/active'),
        fetch('/api/ocpp/logs')
      ]);

      if (stRes.ok) setStations(await stRes.json());
      if (wRes.ok) setWallet(await wRes.json());
      if (flRes.ok) setFleet(await flRes.json());
      if (sesRes.ok) {
        const sesData = await sesRes.json();
        setActiveSession(sesData.session);
      }
      if (logRes.ok) setOcppLogs(await logRes.json());
    } catch (err) {
      console.error('Failed to load initial EV platform data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Telemetry Polling (every 1.5 seconds for live ticking updates)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const [sesRes, logRes] = await Promise.all([
          fetch('/api/session/active'),
          fetch('/api/ocpp/logs')
        ]);
        if (sesRes.ok) {
          const sesData = await sesRes.json();
          setActiveSession(sesData.session);
        }
        if (logRes.ok) {
          setOcppLogs(await logRes.json());
        }
      } catch {
        // silent catch during polling
      }
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // 3. Actions
  const handleStartCharging = async (
    stationId: string,
    connectorId: number,
    isFleet: boolean,
    vin?: string
  ) => {
    setIsStartingCharge(true);
    try {
      const res = await fetch('/api/ocpp/remote-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          connectorId,
          isFleet,
          vin: isFleet ? vin || activeVin : undefined,
          preauthHoldAmount: 20.00
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OCPP unlock request failed');
      }

      setActiveSession(data.session);
      if (data.wallet) setWallet(data.wallet);
      setSelectedStation(null);
      setActiveTab('hud'); // Switch straight to live ticking telemetry HUD!

      // Refresh stations
      const stRes = await fetch('/api/stations?lat=5.5900&lng=-0.1850');
      if (stRes.ok) setStations(await stRes.json());

      showNotice('⚡ RemoteStartTransaction accepted by CitrineOS. Charging underway!', 'success');
    } finally {
      setIsStartingCharge(false);
    }
  };

  const handleStopCharging = async () => {
    setIsStoppingCharge(true);
    try {
      const res = await fetch('/api/ocpp/remote-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to stop session');
      }

      setActiveSession(null);
      if (data.wallet) setWallet(data.wallet);

      // Refresh stations
      const stRes = await fetch('/api/stations?lat=5.5900&lng=-0.1850');
      if (stRes.ok) setStations(await stRes.json());

      showNotice(
        `Session terminated. Delivered ${data.completedSession.kwhDelivered.toFixed(2)} kWh. Held funds reconciled.`,
        'success'
      );
    } catch (err: any) {
      showNotice(err.message || 'Error stopping session', 'error');
    } finally {
      setIsStoppingCharge(false);
    }
  };

  const handleTopUp = async (amount: number, provider: string, phone: string) => {
    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, provider, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Top-up failed');
    setWallet(data.wallet);
    showNotice(`Successfully deposited $${amount.toFixed(2)} via ${provider} Mobile Money.`, 'success');
  };

  const handleInjectOcppEvent = async (
    action: string,
    payload: Record<string, unknown>,
    direction: 'INCOMING' | 'OUTGOING' = 'INCOMING'
  ) => {
    const res = await fetch('/api/ocpp/inject-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload, direction })
    });
    if (res.ok) {
      const logRes = await fetch('/api/ocpp/logs');
      if (logRes.ok) setOcppLogs(await logRes.json());
      showNotice(`Simulated OCPP [${action}] packet broadcasted.`, 'info');
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Global Command Bar */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight text-white uppercase">XCharge EV</h1>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded font-bold font-mono">
                  OCPP 1.6-J / 2.0.1
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">Driver & Commercial Fleet Architecture</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-slate-800">
            <span className="text-xs text-slate-400">CSMS:</span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CitrineOS Core (Local:8080)</span>
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Active Charging session indicator button */}
          {activeSession && (
            <button
              id="header-active-session-indicator"
              onClick={() => setActiveTab('hud')}
              className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Charging: {activeSession.kwhDelivered.toFixed(2)} kWh</span>
            </button>
          )}

          {/* Wallet Balance Pill */}
          {wallet && (
            <button
              id="header-wallet-btn"
              onClick={() => setActiveTab('wallet')}
              className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Wallet className="w-3.5 h-3.5 text-sky-400" />
              <span>${wallet.availableBalance.toFixed(2)}</span>
            </button>
          )}

          {/* Phone / Desktop Viewport Switcher */}
          <button
            id="btn-toggle-viewport"
            onClick={() => setDeviceMode(deviceMode === 'phone' ? 'fluid' : 'phone')}
            className="hidden sm:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-xl border border-slate-700 transition-colors"
            title="Toggle between Native Phone Shell and Fullscreen Web"
          >
            {deviceMode === 'phone' ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span>Fullscreen</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Phone Shell</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Floating Notice / Toast */}
      {appNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl transition-all border animate-in fade-in duration-200 flex items-center gap-2 bg-slate-900 border-sky-500/50 text-sky-200">
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>{appNotice.text}</span>
        </div>
      )}

      {/* Main Workspace with Phone Shell or Fullscreen */}
      <main className="flex-1 flex overflow-hidden relative">
        <ExpoMobileFrame
          deviceMode={deviceMode}
          onToggleDeviceMode={() => setDeviceMode(deviceMode === 'phone' ? 'fluid' : 'phone')}
          activeTabTitle={activeTab}
        >
          {/* Subheader bar inside mobile frame */}
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-400">XCharge</span>
              <span className="text-[10px] text-slate-400">
                {isFleetMode ? 'Commercial Fleet: APEX-LOGISTICS' : 'Personal EV Driver'}
              </span>
            </div>
            <button
              id="mobile-fleet-toggle-btn"
              onClick={() => setIsFleetMode(!isFleetMode)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                isFleetMode
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {isFleetMode ? 'FLEET: VIN MODE' : 'PERSONAL'}
            </button>
          </div>

          {/* Active Tab Screen */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'map' && (
              <MapView
                stations={stations}
                selectedStation={selectedStation}
                onSelectStation={st => setSelectedStation(st)}
                activeRouteStationId={activeRouteStationId}
                onToggleRoute={stId => setActiveRouteStationId(activeRouteStationId === stId ? null : stId)}
              />
            )}

            {activeTab === 'hud' && (
              <ActiveChargingHUD
                session={activeSession}
                onStopSession={handleStopCharging}
                isStopping={isStoppingCharge}
                onSwitchToMap={() => setActiveTab('map')}
              />
            )}

            {activeTab === 'wallet' && wallet && (
              <WalletModal
                wallet={wallet}
                onTopUp={handleTopUp}
                onClose={() => setActiveTab('map')}
              />
            )}

            {activeTab === 'fleet' && fleet && (
              <FleetVINProfile
                fleet={fleet}
                isFleetMode={isFleetMode}
                onToggleFleetMode={setIsFleetMode}
                activeVin={activeVin}
                onSelectVin={setActiveVin}
              />
            )}

            {activeTab === 'ocpp' && (
              <OcppHardwareSimulator
                logs={ocppLogs}
                onInjectEvent={handleInjectOcppEvent}
                onRefreshLogs={async () => {
                  const res = await fetch('/api/ocpp/logs');
                  if (res.ok) setOcppLogs(await res.json());
                }}
              />
            )}

            {activeTab === 'workbench' && <DevSetupDocs />}
          </div>

          {/* Station Details Drawer / Sheet Modal */}
          {selectedStation && wallet && fleet && (
            <StationDetailModal
              station={selectedStation}
              wallet={wallet}
              fleet={fleet}
              isFleetMode={isFleetMode}
              onClose={() => setSelectedStation(null)}
              onStartCharging={handleStartCharging}
              onNavigate={stId => {
                setActiveRouteStationId(stId);
                setSelectedStation(null);
                showNotice('Navigation route plotted to ' + selectedStation.name, 'info');
              }}
              isStarting={isStartingCharge}
              onOpenWallet={() => {
                setSelectedStation(null);
                setActiveTab('wallet');
              }}
            />
          )}

          {/* Bottom Native Navigation Tabs */}
          <nav className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 shrink-0 z-20">
            <button
              id="tab-btn-map"
              onClick={() => setActiveTab('map')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'map' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Map</span>
            </button>

            <button
              id="tab-btn-hud"
              onClick={() => setActiveTab('hud')}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
                activeTab === 'hud' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Zap className="w-4 h-4 mb-0.5" />
                {activeSession && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </div>
              <span className="text-[10px]">Charge HUD</span>
            </button>

            <button
              id="tab-btn-wallet"
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'wallet' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">MoMo Wallet</span>
            </button>

            <button
              id="tab-btn-fleet"
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'fleet' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Fleet VIN</span>
            </button>

            <button
              id="tab-btn-ocpp"
              onClick={() => setActiveTab('ocpp')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'ocpp' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">OCPP CSMS</span>
            </button>

            <button
              id="tab-btn-workbench"
              onClick={() => setActiveTab('workbench')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'workbench' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Tasks 1-4</span>
            </button>
          </nav>
        </ExpoMobileFrame>
      </main>
    </div>
  );
}
