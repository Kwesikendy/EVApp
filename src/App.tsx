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
  const [errorDetails, setErrorDetails] = useState('');
  const [creditedAmount, setCreditedAmount] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [alreadyCredited, setAlreadyCredited] = useState(false);

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

        // Credit amount: search the transaction list for the matching reference first
        const txList: any[] = data.wallet?.transactions || data.user?.transactions || [];
        const matchingTx = txList.find((t: any) => t.reference === data.reference) || txList[0];
        if (matchingTx?.amount) setCreditedAmount(Number(matchingTx.amount));

        // New balance from user record (most reliable)
        const balance = data.user?.walletBalance ?? data.wallet?.availableBalance;
        if (typeof balance === 'number') setNewBalance(balance);

        // Persist updated user to all localStorage keys
        if (data.user) {
          const updatedUser = {
            ...data.user,
            // Ensure walletBalance is a number
            walletBalance: typeof data.user.walletBalance === 'number' ? data.user.walletBalance : (balance ?? 0),
          };
          for (const key of ['wilpower_user_session', 'willpower_user_session', 'chargelink_user_session', 'xcharge_user_session']) {
            try { localStorage.setItem(key, JSON.stringify(updatedUser)); } catch {}
          }
        }

        setAlreadyCredited(Boolean(data.alreadyCredited));
        setStatus('success');
        // Redirect back after a short receipt display
        window.setTimeout(() => window.location.replace('/'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setErrorDetails(err.message || 'Payment verification failed.');
      });
  }, []);

  const isErr = status === 'error';
  const isOk = status === 'success';
  const isPending = status === 'verifying';

  // HyperCharge OS palette
  const BG = '#10141a';
  const SURFACE = '#181c22';
  const CYAN = '#00f0ff';
  const GREEN = '#00e676';
  const RED = '#ff4d4d';
  const MUTED = 'rgba(255,255,255,0.45)';

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <section style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: SURFACE, border: `1px solid ${isErr ? 'rgba(255,77,77,0.25)' : 'rgba(0,240,255,0.18)'}`, borderRadius: 24, padding: '40px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

        {/* Status icon */}
        <div style={{
          width: 72, height: 72, margin: '0 auto 24px', borderRadius: '50%',
          background: isErr ? 'rgba(255,77,77,0.1)' : isOk ? 'rgba(0,230,118,0.1)' : 'rgba(0,240,255,0.08)',
          border: `2px solid ${isErr ? RED : isOk ? GREEN : CYAN}`,
          display: 'grid', placeItems: 'center',
          boxShadow: `0 0 24px ${isErr ? 'rgba(255,77,77,0.2)' : isOk ? 'rgba(0,230,118,0.2)' : 'rgba(0,240,255,0.15)'}`,
        }}>
          {isPending && <span style={{ width: 28, height: 28, border: `3px solid rgba(0,240,255,0.2)`, borderTopColor: CYAN, borderRadius: '50%', display: 'block', animation: 'spin 0.9s linear infinite' }} />}
          {isOk && <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
          {isErr && <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
        </div>

        {/* Heading */}
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff' }}>
          {isPending && 'Verifying Payment…'}
          {isOk && (alreadyCredited ? 'Already Credited' : 'Payment Confirmed!')}
          {isErr && 'Verification Failed'}
        </h1>

        <p style={{ margin: '0 0 24px', color: MUTED, fontSize: 14, lineHeight: 1.6 }}>
          {isPending && 'Checking with Paystack — this takes just a moment.'}
          {isOk && (alreadyCredited ? 'This transaction was already applied to your wallet.' : 'Your ChargeLink wallet has been topped up successfully.')}
          {isErr && errorDetails}
        </p>

        {/* Receipt card — only on success */}
        {isOk && (
          <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: 16, padding: '18px 20px', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' }}>Amount Credited</span>
              <strong style={{ fontSize: 22, color: creditedAmount !== null ? GREEN : '#fff' }}>
                {creditedAmount !== null ? `+ GH₵ ${creditedAmount.toFixed(2)}` : '—'}
              </strong>
            </div>
            {newBalance !== null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                <span style={{ fontSize: 11, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' }}>New Wallet Balance</span>
                <strong style={{ fontSize: 16, color: CYAN }}>GH₵ {newBalance.toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        {isOk && (
          <p style={{ margin: '0 0 20px', fontSize: 12, color: MUTED }}>Redirecting you back to the app…</p>
        )}

        <button
          id="paystack-callback-return-btn"
          onClick={() => window.location.replace('/')}
          style={{
            width: '100%', padding: '14px 20px',
            background: isErr ? 'rgba(255,77,77,0.15)' : isOk ? CYAN : 'rgba(0,240,255,0.12)',
            color: isErr ? RED : isOk ? '#10141a' : CYAN,
            border: `1px solid ${isErr ? 'rgba(255,77,77,0.3)' : 'rgba(0,240,255,0.3)'}`,
            borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s ease',
            letterSpacing: '0.02em',
          }}
        >
          {isPending ? 'Cancel & Return to App' : isErr ? 'Back to App' : 'Return to Wallet'}
        </button>

        {/* CHARGELINK badge */}
        <p style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, textTransform: 'uppercase' }}>ChargeLink GH · Secured by Paystack</p>
      </section>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      `}</style>
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
