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
  if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) {
    return <WilpowerAdmin />;
  }
  return <DriverApp />;
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
        } catch {}
      }}
    />
  );
}
