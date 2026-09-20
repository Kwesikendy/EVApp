import React, { useState } from 'react';
import {
  Truck,
  Car,
  Download,
  Plus,
  Navigation,
  Info,
  Battery,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileSpreadsheet
} from 'lucide-react';

interface FleetScreenProps {
  onLocateVehicle?: (vin: string) => void;
  onVehicleDetails?: (vehicleName: string) => void;
}

export const FleetScreen: React.FC<FleetScreenProps> = ({
  onLocateVehicle,
  onVehicleDetails,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleDownloadReports = () => {
    setNotice('Fleet telemetry report exported to CSV (XCHARGE-NORDIC.csv)');
    setTimeout(() => setNotice(null), 4000);
  };

  const handleAddVehicle = () => {
    const vin = prompt('Enter Vehicle VIN or License Plate:');
    if (vin) {
      setNotice(`Provisioned VIN ${vin} into Nordic Logistics fleet registry.`);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  return (
    <div id="screen-fleet" className="flex-1 flex flex-col bg-[#0a0e14] overflow-y-auto no-scrollbar p-3.5 sm:p-4 select-none pb-8">
      <div className="w-full max-w-md mx-auto space-y-4">
      {/* 1. Header Metadata & Headline */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#94a3b8] uppercase block">
            NORDIC LOGISTICS
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Fleet Vehicles
          </h1>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[10px] font-mono font-bold text-[#00f0ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
          <span>Live Telemetry</span>
        </div>
      </div>

      {/* Floating Notice */}
      {notice && (
        <div className="bg-[#10141a] border border-[#00f0ff]/40 text-[#00f0ff] px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 animate-in fade-in">
          <Radio className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>{notice}</span>
        </div>
      )}

      {/* 2. Top 3-Column KPI Dashboard */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-[#64748b] font-mono block">ACTIVE</span>
          <div className="mt-1">
            <span className="text-base font-bold text-white font-mono block">14</span>
            <span className="text-[10px] text-[#94a3b8]">Vehicles</span>
          </div>
        </div>

        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-[#64748b] font-mono block">AVG BATTERY</span>
          <div className="mt-1">
            <span className="text-base font-bold text-[#00e699] font-mono block">92%</span>
            <span className="text-[10px] text-[#00e699]">Optimal</span>
          </div>
        </div>

        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] text-[#64748b] font-mono block">CHARGING</span>
          <div className="mt-1">
            <span className="text-base font-bold text-[#00f0ff] font-mono block">4</span>
            <span className="text-[10px] text-[#00f0ff]">In Session</span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons: Dual Pill Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          id="btn-fleet-add-vehicle"
          onClick={handleAddVehicle}
          className="min-h-[44px] rounded-2xl bg-[#00f0ff] hover:bg-[#33f3ff] text-[#0a0e14] font-bold text-xs tracking-wider transition-all shadow-md shadow-black/40 flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Vehicle</span>
        </button>

        <button
          id="btn-fleet-download-reports"
          onClick={handleDownloadReports}
          className="min-h-[44px] rounded-2xl bg-[#141820] hover:bg-[#181c24] border border-white/[0.08] text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Download Reports</span>
        </button>
      </div>

      {/* 4. Active Roster Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Active Roster
          </span>
          <span className="text-[11px] text-[#94a3b8] font-mono">3 Visible</span>
        </div>

        {/* Vehicle Card 1: Polestar 3 */}
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Polestar 3</h3>
                <span className="px-1.5 py-0.5 rounded bg-[#181c24] border border-white/10 text-[10px] font-mono text-slate-300">
                  EV 01 OSL
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] font-mono mt-0.5">
                Driver: Marcus K. · Depot: Apex Hub Bay 04
              </p>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[10px] font-mono font-bold text-[#00f0ff] whitespace-nowrap flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
              <span>Charging 68%</span>
            </span>
          </div>

          {/* Progress Bar (Luminous Cyan at 68%) */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-[#181c24] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00f0ff] rounded-full"
                style={{ width: '68%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
              <span>SoC: 68%</span>
              <span className="text-[#00f0ff]">350 kW Active</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
            <span className="text-xs font-mono font-medium text-slate-300">
              Fast Charging GH₵ 3.20/kWh
            </span>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-polestar-details"
                onClick={() => alert('Polestar 3 telemetry: VIN 1FTFW1ED8NFA02941, 111 kWh pack, DC fast charge curve active.')}
                className="px-2.5 py-1 rounded-xl bg-[#181c24] hover:bg-[#1f2632] border border-white/[0.08] text-[11px] font-mono text-slate-200 transition-colors"
              >
                Details
              </button>
              <button
                id="btn-polestar-locate"
                onClick={() => onLocateVehicle && onLocateVehicle('EV 01 OSL')}
                className="px-2.5 py-1 rounded-xl border border-white/20 hover:border-[#00f0ff] text-[11px] font-mono text-[#00f0ff] transition-colors flex items-center gap-1"
              >
                <Navigation className="w-3 h-3 fill-current" />
                <span>Locate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vehicle Card 2: Volvo FH Electric */}
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Volvo FH Electric</h3>
                <span className="px-1.5 py-0.5 rounded bg-[#181c24] border border-white/10 text-[10px] font-mono text-slate-300">
                  HV 04 BER
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] font-mono mt-0.5">
                Driver: Astrid N. · Depot: Oslo Logistics Yard Bay E1
              </p>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-[#00e699]/10 border border-[#00e699]/30 text-[10px] font-mono font-bold text-[#00e699] whitespace-nowrap flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e699]" />
              <span>Ready 92%</span>
            </span>
          </div>

          {/* Progress Bar (Emerald Green at 92%) */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-[#181c24] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00e699] rounded-full"
                style={{ width: '92%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
              <span>SoC: 92%</span>
              <span className="text-[#00e699]">Fully Conditioned</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
            <span className="text-xs font-mono font-medium text-slate-300">
              Standby / Dispatched
            </span>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-volvo-details"
                onClick={() => alert('Volvo FH Electric: 540 kWh heavy transport battery pack, fully charged and preheated.')}
                className="px-2.5 py-1 rounded-xl bg-[#181c24] hover:bg-[#1f2632] border border-white/[0.08] text-[11px] font-mono text-slate-200 transition-colors"
              >
                Details
              </button>
              <button
                id="btn-volvo-locate"
                onClick={() => onLocateVehicle && onLocateVehicle('HV 04 BER')}
                className="px-2.5 py-1 rounded-xl border border-white/20 hover:border-[#00e699] text-[11px] font-mono text-[#00e699] transition-colors flex items-center gap-1"
              >
                <Navigation className="w-3 h-3 fill-current" />
                <span>Locate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Vehicle Card 3: Ford E-Transit */}
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Ford E-Transit</h3>
                <span className="px-1.5 py-0.5 rounded bg-[#181c24] border border-white/10 text-[10px] font-mono text-slate-300">
                  VN 12 STV
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] font-mono mt-0.5">
                Driver: Erik L. · Route: Delivery Sector South 88 km rem
              </p>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-[#ffb020]/10 border border-[#ffb020]/30 text-[10px] font-mono font-bold text-[#ffb020] whitespace-nowrap flex items-center gap-1">
              <span className="text-[9px]">▲</span>
              <span>On Route 41%</span>
            </span>
          </div>

          {/* Progress Bar (Cyan Battery Bar at 41%) */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-[#181c24] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00f0ff] rounded-full"
                style={{ width: '41%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
              <span>SoC: 41%</span>
              <span className="text-[#ffb020]">Routing to Apex Hub</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
            <span className="text-xs font-mono font-medium text-slate-300">
              Estimated return: 16:45
            </span>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-etransit-details"
                onClick={() => alert('Ford E-Transit: 68 kWh battery pack, current speed 64 km/h, heading toward Accra.')}
                className="px-2.5 py-1 rounded-xl bg-[#181c24] hover:bg-[#1f2632] border border-white/[0.08] text-[11px] font-mono text-slate-200 transition-colors"
              >
                Details
              </button>
              <button
                id="btn-etransit-locate"
                onClick={() => onLocateVehicle && onLocateVehicle('VN 12 STV')}
                className="px-2.5 py-1 rounded-xl border border-white/20 hover:border-[#00f0ff] text-[11px] font-mono text-[#00f0ff] transition-colors flex items-center gap-1"
              >
                <Navigation className="w-3 h-3 fill-current" />
                <span>Locate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
