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
  Cpu,
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
  Wrench,
  X,
  Zap,
} from 'lucide-react';

type AdminView = 'dashboard' | 'stations' | 'sessions' | 'diagnostics' | 'security';

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
      const [overviewRes, stationsRes, logsRes] = await Promise.all([
        fetch('/api/admin/overview', { credentials: 'include' }),
        fetch('/api/admin/stations', { credentials: 'include' }),
        fetch('/api/admin/ocpp/logs', { credentials: 'include' }),
      ]);
      if (overviewRes.status === 401) {
        setAdmin(null);
        return;
      }
      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (stationsRes.ok) setStations(await stationsRes.json());
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

  const navItems = useMemo(
    () => [
      { id: 'dashboard' as const, label: 'Dashboard', sub: 'Network overview', icon: LayoutDashboard },
      { id: 'stations' as const, label: 'Stations', sub: 'Commissioning & guns', icon: Building2 },
      { id: 'sessions' as const, label: 'Sessions', sub: 'Live energy ledger', icon: BatteryCharging },
      { id: 'diagnostics' as const, label: 'OCPP 1.6J CSMS', sub: 'Commands & frames', icon: Cpu },
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
            <div className="wa-brand-mark">W</div>
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
            <div className="wa-brand-mark">W</div>
            <div>
              <strong>Wilpower Ops</strong>
              <span>CSMS Control</span>
            </div>
          </div>
          <button type="button" className="wa-close-button" onClick={() => setMobileMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="wa-admin-badge">
          <ShieldCheck size={14} />
          <span>RBAC · {admin.role.replace('_', ' ').toUpperCase()}</span>
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
                  <small>Outlet A (GB/T 160kW) & Outlet B (CCS2 160kW)</small>
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
                  <small>Published rate: GH₵ 4.50 / kWh</small>
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
                      <span>Outlet A (GB/T) and Outlet B (CCS2) report NoError on OCPP 1.6J.</span>
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
                        {station.connectors.map((c) => `${c.label || `Gun ${c.connectorId}`} (${c.type}): ${c.status}`).join(' · ')}
                      </span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="wa-row-action"
                          onClick={() => dispatchAdminOcppCommand('UnlockConnector', { connectorId: 1 })}
                        >
                          <Unlock size={13} />
                          <span>Unlock A</span>
                        </button>
                        <button
                          type="button"
                          className="wa-row-action"
                          onClick={() => dispatchAdminOcppCommand('UnlockConnector', { connectorId: 2 })}
                        >
                          <Unlock size={13} />
                          <span>Unlock B</span>
                        </button>
                        <button
                          type="button"
                          className="wa-row-action"
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
