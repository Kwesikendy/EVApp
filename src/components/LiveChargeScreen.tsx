import React, { useState, useEffect } from 'react';
import {
  Zap,
  Power,
  ChevronDown,
  ChevronUp,
  Clock,
  Gauge,
  CircleDollarSign,
  ShieldCheck,
  BatteryCharging,
  Thermometer,
  Activity,
  Sliders
} from 'lucide-react';
import type { ActiveTelemetrySession } from '../types';

interface LiveChargeScreenProps {
  session?: ActiveTelemetrySession | null;
  onStopCharging?: () => void;
  isStopping?: boolean;
}

export const LiveChargeScreen: React.FC<LiveChargeScreenProps> = ({
  session,
  onStopCharging,
  isStopping = false,
}) => {
  // Target charge limit state (default 80%)
  const [targetLimit, setTargetLimit] = useState<number>(80);
  const [isTechDetailsOpen, setIsTechDetailsOpen] = useState<boolean>(false);

  // Default simulated stats or real active session data
  const currentSoc = session ? Math.min(100, Math.round(session.batteryPercent)) : 68;
  const chargingSpeedKw = session ? Math.round(session.chargingSpeedKw) : 185;
  const energyKwh = session ? session.energyConsumedKwh.toFixed(1) : '34.0';
  const costGhs = session ? (session.currentCostUsd * 14.28).toFixed(2) : '14.28'; // Currency strictly GH₵
  const rangeAddedKm = Math.round((session?.energyConsumedKwh || 34) * 4.18);
  const voltage = 742;
  const currentAmps = 248;

  // Circular gauge math
  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentSoc / 100) * circumference;

  return (
    <div id="screen-live-charge" className="flex-1 flex flex-col bg-[#0a0e14] overflow-y-auto no-scrollbar p-3.5 sm:p-4 space-y-4 select-none pb-8">
      {/* 1. Sub-Header: Active Charger Banner Card */}
      <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-3.5 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-tight">Apex Hypercharge Hub</h2>
          </div>
          <p className="text-xs text-[#94a3b8] font-mono">
            CCS2 · 350 kW Ultra-Fast
          </p>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[10px] font-mono font-bold text-[#00f0ff] tracking-wide uppercase">
          ACTIVE Negotiated
        </div>
      </div>

      {/* 2. Hero Telemetry Gauge */}
      <div className="bg-gradient-to-b from-[#10141a] to-[#141820] border border-white/[0.08] rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-lg">
        {/* Ambient background glow */}
        <div className="absolute w-48 h-48 rounded-full bg-[#00f0ff]/10 blur-2xl pointer-events-none" />

        {/* Circular Progress Meter */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
            {/* Track */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              className="text-[#181c24]"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Target limit marker ring */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="12"
              strokeDasharray={`2 12`}
              fill="transparent"
            />
            {/* Active Cyan Glowing Stroke */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="#00f0ff"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              fill="transparent"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.75))',
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
          </svg>

          {/* Center Readout inside gauge */}
          <div className="absolute flex flex-col items-center text-center">
            <span className="text-5xl font-bold tracking-tighter text-white font-mono">
              {currentSoc}%
            </span>

            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-xs font-mono font-bold text-[#00f0ff]">
              <Zap className="w-3.5 h-3.5 fill-[#00f0ff]" />
              <span>{chargingSpeedKw} kW Fast Charge</span>
            </div>

            <span className="text-xs text-[#94a3b8] font-mono mt-1">
              +{energyKwh} kWh added
            </span>
          </div>
        </div>

        {/* Pulse status indicator under gauge */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#00e699] mt-2">
          <span className="w-2 h-2 rounded-full bg-[#00e699] animate-ping" />
          <span>Cell Voltage Balanced · 400V-800V Architecture</span>
        </div>
      </div>

      {/* 3. Three-Column Metrics Summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[#94a3b8] text-[11px]">
            <Clock className="w-3 h-3 text-[#00f0ff]" />
            <span>To 80%</span>
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-white font-mono leading-tight block">9 mins</span>
            <span className="text-[10px] text-[#64748b]">remaining</span>
          </div>
        </div>

        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[#94a3b8] text-[11px]">
            <Gauge className="w-3 h-3 text-[#00e699]" />
            <span>Range Added</span>
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-white font-mono leading-tight block">+{rangeAddedKm} km</span>
            <span className="text-[10px] text-[#64748b]">estimated</span>
          </div>
        </div>

        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[#94a3b8] text-[11px]">
            <CircleDollarSign className="w-3 h-3 text-[#00f0ff]" />
            <span>Session Cost</span>
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-white font-mono leading-tight block">GH₵ {costGhs}</span>
            <span className="text-[10px] text-[#64748b]">MoMo linked</span>
          </div>
        </div>
      </div>

      {/* 4. Target Charge Limit Card */}
      <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white block">Target Charge Limit</span>
            <span className="text-[10px] text-[#94a3b8]">Recommended for daily battery longevity</span>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-xs font-mono font-bold text-[#00f0ff]">
            {targetLimit}%
          </span>
        </div>

        {/* Tactile Slider */}
        <div className="relative pt-2 pb-1">
          <input
            id="slider-target-limit"
            type="range"
            min="50"
            max="100"
            step="5"
            value={targetLimit}
            onChange={e => setTargetLimit(Number(e.target.value))}
            className="w-full h-2 bg-[#181c24] rounded-lg appearance-none cursor-pointer accent-[#00f0ff]"
          />
        </div>

        {/* Labels below slider */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#64748b]">Current: {currentSoc}%</span>
          <span className="text-[#00f0ff] font-semibold">Daily: 80%</span>
          <span className="text-[#94a3b8]">Road Trip: 100%</span>
        </div>
      </div>

      {/* 5. Collapsible Technical Details */}
      <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl overflow-hidden transition-all">
        <button
          id="btn-toggle-tech-details"
          onClick={() => setIsTechDetailsOpen(!isTechDetailsOpen)}
          className="w-full p-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00f0ff]" />
            <span className="text-xs font-semibold text-slate-200">Hardware Telemetry Bus</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded-full bg-[#181c24] border border-white/[0.08] text-xs font-mono text-[#00f0ff]">
              {voltage}V · {currentAmps}A
            </div>
            {isTechDetailsOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {isTechDetailsOpen && (
          <div className="p-3.5 pt-0 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-[#141820] p-2.5 rounded-xl">
              <span className="text-[10px] text-[#64748b] block">PACK VOLTAGE</span>
              <span className="text-sm font-semibold text-white">742.4 V DC</span>
            </div>
            <div className="bg-[#141820] p-2.5 rounded-xl">
              <span className="text-[10px] text-[#64748b] block">DELIVERY CURRENT</span>
              <span className="text-sm font-semibold text-white">248.8 A</span>
            </div>
            <div className="bg-[#141820] p-2.5 rounded-xl">
              <span className="text-[10px] text-[#64748b] block">CELL TEMPERATURE</span>
              <span className="text-sm font-semibold text-[#00e699]">29.4 °C Optimal</span>
            </div>
            <div className="bg-[#141820] p-2.5 rounded-xl">
              <span className="text-[10px] text-[#64748b] block">COOLING FLOW</span>
              <span className="text-sm font-semibold text-white">18.2 L/min</span>
            </div>
            <div className="col-span-2 bg-[#141820] p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748b] block">PROTOCOL STANDARD</span>
                <span className="text-xs font-semibold text-slate-300">OCPP 2.0.1 / ISO 15118 Plug&Charge</span>
              </div>
              <ShieldCheck className="w-4 h-4 text-[#00e699]" />
            </div>
          </div>
        )}
      </div>

      {/* 6. Safety Action: Prominent Stop Button */}
      <div className="pt-2 space-y-2">
        <button
          id="btn-stop-charging"
          onClick={onStopCharging}
          disabled={isStopping}
          className="w-full min-h-[48px] py-3 rounded-2xl bg-[#2b1418] hover:bg-[#3d1a20] border border-[#ff4d4d]/60 text-[#ff4d4d] font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          <Power className="w-4 h-4" />
          <span>{isStopping ? 'RAMPING DOWN POWER...' : 'STOP CHARGING'}</span>
        </button>

        <p className="text-[10px] text-center text-[#94a3b8] font-mono leading-relaxed">
          Safely ramps down session and unlatches connector cable
        </p>
      </div>
    </div>
  );
};
