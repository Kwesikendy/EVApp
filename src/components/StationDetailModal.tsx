import React, { useState } from 'react';
import type { ChargingStation, Connector, UserWallet, FleetAccount } from '../types';
import { Plug, Gauge, Navigation, ShieldCheck, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface StationDetailModalProps {
  station: ChargingStation;
  wallet: UserWallet;
  fleet: FleetAccount;
  isFleetMode: boolean;
  onClose: () => void;
  onStartCharging: (stationId: string, connectorId: number, isFleet: boolean, vin?: string) => Promise<void>;
  onNavigate: (stationId: string) => void;
  isStarting: boolean;
  onOpenWallet: () => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  wallet,
  fleet,
  isFleetMode,
  onClose,
  onStartCharging,
  onNavigate,
  isStarting,
  onOpenWallet
}) => {
  const [selectedConnectorId, setSelectedConnectorId] = useState<number>(
    station.connectors.find(c => c.status === 'Available')?.connectorId || station.connectors[0].connectorId
  );
  const [selectedVin, setSelectedVin] = useState<string>(fleet.vehicles[0]?.vin || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedConnector = station.connectors.find(c => c.connectorId === selectedConnectorId);
  const PREAUTH_HOLD_AMOUNT = 20.00;

  const handleUnlockAndCharge = async () => {
    setErrorMessage(null);

    if (!selectedConnector) return;

    if (selectedConnector.status !== 'Available') {
      setErrorMessage(`Connector #${selectedConnector.connectorId} is currently ${selectedConnector.status}. Please select an Available connector.`);
      return;
    }

    if (!isFleetMode && wallet.availableBalance < PREAUTH_HOLD_AMOUNT) {
      setErrorMessage(`Insufficient balance for pre-authorization hold (GH₵ ${PREAUTH_HOLD_AMOUNT.toFixed(2)} required). Available: GH₵ ${wallet.availableBalance.toFixed(2)}. Please top up your wallet.`);
      return;
    }

    try {
      await onStartCharging(station.stationId, selectedConnector.connectorId, isFleetMode, isFleetMode ? selectedVin : undefined);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start charging session.');
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="bg-slate-900 border-t border-slate-700/80 rounded-t-3xl w-full max-h-[85%] flex flex-col p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30">
                {station.stationId}
              </span>
              <span className="text-xs text-slate-400">• {station.operator}</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{station.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{station.address}</p>
          </div>
          <button
            id="btn-close-station-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: Navigate & Distance */}
        <div className="flex gap-2 my-3">
          <button
            id="btn-station-navigate"
            onClick={() => onNavigate(station.stationId)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span>Turn-by-Turn Navigation</span>
          </button>
        </div>

        {/* Connectors List */}
        <div className="my-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Connector Port</h3>
          <div className="grid grid-cols-2 gap-2">
            {station.connectors.map(connector => {
              const isSelected = selectedConnectorId === connector.connectorId;
              const isAvailable = connector.status === 'Available';

              return (
                <button
                  key={connector.id}
                  id={`connector-btn-${connector.connectorId}`}
                  onClick={() => setSelectedConnectorId(connector.connectorId)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-white">Port #{connector.connectorId}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isAvailable
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : connector.status === 'Charging'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {connector.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span>{connector.maxPowerKw} kW</span>
                    <span className="text-xs font-medium text-slate-400 font-sans">({connector.type})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    GH₵ {connector.tariffPerKwh.toFixed(2)} / kWh
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Commercial Fleet vs Personal MoMo Wallet Banner */}
        <div className="my-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          {isFleetMode ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400">Commercial Fleet Profile Active</span>
                <span className="text-[11px] text-slate-400">Account: {fleet.billingAccountNo}</span>
              </div>
              <label className="text-[11px] text-slate-300 block mb-1">Select Vehicle VIN:</label>
              <select
                id="select-fleet-vin"
                value={selectedVin}
                onChange={e => setSelectedVin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
              >
                {fleet.vehicles.map(v => (
                  <option key={v.vin} value={v.vin}>
                    {v.make} {v.model} ({v.licensePlate}) - VIN: {v.vin}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">MoMo Wallet Balance</span>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    GH₵ {wallet.availableBalance.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Required Pre-Auth Hold</span>
                  <div className="text-sm font-bold font-mono text-amber-400">
                    GH₵ {PREAUTH_HOLD_AMOUNT.toFixed(2)}
                  </div>
                </div>
              </div>
              {wallet.availableBalance < PREAUTH_HOLD_AMOUNT && (
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-rose-400">Balance below hold requirement</span>
                  <button
                    id="btn-topup-prompt"
                    onClick={onOpenWallet}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 underline"
                  >
                    Top Up via MoMo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mb-2 p-2.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Start Button */}
        <button
          id="btn-unlock-charge"
          disabled={isStarting || selectedConnector?.status !== 'Available'}
          onClick={handleUnlockAndCharge}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-auto"
        >
          <Plug className="w-4 h-4" />
          <span>
            {isStarting
              ? 'Authorizing & Unlatching Cable...'
              : selectedConnector?.status !== 'Available'
              ? `Connector ${selectedConnector?.status}`
              : isFleetMode
              ? 'Unlock Connector (Fleet Credit)'
              : `Authorize GH₵ ${PREAUTH_HOLD_AMOUNT.toFixed(2)} & Unlock`}
          </span>
        </button>
      </div>
    </div>
  );
};
