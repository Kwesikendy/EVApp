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
  const [message, setMessage] = useState('Confirming your payment...');
  const [error, setError] = useState('');

  React.useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get('reference');
    if (!reference) {
      setError('No Paystack transaction reference was returned.');
      return;
    }

    void fetch('/api/wallet/paystack-verify?reference=' + encodeURIComponent(reference))
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Payment verification failed.');
        if (data.user) {
          for (const key of ['wilpower_user_session', 'willpower_user_session', 'chargelink_user_session', 'xcharge_user_session']) {
            localStorage.setItem(key, JSON.stringify(data.user));
          }
        }
        setMessage('Payment confirmed. Returning to your wallet...');
        window.setTimeout(() => window.location.replace('/'), 900);
      })
      .catch((err) => setError(err.message || 'Payment verification failed.'));
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#10141a', color: '#fff' }}>
      <section style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1>{error ? 'Payment could not be confirmed' : message}</h1>
        {error && <><p>{error}</p><button onClick={() => window.location.replace('/')} style={{ padding: '12px 18px' }}>Return to wallet</button></>}
      </section>
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
