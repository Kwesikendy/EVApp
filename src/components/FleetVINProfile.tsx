import React, { useState } from 'react';
import type { FleetAccount, FleetVehicle } from '../types';
import { Truck, Car, Shield, Award, Hash, CheckCircle, BarChart3, UserCheck, AlertTriangle } from 'lucide-react';

interface FleetVINProfileProps {
  fleet: FleetAccount;
  isFleetMode: boolean;
  onToggleFleetMode: (enabled: boolean) => void;
  activeVin: string;
  onSelectVin: (vin: string) => void;
}

export const FleetVINProfile: React.FC<FleetVINProfileProps> = ({
  fleet,
  isFleetMode,
  onToggleFleetMode,
  activeVin,
  onSelectVin
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle>(
    fleet.vehicles.find(v => v.vin === activeVin) || fleet.vehicles[0]
  );

  const utilizationPercent = Math.min(
    100,
    Math.round((fleet.currentUtilization / fleet.creditLimit) * 100)
  );

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-slate-950">
      {/* Fleet Mode Banner & Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isFleetMode ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Corporate Fleet Mode
              </h3>
              <p className="text-[11px] text-slate-400">
                {isFleetMode ? 'Charging billed directly to corporate ledger' : 'Currently in Personal Driver mode'}
              </p>
            </div>
          </div>
          <button
            id="btn-toggle-fleet-mode"
            onClick={() => onToggleFleetMode(!isFleetMode)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              isFleetMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            {isFleetMode ? 'ACTIVE' : 'SWITCH'}
          </button>
        </div>

        {/* Fleet Financial Overview */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-200">{fleet.companyName}</span>
            <span className="font-mono text-slate-400">{fleet.fleetCode}</span>
          </div>

          <div className="flex justify-between items-baseline text-xs mb-1">
            <span className="text-slate-400">Monthly Fleet Credit Facility:</span>
            <span className="font-mono font-bold text-white">
              ${fleet.currentUtilization.toFixed(2)} / ${fleet.creditLimit.toFixed(2)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                utilizationPercent > 80 ? 'bg-rose-500' : 'bg-amber-400'
              }`}
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Fleet Vehicles with VIN details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-sky-400" />
            <span>Assigned Fleet Vehicles (VINs)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">{fleet.vehicles.length} Active EVs</span>
        </h4>

        <div className="space-y-2.5">
          {fleet.vehicles.map(v => {
            const isSelected = activeVin === v.vin;
            return (
              <div
                key={v.vin}
                id={`fleet-vin-${v.vin}`}
                onClick={() => {
                  setSelectedVehicle(v);
                  onSelectVin(v.vin);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-slate-300" />
                    <div>
                      <span className="text-xs font-bold text-white">{v.make} {v.model}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">[{v.licensePlate}]</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                      ACTIVE CHARGING VIN
                    </span>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-500">VIN: </span>
                    <span className="font-mono text-slate-300 font-semibold">{v.vin}</span>
                  </div>
                  <div className="text-emerald-400 font-medium">
                    {v.batteryCapacityKwh} kWh
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-500" />
                    <span>Driver: {v.assignedDriver}</span>
                  </span>
                  <span>{v.driverPhone}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corporate Fleet Benefits Note */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Shield className="w-3.5 h-3.5 text-[#4ade80]" />
          <span>ChargeLink GH Fleet Telematics Integration</span>
        </div>
        <p className="text-[11px]">
          OCPP 1.6J and 2.0.1 transactions automatically capture vehicle VIN via ISO 15118 Plug & Charge or driver badge tagging, synchronizing session kilowatt-hours directly with ERP accounting ledgers.
        </p>
      </div>
    </div>
  );
};
