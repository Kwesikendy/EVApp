import React, { useState } from 'react';
import { WillPowerApp } from './components/WillPowerApp';
import { WillPowerAuth } from './components/WillPowerAuth';
import { WilpowerAdmin } from './components/WilpowerAdmin';

function readStoredUser() {
  try {
    const saved = localStorage.getItem('wilpower_user_session') || localStorage.getItem('willpower_user_session') || localStorage.getItem('chargelink_user_session') || localStorage.getItem('xcharge_user_session');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function App() {
  if (/(^|\/)payments\/paystack\/callback(?:\/|$)/.test(window.location.pathname)) {
    return <PaystackCallback />;
  }
  // Support both the Vercel root deployment (/admin) and hosted project
  // base paths such as /EVApp/admin without mounting the driver shell.
  const isAdminPath = /(^|\/)admin(?:\/|$)/.test(window.location.pathname);
  if (isAdminPath) {
    return <WilpowerAdmin />;
  }
  return <DriverApp />;
}

function PaystackCallback() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Confirming your payment with Paystack...');
  const [errorDetails, setErrorDetails] = useState('');
  const [creditedAmount, setCreditedAmount] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  React.useEffect(() => {
    // Remove static HTML splash/launch screen immediately
    const launchScreen = document.getElementById('pwa-launch-screen');
    if (launchScreen) launchScreen.remove();

    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');

    if (!reference) {
      setStatus('error');
      setErrorDetails('No Paystack transaction reference was found in the callback URL.');
      return;
    }

    void fetch('/api/wallet/paystack-verify?reference=' + encodeURIComponent(reference))
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Payment verification failed.');
        }

        if (data.user) {
          for (const key of ['wilpower_user_session', 'willpower_user_session', 'chargelink_user_session', 'xcharge_user_session']) {
            localStorage.setItem(key, JSON.stringify(data.user));
          }
          if (typeof data.user.walletBalance === 'number') {
            setNewBalance(data.user.walletBalance);
          }
        }
        if (data.wallet?.transactions?.[0]?.amount) {
          setCreditedAmount(data.wallet.transactions[0].amount);
        }

        setStatus('success');
        setMessage('Payment confirmed! Your wallet has been credited.');
        window.setTimeout(() => window.location.replace('/'), 2200);
      })
      .catch((err) => {
        setStatus('error');
        setErrorDetails(err.message || 'Payment verification failed.');
      });
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#07110B', color: '#F8FBF4', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <section style={{ maxWidth: 440, width: '100%', textAlign: 'center', background: '#0D1710', border: '1px solid rgba(189,242,46,0.18)', borderRadius: 24, padding: 36, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ width: 68, height: 68, margin: '0 auto 20px', borderRadius: '50%', background: status === 'error' ? 'rgba(255,77,77,0.12)' : 'rgba(189,242,46,0.12)', border: status === 'error' ? '2px solid #ff4d4d' : '2px solid #BDF22E', display: 'grid', placeItems: 'center', fontSize: 28 }}>
          {status === 'verifying' && <span style={{ width: 28, height: 28, border: '3px solid rgba(189,242,46,0.25)', borderTopColor: '#BDF22E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
          {status === 'success' && '✓'}
          {status === 'error' && '!'}
        </div>

        <h1 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
          {status === 'verifying' && 'Verifying Payment'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'error' && 'Verification Issue'}
        </h1>

        <p style={{ margin: '0 0 20px', color: '#B7C8B7', fontSize: 14, lineHeight: 1.5 }}>
          {status === 'error' ? errorDetails : message}
        </p>

        {status === 'success' && creditedAmount !== null && (
          <div style={{ background: 'rgba(189,242,46,0.06)', border: '1px solid rgba(189,242,46,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
            <span style={{ display: 'block', fontSize: 11, color: '#8EA28E', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Top-Up Amount</span>
            <strong style={{ fontSize: 24, color: '#BDF22E' }}>+ GH₵ {creditedAmount.toFixed(2)}</strong>
            {newBalance !== null && (
              <span style={{ display: 'block', fontSize: 12, color: '#F8FBF4', marginTop: 6 }}>
                New Balance: <strong>GH₵ {newBalance.toFixed(2)}</strong>
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => window.location.replace('/')}
          style={{ width: '100%', padding: '14px 20px', background: status === 'error' ? '#2A1818' : '#BDF22E', color: status === 'error' ? '#ff8080' : '#07110B', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          {status === 'verifying' ? 'Cancel & Return' : 'Return to Wallet'}
        </button>
      </section>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

function DriverApp() {
  const [currentUser, setCurrentUser] = useState<any>(() => readStoredUser());
  const [guestMode, setGuestMode] = useState(false);

  const handleVerified = (user: any) => {
    setCurrentUser(user);
    setGuestMode(false);
    try {
      localStorage.setItem('wilpower_user_session', JSON.stringify(user));
      localStorage.setItem('willpower_user_session', JSON.stringify(user));
      localStorage.setItem('chargelink_user_session', JSON.stringify(user));
      localStorage.setItem('xcharge_user_session', JSON.stringify(user));
    } catch {}
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('wilpower_user_session');
      localStorage.removeItem('willpower_user_session');
      localStorage.removeItem('chargelink_user_session');
      localStorage.removeItem('xcharge_user_session');
    } catch {}
    setCurrentUser(null);
    setGuestMode(false);
  };

  if (!currentUser && !guestMode) {
    return <WillPowerAuth onVerified={handleVerified} onGuestExplore={() => setGuestMode(true)} />;
  }

  return (
    <WillPowerApp
      user={currentUser}
      onSignOut={handleSignOut}
      onUpdateUser={(updated) => {
        setCurrentUser(updated);
        try {
          localStorage.setItem('wilpower_user_session', JSON.stringify(updated));
          localStorage.setItem('willpower_user_session', JSON.stringify(updated));
          localStorage.setItem('chargelink_user_session', JSON.stringify(updated));
          localStorage.setItem('xcharge_user_session', JSON.stringify(updated));
        } catch {}
      }}
    />
  );
}
