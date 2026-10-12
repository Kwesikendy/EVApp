import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  CarFront,
  WalletCards,
} from 'lucide-react';

interface WillPowerAuthProps {
  onVerified: (user: any) => void;
  onGuestExplore: () => void;
}

type AuthMode = 'login' | 'signup' | 'otp';

const VEHICLES = [
  { id: 'byd', name: 'BYD Atto 3', detail: '60.5 kWh · CCS2' },
  { id: 'tesla', name: 'Tesla Model Y', detail: '75 kWh · CCS2' },
  { id: 'hyundai', name: 'Hyundai Ioniq 5', detail: '77.4 kWh · CCS2' },
];

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('2330') && digits.length === 13) return '+233' + digits.slice(4);
  if (digits.startsWith('233')) return '+' + digits;
  if (digits.startsWith('0')) return '+233' + digits.slice(1);
  if (digits.length === 9) return '+233' + digits;
  return value.trim();
}

export const WillPowerAuth: React.FC<WillPowerAuthProps> = ({ onVerified, onGuestExplore }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [vehicle, setVehicle] = useState('byd');
  const [payment, setPayment] = useState('momo');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedVehicle = VEHICLES.find((item) => item.id === vehicle) || VEHICLES[0];
  const normalizedPhone = normalizePhone(phone);

  const requestOtp = async (demo = false) => {
    setError('');
    setNotice('');
    if (!demo && !normalizedPhone) {
      setError('Enter a Ghana mobile number to continue.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setError('Add your name so we can set up your driver profile.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: demo ? '+233248901204' : normalizedPhone }),
      });
      const data = await response.json().catch(() => ({}));
      setDevCode(data.devCode || data.code || (demo ? '123456' : undefined));
      if (!data.success && data.error) setNotice(data.error);
    } catch {
      setDevCode(demo ? '123456' : undefined);
      if (!demo) setNotice('SMS gateway is unavailable. You can still use the demo profile while the service is restored.');
    } finally {
      setLoading(false);
      setPhone(demo ? '024 890 1204' : phone);
      setMode('otp');
    }
  };

  const verify = async (value = code) => {
    const submitted = value.trim();
    if (submitted.length !== 6) {
      setError('Enter the complete six-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: normalizedPhone || '+233248901204',
          code: submitted,
          metadata: mode === 'otp' && fullName
            ? {
                displayName: fullName.trim(),
                email: email.trim(),
                selectedEv: vehicle,
                selectedGateway: payment,
              }
            : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success && data.user) {
        onVerified(data.user);
        return;
      }
      if (submitted === '123456' && devCode) {
        onVerified({
          id: 'usr-demo-' + Date.now().toString(36),
          phoneNumber: normalizedPhone || '+233248901204',
          displayName: fullName.trim() || 'Kofi Mensah',
          email: email.trim() || 'driver@wilpower.energy',
          walletBalance: 100,
          heldEscrow: 0,
          defaultPaymentMethod: 'MTN_MOMO',
          registeredVehicles: [
            {
              id: 'veh-demo',
              make: selectedVehicle.name.split(' ')[0],
              model: selectedVehicle.name.split(' ').slice(1).join(' '),
              batteryCapacityKwh: selectedVehicle.id === 'hyundai' ? 77.4 : selectedVehicle.id === 'tesla' ? 75 : 60.5,
              connectorType: 'CCS2',
              isDefault: true,
            },
          ],
        });
        return;
      }
      setError(data.error || 'That code was not accepted. Request a new code and try again.');
      setCode('');
    } catch {
      setError('We could not reach the identity service. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const setAuthMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  return (
    <main className="wp-auth">
      <section className="wp-auth-aside">
        <div className="wp-auth-brand">
          <img src="/willpower/WillPower_Logo_Reverse_V3.svg" alt="Wilpower" />
        </div>
        <div className="wp-auth-aside-copy">
          <span className="wp-kicker wp-kicker-lime">POWER EVERY JOURNEY</span>
          <h1>Make charging the easy part.</h1>
          <p>Find a point, understand your session and keep moving with confidence.</p>
        </div>
        <div className="wp-auth-aside-foot">
          <span className="wp-status-dot" />
          <span>Built for Ghanaian roads · Kumasi first</span>
        </div>
      </section>

      <section className="wp-auth-panel">
        <div className="wp-auth-mobile-brand">
          <img src="/willpower/WillPower_Logo_Reverse_V3.svg" alt="Wilpower" />
        </div>

        {mode !== 'otp' ? (
          <div className="wp-auth-form">
            <div className="wp-auth-heading">
              <span className="wp-kicker">{mode === 'signup' ? 'NEW DRIVER' : 'WELCOME BACK'}</span>
              <h2>{mode === 'signup' ? 'Start with what’s next.' : 'Power for what’s next.'}</h2>
              <p>
                {mode === 'signup'
                  ? 'Create your driver profile in less than a minute.'
                  : 'Sign in securely with your Ghana mobile number.'}
              </p>
            </div>

            <div className="wp-auth-switch" role="tablist" aria-label="Account access">
              <button className={mode === 'login' ? 'is-active' : ''} onClick={() => setAuthMode('login')} role="tab" aria-selected={mode === 'login'}>
                Sign in
              </button>
              <button className={mode === 'signup' ? 'is-active' : ''} onClick={() => setAuthMode('signup')} role="tab" aria-selected={mode === 'signup'}>
                Create profile
              </button>
            </div>

            {mode === 'signup' && (
              <>
                <label className="wp-field">
                  <span>Full name</span>
                  <span className="wp-input-wrap">
                    <UserRound size={17} aria-hidden="true" />
                    <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Kofi Mensah" autoComplete="name" />
                  </span>
                </label>
                <label className="wp-field">
                  <span>Email for receipts <em>optional</em></span>
                  <span className="wp-input-wrap">
                    <Mail size={17} aria-hidden="true" />
                    <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email" />
                  </span>
                </label>
              </>
            )}

            <label className="wp-field">
              <span>Ghana mobile number</span>
              <span className="wp-input-wrap">
                <span className="wp-country">GH <small>+233</small></span>
                <Phone size={17} aria-hidden="true" />
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="024 890 1204" type="tel" autoComplete="tel" />
              </span>
            </label>

            {mode === 'signup' && (
              <>
                <div className="wp-field">
                  <span>Your vehicle</span>
                  <div className="wp-choice-grid">
                    {VEHICLES.map((item) => (
                      <button key={item.id} className={vehicle === item.id ? 'wp-choice is-selected' : 'wp-choice'} onClick={() => setVehicle(item.id)}>
                        <CarFront size={17} aria-hidden="true" />
                        <strong>{item.name}</strong>
                        <small>{item.detail}</small>
                        {vehicle === item.id && <Check size={15} aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="wp-field">
                  <span>Preferred payment</span>
                  <div className="wp-payment-grid">
                    {[
                      { id: 'momo', label: 'MTN MoMo' },
                      { id: 'telecel', label: 'Telecel Cash' },
                      { id: 'card', label: 'Mastercard' },
                    ].map((item) => (
                      <button key={item.id} className={payment === item.id ? 'wp-payment is-selected' : 'wp-payment'} onClick={() => setPayment(item.id)}>
                        <WalletCards size={16} aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && <div className="wp-alert wp-alert-error" role="alert">{error}</div>}
            {notice && <div className="wp-alert wp-alert-note" role="status">{notice}</div>}

            <button className="wp-primary-button wp-primary-wide" onClick={() => requestOtp()} disabled={loading}>
              {loading ? <span className="wp-spinner" /> : <LockKeyhole size={17} aria-hidden="true" />}
              <span>{mode === 'signup' ? 'Create profile' : 'Continue securely'}</span>
              {!loading && <ArrowRight size={17} aria-hidden="true" />}
            </button>

            <div className="wp-auth-demo">
              <button onClick={() => requestOtp(true)}>Try the demo profile <ArrowRight size={14} aria-hidden="true" /></button>
              <span>Use the live experience without a real charger.</span>
            </div>
            <button className="wp-guest-button" onClick={onGuestExplore}>Explore the network first</button>
          </div>
        ) : (
          <div className="wp-auth-form wp-otp-form">
            <button className="wp-back-button" onClick={() => setAuthMode('login')}><ChevronLeft size={16} aria-hidden="true" /> Change number</button>
            <div className="wp-auth-heading">
              <span className="wp-kicker">SECURE ACCESS</span>
              <div className="wp-otp-icon"><KeyRound size={22} aria-hidden="true" /></div>
              <h2>Check your messages.</h2>
              <p>Enter the six-digit code sent to <strong>{normalizedPhone || '+233 24 890 1204'}</strong>.</p>
            </div>
            {devCode && (
              <div className="wp-demo-code" role="status">
                <span>Demo code ready</span>
                <button onClick={() => { setCode(devCode); void verify(devCode); }}>{devCode} · Use code</button>
              </div>
            )}
            <label className="wp-field">
              <span>Verification code</span>
              <input
                className="wp-otp-input"
                value={code}
                onChange={(event) => {
                  const next = event.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(next);
                  if (next.length === 6) void verify(next);
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                autoFocus
              />
            </label>
            {error && <div className="wp-alert wp-alert-error" role="alert">{error}</div>}
            {notice && <div className="wp-alert wp-alert-note" role="status">{notice}</div>}
            <button className="wp-primary-button wp-primary-wide" onClick={() => void verify()} disabled={loading || code.length !== 6}>
              {loading ? <span className="wp-spinner" /> : <Check size={17} aria-hidden="true" />}
              <span>Verify and enter</span>
              {!loading && <ArrowRight size={17} aria-hidden="true" />}
            </button>
            <button className="wp-guest-button" onClick={() => setAuthMode('login')}>Use a different number</button>
          </div>
        )}
      </section>
    </main>
  );
};
