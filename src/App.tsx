import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { ModernHeader } from './components/ModernHeader';
import { ModernBottomNav, TabKey } from './components/ModernBottomNav';
import { LiveChargeScreen } from './components/LiveChargeScreen';
import { StationMapScreen } from './components/StationMapScreen';
import { WalletScreen } from './components/WalletScreen';
import { FleetScreen } from './components/FleetScreen';
import { AdminStationManager } from './components/AdminStationManager';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { OtpVerificationScreen } from './components/OtpVerificationScreen';
import { OtpSuccessScreen } from './components/OtpSuccessScreen';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { DriverProfileModal } from './components/DriverProfileModal';
import { X, Building2, ShieldCheck, Car, User, LogOut, Wallet, Phone, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChargingStation, ActiveTelemetrySession } from './types';

export default function App() {
  // Splash screen state (can be replayed from header)
  const [showSplash, setShowSplash] = useState<boolean>(false);

  // Authentication workflow: 'authenticated' | 'login' | 'signup' | 'otp' | 'otp_success'
  const [authView, setAuthView] = useState<'authenticated' | 'login' | 'signup' | 'otp' | 'otp_success'>(() => {
    try {
      const saved = localStorage.getItem('xcharge_user_session');
      return saved ? 'authenticated' : 'login';
    } catch {
      return 'login';
    }
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('xcharge_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authPhone, setAuthPhone] = useState<string>('+233248901204');
  const [authDevCode, setAuthDevCode] = useState<string | undefined>(undefined);
  const [authGatewayNotice, setAuthGatewayNotice] = useState<string | undefined>(undefined);
  const [authRegistration, setAuthRegistration] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Active navigation tab (Strict 4-tab spec: 'map' | 'charge' | 'wallet' | 'fleet')
  const [activeTab, setActiveTab] = useState<TabKey>('map');

  // Viewport mode: 'phone' shell (~420px luxury chassis on desktop) or 'fluid' fullscreen on mobile/PWA
  const [deviceMode, setDeviceMode] = useState<'phone' | 'fluid'>(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      const isMobileScreen = window.innerWidth < 768;
      if (isStandalone || isMobileScreen) {
        return 'fluid';
      }
    }
    return 'phone';
  });

  // Backend state for real telemetry & admin
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveTelemetrySession | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('xcharge_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.registeredVehicles?.[0]?.model) {
          return `${parsed.registeredVehicles[0].make} ${parsed.registeredVehicles[0].model}`;
        }
      }
    } catch {}
    return 'FL-08 Nordic';
  });

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

    // Dynamically adjust device mode on screen resize/orientation change
    const handleResize = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      if (isStandalone || window.innerWidth < 768) {
        setDeviceMode('fluid');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleSignOut = () => {
    try {
      localStorage.removeItem('xcharge_user_session');
    } catch {}
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    setAuthView('login');
  };

  return (
    <div
      className={`w-full h-[100dvh] min-h-[100dvh] bg-[#070a0e] text-slate-100 flex flex-col items-center justify-center overflow-hidden font-sans select-none relative ${
        deviceMode === 'phone' ? 'p-0 sm:p-4' : 'p-0'
      }`}
    >
      {/* Ambient background glow for desktop showcase */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(45,122,62,0.18),transparent_60%)]" />

      {/* 1. Launch Splash Screen with Video and Cinematic Animation */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* Desktop Top Status Pill */}
      {deviceMode === 'phone' && (
        <div className="hidden lg:flex items-center justify-between w-full max-w-4xl px-4 py-1.5 mb-1 shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              CHARGELINK GH OS <span className="text-[#4ade80]">v2.4 WEB</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30">
              KUMASI & ACCRA NETWORK
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e699] animate-pulse" />
              OCPP 1.6J / 2.0.1 Live
            </span>
            <span>•</span>
            <span className="text-slate-300">Ghana MoMo Gateway</span>
          </div>
        </div>
      )}

      {/* 2. Main Mobile Frame / Responsive Container */}
      <div
        id="xcharge-app-container"
        className={`w-full h-full flex flex-col overflow-hidden transition-all duration-300 relative z-10 ${
          deviceMode === 'phone'
            ? 'sm:max-w-[420px] sm:max-h-[890px] sm:rounded-[44px] sm:border-[5px] sm:border-[#1e2531] sm:shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_50px_rgba(45,122,62,0.2)] sm:ring-1 sm:ring-white/15'
            : 'max-w-none max-h-none rounded-none border-none shadow-none'
        }`}
      >
        {/* Device Dynamic Island Bar on phone shell */}
        {deviceMode === 'phone' && (
          <div className="hidden sm:flex items-center justify-between px-6 pt-2.5 pb-1 bg-[#10141a] shrink-0 border-b border-white/[0.04]">
            <span className="text-[11px] font-mono font-bold text-slate-300">9:41</span>
            <div className="w-24 h-4 bg-black rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#181c24] mr-auto ml-1.5 border border-white/5" />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono">
              <span>5G</span>
              <div className="w-3.5 h-2 rounded-2xs border border-slate-300 p-0.5 flex items-center">
                <div className="w-full h-full bg-[#00e699] rounded-3xs" />
              </div>
            </div>
          </div>
        )}

        {/* Render Authentication Suite or Main Dashboard */}
        {authView !== 'authenticated' ? (
          <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0a0e14]">
            <AnimatePresence mode="wait">
              <motion.div
                key={authView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col overflow-hidden w-full h-full"
              >
                {authView === 'login' && (
                  <LoginScreen
                    onSendCode={(phone, type, devCode, gatewayNotice) => {
                      setAuthPhone(phone);
                      setAuthDevCode(devCode);
                      setAuthGatewayNotice(gatewayNotice);
                      setAuthView('otp');
                    }}
                    onNavigateToSignUp={() => setAuthView('signup')}
                    onGuestExplore={() => setAuthView('authenticated')}
                  />
                )}

                {authView === 'signup' && (
                  <SignUpScreen
                    onContinue={(data) => {
                      setAuthPhone(data.phoneNumber);
                      setAuthDevCode(data.devCode);
                      setAuthRegistration(data);
                      setAuthView('otp');
                    }}
                    onBackToLogin={() => setAuthView('login')}
                  />
                )}

                {authView === 'otp' && (
                  <OtpVerificationScreen
                    phoneNumber={authPhone}
                    devCode={authDevCode}
                    gatewayNotice={authGatewayNotice}
                    registrationMetadata={authRegistration}
                    onVerified={(user) => {
                      setCurrentUser(user);
                      try {
                        localStorage.setItem('xcharge_user_session', JSON.stringify(user));
                      } catch {}
                      if (user?.registeredVehicles?.[0]?.model) {
                        setSelectedVehicle(`${user.registeredVehicles[0].make} ${user.registeredVehicles[0].model}`);
                      }
                      setAuthView('otp_success');
                    }}
                    onBackToLogin={() => setAuthView('login')}
                  />
                )}

                {authView === 'otp_success' && (
                  <OtpSuccessScreen
                    user={currentUser}
                    onEnterDashboard={() => setAuthView('authenticated')}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <>
            {/* Persistent Header */}
            <ModernHeader
              vehicleBadge={selectedVehicle}
              deviceMode={deviceMode}
              onToggleDeviceMode={() => setDeviceMode(deviceMode === 'phone' ? 'fluid' : 'phone')}
              onReplaySplash={() => setShowSplash(true)}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenVehicleSelect={() => setIsVehicleModalOpen(true)}
              onOpenAdmin={() => setIsAdminOpen(true)}
              avatarUrl={currentUser?.avatarUrl}
              driverName={currentUser?.displayName}
            />

            {/* Main Content Area (4 Modernized Screens) */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0a0e14]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                  className="flex-1 flex flex-col overflow-hidden w-full h-full"
                >
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
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Persistent Bottom Navigation (4 Tabs) */}
            <ModernBottomNav
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
              isCharging={true}
            />
          </>
        )}
      </div>

      {/* Driver Profile & Settings Modal */}
      <DriverProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        activeVehicle={selectedVehicle}
        onSelectVehicle={(vehicleName) => setSelectedVehicle(vehicleName)}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          try {
            localStorage.setItem('xcharge_user_session', JSON.stringify(updated));
          } catch {}
        }}
        onOpenAdmin={() => {
          setIsProfileModalOpen(false);
          setIsAdminOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      {/* Vehicle Selector Modal */}
      <AnimatePresence>
        {isVehicleModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsVehicleModalOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-md bg-[#10141a] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#4ade80]" />
                  <h3 className="text-sm font-bold text-white">Select Active Vehicle Profile</h3>
                </div>
                <button
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#181c24] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
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
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedVehicle === veh.name
                        ? 'bg-[#181c24] border-[#22c55e] shadow-md shadow-black/40'
                        : 'bg-[#141820] border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{veh.name}</span>
                      <p className="text-[11px] text-[#94a3b8]">{veh.model}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#4ade80]">{veh.soc}</span>
                      <p className="text-[10px] text-[#00e699] font-mono">{veh.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Station Management Sheet / Drawer */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAdminOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-2xl h-[90vh] bg-[#10141a] border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-[#141820] border-b border-white/[0.08] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#4ade80]" />
                  <h3 className="text-sm font-bold text-white">ChargeLink GH Operator & Station Admin</h3>
                </div>
                <button
                  id="btn-close-admin-modal"
                  onClick={() => setIsAdminOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#181c24] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progressive Web App (PWA) Mobile Install Prompt */}
      <PwaInstallPrompt />
    </div>
  );
}
