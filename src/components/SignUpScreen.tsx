import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Car,
  User,
  Mail,
  Zap,
  Check
} from 'lucide-react';
import { XChargeLogo } from './XChargeLogo';
import { MtnMomoLogo, TelecelLogo, MastercardLogo } from './PaymentLogos';

interface SignUpScreenProps {
  onContinue: (formData: {
    phoneNumber: string;
    fullName: string;
    email: string;
    selectedEv: string;
    selectedGateway: string;
    devCode?: string;
  }) => void;
  onBackToLogin: () => void;
}

const EV_MODELS = [
  { id: 'tesla', name: 'Tesla Model 3 / Y', spec: 'CCS2 / NACS 250kW' },
  { id: 'byd', name: 'BYD Atto 3 EV', spec: 'GB/T & CCS2 150kW' },
  { id: 'hyundai', name: 'Hyundai Ioniq 5', spec: '800V Ultra-DC 350kW' },
  { id: 'volvo', name: 'Volvo FH Electric', spec: 'Heavy Haul 350kW' },
];

const PAYMENT_GATEWAYS = [
  { id: 'momo', name: 'MTN Mobile Money', logo: MtnMomoLogo, sub: '*170# Direct Escrow' },
  { id: 'telecel', name: 'Telecel Cash', logo: TelecelLogo, sub: '*110# Zero Surge Fee' },
  { id: 'card', name: 'Mastercard Debit', logo: MastercardLogo, sub: '3D Secure Global' },
];

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onContinue,
  onBackToLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedEv, setSelectedEv] = useState('byd');
  const [selectedGateway, setSelectedGateway] = useState('momo');
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatGhanaPhone = (input: string) => {
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('233')) return `+${digits}`;
    if (digits.startsWith('0')) return `+233${digits.slice(1)}`;
    return digits ? `+233${digits}` : '';
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your Ghana mobile phone number');
      return;
    }
    if (!agreed) {
      setErrorMessage('Please accept the XCharge Terms of Service');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const fullPhone = formatGhanaPhone(phoneNumber);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });

      const data = await res.json().catch(() => ({}));
      setIsLoading(false);

      onContinue({
        phoneNumber: fullPhone,
        fullName: fullName.trim(),
        email: email.trim(),
        selectedEv,
        selectedGateway,
        devCode: data.devCode || '123456',
      });
    } catch {
      setIsLoading(false);
      onContinue({
        phoneNumber: fullPhone,
        fullName: fullName.trim(),
        email: email.trim(),
        selectedEv,
        selectedGateway,
        devCode: '123456',
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0a0e14] text-slate-100 overflow-y-auto no-scrollbar select-none">
      <div className="w-full max-w-md space-y-4 my-auto">
        {/* Top Bar with Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>

          <span className="px-2.5 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[10px] font-mono font-bold text-[#00f0ff]">
            REGISTRATION
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Register EV & Driver Profile
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Setup your Ghana fast-charging credentials and link your vehicle telemetry.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Step 1: Personal Credentials */}
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-lg">
          <span className="text-[11px] font-bold text-[#00f0ff] uppercase tracking-wider block font-mono">
            1. Driver Information
          </span>

          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] text-[#94a3b8] uppercase font-bold block mb-1">
                Full Name
              </label>
              <div className="flex items-center gap-2 bg-[#181c24] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#00f0ff]/60">
                <User className="w-3.5 h-3.5 text-[#64748b]" />
                <input
                  type="text"
                  placeholder="e.g. Kwesi Mensah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs text-white placeholder-[#64748b] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#94a3b8] uppercase font-bold block mb-1">
                Ghana Phone Number
              </label>
              <div className="flex items-center gap-2 bg-[#181c24] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#00f0ff]/60">
                <span className="text-xs font-mono font-bold text-slate-300">🇬🇭 +233</span>
                <input
                  type="tel"
                  placeholder="024 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs text-white font-mono placeholder-[#64748b] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#94a3b8] uppercase font-bold block mb-1">
                Email Address (Optional)
              </label>
              <div className="flex items-center gap-2 bg-[#181c24] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#00f0ff]/60">
                <Mail className="w-3.5 h-3.5 text-[#64748b]" />
                <input
                  type="email"
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs text-white placeholder-[#64748b] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Electric Vehicle Selection */}
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-lg">
          <span className="text-[11px] font-bold text-[#00f0ff] uppercase tracking-wider block font-mono">
            2. Select Active Electric Vehicle
          </span>

          <div className="grid grid-cols-2 gap-2">
            {EV_MODELS.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedEv(ev.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedEv === ev.id
                    ? 'bg-[#181c24] border-[#00f0ff] glow-cyan-sm'
                    : 'bg-[#141820] border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Car className={`w-3.5 h-3.5 ${selectedEv === ev.id ? 'text-[#00f0ff]' : 'text-slate-400'}`} />
                  {selectedEv === ev.id && (
                    <Check className="w-3.5 h-3.5 text-[#00f0ff] stroke-[3]" />
                  )}
                </div>
                <div className="text-xs font-bold text-white mt-1.5 truncate">{ev.name}</div>
                <div className="text-[10px] text-[#94a3b8] font-mono">{ev.spec}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Payment Gateway */}
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-lg">
          <span className="text-[11px] font-bold text-[#00f0ff] uppercase tracking-wider block font-mono">
            3. Primary Payment Gateway
          </span>

          <div className="space-y-2">
            {PAYMENT_GATEWAYS.map((gw) => {
              const Logo = gw.logo;
              const isSelected = selectedGateway === gw.id;
              return (
                <button
                  key={gw.id}
                  type="button"
                  onClick={() => setSelectedGateway(gw.id)}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[#181c24] border-[#00f0ff] shadow-sm'
                      : 'bg-[#141820] border-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Logo size="icon" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-white font-mono">{gw.name}</div>
                      <div className="text-[10px] text-[#94a3b8] font-mono">{gw.sub}</div>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'bg-[#00f0ff] border-[#00f0ff]' : 'border-white/20'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Terms Agreement Checkbox */}
        <label className="flex items-start gap-2 text-xs text-[#94a3b8] cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 rounded accent-[#00f0ff]"
          />
          <span>
            I agree to the XCharge Terms of Service and authorize instant MoMo pre-authorization for public charging sessions.
          </span>
        </label>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full min-h-[48px] rounded-2xl bg-[#00f0ff] hover:bg-[#33f3ff] text-[#0a0e14] font-extrabold text-xs tracking-wider transition-all glow-cyan-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 shadow-lg"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4 fill-black" />
              <span>CREATE PROFILE & SEND OTP</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
