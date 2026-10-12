import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BatteryCharging,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Cpu,
  Gauge,
  LogOut,
  Menu,
  Network,
  PlugZap,
  RefreshCw,
  ServerCog,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import type { ChargingStation, OcppMessage } from '../types';

type AdminView = 'overview' | 'stations' | 'sessions' | 'diagnostics';

interface AdminIdentity {
  id: string;
  email: string;
  displayName: string;
  role: string;
  mustChangePassword?: boolean;
}

interface AdminOverviewData {
  generatedAt: string;
  stations: { total: number; online: number; offline: number };
  connectors: { total: number; available: number; occupied: number };
  sessions: { active: number; currentCost: number; kwhDelivered: number };
  network: { health: string; citrineOsBridge: string; ocppVersion: string };
  alerts: OcppMessage[];
}

interface AdminConfig {
  localCredentialsEnabled: boolean;
  defaultCredentialsEnabled?: boolean;
  email?: string;
}

const ADMIN_NAV: { id: AdminView; label: string; detail: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Command center', detail: 'Network pulse', icon: BarChart3 },
  { id: 'stations', label: 'Station operations', detail: 'Chargers and connectors', icon: Building2 },
  { id: 'sessions', label: 'Live sessions', detail: 'Energy and authorisations', icon: BatteryCharging },
  { id: 'diagnostics', label: 'Diagnostics', detail: 'OCPP and system health', icon: ServerCog },
];

function adminMoney(value: number) {
  return 'GH₵ ' + Number(value || 0).toFixed(2);
}

async function adminRequest<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...options, cache: 'no-store', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } });
  } catch {
    throw new Error(`Unable to reach the admin API at ${url}. Confirm that this is the Vercel deployment URL and redeploy the latest commit.`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Admin request failed.');
  return data as T;
}

export const WilpowerAdmin: React.FC = () => {
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [config, setConfig] = useState<AdminConfig | null>(null);

  useEffect(() => {
    void Promise.all([
      adminRequest<{ admin: AdminIdentity }>('/api/admin/auth/me').then((result) => setAdmin(result.admin)).catch(() => setAdmin(null)),
      adminRequest<AdminConfig>('/api/admin/auth/config').then(setConfig).catch(() => setConfig(null)),
    ]).finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) return <div className="wa-loading"><div className="wa-loading-mark">W</div><span>Securing admin workspace...</span></div>;
  if (!admin) return <AdminLogin config={config} onAuthenticated={setAdmin} />;
  if (admin.mustChangePassword) return <AdminPasswordChange admin={admin} onAuthenticated={setAdmin} />;
  return <AdminWorkspace admin={admin} onSignOut={() => { void adminRequest('/api/admin/auth/logout', { method: 'POST' }).finally(() => setAdmin(null)); }} />;
};

function AdminPasswordChange({ admin, onAuthenticated }: { admin: AdminIdentity; onAuthenticated: (admin: AdminIdentity) => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 12) {
      setError('Choose a password with at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await adminRequest<{ admin: AdminIdentity }>('/api/admin/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      onAuthenticated(result.admin);
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to change the administrator password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wa-auth-shell">
      <div className="wa-auth-orbit" aria-hidden="true" />
      <section className="wa-auth-panel">
        <div className="wa-brand-lockup"><div className="wa-brand-mark">W</div><div><strong>Wilpower</strong><span>Network control</span></div></div>
        <span className="wa-eyebrow">FIRST LOGIN SECURITY CHECK</span>
        <h1>Set your private access key.</h1>
        <p>You are using the initial administrator password. Create a new password before entering the operations portal.</p>
        <form className="wa-auth-form" onSubmit={submit}>
          <label><span>Current password</span><input value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type="password" autoComplete="current-password" required /></label>
          <label><span>New password</span><input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required /></label>
          <label><span>Confirm new password</span><input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required /></label>
          {error && <div className="wa-error" role="alert"><AlertTriangle size={16} />{error}</div>}
          <button className="wa-primary-button" disabled={busy}>{busy ? 'Saving secure password...' : 'Save password and continue'} <ArrowRight size={16} /></button>
        </form>
        <div className="wa-dev-note"><ShieldCheck size={15} /><span>Use at least 12 characters. Your current password is never displayed.</span></div>
      </section>
    </div>
  );
}

function AdminLogin({ config, onAuthenticated }: { config: AdminConfig | null; onAuthenticated: (admin: AdminIdentity) => void }) {
  const [email, setEmail] = useState(config?.email || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (config?.email) setEmail(config.email);
  }, [config?.email]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await adminRequest<{ admin: AdminIdentity }>('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      onAuthenticated(result.admin);
    } catch (requestError: any) {
      setError(requestError.message || 'Unable to sign in to the admin portal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wa-auth-shell">
      <div className="wa-auth-orbit" aria-hidden="true" />
      <section className="wa-auth-panel">
        <div className="wa-brand-lockup"><div className="wa-brand-mark">W</div><div><strong>Wilpower</strong><span>Network control</span></div></div>
        <span className="wa-eyebrow">PRIVATE OPERATIONS PORTAL</span>
        <h1>Control every part of the network.</h1>
        <p>Admin access is separated from the driver experience. Sign in with your Wilpower operations credentials.</p>
        <form className="wa-auth-form" onSubmit={submit}>
          <label><span>Administrator email</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" placeholder="admin@wilpower.energy" required /></label>
          <label><span>Password</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Enter secure password" required /></label>
          {error && <div className="wa-error" role="alert"><AlertTriangle size={16} />{error}</div>}
          <button className="wa-primary-button" disabled={busy}>{busy ? 'Authenticating...' : 'Enter operations portal'} <ArrowRight size={16} /></button>
        </form>
        {config?.defaultCredentialsEnabled && <div className="wa-dev-note"><ShieldCheck size={15} /><span>Initial access is enabled for {config.email || 'the configured administrator'} and requires a password change after login.</span></div>}
        <a className="wa-back-link" href="/">Return to driver experience <ChevronRight size={14} /></a>
      </section>
    </div>
  );
}

function AdminWorkspace({ admin, onSignOut }: { admin: AdminIdentity; onSignOut: () => void }) {
  const [view, setView] = useState<AdminView>('overview');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [logs, setLogs] = useState<OcppMessage[]>([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = async (silent = false) => {
    if (!silent) setBusy(true);
    try {
      const [nextOverview, nextStations, nextLogs] = await Promise.all([
        adminRequest<AdminOverviewData>('/api/admin/overview'),
        adminRequest<ChargingStation[]>('/api/admin/stations'),
        adminRequest<OcppMessage[]>('/api/admin/ocpp/logs'),
      ]);
      setOverview(nextOverview);
      setStations(nextStations);
      setLogs(nextLogs);
      if (!silent) setNotice('Operations data refreshed.');
    } catch (error: any) {
      setNotice(error.message || 'Unable to refresh operations data.');
    } finally {
      if (!silent) setBusy(false);
    }
  };

  useEffect(() => {
    void refresh(true);
    const timer = window.setInterval(() => void refresh(true), 12000);
    return () => window.clearInterval(timer);
  }, []);

  const activeNav = useMemo(() => ADMIN_NAV.find((item) => item.id === view) || ADMIN_NAV[0], [view]);

  const toggleStation = async (station: ChargingStation) => {
    setBusy(true);
    try {
      await adminRequest(`/api/stations/${station.id}`, { method: 'PUT', body: JSON.stringify({ isOnline: !station.isOnline }) });
      await refresh(true);
      setNotice(station.name + ' is now ' + (!station.isOnline ? 'online.' : 'offline.'));
    } catch (error: any) {
      setNotice(error.message || 'Station update failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wa-app">
      <aside className={mobileNav ? 'wa-sidebar is-open' : 'wa-sidebar'}>
        <div className="wa-sidebar-top"><div className="wa-brand-lockup"><div className="wa-brand-mark">W</div><div><strong>Wilpower</strong><span>Network control</span></div></div><button className="wa-close-button" onClick={() => setMobileNav(false)} aria-label="Close admin navigation"><X size={18} /></button></div>
        <div className="wa-admin-badge"><ShieldCheck size={15} /><span>ADMIN ONLY</span></div>
        <nav className="wa-nav" aria-label="Admin navigation">{ADMIN_NAV.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => { setView(item.id); setMobileNav(false); }}><Icon size={17} /><span><strong>{item.label}</strong><small>{item.detail}</small></span>{view === item.id && <ChevronRight size={14} />}</button>; })}</nav>
        <div className="wa-sidebar-bottom"><div className="wa-sidebar-note"><Network size={17} /><span>Live network bridge<br /><strong>{overview?.network.citrineOsBridge || 'Checking...'}</strong></span></div><div className="wa-admin-user"><div className="wa-admin-avatar">{admin.displayName.slice(0, 2).toUpperCase()}</div><div><strong>{admin.displayName}</strong><span>{admin.role.replace('_', ' ')}</span></div><button onClick={onSignOut} aria-label="Sign out of admin portal"><LogOut size={16} /></button></div></div>
      </aside>
      <main className="wa-main">
        <header className="wa-topbar"><button className="wa-menu-button" onClick={() => setMobileNav(true)} aria-label="Open admin navigation"><Menu size={20} /></button><div><span className="wa-topbar-kicker">WILPOWER OPERATIONS</span><h2>{activeNav.label}</h2></div><div className="wa-top-actions"><span className="wa-secure-chip"><span /> Secure admin session</span><button className="wa-refresh-button" onClick={() => void refresh()} disabled={busy} aria-label="Refresh operations data"><RefreshCw size={17} className={busy ? 'is-spinning' : ''} /></button></div></header>
        <div className="wa-content"><div className="wa-page-heading"><div><span className="wa-eyebrow">{activeNav.detail}</span><h1>{activeNav.label}</h1><p>Make informed network decisions from one operational view.</p></div><div className="wa-page-status"><span className="wa-live-dot" />{overview?.generatedAt ? 'Updated ' + new Date(overview.generatedAt).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }) : 'Connecting'}</div></div>
          {notice && <div className="wa-notice" role="status"><CheckCircle2 size={15} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={14} /></button></div>}
          {view === 'overview' && <AdminOverview overview={overview} stations={stations} onStationView={() => setView('stations')} />}
          {view === 'stations' && <AdminStations stations={stations} busy={busy} onToggle={toggleStation} />}
          {view === 'sessions' && <AdminSessions overview={overview} />}
          {view === 'diagnostics' && <AdminDiagnostics overview={overview} logs={logs} />}
        </div>
      </main>
    </div>
  );
}

function AdminOverview({ overview, stations, onStationView }: { overview: AdminOverviewData | null; stations: ChargingStation[]; onStationView: () => void }) {
  const metrics = [
    { label: 'Stations online', value: overview ? overview.stations.online + ' / ' + overview.stations.total : '--', detail: overview?.stations.offline ? overview.stations.offline + ' need attention' : 'All network points healthy', icon: Building2, tone: 'lime' },
    { label: 'Available connectors', value: overview?.connectors.available ?? '--', detail: (overview?.connectors.total || 0) + ' connectors registered', icon: PlugZap, tone: 'blue' },
    { label: 'Live sessions', value: overview?.sessions.active ?? '--', detail: overview ? overview.sessions.kwhDelivered.toFixed(2) + ' kWh in progress' : 'Awaiting telemetry', icon: BatteryCharging, tone: 'amber' },
    { label: 'Current session value', value: overview ? adminMoney(overview.sessions.currentCost) : '--', detail: 'Live Ghana Cedi accrual', icon: CircleDollarSign, tone: 'purple' },
  ];
  return <div className="wa-page-body"><section className="wa-metric-grid">{metrics.map((metric) => { const Icon = metric.icon; return <div className={'wa-metric wa-metric-' + metric.tone} key={metric.label}><div><span>{metric.label}</span><Icon size={18} /></div><strong>{metric.value}</strong><small>{metric.detail}</small></div>; })}</section><div className="wa-dashboard-grid"><section className="wa-panel wa-network-panel"><div className="wa-panel-heading"><div><span className="wa-eyebrow">NETWORK MAP</span><h3>Station pulse</h3></div><button className="wa-inline-button" onClick={onStationView}>Manage stations <ArrowRight size={14} /></button></div><div className="wa-network-map"><div className="wa-map-orbit wa-orbit-one" /><div className="wa-map-orbit wa-orbit-two" /><div className="wa-map-grid-lines" />{stations.map((station, index) => <div className={'wa-network-pin ' + (station.isOnline ? 'is-online' : 'is-offline')} key={station.id} style={{ left: (24 + index * 30) + '%', top: (35 + (index % 2) * 22) + '%' }}><span /><strong>{station.name}</strong></div>)}<div className="wa-map-center"><Gauge size={18} /><span>KUMASI<br /><b>CONTROL GRID</b></span></div></div></section><section className="wa-panel wa-alert-panel"><div className="wa-panel-heading"><div><span className="wa-eyebrow">REQUIRES ATTENTION</span><h3>Operational alerts</h3></div><AlertTriangle size={18} /></div>{overview?.alerts.length ? overview.alerts.map((alert) => <div className="wa-alert-row" key={alert.id}><AlertTriangle size={15} /><div><strong>{alert.action}</strong><span>{String(alert.payload?.errorCode || 'Connector fault reported')}</span></div><Clock3 size={14} /></div>) : <div className="wa-empty-state"><CheckCircle2 size={22} /><strong>No active alerts</strong><span>Network events will appear here.</span></div>}</section></div><section className="wa-panel wa-next-panel"><div className="wa-panel-heading"><div><span className="wa-eyebrow">OPERATIONS FOUNDATION</span><h3>Admin modules</h3></div><Settings2 size={18} /></div><div className="wa-module-grid"><ModuleCard icon={CircleDollarSign} title="Finance" detail="Wallets, payments and settlements" status="Next module" /><ModuleCard icon={Users} title="Drivers and fleets" detail="Accounts, vehicles and limits" status="Next module" /><ModuleCard icon={ShieldCheck} title="Staff and audit" detail="Roles, permissions and history" status="Next module" /></div></section></div>;
}

function AdminStations({ stations, busy, onToggle }: { stations: ChargingStation[]; busy: boolean; onToggle: (station: ChargingStation) => void }) {
  return <div className="wa-page-body"><section className="wa-panel wa-table-panel"><div className="wa-panel-heading"><div><span className="wa-eyebrow">ASSET REGISTER</span><h3>Stations and connectors</h3></div><button className="wa-primary-small" disabled={busy}><Building2 size={14} /> Register station</button></div><div className="wa-station-table"><div className="wa-table-row wa-table-head"><span>Station</span><span>State</span><span>Connectors</span><span>Action</span></div>{stations.map((station) => <div className="wa-table-row" key={station.id}><div className="wa-station-name"><div className="wa-station-icon"><Building2 size={16} /></div><span><strong>{station.name}</strong><small>{station.stationId} · {station.address}</small></span></div><span className={station.isOnline ? 'wa-state is-online' : 'wa-state is-offline'}><i />{station.isOnline ? 'Online' : 'Offline'}</span><span className="wa-connector-count"><strong>{station.connectors.filter((connector) => connector.status === 'Available').length}</strong> / {station.connectors.length} available</span><button className="wa-row-action" onClick={() => onToggle(station)} disabled={busy}>{station.isOnline ? 'Take offline' : 'Bring online'} <ArrowRight size={13} /></button></div>)}{!stations.length && <div className="wa-empty-state"><Building2 size={22} /><strong>No stations registered</strong><span>Station records will appear here.</span></div>}</div></section></div>;
}

function AdminSessions({ overview }: { overview: AdminOverviewData | null }) {
  return <div className="wa-page-body"><section className="wa-session-hero"><div><span className="wa-eyebrow">LIVE ENERGY CONTROL</span><h3>{overview?.sessions.active ? 'A charging session is active.' : 'No active charging sessions.'}</h3><p>{overview?.sessions.active ? 'Telemetry and financial accruals are being monitored from the control room.' : 'When a driver starts charging, live telemetry will appear here.'}</p></div><div className="wa-session-figure"><Activity size={18} /><strong>{overview?.sessions.kwhDelivered.toFixed(2) || '0.00'}</strong><span>kWh in flight</span></div></section><section className="wa-panel wa-placeholder-panel"><Cpu size={22} /><h3>Session operations are ready for telemetry</h3><p>The next layer adds driver identity, vehicle, connector, live power, session controls, authorisation holds, and settlement history.</p><span className="wa-coming-chip">TELEMETRY MODULE NEXT</span></section></div>;
}

function AdminDiagnostics({ overview, logs }: { overview: AdminOverviewData | null; logs: OcppMessage[] }) {
  return <div className="wa-page-body"><section className="wa-diagnostics-grid"><div className="wa-panel wa-health-card"><div className="wa-panel-heading"><div><span className="wa-eyebrow">SYSTEM HEALTH</span><h3>Bridge status</h3></div><Network size={18} /></div><div className="wa-health-status"><span className="wa-live-dot" /><strong>{overview?.network.citrineOsBridge || 'CHECKING'}</strong></div><div className="wa-detail-line"><span>Protocol</span><strong>{overview?.network.ocppVersion || 'OCPP 1.6J / 2.0.1'}</strong></div><div className="wa-detail-line"><span>Recent packets</span><strong>{logs.length}</strong></div></div><div className="wa-panel wa-log-card"><div className="wa-panel-heading"><div><span className="wa-eyebrow">OCPP EVENT STREAM</span><h3>Recent packets</h3></div><ServerCog size={18} /></div><div className="wa-log-list">{logs.slice(0, 8).map((log) => <div className="wa-log-row" key={log.id}><span className="wa-log-time">{new Date(log.timestamp).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span><strong>{log.action}</strong><span className={log.direction === 'INCOMING' ? 'wa-log-in' : 'wa-log-out'}>{log.direction}</span></div>)}{!logs.length && <div className="wa-empty-state"><ServerCog size={22} /><strong>No OCPP events yet</strong><span>Hardware traffic will appear here.</span></div>}</div></div></section></div>;
}

function ModuleCard({ icon: Icon, title, detail, status }: { icon: React.ElementType; title: string; detail: string; status: string }) {
  return <div className="wa-module-card"><div className="wa-module-icon"><Icon size={17} /></div><strong>{title}</strong><span>{detail}</span><small>{status}</small></div>;
}
