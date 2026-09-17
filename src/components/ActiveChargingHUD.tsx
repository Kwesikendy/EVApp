import React, { useState } from 'react';
import type { ActiveTelemetrySession } from '../types';
import { Zap, Clock, DollarSign, BatteryCharging, Gauge, ShieldAlert, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface ActiveChargingHUDProps {
  session: ActiveTelemetrySession | null;
  onStopSession: () => Promise<void>;
  isStopping: boolean;
  onSwitchToMap: () => void;
}

export const ActiveChargingHUD: React.FC<ActiveChargingHUDProps> = ({
  session,
  onStopSession,
  isStopping,
  onSwitchToMap
}) => {
  const [showConfirmStop, setShowConfirmStop] = useState(false);

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
          <BatteryCharging className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-1">No Active Charging Session</h3>
        <p className="text-xs text-slate-400 max-w-xs mb-6">
          Connect your EV to any XCharge fast charging station, authorize via Mobile Money or Fleet VIN, and unlock the connector to start streaming live telemetry.
        </p>
        <button
          id="btn-hud-find-station"
          onClick={onSwitchToMap}
          className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <span>Locate Nearest Fast Charger</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedTimeRemainingMins = Math.max(
    1,
    Math.round(((session.targetSocPercent - session.currentSocPercent) / 100) * 75 * (60 / Math.max(session.currentPowerKw, 20)))
  );

  return (
    <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto bg-slate-950">
      {/* Top Session Header */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              CitrineOS OCPP 1.6-J Stream
            </span>
          </div>
          <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {session.stationId} • Port #{session.connectorId}
          </span>
        </div>

        {/* Big Circular SoC Gauge */}
        <div className="flex flex-col items-center justify-center my-3 relative">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-slate-800 stroke-current"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-sky-500 stroke-current transition-all duration-500"
                strokeWidth="7"
                strokeDasharray={`${(session.currentSocPercent / 100) * 264} 264`}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-white tracking-tight">
                {session.currentSocPercent.toFixed(1)}
                <span className="text-lg font-bold text-sky-400">%</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">Target: {session.targetSocPercent}%</span>
              <span className="text-[10px] text-emerald-400 font-mono mt-1">~{estimatedTimeRemainingMins} mins left</span>
            </div>
          </div>
        </div>

        {/* Live Ticking Grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-2">
          {/* Active Charge Speed kW */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Charge Speed</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white">
                {session.currentPowerKw.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-amber-400">kW</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {session.voltageV.toFixed(0)}V • {session.currentA.toFixed(0)}A
            </span>
          </div>

          {/* Energy Delivered kWh */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Energy Delivered</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {session.kwhDelivered.toFixed(3)}
              </span>
              <span className="text-xs font-semibold text-slate-400">kWh</span>
            </div>
            <span className="text-[10px] text-emerald-500/80 font-mono">Live OCPP MeterValues</span>
          </div>

          {/* Duration */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Session Duration</span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {formatDuration(session.elapsedSeconds)}
            </div>
            <span className="text-[10px] text-slate-500">Timer active</span>
          </div>

          {/* Accrued Cost */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Accrued Cost</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">
              ${session.accruedCost.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Rate: $0.32/kWh</span>
          </div>
        </div>

        {/* Pre-Authorization / Fleet Ledger Notice */}
        <div className="mt-3 p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-xs">
          {session.isFleetSession ? (
            <div className="flex items-center gap-2 text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Fleet Billing Active:</strong> Charging against corporate account for VIN{' '}
                <span className="font-mono text-white font-semibold">{session.fleetVin}</span>.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sky-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-400" />
              <span>
                <strong>MoMo Pre-Auth Hold:</strong> $
                {session.preauthHoldAmount.toFixed(2)} reserved. Surplus funds will automatically return to your available balance upon termination.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stop Charging Button & Confirmation */}
      <div className="mt-4">
        {!showConfirmStop ? (
          <button
            id="btn-stop-charging"
            onClick={() => setShowConfirmStop(true)}
            className="w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Stop Charging & Release Connector</span>
          </button>
        ) : (
          <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-4 text-center">
            <h4 className="text-sm font-bold text-rose-200 mb-1">Confirm Session Termination?</h4>
            <p className="text-xs text-rose-300/80 mb-3">
              This will send an OCPP RemoteStopTransaction request to CitrineOS, lock the plug, and settle the final bill (${session.accruedCost.toFixed(2)}).
            </p>
            <div className="flex gap-2">
              <button
                id="btn-cancel-stop"
                onClick={() => setShowConfirmStop(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Continue Charging
              </button>
              <button
                id="btn-confirm-stop"
                disabled={isStopping}
                onClick={async () => {
                  await onStopSession();
                  setShowConfirmStop(false);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isStopping ? 'Stopping...' : 'Confirm & Settle'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
