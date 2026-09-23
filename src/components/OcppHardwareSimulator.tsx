import React, { useState } from 'react';
import type { OcppMessage } from '../types';
import { Terminal, ArrowDown, ArrowUp, Play, CheckCircle2, RefreshCw, Send, Radio, AlertOctagon } from 'lucide-react';

interface OcppHardwareSimulatorProps {
  logs: OcppMessage[];
  onInjectEvent: (action: string, payload: Record<string, unknown>, direction?: 'INCOMING' | 'OUTGOING') => Promise<void>;
  onRefreshLogs: () => Promise<void>;
}

export const OcppHardwareSimulator: React.FC<OcppHardwareSimulatorProps> = ({
  logs,
  onInjectEvent,
  onRefreshLogs
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'BootNotification' | 'StatusNotification' | 'MeterValues'>('ALL');
  const [selectedMessage, setSelectedMessage] = useState<OcppMessage | null>(logs[0] || null);
  const [isInjecting, setIsInjecting] = useState(false);

  const filteredLogs = logs.filter(m => {
    if (activeFilter === 'ALL') return true;
    return m.action === activeFilter;
  });

  const handleTriggerSimulatedEvent = async (type: 'boot' | 'status_charging' | 'meter_values' | 'status_available') => {
    setIsInjecting(true);
    try {
      if (type === 'boot') {
        await onInjectEvent('BootNotification', {
          chargePointVendor: 'MaxPower',
          chargePointModel: 'VCP160-160kW',
          chargePointSerialNumber: 'MP-VCP160-KSI-001',
          firmwareVersion: 'v1.6.0-ocpp16j',
          iccid: '89014103211118510720',
          imsi: '0829117281928'
        });
      } else if (type === 'status_charging') {
        await onInjectEvent('StatusNotification', {
          connectorId: 1,
          errorCode: 'NoError',
          status: 'Charging',
          info: 'EV Contactors closed. Active DC power flowing.',
          timestamp: new Date().toISOString()
        });
      } else if (type === 'meter_values') {
        await onInjectEvent('MeterValues', {
          connectorId: 1,
          transactionId: 98421,
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [
                { value: '16.420', context: 'Sample.Periodic', measurand: 'Energy.Active.Import.Register', unit: 'kWh' },
                { value: '148.5', context: 'Sample.Periodic', measurand: 'Power.Active.Import', unit: 'kW' },
                { value: '48.0', context: 'Sample.Periodic', measurand: 'SoC', unit: 'Percent' },
                { value: '402.1', context: 'Sample.Periodic', measurand: 'Voltage', phase: 'L1', unit: 'V' },
                { value: '369.3', context: 'Sample.Periodic', measurand: 'Current.Import', unit: 'A' }
              ]
            }
          ]
        });
      } else if (type === 'status_available') {
        await onInjectEvent('StatusNotification', {
          connectorId: 1,
          errorCode: 'NoError',
          status: 'Available',
          info: 'Connector returned to holster. Ready for next driver.',
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden bg-slate-950">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              CitrineOS OCPP 1.6-J / 2.0.1 Live Bridge
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
            CSMS PORT 8080 CONNECTED
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          Simulate incoming hardware telemetry packets from chargers like MaxPower VCP160 or open-source tools (Ocpp-Charge-Point-Simulator / MicroOCPP).
        </p>

        {/* Action Triggers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            id="btn-sim-boot"
            disabled={isInjecting}
            onClick={() => handleTriggerSimulatedEvent('boot')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 py-2 px-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-slate-100">BootNotify</div>
              <div className="text-[10px] text-slate-400">Power On Station</div>
            </div>
            <Play className="w-3.5 h-3.5 text-sky-400" />
          </button>

          <button
            id="btn-sim-charging"
            disabled={isInjecting}
            onClick={() => handleTriggerSimulatedEvent('status_charging')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 py-2 px-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-blue-400">Status: Charging</div>
              <div className="text-[10px] text-slate-400">Lock & Flow</div>
            </div>
            <Play className="w-3.5 h-3.5 text-blue-400" />
          </button>

          <button
            id="btn-sim-metervalues"
            disabled={isInjecting}
            onClick={() => handleTriggerSimulatedEvent('meter_values')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 py-2 px-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-emerald-400">MeterValues</div>
              <div className="text-[10px] text-slate-400">Live kW/kWh Ticker</div>
            </div>
            <Play className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          <button
            id="btn-sim-available"
            disabled={isInjecting}
            onClick={() => handleTriggerSimulatedEvent('status_available')}
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 py-2 px-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-amber-400">Status: Available</div>
              <div className="text-[10px] text-slate-400">Release Plug</div>
            </div>
            <Play className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Packet Stream Console */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0">
        {/* Packet List */}
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Header & Filter */}
          <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Packet Traffic ({logs.length})</span>
            <div className="flex gap-1">
              {(['ALL', 'BootNotification', 'StatusNotification', 'MeterValues'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    activeFilter === f
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f === 'ALL' ? 'ALL' : f.replace('Notification', '')}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
            {filteredLogs.map(m => {
              const isSelected = selectedMessage?.id === m.id;
              const isIncoming = m.direction === 'INCOMING';

              return (
                <div
                  key={m.id}
                  id={`packet-row-${m.id}`}
                  onClick={() => setSelectedMessage(m)}
                  className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-slate-800' : 'hover:bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center ${
                        isIncoming ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
                      }`}
                    >
                      {isIncoming ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                    </span>
                    <div>
                      <div className="font-bold text-slate-200">{m.action}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(m.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-semibold ${
                      m.action === 'MeterValues'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : m.action === 'StatusNotification'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {m.direction}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* JSON Inspector View */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs bg-slate-900/60">
            <span className="font-bold text-slate-300 font-mono">
              {selectedMessage ? `${selectedMessage.action} [${selectedMessage.direction}]` : 'Payload Inspector'}
            </span>
            {selectedMessage && (
              <span className="text-[10px] text-slate-500 font-mono">
                {selectedMessage.id}
              </span>
            )}
          </div>
          <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] text-emerald-400 bg-slate-950">
            {selectedMessage ? (
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(selectedMessage.payload, null, 2)}
              </pre>
            ) : (
              <div className="text-slate-500 text-center py-10">Select a packet from the traffic log to inspect raw OCPP frames</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
