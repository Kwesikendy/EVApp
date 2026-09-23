import React from 'react';
import { Car, User, Smartphone, Monitor, Video } from 'lucide-react';
import { XChargeLogo } from './XChargeLogo';

interface ModernHeaderProps {
  vehicleBadge?: string;
  isOnline?: boolean;
  deviceMode: 'phone' | 'fluid';
  onToggleDeviceMode: () => void;
  onOpenProfile?: () => void;
  onOpenVehicleSelect?: () => void;
  onReplaySplash?: () => void;
  onOpenAdmin?: () => void;
  avatarUrl?: string;
  driverName?: string;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  vehicleBadge = 'FL-08 Nordic',
  isOnline = true,
  deviceMode,
  onToggleDeviceMode,
  onOpenProfile,
  onOpenVehicleSelect,
  onReplaySplash,
  onOpenAdmin,
  avatarUrl,
  driverName
}) => {
  return (
    <header
      id="xcharge-global-header"
      className="h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] bg-[#10141a] border-b border-white/[0.08] px-3 sm:px-4 shrink-0 select-none z-30"
    >
      <div className="w-full max-w-4xl mx-auto h-full flex items-center justify-between">
      {/* Left: Official ChargeLink GH Logo + status pill */}
      <div className="flex items-center gap-2.5">
        <XChargeLogo size="sm" variant="full" />
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#00e699]/10 border border-[#00e699]/30 text-[10px] font-mono font-semibold text-[#00e699]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e699] animate-pulse" />
          <span>LIVE</span>
        </span>
      </div>

      {/* Right: Fleet/Vehicle badge pill + Avatar & controls */}
      <div className="flex items-center gap-2">
        {/* Replay Splash button */}
        {onReplaySplash && (
          <button
            id="btn-replay-splash"
            onClick={onReplaySplash}
            title="Replay Charging Video Splash"
            className="w-7 h-7 rounded-lg bg-[#181c24] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-[#4ade80] transition-colors cursor-pointer active:scale-95"
          >
            <Video className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Viewport toggle (Mobile Shell vs Fullscreen) */}
        <button
          id="btn-header-viewport"
          onClick={onToggleDeviceMode}
          title="Toggle Fullscreen or Mobile Shell"
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#181c24] border border-white/[0.08] text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95"
        >
          {deviceMode === 'phone' ? (
            <>
              <Monitor className="w-3 h-3 text-[#4ade80]" />
              <span>Fullscreen</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3 h-3 text-[#00e699]" />
              <span>Phone</span>
            </>
          )}
        </button>

        {/* Vehicle Badge Pill */}
        <button
          id="header-vehicle-pill"
          onClick={onOpenVehicleSelect}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181c24] hover:bg-[#1f2632] border border-white/[0.08] transition-colors cursor-pointer active:scale-95"
        >
          <Car className="w-3.5 h-3.5 text-[#22c55e]" />
          <span className="text-xs font-mono font-semibold text-slate-200">{vehicleBadge}</span>
        </button>

        {/* Profile Avatar Button (Operator / Account Portal) */}
        <button
          id="header-profile-btn"
          onClick={onOpenProfile || onOpenAdmin}
          title="Driver Profile & Operator Portal"
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#181c24] to-[#1f2632] border border-white/10 hover:border-[#22c55e]/50 flex items-center justify-center transition-all group cursor-pointer active:scale-95 overflow-hidden ring-1 ring-white/5"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={driverName || 'Driver'}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <User className="w-4 h-4 text-slate-300 group-hover:text-[#22c55e]" />
          )}
        </button>
      </div>
      </div>
    </header>
  );
};
