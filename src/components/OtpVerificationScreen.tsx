import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  KeyRound,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import { XChargeLogo } from './XChargeLogo';

interface OtpVerificationScreenProps {
  phoneNumber: string;
  devCode?: string;
  registrationMetadata?: {
    fullName?: string;
    email?: string;
    selectedEv?: string;
    selectedGateway?: string;
  };
  onVerified: (user: any) => void;
  onBackToLogin: () => void;
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  phoneNumber,
  devCode,
  registrationMetadata,
  onVerified,
  onBackToLogin,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Autofocus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste of multiple digits
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const next = [...digits];
        for (let i = 0; i < 6; i++) {
          next[i] = pasted[i] || '';
        }
        setDigits(next);
        const nextFocus = Math.min(pasted.length, 5);
        inputRefs.current[nextFocus]?.focus();
        if (pasted.length === 6) {
          submitCode(pasted);
        }
      }
      return;
    }

    const next = [...digits];
    next[index] = val;
    setDigits(next);
    setErrorMessage(null);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = next.join('');
    if (fullCode.length === 6 && !next.includes('')) {
      submitCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (codeToSubmit?: string) => {
    const code = codeToSubmit || digits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          code,
          metadata: registrationMetadata ? {
            displayName: registrationMetadata.fullName,
            email: registrationMetadata.email,
            selectedEv: registrationMetadata.selectedEv,
            selectedGateway: registrationMetadata.selectedGateway,
          } : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      setIsVerifying(false);

      if (res.ok && data.success && data.user) {
        onVerified(data.user);
      } else {
        // If code matches devCode or 123456 bypass
        if ((devCode && code === devCode) || code === '123456') {
          const fallbackUser = {
            id: 'usr-sim-' + Date.now().toString(36),
            phoneNumber,
            displayName: registrationMetadata?.fullName || 'EV Driver',
            email: registrationMetadata?.email || 'driver@xcharge.africa',
            walletBalance: 250.00,
            defaultPaymentMethod: 'MTN_MOMO',
            registeredVehicles: [
              {
                id: 'veh-01',
                make: registrationMetadata?.selectedEv === 'tesla' ? 'Tesla' : 'BYD',
                model: registrationMetadata?.selectedEv === 'tesla' ? 'Model Y' : 'Atto 3',
                batteryCapacityKwh: 75.0,
                connectorType: 'CCS2',
                isDefault: true,
              }
            ],
          };
          onVerified(fallbackUser);
        } else {
          setErrorMessage(data.error || 'Invalid verification code. Please check and retry.');
          setDigits(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    } catch {
      setIsVerifying(false);
      // Offline fallback
      const fallbackUser = {
        id: 'usr-sim-01',
        phoneNumber,
        displayName: registrationMetadata?.fullName || 'EV Driver',
        walletBalance: 250.00,
        defaultPaymentMethod: 'MTN_MOMO',
      };
      onVerified(fallbackUser);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(60);
    setResendNotice('New verification code dispatched via SMS.');
    setTimeout(() => setResendNotice(null), 4000);

    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
    } catch {
      // offline
    }
  };

  const handleAutoFillDevCode = () => {
    const code = devCode || '123456';
    const split = code.split('').slice(0, 6);
    setDigits(split);
    submitCode(code);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0a0e14] text-slate-100 overflow-y-auto no-scrollbar select-none">
      <div className="w-full max-w-sm space-y-5 py-6 sm:my-auto">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Number</span>
          </button>

          <span className="px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[10px] font-mono font-bold text-[#00f0ff]">
            STEP 2 OF 2
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 mx-auto flex items-center justify-center text-[#00f0ff] shadow-md shadow-black/40">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Verify Phone Number
          </h1>
          <p className="text-xs text-[#94a3b8]">
            Enter the 6-digit passcode sent via SMS to:
          </p>
          <div className="inline-block px-3 py-1 rounded-full bg-[#181c24] border border-white/10 text-xs font-mono font-bold text-[#00f0ff]">
            {phoneNumber}
          </div>
        </div>

        {/* Notices */}
        {resendNotice && (
          <div className="p-2.5 rounded-xl bg-[#00e699]/10 border border-[#00e699]/30 text-[#00e699] text-xs font-medium text-center animate-in fade-in">
            {resendNotice}
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* 6 Digit Input Cells */}
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            {digits.map((d, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 rounded-xl text-center font-mono text-xl font-bold transition-all border ${
                  d
                    ? 'bg-[#181c24] border-[#00f0ff] text-white shadow-sm'
                    : 'bg-[#141820] border-white/10 text-slate-400 focus:border-[#00f0ff]/60 focus:bg-[#181c24]'
                } focus:outline-none`}
              />
            ))}
          </div>

          {/* Quick Auto-Fill Hint */}
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/5 border border-[#00f0ff]/20 flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#94a3b8]">
              {devCode ? 'Passcode: ' : 'Demo Bypass: '}
              <span className="text-[#00f0ff] font-bold">{devCode || '123456'}</span>
            </span>
            <button
              type="button"
              onClick={handleAutoFillDevCode}
              className="text-[10px] font-mono font-bold text-[#00f0ff] hover:underline"
            >
              Auto-fill
            </button>
          </div>

          {/* Verify CTA */}
          <button
            type="button"
            onClick={() => submitCode()}
            disabled={isVerifying || digits.includes('')}
            className="w-full min-h-[48px] rounded-2xl bg-[#00f0ff] hover:bg-[#33f3ff] text-[#0a0e14] font-extrabold text-xs tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-black/40"
          >
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 fill-black" />
                <span>VERIFY & LAUNCH CONSOLE</span>
              </>
            )}
          </button>
        </div>

        {/* Resend Action */}
        <div className="flex items-center justify-center text-xs text-[#94a3b8]">
          {timer > 0 ? (
            <span className="font-mono">
              Resend code in <span className="text-white font-bold">{timer}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-[#00f0ff] font-bold hover:underline flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Resend SMS Code</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
