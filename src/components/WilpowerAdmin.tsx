import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BatteryCharging,
  Building2,
  CheckCircle2,
  ChevronRight,
  Copy,
  SlidersHorizontal,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Unlock,
  Users,
  Search,
  Coins,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

type AdminView = 'dashboard' | 'stations' | 'customers' | 'sessions' | 'diagnostics' | 'security';

interface CustomerTransaction { id: string; timestamp: string; amount: number; type: string; status: string; provider: string; reference: string; description: string; }
interface CustomerAccount { id: string; phoneNumber: string; displayName: string; email?: string; walletBalance: number; heldEscrow: number; customTariffPerKwh?: number; chargingCount: number; totalSpentGhs: number; registeredVehicles: Array<{ id: string; make: string; model: string; licensePlate: string; connectorType: string }>; transactions: CustomerTransaction[]; createdAt: string; updatedAt: string; }

interface AdminIdentity {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'network_operator' | 'finance_auditor';
}

interface Connector {
  connectorId: number;
  label?: string;
  type: 'CCS2' | 'GB/T' | 'Type2' | 'CHAdeMO';
  maxPowerKw: number;
  status: string;
  errorCode?: string;
  tariffPerKwh: number;
}

interface Station {
  id: string;
  stationId: string;
  pileNumber?: string;
  name: string;
  operator?: string;
  address: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  ocppVersion?: string;
  vendor?: string;
  model?: string;
  firmwareVersion?: string;
  connectors: Connector[];
}

interface OcppLog {
  id: string;
  timestamp: string;
  chargeBoxId?: string;
  direction: 'INCOMING' | 'OUTGOING';
  action: string;
  messageTypeId?: number;
  uniqueId?: string;
  payload: Record<string, any>;
}

interface OverviewPayload {
  generatedAt: string;
  stations: { total: number; online: number; offline: number };
  connectors: { total: number; available: number; occupied: number };
  sessions: { active: number; currentCost: number; kwhDelivered: number; activeSession?: any };
  network: { health: string; citrineOsBridge: string; ocppVersion: string; connectedSockets?: number };
  alerts: OcppLog[];
}

function formatGhs(amount: number): string {
  return `GH₵ ${Number(amount || 0).toFixed(2)}`;
}

export function WilpowerAdmin() {
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [view, setView] = useState<AdminView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [email, setEmail] = useState('admin@wilpower.gh');
  const [password, setPassword] = useState('');
  const [devHint, setDevHint] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [logs, setLogs] = useState<OcppLog[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);
  const [customerTariffInput, setCustomerTariffInput] = useState('');
  const [stationTariffDrafts, setStationTariffDrafts] = useState<Record<string, string>>({});
  const [tariffBusy, setTariffBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const wsPrimaryUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ocpp/1.6/CL-KSI-001`;

  async function checkSession() {
    try {
      const [meRes, configRes] = await Promise.all([
        fetch('/api/admin/auth/me', { credentials: 'include' }),
        fetch('/api/admin/auth/config', { credentials: 'include' }),
      ]);
      if (configRes.ok) {
        const cfg = await configRes.json();
        if (cfg.defaultEmail) setEmail(cfg.defaultEmail);
        if (cfg.defaultPasswordHint) setDevHint(cfg.defaultPasswordHint);
      }
      if (meRes.ok) {
        const data = await meRes.json();
        setAdmin(data.admin || null);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setBootstrapping(false);
    }
  }

  async function refreshOperations() {
    if (!admin) return;
    setRefreshing(true);
    try {
      const [overviewRes, stationsRes, logsRes, customersRes] = await Promise.all([
        fetch('/api/admin/overview', { credentials: 'include' }),
        fetch('/api/admin/stations', { credentials: 'include' }),
        fetch('/api/admin/ocpp/logs', { credentials: 'include' }),
        fetch('/api/admin/customers', { credentials: 'include' }),
      ]);
      if (overviewRes.status === 401) {
        setAdmin(null);
        return;
      }
      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (stationsRes.ok) {
        const nextStations: Station[] = await stationsRes.json();
        setStations(nextStations);
        setStationTariffDrafts((prev) => {
          const next = { ...prev };
          for (const st of nextStations) {
            if (next[st.stationId] === undefined) {
              next[st.stationId] = String((st.connectors?.[0]?.tariffPerKwh ?? 5.0).toFixed(2));
            }
          }
          return next;
        });
      }
      if (customersRes.ok) {
        const nextCustomers: CustomerAccount[] = await customersRes.json();
        setCustomers(Array.isArray(nextCustomers) ? nextCustomers : []);
      }
      if (logsRes.ok) {
        const nextLogs = await logsRes.json();
        setLogs(Array.isArray(nextLogs) ? nextLogs.slice(0, 20) : []);
      }
    } catch {
      setNotice('Live CSMS telemetry is temporarily unreachable.');
    } finally {
      setRefreshing(false);
    }
  }

  async function dispatchAdminOcppCommand(action: string, payload: Record<string, any> = {}) {
    try {
      const res = await fetch('/api/ocpp/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chargeBoxId: 'CL-KSI-001',
          action,
          payload,
        }),
      });
      const data = await res.json();
      await refreshOperations();
      if (res.ok) {
        setNotice(`OCPP 1.6J [${action}] -> ${data?.responsePayload?.status || 'Accepted'}`);
      } else {
        setNotice(data.error || 'Command failed');
      }
    } catch {
      setNotice('Could not dispatch OCPP 1.6J command.');
    }
  }

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!admin) return;
    refreshOperations();
    const timer = window.setInterval(refreshOperations, 5000);
    return () => window.clearInterval(timer);
  }, [admin?.id]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || 'Administrator login failed.');
        return;
      }
      setAdmin(data.admin);
      setPassword('');
    } catch {
      setAuthError('Could not connect to the Wilpower admin gateway.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setAdmin(null);
    setOverview(null);
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 12) {
      setNotice('New administrator password must be at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice('New password and confirmation do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setNotice(data.error || 'Password could not be updated.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDevHint(null);
      setNotice('Administrator password rotated and persisted.');
    } catch {
      setNotice('Could not reach the admin security service.');
    } finally {
      setPasswordBusy(false);
    }
  }

  async function updateStationTariff(stationId: string) {
    const val = parseFloat(stationTariffDrafts[stationId] || '');
    if (!Number.isFinite(val) || val <= 0 || val > 100) {
      setNotice('Enter a valid price between GH₵ 0.01 and GH₵ 100.00 per kWh.');
      return;
    }
    setTariffBusy(true);
    try {
      const res = await fetch(`/api/admin/stations/${encodeURIComponent(stationId)}/tariff`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tariffPerKwh: val }),
      });
      const data = await res.json();
      if (!res.ok) { setNotice(data.error || 'Could not update station tariff.'); return; }
      setNotice(`${stationId} tariff updated to ${formatGhs(val)}/kWh.`);
      await refreshOperations();
    } catch {
      setNotice('Network error updating station tariff.');
    } finally {
      setTariffBusy(false);
    }
  }

  async function updateCustomerTariff(phone: string, customRate: number | null) {
    setTariffBusy(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(phone)}/tariff`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customTariffPerKwh: customRate }),
      });
      const data = await res.json();
      if (!res.ok) { setNotice(data.error || 'Could not update customer rate.'); return; }
      setNotice(customRate === null ? `Reset ${phone} to station default rate.` : `Set ${phone} custom rate to ${formatGhs(customRate)}/kWh.`);
      await refreshOperations();
    } catch {
      setNotice('Network error updating customer rate.');
    } finally {
      setTariffBusy(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      (c.displayName || '').toLowerCase().includes(q) ||
      (c.phoneNumber || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.registeredVehicles || []).some((v) => (v.licensePlate || '').toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  const selectedCustomer = useMemo(() => {
    if (!customers.length) return null;
    return customers.find((c) => c.phoneNumber === selectedCustomerPhone) || filteredCustomers[0] || customers[0];
  }, [customers, filteredCustomers, selectedCustomerPhone]);

  const navItems = useMemo(
    () => [
      { id: 'dashboard' as const, label: 'Dashboard', sub: 'Network overview', icon: LayoutDashboard },
      { id: 'stations' as const, label: 'Stations', sub: 'Commissioning & pricing', icon: Building2 },
      { id: 'customers' as const, label: 'Customers', sub: 'Accounts, history & rates', icon: Users },
      { id: 'sessions' as const, label: 'Sessions', sub: 'Live energy ledger', icon: Zap },
      { id: 'diagnostics' as const, label: 'OCPP 1.6J CSMS', sub: 'Commands & frames', icon: SlidersHorizontal },
      { id: 'security' as const, label: 'Security', sub: 'Credentials & access', icon: KeyRound },
    ],
    []
  );

  if (bootstrapping) {
    return (
      <div className="wa-loading">
        <div className="wa-loading-mark">W</div>
        <span>Verifying Wilpower Operations session...</span>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="wa-auth-shell">
        <div className="wa-auth-orbit" />
        <main className="wa-auth-panel">
          <div className="wa-brand-lockup">
            <img src="/willpower/WillPower_App_Icon_V3.png" alt="Wilpower" className="wa-brand-mark" style={{ objectFit: 'cover' }} />
            <div>
              <strong>Wilpower Operations</strong>
              <span>Restricted CSMS & Network Control Plane</span>
            </div>
          </div>

          <span className="wa-eyebrow">ISOLATED ADMIN PORTAL</span>
          <h1>Network Command Access.</h1>
          <p>
            Authenticate with your operator credentials to inspect station availability, OCPP 1.6 Edition 2 packets, and Ghana Cedi session reconciliation.
          </p>

          <form onSubmit={handleLogin} className="wa-auth-form">
            <label>
              <span>Administrator Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label>
              <span>Security Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter operator password"
                autoComplete="current-password"
                required
              />
            </label>

            {authError && (
              <div className="wa-error">
                <AlertTriangle size={15} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" className="wa-primary-button" disabled={authBusy}>
              <Lock size={15} />
              <span>{authBusy ? 'Authenticating...' : 'Unlock Operations Console'}</span>
              <ArrowUpRight size={16} />
            </button>
          </form>

          {devHint && (
            <div className="wa-dev-note">
              <KeyRound size={14} />
              <span>
                Local dev credential active. Set <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> in production.
              </span>
              <button type="button" className="wa-inline-button" onClick={() => setPassword(devHint)}>
                Fill dev password
              </button>
            </div>
          )}

          <a className="wa-back-link" href="/">
            <span>Return to driver application</span>
            <ChevronRight size={14} />
          </a>
        </main>
      </div>
    );
  }

  const totalConnectors = overview?.connectors.total ?? stations.reduce((sum, s) => sum + s.connectors.length, 0);
  const availableConnectors = overview?.connectors.available ?? 0;

  return (
    <div className="wa-app">
      <aside className={`wa-sidebar ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="wa-sidebar-top">
          <div className="wa-brand-lockup">
            <img src="/willpower/WillPower_App_Icon_V3.png" alt="Wilpower" className="wa-brand-mark" style={{ objectFit: 'cover' }} />
            <div>
              <strong>Wilpower Ops</strong>
              <span>CSMS Control</span>
            </div>
          </div>
          <button type="button" className="wa-close-button" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>


        <nav className="wa-nav" aria-label="Operations navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={view === item.id ? 'is-active' : ''}
                onClick={() => {
                  setView(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon size={17} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.sub}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="wa-sidebar-bottom">
          <div className="wa-sidebar-note">
            <Radio size={15} />
            <div>
              <strong>CitrineOS Bridge</strong>
              <span>{overview?.network.ocppVersion || 'OCPP 1.6J Edition 2'}</span>
            </div>
          </div>

          <div className="wa-admin-user">
            <div className="wa-admin-avatar">{admin.displayName.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{admin.displayName}</strong>
              <span>{admin.email}</span>
            </div>
            <button type="button" onClick={handleLogout} title="Sign out of admin portal">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="wa-main">
        <header className="wa-topbar">
          <button type="button" className="wa-menu-button" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={18} />
          </button>

          <div>
            <span className="wa-topbar-kicker">WILPOWER OPERATIONS PORTAL</span>
            <h2>{navItems.find((item) => item.id === view)?.label}</h2>
          </div>

          <div className="wa-top-actions">
            <div className="wa-secure-chip">
              <span />
              HttpOnly Session Active
            </div>
            <button type="button" className="wa-refresh-button" onClick={refreshOperations} title="Refresh telemetry">
              <RefreshCw size={15} className={refreshing ? 'is-spinning' : ''} />
            </button>
          </div>
        </header>

        <main className="wa-content">
          {notice && (
            <div className="wa-notice">
              <AlertTriangle size={15} />
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {view === 'dashboard' && (
            <section className="wa-section">
              <div className="wa-page-heading">
                <div>
                  <span className="wa-eyebrow">LIVE NETWORK HEALTH</span>
                  <h1>Ghana Charging Control Plane.</h1>
                  <p>Greenwood Event Center (CL-KSI-001) MaxPower VCP160 160 kW DC Fast Charger commissioned on OCPP 1.6 Edition 2.</p>
                </div>
                <div className="wa-page-status">
                  <span className="wa-live-dot" />
                  <span>Updated {overview?.generatedAt ? new Date(overview.generatedAt).toLocaleTimeString() : 'now'}</span>
                </div>
              </div>

              <div className="wa-metric-grid">
                <article className="wa-metric">
                  <div>
                    <span>REGISTERED HUBS</span>
                    <Building2 size={17} />
                  </div>
                  <strong>{overview?.stations.total ?? stations.length}</strong>
                  <small>{overview?.stations.online ?? 1} online · {overview?.stations.offline ?? 0} offline</small>
                </article>

                <article className="wa-metric wa-metric-blue">
                  <div>
                    <span>CONNECTOR READY RATE</span>
                    <Zap size={17} />
                  </div>
                  <strong>{availableConnectors} / {totalConnectors}</strong>
                  <small>Outlet A (GB/T 160kW) & Outlet B (GB/T 160kW)</small>
                </article>

                <article className="wa-metric wa-metric-amber">
                  <div>
                    <span>ACTIVE SESSIONS</span>
                    <BatteryCharging size={17} />
                  </div>
                  <strong>{overview?.sessions.active ?? 0}</strong>
                  <small>{(overview?.sessions.kwhDelivered ?? 0).toFixed(2)} kWh delivered live</small>
                </article>

                <article className="wa-metric wa-metric-purple">
                  <div>
                    <span>LIVE ESCROW LEDGER</span>
                    <Activity size={17} />
                  </div>
                  <strong>{formatGhs(overview?.sessions.currentCost ?? 0)}</strong>
                  <small>Published rate: GH₵ 5.00 / kWh</small>
                </article>
              </div>

              <div className="wa-dashboard-grid">
                <div className="wa-panel wa-network-panel">
                  <div className="wa-panel-heading">
                    <div>
                      <span className="wa-eyebrow">GEOSPATIAL TELEMETRY</span>
                      <h3>Kumasi Greenwood Corridor</h3>
                    </div>
                    <button type="button" className="wa-inline-button" onClick={() => setView('stations')}>
                      <span>Manage stations</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="wa-network-map">
                    <div className="wa-map-grid-lines" />
                    <div className="wa-map-orbit wa-orbit-one" />
                    <div className="wa-map-orbit wa-orbit-two" />
                    <div className="wa-map-center">
                      <MapPin size={18} />
                      <span>KUMASI COMMAND</span>
                      <b>6.6697 N · -1.5996 W</b>
                    </div>
                    {stations.map((station) => (
                      <div key={station.id} className={`wa-network-pin ${station.isOnline ? 'is-online' : 'is-offline'}`} style={{ top: '48%', left: '53%' }}>
                        <span />
                        <strong>{station.stationId} · ONLINE</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="wa-panel wa-alert-panel">
                  <div className="wa-panel-heading">
                    <div>
                      <span className="wa-eyebrow">PRIORITY ALERTS</span>
                      <h3>Hardware Exceptions</h3>
                    </div>
                    <AlertTriangle size={17} />
                  </div>

                  {overview?.alerts?.length ? (
                    overview.alerts.map((alert) => (
                      <div className="wa-alert-row" key={alert.id}>
                        <AlertTriangle size={15} />
                        <div>
                          <strong>{alert.action}</strong>
                          <span>Connector {alert.payload?.connectorId} reported {alert.payload?.errorCode || 'Faulted'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="wa-empty-state">
                      <CheckCircle2 size={24} />
                      <strong>Zero active hardware faults</strong>
                      <span>Outlet A (GB/T) and Outlet B (GB/T) report NoError on OCPP 1.6J.</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {view === 'stations' && (
            <section className="wa-section">
              <div className="wa-page-heading">
                <div>
                  <span className="wa-eyebrow">STATION REGISTRY & COMMISSIONING</span>
                  <h1>Charge Points & Connectors.</h1>
                  <p>Live OCPP 1.6 Edition 2 status and the 5-step MaxPower VCP160 physical commissioning runbook.</p>
                </div>
                <button
                  type="button"
                  className="wa-primary-small"
                  onClick={() => dispatchAdminOcppCommand('TriggerMessage', { requestedMessage: 'StatusNotification', connectorId: 1 })}
                >
                  <RefreshCw size={15} />
                  <span>Poll StatusNotification</span>
                </button>
              </div>

              <div className="wa-panel wa-table-panel">
                <div className="wa-station-table">
                  <div className="wa-table-row wa-table-head">
                    <span>Station / Pile ID</span>
                    <span>Status</span>
                    <span>Outlets</span>
                    <span>Remote OCPP 1.6J Actions</span>
                  </div>
                  {stations.map((station) => (
                    <div className="wa-table-row" key={station.id}>
                      <div className="wa-station-name">
                        <div className="wa-station-icon"><Zap size={16} /></div>
                        <span>
                          <strong>{station.name}</strong>
                          <small>{station.stationId} · Pile ID: {station.pileNumber || '19046744073709551615'} · {station.address}</small>
                        </span>
                      </div>
                      <span className={`wa-state ${station.isOnline ? 'is-online' : 'is-offline'}`}>
                        <i />
                        {station.isOnline ? 'Online (1.6J)' : 'Offline'}
                      </span>
                      <span className="wa-connector-count">
                        {station.connectors.length === 1
                          ? `${station.connectors[0].maxPowerKw}kW ${station.connectors[0].type}: ${station.connectors[0].status}`
                          : station.connectors
                              .map((c) => `${c.label || `Gun ${c.connectorId}`} (${c.maxPowerKw}kW ${c.type}): ${c.status}`)
                              .join(' · ')}
                      </span>
                      <div className="wa-station-actions">
                        <div className="wa-tariff-inline">
                          <input
                            type="number"
                            step="0.10"
                            min="0.10"
                            value={stationTariffDrafts[station.stationId] ?? ''}
                            onChange={(e) => setStationTariffDrafts((prev) => ({ ...prev, [station.stationId]: e.target.value }))}
                            className="wa-input wa-input-sm"
                            aria-label="Tariff GH₵ per kWh"
                          />
                          <button
                            type="button"
                            className="wa-btn-primary wa-btn-sm"
                            disabled={tariffBusy}
                            onClick={() => updateStationTariff(station.stationId)}
                          >
                            <Coins size={13} />
                            <span>Set GH₵/kWh</span>
                          </button>
                        </div>
                        {station.connectors.length === 1 ? (
                          <button
                            type="button"
                            className="wa-btn-secondary wa-btn-sm"
                            onClick={() => dispatchAdminOcppCommand('UnlockConnector', { connectorId: station.connectors[0].connectorId })}
                          >
                            <Unlock size={13} />
                            <span>Unlock Gun</span>
                          </button>
                        ) : (
                          station.connectors.map((c) => {
                            const shortLabel = c.label ? c.label.replace(/^Outlet\s+/i, '') : String(c.connectorId);
                            return (
                              <button
                                key={c.connectorId}
                                type="button"
                                className="wa-btn-secondary wa-btn-sm"
                                onClick={() => dispatchAdminOcppCommand('UnlockConnector', { connectorId: c.connectorId })}
                              >
                                <Unlock size={13} />
                                <span>Unlock {shortLabel}</span>
                              </button>
                            );
                          })
                        )}
                        <button
                          type="button"
                          className="wa-btn-secondary wa-btn-sm"
                          onClick={() => dispatchAdminOcppCommand('Reset', { type: 'Soft' })}
                        >
                          <RefreshCw size={13} />
                          <span>Soft Reset</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="wa-panel wa-next-panel" style={{ marginTop: 16 }}>
                <div className="wa-panel-heading">
                  <div>
                    <span className="wa-eyebrow">MAXPOWER VCP160 · 5-STEP HMI COMMISSIONING GUIDE</span>
                    <h3>Physical Charger Setup Parameters</h3>
                  </div>
                  <Wrench size={17} />
                </div>

                <div className="wp-commissioning-layout" style={{ marginTop: 16 }}>
                  <img
                    src="/ocpp-commissioning-guide.jpeg"
                    alt="MaxPower VCP160 5-Step OCPP Setup"
                    className="wp-commissioning-image"
                  />
                  <div className="wp-step-list">
                    <div className="wp-step-item">
                      <span className="wp-step-badge">1</span>
                      <div>
                        <strong>Step 1: Click Menu</strong>
                        <p>On the main charger HMI (showing Outlet A & Outlet B voltage, current, capacity, time, price /kWh, and ID 19046744073709551615), tap <b>Menu</b>.</p>
                      </div>
                    </div>
                    <div className="wp-step-item">
                      <span className="wp-step-badge">2</span>
                      <div>
                        <strong>Step 2: Click System administrator</strong>
                        <p>Select <b>System administrator</b> (bottom-right tile of the Menu screen).</p>
                      </div>
                    </div>
                    <div className="wp-step-item">
                      <span className="wp-step-badge">3</span>
                      <div>
                        <strong>Step 3: Enter password 1, and click OK</strong>
                        <p>Enter administrator password <b>1</b> and tap <b>OK</b>.</p>
                      </div>
                    </div>
                    <div className="wp-step-item">
                      <span className="wp-step-badge">4</span>
                      <div>
                        <strong>Step 4: Click OCPP setup</strong>
                        <p>Tap the <b>OCPP setup</b> tile in the System administrator menu.</p>
                      </div>
                    </div>
                    <div className="wp-step-item">
                      <span className="wp-step-badge">5</span>
                      <div>
                        <strong>Step 5: Set OCPP URL and stake number</strong>
                        <p>
                          Set <b>OCPP connection</b> = <code>Enable</code>, <b>URL setting</b> = <code>{wsPrimaryUrl}</code>, <b>port</b> = <code>5173</code>, <b>pile number</b> = <code>CL-KSI-001</code> (or <code>19046744073709551615</code>), and <b>Network mode</b> = <code>2.Ethernet</code> (for 4G SIM or network cable).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === 'customers' && (
            <section className="wa-section">
              <div className="wa-page-heading">
                <div>
                  <span className="wa-eyebrow">DRIVER ACCOUNTS &amp; PRICING</span>
                  <h1>Customer Accounts &amp; History.</h1>
                  <p>View registered drivers, inspect wallet balances and charging history, and set customer-specific GH₵/kWh pricing.</p>
                </div>
                <div className="wa-page-status">
                  <span>{customers.length} Registered {customers.length === 1 ? 'Account' : 'Accounts'}</span>
                </div>
              </div>

              <div className="wa-search-well">
                <Search size={16} />
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, phone (+233...), email, or vehicle plate..."
                />
              </div>

              <div className="wa-customers-grid">
                <div className="wa-panel">
                  <div className="wa-panel-heading">
                    <div>
                      <span className="wa-eyebrow">ACCOUNTS ({filteredCustomers.length})</span>
                      <h3>Registered Drivers</h3>
                    </div>
                    <Users size={18} />
                  </div>

                  {filteredCustomers.length === 0 ? (
                    <div className="wa-empty-state">
                      <Users size={22} />
                      <strong>No customer accounts found</strong>
                      <span>New signups appear here automatically once drivers verify via OTP.</span>
                    </div>
                  ) : (
                    <div className="wa-customer-list">
                      {filteredCustomers.map((c) => {
                        const isSelected = selectedCustomer?.phoneNumber === c.phoneNumber;
                        return (
                          <button
                            key={c.phoneNumber}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerPhone(c.phoneNumber);
                              setCustomerTariffInput(c.customTariffPerKwh !== undefined ? String(c.customTariffPerKwh) : '');
                            }}
                            className={`wa-customer-card ${isSelected ? 'is-selected' : ''}`}
                          >
                            <div className="wa-customer-meta">
                              <strong>{c.displayName || 'Wilpower Driver'}</strong>
                              <span>{c.phoneNumber}{c.email ? ` · ${c.email}` : ''}</span>
                              <small>
                                Wallet: {formatGhs(c.walletBalance)} · {c.chargingCount} charging {c.chargingCount === 1 ? 'session' : 'sessions'}
                                {c.customTariffPerKwh !== undefined ? ` · Custom rate: ${formatGhs(c.customTariffPerKwh)}/kWh` : ' · Standard rate'}
                              </small>
                            </div>
                            <ChevronRight size={16} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="wa-panel">
                  <div className="wa-panel-heading">
                    <div>
                      <span className="wa-eyebrow">ACCOUNT DETAIL &amp; CHARGING HISTORY</span>
                      <h3>{selectedCustomer ? selectedCustomer.displayName : 'Select a Customer'}</h3>
                    </div>
                    <Coins size={18} />
                  </div>

                  {!selectedCustomer ? (
                    <div className="wa-empty-state">
                      <Users size={22} />
                      <strong>No customer selected</strong>
                      <span>Select a customer on the left to inspect charging history and modify pricing.</span>
                    </div>
                  ) : (
                    <div className="wa-customer-detail">
                      <div className="wa-customer-stats">
                        <div className="wa-stat-tile">
                          <small>Wallet Balance</small>
                          <strong className="is-accent">{formatGhs(selectedCustomer.walletBalance)}</strong>
                        </div>
                        <div className="wa-stat-tile">
                          <small>Charging Spend</small>
                          <strong>{formatGhs(selectedCustomer.totalSpentGhs)}</strong>
                        </div>
                        <div className="wa-stat-tile">
                          <small>Customer Rate</small>
                          <strong>
                            {selectedCustomer.customTariffPerKwh !== undefined ? `${formatGhs(selectedCustomer.customTariffPerKwh)}/kWh` : 'Station Default'}
                          </strong>
                        </div>
                      </div>

                      <div className="wa-info-well">
                        <div className="wa-info-row">
                          <span>Phone</span>
                          <strong>{selectedCustomer.phoneNumber}</strong>
                        </div>
                        {selectedCustomer.email && (
                          <div className="wa-info-row">
                            <span>Email</span>
                            <strong>{selectedCustomer.email}</strong>
                          </div>
                        )}
                        <div className="wa-info-row">
                          <span>Vehicles</span>
                          <strong>
                            {selectedCustomer.registeredVehicles?.length
                              ? selectedCustomer.registeredVehicles.map((v) => `${v.make} ${v.model} (${v.licensePlate})`).join(', ')
                              : 'None registered'}
                          </strong>
                        </div>
                      </div>

                      <div className="wa-rate-box">
                        <div className="wa-rate-header">
                          <strong>Price Modification for {selectedCustomer.displayName}</strong>
                          <span>Override the GH₵/kWh rate applied to this driver&apos;s sessions.</span>
                        </div>
                        <div className="wa-rate-controls">
                          <input
                            type="number"
                            step="0.10"
                            min="0.10"
                            placeholder="e.g. 4.50"
                            value={customerTariffInput}
                            onChange={(e) => setCustomerTariffInput(e.target.value)}
                            className="wa-input"
                          />
                          <button
                            type="button"
                            className="wa-btn-primary"
                            disabled={tariffBusy}
                            onClick={() => {
                              const parsed = parseFloat(customerTariffInput);
                              if (!Number.isFinite(parsed) || parsed <= 0) {
                                setNotice('Enter a valid GH₵/kWh price (e.g. 4.50).');
                                return;
                              }
                              updateCustomerTariff(selectedCustomer.phoneNumber, parsed);
                            }}
                          >
                            <span>Save Custom Rate</span>
                          </button>
                          <button
                            type="button"
                            className="wa-btn-secondary"
                            disabled={tariffBusy}
                            onClick={() => {
                              setCustomerTariffInput('');
                              updateCustomerTariff(selectedCustomer.phoneNumber, null);
                            }}
                          >
                            <span>Reset to Default</span>
                          </button>
                        </div>
                      </div>

                      <div className="wa-tx-section">
                        <div className="wa-tx-heading">
                          <strong>Charging &amp; Transaction History</strong>
                          <span>{selectedCustomer.transactions?.length || 0} records</span>
                        </div>
                        {!selectedCustomer.transactions?.length ? (
                          <div className="wa-empty-state is-compact">
                            <span>No charging sessions or wallet transactions recorded yet for this customer.</span>
                          </div>
                        ) : (
                          <div className="wa-tx-list">
                            {selectedCustomer.transactions.map((tx) => (
                              <div className="wa-tx-row" key={tx.id}>
                                <div className="wa-customer-meta">
                                  <strong>{tx.description || tx.type}</strong>
                                  <span>{tx.reference} · {new Date(tx.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="wa-tx-amount">
                                  <strong className={tx.type === 'TOPUP' ? 'is-accent' : ''}>
                                    {tx.type === 'TOPUP' ? '+' : ''}{formatGhs(tx.amount)}
                                  </strong>
                                  <small>{tx.status}</small>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {view === 'sessions' && (
            <section className="wa-section">
              <div className="wa-page-heading">
                <div>
                  <span className="wa-eyebrow">ENERGY & ESCROW LEDGER</span>
                  <h1>Active Charging Sessions.</h1>
                  <p>Real-time Ghana Cedi pre-authorization holds, kWh metering, and idle fee enforcement.</p>
                </div>
              </div>

              <div className="wa-session-hero">
                <div>
                  <span className="wa-eyebrow">SESSION TELEMETRY</span>
                  <h3>{overview?.sessions.active ? '1 session active on network' : 'No active vehicle sessions'}</h3>
                  <p>
                    Pre-authorization holds of GH₵ 25.00 are locked before RemoteStartTransaction and reconciled immediately when StopTransaction is received.
                  </p>
                </div>
                <div className="wa-session-figure">
                  <Zap size={22} />
                  <strong>{(overview?.sessions.kwhDelivered ?? 0).toFixed(2)} kWh</strong>
                  <span>{formatGhs(overview?.sessions.currentCost ?? 0)} accrued</span>
                </div>
              </div>
            </section>
          )}

          {view === 'diagnostics' && (
            <section className="wa-section">
              <div className="wa-page-heading">
                <div>
                  <span className="wa-eyebrow">CITRINEOS / OCPP 1.6J BRIDGE</span>
                  <h1>System Diagnostics & CSMS Console.</h1>
                  <p>Inspect incoming and outgoing OCPP 1.6 Edition 2 JSON-RPC frames and dispatch remote commands.</p>
                </div>
              </div>

              <div className="wa-diagnostics-grid">
                <div className="wa-panel wa-health-card">
                  <span className="wa-eyebrow">CSMS BACKBONE & REMOTE COMMANDS</span>
                  <h3>CitrineOS OCPP 1.6J Bridge</h3>
                  <div className="wa-health-status">
                    <span className="wa-live-dot" />
                    <strong>{overview?.network.citrineOsBridge || 'CONNECTED'}</strong>
                  </div>
                  <div className="wa-detail-line">
                    <span>Protocol</span>
                    <strong>{overview?.network.ocppVersion || 'OCPP 1.6J Edition 2'}</strong>
                  </div>
                  <div className="wa-detail-line">
                    <span>WebSocket URL</span>
                    <strong>{wsPrimaryUrl}</strong>
                  </div>
                  <div className="wa-detail-line">
                    <span>Primary Node</span>
                    <strong>CL-KSI-001 · Greenwood Event Center</strong>
                  </div>
                  <div className="wa-detail-line">
                    <span>Factory Stake Alias</span>
                    <strong>19046744073709551615</strong>
                  </div>

                  <div className="wp-hmi-actions" style={{ marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => dispatchAdminOcppCommand('TriggerMessage', { requestedMessage: 'Heartbeat' })}
                    >
                      Trigger Heartbeat
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchAdminOcppCommand('TriggerMessage', { requestedMessage: 'StatusNotification', connectorId: 1 })}
                    >
                      Trigger Status (Outlet A)
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchAdminOcppCommand('UnlockConnector', { connectorId: 1 })}
                    >
                      Unlock Outlet A
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchAdminOcppCommand('UnlockConnector', { connectorId: 2 })}
                    >
                      Unlock Outlet B
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchAdminOcppCommand('ClearCache', {})}
                    >
                      ClearCache
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchAdminOcppCommand('Reset', { type: 'Soft' })}
                    >
                      Soft Reset
                    </button>
                  </div>
                </div>

                <div className="wa-panel wa-log-card">
                  <div className="wa-panel-heading">
                    <div>
                      <span className="wa-eyebrow">PACKET AUDIT TRAIL</span>
                      <h3>OCPP 1.6J Event Stream</h3>
                    </div>
                    <Terminal size={17} />
                  </div>

                  <div className="wa-log-list">
                    {logs.map((log) => (
                      <div className="wa-log-row" key={log.id}>
                        <span className="wa-log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <strong>{log.action} ({log.chargeBoxId || 'CL-KSI-001'})</strong>
                        <span className={log.direction === 'INCOMING' ? 'wa-log-in' : 'wa-log-out'}>
                          {log.direction}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === 'security' && (
            <section className="wa-section">
              <div className="wa-page-heading">
                <div>
                  <span className="wa-eyebrow">OPERATOR CREDENTIAL SECURITY</span>
                  <h1>Admin Access & Password.</h1>
                  <p>Rotate the operations portal password. Changes are hashed with scrypt and persisted on the server.</p>
                </div>
              </div>

              <div className="wa-diagnostics-grid">
                <div className="wa-panel wa-health-card">
                  <span className="wa-eyebrow">ACTIVE OPERATOR</span>
                  <h3>{admin.displayName}</h3>
                  <div className="wa-detail-line">
                    <span>Email</span>
                    <strong>{admin.email}</strong>
                  </div>
                  <div className="wa-detail-line">
                    <span>Assigned Role</span>
                    <strong>{admin.role}</strong>
                  </div>
                  <div className="wa-detail-line">
                    <span>Session Cookie</span>
                    <strong>HttpOnly · SameSite=Strict · 8h TTL</strong>
                  </div>
                </div>

                <div className="wa-panel wa-log-card">
                  <div className="wa-panel-heading">
                    <div>
                      <span className="wa-eyebrow">PASSWORD ROTATION</span>
                      <h3>Change Operator Password</h3>
                    </div>
                    <KeyRound size={17} />
                  </div>

                  <form onSubmit={handlePasswordUpdate} className="wa-auth-form">
                    <label>
                      <span>Current Password</span>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                      />
                    </label>
                    <label>
                      <span>New Password (minimum 12 characters)</span>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={12}
                        required
                      />
                    </label>
                    <label>
                      <span>Confirm New Password</span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={12}
                        required
                      />
                    </label>
                    <button type="submit" className="wa-primary-button" disabled={passwordBusy}>
                      <Lock size={15} />
                      <span>{passwordBusy ? 'Rotating password...' : 'Update Admin Password'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default WilpowerAdmin;
