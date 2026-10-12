import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  BatteryCharging,
  Bell,
  CarFront,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  Gauge,
  Grid2X2,
  Home,
  Info,
  Layers3,
  LocateFixed,
  MapPin,
  Menu,
  Navigation,
  PlugZap,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import type { ActiveTelemetrySession, ChargingStation, FleetAccount, WalletTransaction } from '../types';

type ViewKey = 'home' | 'discover' | 'charging' | 'wallet' | 'operator';

interface WillPowerAppProps {
  user: any;
  onSignOut: () => void;
  onUpdateUser?: (user: any) => void;
}

interface WalletState {
  availableBalance: number;
  heldBalance: number;
  currency: string;
  phoneNumber: string;
  momoProvider: string;
  transactions: WalletTransaction[];
}

interface MomoRequest {
  transactionId: string;
  amount: number;
  provider: string;
  ussdPrompt: string;
  networkReference: string;
}

const NAV_ITEMS: { id: ViewKey; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Find a charger', icon: MapPin },
  { id: 'charging', label: 'Charging session', icon: Zap },
  { id: 'wallet', label: 'Wallet & history', icon: CreditCard },
  { id: 'operator', label: 'Operator portal', icon: Grid2X2 },
];

function money(amount: number | undefined) {
  return 'GH₵ ' + Number(amount || 0).toFixed(2);
}

function dateLabel(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Recent activity';
  return new Intl.DateTimeFormat('en-GH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function elapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ':' + String(secs).padStart(2, '0');
}

function stationStatus(station: ChargingStation) {
  if (!station.isOnline || station.connectors.every((connector) => connector.status === 'Unavailable')) return 'Opening soon';
  if (station.connectors.some((connector) => connector.status === 'Available')) return 'Available';
  return 'Busy';
}

function transactionLabel(transaction: WalletTransaction) {
  if (transaction.type === 'TOPUP') return 'Wallet top-up';
  if (transaction.type === 'CHARGE_SETTLEMENT') return 'Charging session';
  if (transaction.type === 'PREAUTH_HOLD') return 'Session authorisation';
  return 'Authorisation release';
}

export const WillPowerApp: React.FC<WillPowerAppProps> = ({ user, onSignOut, onUpdateUser }) => {
  const [view, setView] = useState<ViewKey>('home');
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [session, setSession] = useState<ActiveTelemetrySession | null>(null);
  const [fleet, setFleet] = useState<FleetAccount | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [simulator, setSimulator] = useState<any>(null);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [search, setSearch] = useState('');
  const [connectorFilter, setConnectorFilter] = useState('all');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('50');
  const [topupProvider, setTopupProvider] = useState('MTN');
  const [momoRequest, setMomoRequest] = useState<MomoRequest | null>(null);
  const [momoPin, setMomoPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 4200);
  };

  const loadCore = async () => {
    const phone = user?.phoneNumber || '+233248901204';
    try {
      const responses = await Promise.all([
        fetch('/api/stations?lat=6.6885&lng=-1.6244'),
        fetch('/api/wallet?phoneNumber=' + encodeURIComponent(phone)),
        fetch('/api/session/active'),
        fetch('/api/fleet'),
        fetch('/api/health'),
        fetch('/api/simulator/status'),
      ]);
      const stationData = responses[0].ok ? await responses[0].json() : [];
      const walletData = responses[1].ok ? await responses[1].json() : null;
      const sessionData = responses[2].ok ? await responses[2].json() : null;
      const fleetData = responses[3].ok ? await responses[3].json() : null;
      const healthData = responses[4].ok ? await responses[4].json() : null;
      const simulatorData = responses[5].ok ? await responses[5].json() : null;
      if (Array.isArray(stationData)) {
        setStations(stationData);
        setSelectedStationId((current) => current || stationData[0]?.id || '');
      }
      if (walletData) setWallet(walletData);
      setSession(sessionData?.session || sessionData?.activeSession || null);
      setFleet(fleetData);
      setHealth(healthData);
      setSimulator(simulatorData);
    } catch {
      showToast('The network is taking a moment. Showing the last available information.');
    }
  };

  useEffect(() => {
    void loadCore();
    const timer = window.setInterval(() => void loadCore(), session ? 4000 : 15000);
    return () => window.clearInterval(timer);
  }, [user?.phoneNumber, session?.sessionId]);

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) || stations[0],
    [stations, selectedStationId],
  );
  const primaryVehicle = user?.registeredVehicles?.find((vehicle: any) => vehicle.isDefault) || user?.registeredVehicles?.[0];
  const availableBalance = wallet?.availableBalance ?? user?.walletBalance ?? 0;
  const filteredStations = stations.filter((station) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || (station.name + ' ' + station.address).toLowerCase().includes(query);
    const matchesConnector = connectorFilter === 'all' || station.connectors.some((connector) => connector.type === connectorFilter);
    return matchesSearch && matchesConnector;
  });

  const selectView = (next: ViewKey) => {
    setView(next);
    setShowMobileNav(false);
  };

  const startCharging = async (station: ChargingStation, connectorId: number) => {
    setBusy(true);
    try {
      const response = await fetch('/api/ocpp/remote-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: station.stationId,
          connectorId,
          phoneNumber: user?.phoneNumber || '+233248901204',
          isFleet: false,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data.error || 'This connector is not ready yet.');
        return;
      }
      setSession(data.session || null);
      if (data.wallet) setWallet(data.wallet);
      selectView('charging');
      showToast('Session authorised. Connector unlocked.');
    } catch {
      showToast('Unable to reach the charging service.');
    } finally {
      setBusy(false);
    }
  };

  const stopCharging = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/ocpp/remote-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: user?.phoneNumber || '+233248901204' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data.error || 'There is no active session to stop.');
        return;
      }
      setSession(null);
      if (data.wallet) setWallet(data.wallet);
      showToast('Session settled. Your receipt is now in Wallet & history.');
    } catch {
      showToast('Unable to reach the charging service.');
    } finally {
      setBusy(false);
    }
  };

  const initiateTopup = async () => {
    const amount = Number(topupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a valid Ghana Cedi amount.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/wallet/momo-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, provider: topupProvider, phone: user?.phoneNumber || '+233248901204' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        showToast(data.error || 'Payment request could not be created.');
        return;
      }
      setMomoRequest(data);
    } catch {
      showToast('Unable to reach the payment switch.');
    } finally {
      setBusy(false);
    }
  };

  const confirmTopup = async () => {
    if (!momoRequest) return;
    setBusy(true);
    try {
      const response = await fetch('/api/wallet/momo-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: momoRequest.transactionId,
          amount: momoRequest.amount,
          provider: momoRequest.provider,
          phone: user?.phoneNumber || '+233248901204',
          pin: momoPin,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        showToast(data.error || 'Payment confirmation failed.');
        return;
      }
      setWallet(data.wallet);
      setMomoRequest(null);
      setMomoPin('');
      setShowTopup(false);
      showToast('Wallet credited. Your receipt has been saved.');
      if (onUpdateUser && data.wallet) onUpdateUser({ ...user, walletBalance: data.wallet.availableBalance });
    } catch {
      showToast('Unable to confirm the payment.');
    } finally {
      setBusy(false);
    }
  };

  const renderView = () => {
    if (view === 'discover') {
      return (
        <DiscoverView
          stations={filteredStations}
          selectedStation={selectedStation}
          search={search}
          connectorFilter={connectorFilter}
          onSearch={setSearch}
          onFilter={setConnectorFilter}
          onSelect={(station) => setSelectedStationId(station.id)}
          onCharge={(station) => {
            const connector = station.connectors.find((item) => item.status === 'Available') || station.connectors[0];
            if (connector) void startCharging(station, connector.connectorId);
          }}
        />
      );
    }
    if (view === 'charging') {
      return <ChargingView session={session} station={stations.find((item) => item.stationId === session?.stationId)} busy={busy} onStop={stopCharging} onExplore={() => selectView('discover')} />;
    }
    if (view === 'wallet') {
      return <WalletView wallet={wallet} onTopup={() => setShowTopup(true)} />;
    }
    if (view === 'operator') {
      return <OperatorView stations={stations} health={health} simulator={simulator} fleet={fleet} />;
    }
    return (
      <HomeView
        user={user}
        vehicle={primaryVehicle}
        wallet={wallet}
        session={session}
        station={selectedStation}
        onFind={() => selectView('discover')}
        onCharging={() => selectView('charging')}
        onWallet={() => selectView('wallet')}
        onStart={(station) => {
          const connector = station?.connectors.find((item) => item.status === 'Available') || station?.connectors[0];
          if (station && connector) void startCharging(station, connector.connectorId);
        }}
      />
    );
  };

  return (
    <div className="wp-app">
      <aside className={showMobileNav ? 'wp-sidebar is-open' : 'wp-sidebar'}>
        <div className="wp-sidebar-top">
          <div className="wp-sidebar-brand"><img src="/willpower/WillPower_Logo_Reverse_V3.svg" alt="Will Power" /></div>
          <button className="wp-mobile-close" onClick={() => setShowMobileNav(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <div className="wp-side-label">YOUR SPACE</div>
        <nav className="wp-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => selectView(item.id)}>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
                {item.id === 'charging' && session && <span className="wp-nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="wp-sidebar-bottom">
          <div className="wp-side-message">
            <span className="wp-kicker wp-kicker-lime">MORE THAN A CHARGE</span>
            <p>Good journeys start with certainty.</p>
          </div>
          <div className="wp-user-card">
            <div className="wp-avatar">{(user?.displayName || 'WP').slice(0, 2).toUpperCase()}</div>
            <div><strong>{user?.displayName || 'Driver'}</strong><span>{primaryVehicle ? primaryVehicle.make + ' ' + primaryVehicle.model : 'Driver profile'}</span></div>
            <button onClick={onSignOut} aria-label="Sign out"><SquareArrowOutUpRight size={16} /></button>
          </div>
        </div>
      </aside>

      <section className="wp-content">
        <header className="wp-topbar">
          <button className="wp-mobile-menu" onClick={() => setShowMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="wp-breadcrumb"><span>Will Power</span><i>/</i><strong>{NAV_ITEMS.find((item) => item.id === view)?.label}</strong></div>
          <div className="wp-topbar-actions">
            <span className="wp-location"><span className="wp-topbar-pulse" aria-hidden="true" /><MapPin size={15} aria-hidden="true" /> Kumasi, Ghana</span>
            <span className="wp-concept-badge">{health?.status === 'ok' ? 'LIVE NETWORK' : 'DESIGN CONCEPT'}</span>
            <button className="wp-icon-button" aria-label="Notifications"><Bell size={18} /></button>
          </div>
        </header>
        <main className="wp-main">{renderView()}</main>
        <nav className="wp-mobile-nav" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => selectView(item.id)}><Icon size={18} /><span>{item.id === 'discover' ? 'Explore' : item.id === 'charging' ? 'Charging' : item.id === 'wallet' ? 'Wallet' : item.label}</span></button>;
          })}
        </nav>
      </section>

      {showTopup && (
        <TopupModal
          amount={topupAmount}
          provider={topupProvider}
          request={momoRequest}
          pin={momoPin}
          busy={busy}
          onAmount={setTopupAmount}
          onProvider={setTopupProvider}
          onPin={setMomoPin}
          onStart={initiateTopup}
          onConfirm={confirmTopup}
          onClose={() => { setShowTopup(false); setMomoRequest(null); setMomoPin(''); }}
        />
      )}
      {toast && <div className="wp-toast" role="status">{toast}</div>}
    </div>
  );
};

const PageHeader: React.FC<{ kicker: string; title: string; description: string; action?: React.ReactNode; tag?: string }> = ({ kicker, title, description, action, tag }) => (
  <div className="wp-page-header">
    <div><span className="wp-kicker">{kicker}</span><h1>{title}</h1><p>{description}</p></div>
    <div className="wp-page-header-side">{tag && <span className="wp-concept-badge">{tag}</span>}{action}</div>
  </div>
);

function HomeView({ user, vehicle, wallet, session, station, onFind, onCharging, onWallet, onStart }: any) {
  return (
    <div className="wp-page">
      <PageHeader kicker="THE NEW WAY TO MOVE" title="Power for what’s next." description="A charging experience designed around your day." action={<button className="wp-outline-button" onClick={onFind}><MapPin size={16} /> Explore stations <ArrowRight size={16} /></button>} />
      <section className="wp-hero">
        <div className="wp-hero-copy">
          <div className="wp-hero-signal"><span className="wp-status-dot" /> NETWORK READY <span>01 / KUMASI</span></div>
          <span className="wp-kicker wp-kicker-lime">WILL POWER / KUMASI</span>
          <h2>Less waiting.<br />More going.</h2>
          <p>Find the right connector, understand your charging session and get back on the road.</p>
          <button className="wp-primary-button" onClick={onFind}>Find a charging point <ArrowRight size={16} /></button>
          <div className="wp-hero-stats"><div><strong>01</strong><span>active location</span></div><div><strong>02</strong><span>connector types</span></div><div><strong>24/7</strong><span>account access</span></div></div>
        </div>
        <div className="wp-hero-image"><div className="wp-hero-image-grid" aria-hidden="true" /><img src="/willpower/Photo_Concept_Only.jpg" alt="Driver connecting an electric vehicle at a charging point" /><span>CAMPAIGN IMAGE / VISUAL CONCEPT</span><b>WP / 01</b></div>
      </section>

      <div className="wp-home-intro"><h2>The essentials, simplified.</h2><span>Live account data · built for the road</span></div>
      <section className="wp-essential-grid">
        <button className="wp-essential-card" onClick={onFind}><span>Find your nearest point <MapPin size={17} /></span><strong><em>01</em> /Find</strong><small>Location, connector, directions.</small></button>
        <button className={session ? 'wp-essential-card is-live' : 'wp-essential-card'} onClick={onCharging}><span>Know before you plug in <Zap size={17} /></span><strong><em>02</em> /Charge</strong><small>{session ? 'Your session is live right now.' : 'Session status, time and cost.'}</small></button>
        <button className="wp-essential-card" onClick={onWallet}><span>Pay with confidence <CreditCard size={17} /></span><strong><em>03</em> /Go</strong><small>Wallet balance and digital receipts.</small></button>
      </section>

      <section className="wp-home-lower">
        <div className="wp-balance-card">
          <div className="wp-balance-top"><div><span className="wp-kicker wp-kicker-lime">YOUR WALLET</span><h3>{money(wallet?.availableBalance ?? user?.walletBalance)}</h3></div><WalletCards size={23} /></div>
          <p>{wallet?.heldBalance ? money(wallet.heldBalance) + ' held for your active session' : 'Ready for your next charge.'}</p>
          <button onClick={onWallet}>Open wallet <ArrowRight size={15} /></button>
        </div>
        <div className="wp-next-card">
          <div className="wp-card-heading"><div><span className="wp-kicker">YOUR VEHICLE</span><h3>{vehicle ? vehicle.make + ' ' + vehicle.model : 'Add your vehicle'}</h3></div><CarFront size={22} /></div>
          <div className="wp-vehicle-meta"><span>{vehicle?.licensePlate || 'Profile ready'}</span><span>{vehicle?.connectorType || 'CCS2'} · {vehicle?.batteryCapacityKwh || 0} kWh</span></div>
          <div className="wp-vehicle-line"><span className="wp-status-dot wp-status-dot-green" />{station ? station.name + ' · ' + (station.isOnline ? 'online' : 'opening soon') : 'Loading network status'}</div>
          {station && <button className="wp-text-button" onClick={() => onStart(station)}>View next available point <ChevronRight size={15} /></button>}
        </div>
      </section>
    </div>
  );
}

function DiscoverView({ stations, selectedStation, search, connectorFilter, onSearch, onFilter, onSelect, onCharge }: any) {
  return (
    <div className="wp-page">
      <PageHeader kicker="DISCOVER CHARGING" title="Find your next charge." description="Find a point that suits your car and your schedule." tag="NETWORK DATA" />
      <div className="wp-discover-grid">
        <section className="wp-station-panel">
          <label className="wp-search"><Search size={18} aria-hidden="true" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search area or connector" aria-label="Search stations" /></label>
          <div className="wp-filter-row">
            {['all', 'CCS2', 'GB/T', 'Type2'].map((filter) => <button key={filter} className={connectorFilter === filter ? 'is-active' : ''} onClick={() => onFilter(filter)}>{filter === 'all' ? 'All points' : filter}</button>)}
          </div>
          <div className="wp-panel-divider" />
          <div className="wp-list-heading"><strong>Charging points</strong><span>{stations.length} found</span></div>
          <div className="wp-station-list">
            {stations.length === 0 && <div className="wp-empty"><CircleAlert size={18} /><p>No points match this search.</p></div>}
            {stations.map((station: ChargingStation) => (
              <button key={station.id} className={selectedStation?.id === station.id ? 'wp-station-item is-selected' : 'wp-station-item'} onClick={() => onSelect(station)}>
                <span className="wp-station-item-top"><strong>{station.name}</strong><span className={stationStatus(station) === 'Available' ? 'wp-status-chip is-good' : 'wp-status-chip'}>{stationStatus(station)}</span></span>
                <span className="wp-station-address">{station.address}</span>
                <span className="wp-station-connectors">{station.connectors.map((connector) => connector.type).join(' · ')} · {station.distanceKm ? station.distanceKm + ' km away' : 'Ghana network'}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="wp-map-panel">
          <div className="wp-map-grid" aria-label="Stylised station network map">
            {stations.map((station: ChargingStation, index: number) => <button key={station.id} className={selectedStation?.id === station.id ? 'wp-map-pin is-selected' : 'wp-map-pin'} style={{ left: (28 + index * 25) + '%', top: (35 + (index % 2) * 23) + '%' }} onClick={() => onSelect(station)} aria-label={'Select ' + station.name}><Zap size={17} /></button>)}
            <div className="wp-map-label wp-map-label-one">KUMASI</div><div className="wp-map-label wp-map-label-two">ASHANTI</div>
          </div>
          {selectedStation && <div className="wp-map-sheet"><span className="wp-kicker">SELECTED LOCATION</span><h3>{selectedStation.name}</h3><p>{selectedStation.address}</p><div className="wp-map-sheet-meta"><span>{selectedStation.connectors.length} connectors</span><span>{selectedStation.isOnline ? 'Online' : 'Hardware incoming'}</span></div><div className="wp-map-actions"><button className="wp-primary-button" onClick={() => onCharge(selectedStation)}>Charging details <ArrowRight size={15} /></button><a className="wp-outline-button" href={'https://www.google.com/maps/search/?api=1&query=' + selectedStation.latitude + ',' + selectedStation.longitude} target="_blank" rel="noreferrer"><Navigation size={15} /> Directions</a></div></div>}
        </section>
      </div>
    </div>
  );
}

function ChargingView({ session, station, busy, onStop, onExplore }: any) {
  const progress = session ? Math.min(100, Math.round((session.currentSocPercent / Math.max(session.targetSocPercent, 1)) * 100)) : 0;
  return (
    <div className="wp-page">
      <PageHeader kicker="CHARGING SESSION" title={session ? 'Every detail. In your hands.' : 'Ready when you are.'} description={session ? 'A calmer way to track energy, time and cost.' : 'Choose a live point to begin a charging session.'} tag={session ? 'LIVE SESSION' : 'NO ACTIVE SESSION'} />
      {session ? (
        <div className="wp-charging-grid">
          <section className="wp-charge-card">
            <div className="wp-charge-card-top"><div><span className="wp-kicker wp-kicker-lime">YOUR SESSION / LIVE</span><h2>{station?.name || 'Charging point'}</h2></div><span className="wp-live-badge"><span className="wp-status-dot" />Charging</span></div>
            <div className="wp-charge-ring" style={{ background: 'conic-gradient(#BDF22E ' + progress + '%, #294232 0)' }}><div><strong>{Math.round(session.currentSocPercent)}%</strong><span>state of charge</span></div></div>
            <div className="wp-charge-stats"><div><strong>{session.kwhDelivered.toFixed(2)}</strong><span>kWh delivered</span></div><div><strong>{money(session.accruedCost)}</strong><span>current cost</span></div><div><strong>{elapsed(session.elapsedSeconds)}</strong><span>elapsed time</span></div></div>
            <button className="wp-danger-button" onClick={onStop} disabled={busy}>{busy ? 'Settling session...' : 'Stop and settle session'}</button>
          </section>
          <section className="wp-detail-card"><h2>Session information</h2><DetailRow label="Charge point" value={station?.name || session.stationId} /><DetailRow label="Connector" value={'Connector ' + session.connectorId} /><DetailRow label="Power draw" value={session.currentPowerKw.toFixed(1) + ' kW'} /><DetailRow label="Battery target" value={Math.round(session.targetSocPercent) + '%'} /><DetailRow label="Authorisation hold" value={money(session.preauthHoldAmount)} /><div className="wp-notice"><Info size={18} /><span>Your session is billed from live meter values. Any unused authorisation hold returns to your wallet when you stop.</span></div></section>
        </div>
      ) : (
        <div className="wp-empty-session"><div className="wp-empty-icon"><PlugZap size={25} /></div><h2>No active session</h2><p>Find a charging point, check the connector and start when you're ready.</p><button className="wp-primary-button" onClick={onExplore}>Explore charging points <ArrowRight size={16} /></button></div>
      )}
    </div>
  );
}

function WalletView({ wallet, onTopup }: any) {
  return (
    <div className="wp-page">
      <PageHeader kicker="PAYMENTS" title="A simpler way to pay." description="One place for payment methods, receipts and every session." action={<button className="wp-primary-button" onClick={onTopup}>Add funds <ArrowRight size={16} /></button>} />
      <div className="wp-wallet-grid">
        <section className="wp-credit-card"><div className="wp-credit-heading"><div><span className="wp-kicker wp-kicker-lime">WILL POWER WALLET</span><h2>{money(wallet?.availableBalance)}</h2></div><WalletCards size={24} /></div><div className="wp-credit-footer"><span>Available balance</span><span>{wallet?.heldBalance ? money(wallet.heldBalance) + ' held' : 'No active hold'}</span></div></section>
        <section className="wp-detail-card"><h2>Payment methods</h2><DetailRow label="Primary method" value={(wallet?.momoProvider || 'MTN') + ' Mobile Money'} /><DetailRow label="Billing currency" value="Ghana cedi (GHS)" /><DetailRow label="Account number" value={wallet?.phoneNumber || 'Not linked'} /><div className="wp-notice"><ShieldCheck size={18} /><span>Your payment activity is reconciled by the Will Power wallet ledger.</span></div></section>
      </div>
      <div className="wp-section-heading"><h2>Charging history</h2><span>{wallet?.transactions?.length || 0} ledger entries</span></div>
      <section className="wp-ledger">
        {(wallet?.transactions || []).slice(0, 8).map((transaction: WalletTransaction) => <div className="wp-ledger-row" key={transaction.id}><span className={transaction.type === 'TOPUP' ? 'wp-ledger-icon is-credit' : 'wp-ledger-icon'}>{transaction.type === 'TOPUP' ? <ArrowDownLeft size={17} /> : <Zap size={17} />}</span><div className="wp-ledger-copy"><strong>{transactionLabel(transaction)}</strong><span>{dateLabel(transaction.timestamp)} · {transaction.description}</span></div><div className={transaction.type === 'TOPUP' ? 'wp-ledger-amount is-credit' : 'wp-ledger-amount'}>{transaction.type === 'TOPUP' ? '+' : '-'}{money(transaction.amount)}<small>{transaction.status.toLowerCase()}</small></div></div>)}
        {!wallet?.transactions?.length && <div className="wp-empty"><Clock3 size={18} /><p>Your charging and payment activity will appear here.</p></div>}
      </section>
    </div>
  );
}

function OperatorView({ stations, health, simulator, fleet }: any) {
  const station = stations[0];
  const connected = health?.citrineOsBridge === 'CONNECTED';
  return (
    <div className="wp-page">
      <PageHeader kicker="WILL POWER / OPERATIONS" title="Control without clutter." description="An operator view built around action, not decorative charts." tag="BACK-OFFICE" />
      <section className="wp-metric-grid"><Metric label="Charger connections" value={station?.isOnline ? '1' : '0'} detail={station?.isOnline ? 'Online now' : 'Pending hardware integration'} icon={PlugZap} /><Metric label="Active sessions" value={simulator?.activeSession ? '1' : '0'} detail={simulator?.activeSession ? 'Live telemetry' : 'No live session'} icon={Activity} /><Metric label="Receipts reconciled" value={health?.activeSessions ?? '0'} detail={connected ? 'CSMS bridge connected' : 'Payment gateway required'} icon={WalletCards} /></section>
      <div className="wp-section-heading"><h2>What needs attention</h2><span>{station ? station.name : 'Loading station registry'}</span></div>
      <section className="wp-operator-table">
        <div className="wp-operator-row is-head"><span>Asset</span><span>Station state</span><span>Priority</span><span>Next action</span></div>
        {station?.connectors?.map((connector: any) => <div className="wp-operator-row" key={connector.id}><strong>{station.stationId} · Connector {connector.connectorId}</strong><span>{connector.status}</span><span><em className={connector.status === 'Available' ? 'is-green' : 'is-amber'}>{connector.status === 'Available' ? 'Ready' : 'Setup'}</em></span><span>{connector.status === 'Unavailable' ? 'Pair hardware' : 'Monitor session'}</span></div>)}
        {!station && <div className="wp-empty"><CircleAlert size={18} /><p>Station registry unavailable.</p></div>}
      </section>
      <div className="wp-section-heading"><h2>Operating picture</h2><span>Live service diagnostics</span></div>
      <section className="wp-operator-cards"><div className="wp-editorial-card wp-editorial-dark"><span className="wp-kicker wp-kicker-lime">LIVE WHEN IT MATTERS</span><h3>{connected ? 'CSMS bridge connected.' : 'Bridge awaiting hardware.'}</h3><p>Online state, connector faults, tariffs, authorisations, usage, payments and logs should remain accurate and auditable.</p></div><div className="wp-editorial-card wp-editorial-lime"><span className="wp-kicker">HUMAN AT EVERY STEP</span><h3>{fleet?.vehicles?.length || 0} fleet vehicles in view.</h3><p>Give staff the next useful action, from pairing hardware to checking a driver's charging status.</p></div></section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="wp-detail-row"><span>{label}</span><strong>{value}</strong></div>;
}

function Metric({ label, value, detail, icon: Icon }: any) {
  return <div className="wp-metric"><div><span>{label}</span><Icon size={20} /></div><strong>{value}</strong><small>{detail}</small></div>;
}

function TopupModal({ amount, provider, request, pin, busy, onAmount, onProvider, onPin, onStart, onConfirm, onClose }: any) {
  return (
    <div className="wp-modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="wp-modal" role="dialog" aria-modal="true" aria-labelledby="topup-title">
        <div className="wp-modal-heading"><div><span className="wp-kicker">WALLET</span><h2 id="topup-title">{request ? 'Confirm your payment.' : 'Add funds securely.'}</h2></div><button className="wp-icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {!request ? <><label className="wp-field"><span>Amount in Ghana cedi</span><span className="wp-input-wrap"><span className="wp-currency">GH₵</span><input value={amount} onChange={(event) => onAmount(event.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" /></span></label><div className="wp-topup-presets">{['25', '50', '100', '250'].map((value) => <button key={value} onClick={() => onAmount(value)}>{value}</button>)}</div><div className="wp-field"><span>Payment provider</span><div className="wp-payment-grid"><button className={provider === 'MTN' ? 'wp-payment is-selected' : 'wp-payment'} onClick={() => onProvider('MTN')}><WalletCards size={16} /> MTN MoMo</button><button className={provider === 'TELECEL' ? 'wp-payment is-selected' : 'wp-payment'} onClick={() => onProvider('TELECEL')}><WalletCards size={16} /> Telecel Cash</button></div></div><button className="wp-primary-button wp-primary-wide" onClick={onStart} disabled={busy}>{busy ? <span className="wp-spinner" /> : <ArrowRight size={17} />} Request payment prompt</button></> : <><div className="wp-ussd-card"><span className="wp-kicker">AUTHORISATION REQUEST</span><strong>{request.ussdPrompt}</strong><small>{request.networkReference} · 60 second window</small></div><label className="wp-field"><span>Confirmation PIN <em>demo or gateway PIN</em></span><input value={pin} onChange={(event) => onPin(event.target.value)} placeholder="Enter PIN" type="password" inputMode="numeric" /></label><button className="wp-primary-button wp-primary-wide" onClick={onConfirm} disabled={busy}>{busy ? <span className="wp-spinner" /> : <Check size={17} />} Confirm and credit wallet</button><button className="wp-guest-button" onClick={() => onClose()}>Cancel payment request</button></>}
      </section>
    </div>
  );
}
