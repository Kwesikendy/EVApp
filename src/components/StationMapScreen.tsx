import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Navigation,
  Layers,
  Locate,
  Plug,
  Gauge,
  Car,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { ChargingStation } from '../types';

interface StationMapScreenProps {
  onSelectStationForCharge?: (station: any) => void;
  onNavigateToCharge?: () => void;
}

interface MapStationItem {
  id: string;
  name: string;
  subline: string;
  badge: string;
  color: 'cyan' | 'green' | 'amber' | 'red';
  power: string;
  availableStalls: number;
  totalStalls: number;
  distance: string;
  eta: string;
  pricePerKwh: string;
  connectors: { type: string; count: number }[];
  xPercent: number; // For responsive map placement
  yPercent: number;
}

export const StationMapScreen: React.FC<StationMapScreenProps> = ({
  onSelectStationForCharge,
  onNavigateToCharge,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('available');
  const [selectedStationId, setSelectedStationId] = useState<string>('apex-hub');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTrafficOn, setIsTrafficOn] = useState<boolean>(true);
  const [activeRoute, setActiveRoute] = useState<boolean>(true);

  // Modernized station pins per spec
  const stations: MapStationItem[] = [
    {
      id: 'apex-hub',
      name: 'Apex Hypercharge Hub',
      subline: '2.4 km · 6 min drive · Marina Corridor',
      badge: '350 kW · 4 open · 2.4 km (6 min)',
      color: 'cyan',
      power: 'Up to 350 kW',
      availableStalls: 4,
      totalStalls: 6,
      distance: '2.4 km',
      eta: '6 min',
      pricePerKwh: 'GH₵ 3.20 / kWh',
      connectors: [
        { type: 'CCS2', count: 3 },
        { type: 'CHAdeMO', count: 1 },
      ],
      xPercent: 54,
      yPercent: 42,
    },
    {
      id: 'airport-supercharge',
      name: 'Kotoka Terminal 3 Superhub',
      subline: '1.1 km · 3 min drive · Airport Bypass',
      badge: '300 kW · 3 open · 1.1 km (3 min)',
      color: 'green',
      power: 'Up to 300 kW',
      availableStalls: 3,
      totalStalls: 4,
      distance: '1.1 km',
      eta: '3 min',
      pricePerKwh: 'GH₵ 3.10 / kWh',
      connectors: [
        { type: 'CCS2', count: 2 },
        { type: 'Type 2', count: 1 },
      ],
      xPercent: 28,
      yPercent: 30,
    },
    {
      id: 'osu-depot',
      name: 'Osu Oxford Fast Charger',
      subline: '4.1 km · 11 min drive · Cantonments Rd',
      badge: '180 kW · 1 open · 4.1 km (11 min)',
      color: 'amber',
      power: 'Up to 180 kW',
      availableStalls: 1,
      totalStalls: 4,
      distance: '4.1 km',
      eta: '11 min',
      pricePerKwh: 'GH₵ 2.90 / kWh',
      connectors: [{ type: 'CCS2', count: 1 }],
      xPercent: 72,
      yPercent: 65,
    },
    {
      id: 'harbour-hub',
      name: 'Tema Port Industrial Depot',
      subline: '5.8 km · 16 min drive · Heavy Industrial Area',
      badge: '50 kW · 0 open · 5.8 km (16 min)',
      color: 'red',
      power: 'Up to 50 kW',
      availableStalls: 0,
      totalStalls: 2,
      distance: '5.8 km',
      eta: '16 min',
      pricePerKwh: 'GH₵ 2.50 / kWh',
      connectors: [{ type: 'GB/T', count: 0 }],
      xPercent: 82,
      yPercent: 25,
    },
  ];

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0];

  return (
    <div id="screen-station-map" className="flex-1 flex flex-col relative bg-[#0a0e14] overflow-hidden select-none">
      {/* 1. Full-Bleed Dark Grid Map Canvas */}
      <div className="absolute inset-0 z-0 bg-[#0a0e14]">
        {/* Dark map grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, #1f2632 1px, transparent 1px), linear-gradient(to bottom, #1f2632 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Radial city glow accents */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-[#00f0ff]/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-[#00e699]/5 blur-3xl" />

        {/* Stylized vector roads */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <path
            d="M -50 200 C 150 180, 200 350, 450 320"
            fill="none"
            stroke="#1f2632"
            strokeWidth="14"
          />
          <path
            d="M 120 -50 C 140 250, 280 400, 310 700"
            fill="none"
            stroke="#181c24"
            strokeWidth="18"
          />
          <path
            d="M 0 450 Q 200 420 400 520"
            fill="none"
            stroke="#1f2632"
            strokeWidth="10"
          />

          {/* Traffic flow lines */}
          {isTrafficOn && (
            <>
              <path
                d="M 120 100 C 130 200, 200 320, 230 400"
                fill="none"
                stroke="#00e699"
                strokeWidth="3"
                strokeDasharray="8 6"
                className="opacity-70"
              />
              <path
                d="M 280 410 Q 300 480 320 580"
                fill="none"
                stroke="#ffb020"
                strokeWidth="3"
                strokeDasharray="8 6"
                className="opacity-70"
              />
            </>
          )}

          {/* Active Neon Telemetry Route Line to Apex Hub */}
          {activeRoute && (
            <path
              d="M 180 560 C 190 480, 210 400, 226 310"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="4"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px rgba(0,240,255,0.8))"
              strokeDasharray="6 4"
            />
          )}
        </svg>

        {/* User Vehicle Puck (FL-08 Nordic) */}
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: '44%', top: '72%' }}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#10141a] border-2 border-[#00f0ff] flex items-center justify-center glow-cyan-sm">
              <Navigation className="w-4 h-4 text-[#00f0ff] fill-[#00f0ff] -rotate-45" />
            </div>
            <span className="absolute -inset-1 rounded-full bg-[#00f0ff]/20 animate-ping pointer-events-none" />
          </div>
          <span className="mt-1 px-1.5 py-0.5 rounded bg-[#10141a] border border-white/10 text-[9px] font-mono font-bold text-white">
            FL-08
          </span>
        </div>

        {/* Interactive Map Pins */}
        {stations.map(st => {
          const isSelected = st.id === selectedStationId;

          return (
            <div
              key={st.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200"
              style={{ left: `${st.xPercent}%`, top: `${st.yPercent}%` }}
              onClick={() => setSelectedStationId(st.id)}
            >
              {/* Highlighted Cyan Callout for selected pin */}
              {isSelected ? (
                <div className="flex flex-col items-center -translate-y-6">
                  <div className="px-3 py-1.5 rounded-xl bg-[#10141a] border border-[#00f0ff] shadow-xl text-[11px] font-mono font-bold text-white flex items-center gap-1.5 glow-cyan-sm whitespace-nowrap">
                    <Plug className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span>{st.badge}</span>
                  </div>
                  <div className="w-2 h-2 bg-[#00f0ff] rotate-45 -mt-1 shadow-md" />
                  <div className="w-4 h-4 rounded-full bg-[#00f0ff] border-2 border-[#10141a] mt-1 shadow-lg animate-bounce" />
                </div>
              ) : (
                /* Unselected pin dots */
                <div className="group relative flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-[#10141a] shadow-lg transition-transform group-hover:scale-125 ${
                      st.color === 'green'
                        ? 'bg-[#00e699]'
                        : st.color === 'amber'
                        ? 'bg-[#ffb020]'
                        : 'bg-[#ff4d4d]'
                    }`}
                  />
                  <span className="absolute top-5 px-1.5 py-0.5 rounded bg-[#10141a]/90 border border-white/10 text-[9px] font-mono text-slate-300 whitespace-nowrap">
                    {st.power}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Top Controls (Frosted Search Bar & Filter Ribbon) */}
      <div className="relative z-20 p-3 sm:p-4 space-y-2.5">
        {/* Floating frosted search bar */}
        <div className="flex items-center gap-2 bg-[#10141a]/85 backdrop-blur-md border border-white/[0.08] rounded-2xl px-3 py-2 shadow-xl">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            id="input-station-search"
            type="text"
            placeholder="Search Accra stations or hubs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            id="btn-filter-tune"
            className="w-7 h-7 rounded-xl bg-[#181c24] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Scrollable Filter Pill Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            id="filter-all"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeFilter === 'all'
                ? 'bg-[#00f0ff] border-[#00f0ff] text-[#0a0e14] font-bold'
                : 'bg-[#10141a]/80 backdrop-blur-md border-white/[0.08] text-slate-300 hover:border-white/20'
            }`}
          >
            All
          </button>

          <button
            id="filter-available"
            onClick={() => setActiveFilter('available')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              activeFilter === 'available'
                ? 'bg-[#00f0ff] border-[#00f0ff] text-[#0a0e14] font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'bg-[#10141a]/80 backdrop-blur-md border-white/[0.08] text-slate-300 hover:border-white/20'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>Available Now</span>
          </button>

          <button
            id="filter-fast"
            onClick={() => setActiveFilter('fast')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1 ${
              activeFilter === 'fast'
                ? 'bg-[#00f0ff] border-[#00f0ff] text-[#0a0e14] font-bold'
                : 'bg-[#10141a]/80 backdrop-blur-md border-white/[0.08] text-slate-300 hover:border-white/20'
            }`}
          >
            <Gauge className="w-3 h-3" />
            <span>Fast 150kW+</span>
          </button>

          <button
            id="filter-momo"
            onClick={() => setActiveFilter('momo')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeFilter === 'momo'
                ? 'bg-[#00f0ff] border-[#00f0ff] text-[#0a0e14] font-bold'
                : 'bg-[#10141a]/80 backdrop-blur-md border-white/[0.08] text-slate-300 hover:border-white/20'
            }`}
          >
            MoMo Accepted
          </button>
        </div>
      </div>

      {/* 3. Floating Map Action Buttons (Right side) */}
      <div className="absolute right-3 top-36 z-20 flex flex-col gap-2">
        <button
          id="btn-map-locate"
          onClick={() => setSelectedStationId('apex-hub')}
          title="Re-center GPS"
          className="w-9 h-9 rounded-2xl bg-[#10141a]/90 backdrop-blur-md border border-white/[0.08] shadow-lg flex items-center justify-center text-slate-300 hover:text-[#00f0ff] transition-colors"
        >
          <Locate className="w-4 h-4" />
        </button>

        <button
          id="btn-map-layers"
          title="Layer Switcher"
          className="w-9 h-9 rounded-2xl bg-[#10141a]/90 backdrop-blur-md border border-white/[0.08] shadow-lg flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          id="btn-map-traffic"
          onClick={() => setIsTrafficOn(!isTrafficOn)}
          title="Toggle Traffic"
          className={`w-9 h-9 rounded-2xl backdrop-blur-md border shadow-lg flex items-center justify-center transition-colors ${
            isTrafficOn
              ? 'bg-[#181c24] border-[#00e699]/40 text-[#00e699]'
              : 'bg-[#10141a]/90 border-white/[0.08] text-slate-500'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Bottom Station Drawer Sheet */}
      <div className="relative z-20 mt-auto bg-[#10141a]/95 backdrop-blur-xl border-t border-white/[0.08] rounded-t-3xl p-4 space-y-3.5 shadow-2xl">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />

        {/* Station name & status */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {selectedStation.name}
            </h3>
            <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
              {selectedStation.subline}
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-[#00e699]/10 border border-[#00e699]/30 text-[11px] font-mono font-bold text-[#00e699] whitespace-nowrap">
            • {selectedStation.availableStalls} of {selectedStation.totalStalls} stalls free
          </span>
        </div>

        {/* Metric cards (2 columns) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#141820] border border-white/[0.06] rounded-2xl p-2.5">
            <span className="text-[10px] text-[#64748b] block">MAX CHARGING SPEED</span>
            <span className="text-sm font-bold text-white font-mono">{selectedStation.power}</span>
          </div>

          <div className="bg-[#141820] border border-white/[0.06] rounded-2xl p-2.5">
            <span className="text-[10px] text-[#64748b] block">PRICING RATE</span>
            <span className="text-sm font-bold text-[#00f0ff] font-mono">{selectedStation.pricePerKwh}</span>
          </div>
        </div>

        {/* Connector Availability Pills */}
        <div className="flex items-center gap-2">
          {selectedStation.connectors.map(c => (
            <div
              key={c.type}
              className="px-2.5 py-1 rounded-xl bg-[#181c24] border border-white/[0.08] text-xs font-mono text-slate-200 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
              <span>{c.type} ({c.count} avail)</span>
            </div>
          ))}
        </div>

        {/* Actions: Dual CTAs */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            id="btn-reserve-stall"
            onClick={() => alert(`Stall at ${selectedStation.name} reserved for 15 minutes.`)}
            className="min-h-[44px] py-2.5 rounded-2xl border border-white/20 hover:border-white/40 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <span>Reserve Stall</span>
          </button>

          <button
            id="btn-start-route-charge"
            onClick={() => {
              if (onNavigateToCharge) onNavigateToCharge();
            }}
            className="min-h-[44px] py-2.5 rounded-2xl bg-[#00f0ff] hover:bg-[#33f3ff] text-[#0a0e14] font-bold text-xs tracking-wide transition-all glow-cyan-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Navigation className="w-3.5 h-3.5 fill-current" />
            <span>Start Route</span>
          </button>
        </div>
      </div>
    </div>
  );
};
