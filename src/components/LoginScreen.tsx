import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Lock,
  Building2,
  Check,
  User,
} from 'lucide-react';
import { XChargeLogo } from './XChargeLogo';

interface LoginScreenProps {
  onSendCode: (phoneNumber: string, accountType: 'personal' | 'fleet', devCode?: string, gatewayNotice?: string) => void;
  onNavigateToSignUp: () => void;
  onGuestExplore: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSendCode,
  onNavigateToSignUp,
  onGuestExplore,
}) => {
  const [accountType, setAccountType] = useState<'personal' | 'fleet'>('personal');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatGhanaPhone = (input: string) => {
    // Standardize to international format +233
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('2330') && digits.length === 13) return `+233${digits.slice(4)}`;
    if (digits.startsWith('233')) return `+${digits}`;
    if (digits.startsWith('0')) return `+233${digits.slice(1)}`;
    return digits ? `+233${digits}` : '';
  };

  const handleSendCode = async (phoneToUse?: string) => {
    const raw = phoneToUse || phoneNumber;
    if (!raw.trim()) {
      setErrorMessage('Please enter your Ghana mobile phone number');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const fullPhone = formatGhanaPhone(raw);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });

      const data = await res.json().catch(() => ({}));
      setIsLoading(false);
      const gatewayNotice = !data.success ? (data.error || 'SMS Gateway Notice') : undefined;
      onSendCode(fullPhone, accountType, undefined, gatewayNotice);
    } catch {
      setIsLoading(false);
      onSendCode(fullPhone, accountType, undefined);
    }
  };

  const handleFillDemoDriver = () => {
    const demoPhone = '0248901204';
    setPhoneNumber(demoPhone);
    setAccountType('personal');
    onSendCode('+233248901204', 'personal', '123456');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0a0e14] text-slate-100 overflow-y-auto no-scrollbar select-none">
      <div className="w-full max-w-sm space-y-5 py-6 sm:my-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-2.5 rounded-2xl bg-[#10141a] border border-white/10 shadow-xl mb-1">
            <XChargeLogo size="md" variant="full" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00e699]/10 border border-[#00e699]/30 text-[10px] font-mono font-bold text-[#00e699]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e699] animate-pulse" />
            <span>CHARGELINK GH · KUMASI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Driver Authentication
          </h1>
          <p className="text-xs text-[#94a3b8] max-w-xs">
            Enter your mobile number to receive a secure one-time verification code.
          </p>
        </div>

        {/* Account Switcher Pills */}
        <div className="bg-[#10141a] border border-white/[0.08] p-1 rounded-2xl flex items-center shadow-inner">
          <button
            type="button"
            onClick={() => setAccountType('personal')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              accountType === 'personal'
                ? 'bg-[#181c24] text-white shadow-sm border border-white/10'
                : 'text-[#64748b] hover:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>Personal Driver</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('fleet')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              accountType === 'fleet'
                ? 'bg-[#181c24] text-[#4ade80] shadow-sm border border-[#22c55e]/30'
                : 'text-[#64748b] hover:text-slate-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>Fleet Account</span>
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Phone Input Card */}
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-lg">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            Mobile Number
          </label>

          <div className="flex items-center gap-2 bg-[#181c24] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#22c55e] transition-all">
            {/* Ghana Flag Indicator */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 shrink-0">
              <span className="text-base leading-none">🇬🇭</span>
              <span className="text-xs font-mono font-bold text-slate-300">+233</span>
            </div>

            <input
              type="tel"
              placeholder="024 890 1204"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendCode();
              }}
              className="flex-1 bg-transparent border-none text-sm text-white font-mono placeholder-[#64748b] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#64748b] font-mono">
            <span>Supports MTN, Telecel, AT</span>
            <span className="flex items-center gap-1 text-[#00e699]">
              <ShieldCheck className="w-3 h-3 text-[#00e699]" />
              Encrypted
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => handleSendCode()}
          disabled={isLoading}
          className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-[#2d7a3e] via-[#22c55e] to-[#2d7a3e] hover:brightness-110 text-white font-extrabold text-xs tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-black/40 cursor-pointer"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span>SEND VERIFICATION CODE</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>

        {/* Quick Demo Pilot Profile */}
        <button
          type="button"
          onClick={handleFillDemoDriver}
          className="w-full py-2.5 px-3 rounded-xl bg-[#181c24] hover:bg-[#20252e] border border-white/10 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-all group cursor-pointer active:scale-[0.99]"
        >
          <User className="w-3.5 h-3.5 text-[#4ade80] group-hover:scale-110 transition-transform" />
          <span>Quick Demo Login (Kofi Mensah · BYD Atto 3)</span>
        </button>

        {/* Secondary Navigation Options */}
        <div className="pt-1 flex flex-col items-center gap-3 text-xs">
          <p className="text-[#94a3b8]">
            New to ChargeLink GH?{' '}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="text-[#4ade80] font-bold hover:underline"
            >
              Register Vehicle & Driver
            </button>
          </p>

          <button
            type="button"
            onClick={onGuestExplore}
            className="text-[11px] font-mono text-[#64748b] hover:text-slate-300 transition-colors"
          >
            Skip & Explore Map as Guest →
          </button>
        </div>
      </div>
    </div>
  );
};
