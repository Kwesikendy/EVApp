import React, { useState } from 'react';
import type { ChargingStation, ConnectorType } from '../types';
import {
  Plus,
  Trash2,
  Power,
  MapPin,
  Plug,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface AdminStationManagerProps {
  stations: ChargingStation[];
  onRefreshStations: () => Promise<void>;
  onSwitchToMap: (stationId?: string) => void;
}

export const AdminStationManager: React.FC<AdminStationManagerProps> = ({
  stations,
  onRefreshStations,
  onSwitchToMap
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [stationId, setStationId] = useState('');
  const [operator, setOperator] = useState('XCharge Grid Network');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('5.6037');
  const [longitude, setLongitude] = useState('-0.1870');
  const [connectorType, setConnectorType] = useState<ConnectorType>('CCS2');
  const [maxPowerKw, setMaxPowerKw] = useState('350');
  const [tariffPerKwh, setTariffPerKwh] = useState('3.80');
  const [connectorCount, setConnectorCount] = useState('2');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showNotification = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handlePresetLocation = (city: string, lat: string, lng: string, addr: string) => {
    setName(`${city} Superhub`);
    setAddress(addr);
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !latitude || !longitude) {
      showNotification('Please provide station name, latitude, and longitude');
      return;
    }

    setIsSubmitting(true);
    try {
      const count = parseInt(connectorCount, 10) || 2;
      const connectors = Array.from({ length: count }, (_, i) => ({
        connectorId: i + 1,
        type: connectorType,
        maxPowerKw: parseFloat(maxPowerKw) || 150,
        status: 'Available',
        tariffPerKwh: parseFloat(tariffPerKwh) || 3.50,
        tariffCurrency: 'GHS'
      }));

      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          stationId: stationId || `EV-HUB-${Math.floor(100 + Math.random() * 900)}`,
          operator,
          address: address || 'Commercial EV Plaza',
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          connectors,
          amenities: ['Coffee Shop', 'EV Parking', 'Restrooms', '24/7 Security']
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create station');
      }

      await onRefreshStations();
      setIsCreating(false);
      setName('');
      setStationId('');
      setAddress('');
      showNotification('🎉 Station deployed! It is now live on the driver map.');
    } catch (err: any) {
      showNotification(err.message || 'Error creating station');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (station: ChargingStation) => {
    try {
      const res = await fetch(`/api/stations/${station.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: !station.isOnline })
      });
      if (res.ok) {
        await onRefreshStations();
        showNotification(`Station "${station.name}" is now ${!station.isOnline ? 'ONLINE' : 'OFFLINE'}.`);
      }
    } catch {
      showNotification('Could not update station status');
    }
  };

  const handleDeleteStation = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to decommission station: "${name}"?`)) return;
    try {
      const res = await fetch(`/api/stations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await onRefreshStations();
        showNotification(`Station "${name}" decommissioned successfully.`);
      }
    } catch {
      showNotification('Could not delete station');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto p-4 font-sans select-none">
      {/* Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Operator Station Management Portal
              </h2>
              <p className="text-xs text-slate-400">
                Register new physical chargers, configure kWh tariffs, and control network access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="admin-refresh-btn"
              onClick={() => onRefreshStations()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              title="Refresh Network"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="admin-add-station-btn"
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy New Charger</span>
            </button>
          </div>
        </div>
      </div>

      {statusNotice && (
        <div className="mb-4 p-3 bg-sky-950/80 border border-sky-500/50 rounded-xl text-xs text-sky-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Modal: Add New Station */}
      {isCreating && (
        <div className="mb-4 bg-slate-900 border border-sky-500/40 rounded-2xl p-5 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Register New Hardware Charging Point</h3>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateStation} className="space-y-4">
            {/* Presets */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Location Presets (Click to Auto-fill):
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetLocation('Airport City', '5.6050', '-0.1720', 'Liberation Rd, Terminal 3 District, Accra')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5"
                >
                  <MapPin className="w-3 h-3 text-[#00f0ff]" />
                  <span>Airport City Terminal 3</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetLocation('Tema Motorway', '5.6420', '-0.0980', 'Accra-Tema Motorway Interchange, Freight Hub')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5"
                >
                  <MapPin className="w-3 h-3 text-[#00f0ff]" />
                  <span>Tema Motorway Freight Stop</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetLocation('Ridge Diplomatic', '5.5780', '-0.1910', 'GIMPA Bypass, Ridge Ambassadorial Enclave')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5"
                >
                  <MapPin className="w-3 h-3 text-[#00f0ff]" />
                  <span>Ridge Tech Enclave</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetLocation('Achimota Mall', '5.6120', '-0.2290', 'Achimota Retail Complex, N1 Highway')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5"
                >
                  <MapPin className="w-3 h-3 text-[#00f0ff]" />
                  <span>Achimota Mall Express</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Station / Hub Name *</label>
                <input
                  type="text"
                  placeholder="e.g. VoltCharge Express - Midtown"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Hardware OCPP ID (Serial)</label>
                <input
                  type="text"
                  placeholder="e.g. VC-ACC-009"
                  value={stationId}
                  onChange={e => setStationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Operator Brand</label>
                <input
                  type="text"
                  value={operator}
                  onChange={e => setOperator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Physical Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 14 North Ridge Boulevard"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Latitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={e => setLatitude(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Longitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={e => setLongitude(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Hardware Specifications */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Connector Standard</label>
                <select
                  value={connectorType}
                  onChange={e => setConnectorType(e.target.value as ConnectorType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="CCS2">CCS2 (DC Fast)</option>
                  <option value="Type2">Type 2 (AC Destination)</option>
                  <option value="CHAdeMO">CHAdeMO (DC)</option>
                  <option value="GB/T">GB/T (China Standard)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Max Power Output</label>
                <select
                  value={maxPowerKw}
                  onChange={e => setMaxPowerKw(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="22">22 kW (AC Standard)</option>
                  <option value="50">50 kW (DC Fast)</option>
                  <option value="120">120 kW (DC Rapid)</option>
                  <option value="160">160 kW (DC High-Power)</option>
                  <option value="240">240 kW (DC Ultra-Fast)</option>
                  <option value="350">350 kW (DC Mega-Charger)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Tariff (GH₵ / kWh)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-500 font-mono">GH₵</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tariffPerKwh}
                    onChange={e => setTariffPerKwh(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">No. of Charging Plugs</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={connectorCount}
                  onChange={e => setConnectorCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Deploy to Network</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Network Stations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Charging Stations ({stations.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Real-time PostGIS Spatial Registry
          </span>
        </div>

        {stations.map(st => {
          const availablePorts = st.connectors.filter(c => c.status === 'Available').length;
          const maxKw = Math.max(...st.connectors.map(c => c.maxPowerKw));
          const tariff = st.connectors[0]?.tariffPerKwh || 0.32;

          return (
            <div
              key={st.id}
              className={`bg-slate-900 border rounded-2xl p-4 transition-all ${
                st.isOnline ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/40 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      st.isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    <Plug className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{st.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {st.stationId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          st.isOnline
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {st.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {st.address}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        GPS: {st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}
                      </span>
                    </div>

                    {/* Plugs breakdown */}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-emerald-400 font-semibold">
                        {availablePorts} of {st.connectors.length} Plugs Open
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-sky-400 font-mono font-semibold">{maxKw} kW Peak</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-400 font-mono font-semibold">GH₵ {tariff.toFixed(2)}/kWh</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onSwitchToMap(st.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                    title="View on Driver Map"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Map</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(st)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      st.isOnline
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{st.isOnline ? 'Disable' : 'Enable'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteStation(st.id, st.name)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 transition-colors"
                    title="Decommission Station"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
