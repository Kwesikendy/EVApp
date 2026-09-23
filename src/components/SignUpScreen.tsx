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
  onViewLegal?: (tab?: 'terms' | 'privacy') => void;
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
  onViewLegal,
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
    if (digits.startsWith('2330') && digits.length === 13) return `+233${digits.slice(4)}`;
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
      setErrorMessage('Please accept the ChargeLink GH Terms of Service');
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
        devCode: data?.code || data?.otp || '123456',
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
      <div className="w-full max-w-md mx-auto py-6 sm:my-auto px-4 animate-in fade-in duration-300">
        <div className="bg-[#10141a] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToLogin}
              type="button"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
            <span className="text-[10px] font-mono text-[#4ade80] bg-[#22c55e]/15 border border-[#22c55e]/30 px-2 py-0.5 rounded-full font-bold">
              NEW DRIVER NODE
            </span>
          </div>

          {/* Brand & Title */}
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-1">
              <XChargeLogo size="md" variant="mark" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Create Driver Profile</h2>
            <p className="text-xs text-[#94a3b8]">
              Register with your Ghana mobile number for instant MoMo escrow charging
            </p>
          </div>

          {/* Form Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <div className="flex items-center gap-2 bg-[#141820] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#22c55e] transition-all">
                <User className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kofi Mensah"
                  className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Ghana Mobile Phone
              </label>
              <div className="flex items-center gap-2 bg-[#141820] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#22c55e] transition-all">
                <span className="text-sm">🇬🇭</span>
                <span className="text-xs font-mono font-bold text-slate-300">+233</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="24 890 1204"
                  className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Email Address (Invoicing & Receipts)
              </label>
              <div className="flex items-center gap-2 bg-[#141820] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#22c55e] transition-all">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@chargelink.africa"
                  className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* EV Selection Section */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Select Electric Vehicle Model
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EV_MODELS.map((ev) => {
                const isSelected = selectedEv === ev.id;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelectedEv(ev.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#181c24] border-[#22c55e] text-white shadow-md shadow-black/40'
                        : 'bg-[#141820] border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Car className={`w-3.5 h-3.5 ${isSelected ? 'text-[#4ade80]' : 'text-slate-400'}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#4ade80]" />}
                    </div>
                    <span className="text-[11px] font-bold block leading-tight">{ev.name}</span>
                    <span className="text-[9px] text-[#94a3b8] font-mono block mt-0.5">{ev.spec}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Preference */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Default Payment Switch
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_GATEWAYS.map((gw) => {
                const isSelected = selectedGateway === gw.id;
                const LogoComponent = gw.logo;
                return (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setSelectedGateway(gw.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#181c24] border-[#22c55e] text-white'
                        : 'bg-[#141820] border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <LogoComponent size="icon" />
                    <span className="text-[10px] font-bold text-center leading-none">{gw.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terms Agreement Checkbox & Links */}
          <div className="flex items-start gap-2.5 pt-1 text-xs text-[#94a3b8]">
            <input
              id="signup-agree-checkbox"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded accent-[#22c55e] cursor-pointer"
            />
            <label htmlFor="signup-agree-checkbox" className="leading-relaxed select-none">
              I agree to the{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onViewLegal ? onViewLegal('terms') : alert('View Terms of Service');
                }}
                className="text-[#4ade80] hover:text-[#22c55e] font-semibold underline underline-offset-2 cursor-pointer"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onViewLegal ? onViewLegal('privacy') : alert('View Privacy Policy');
                }}
                className="text-[#4ade80] hover:text-[#22c55e] font-semibold underline underline-offset-2 cursor-pointer"
              >
                Privacy Policy
              </button>
              , and authorize automated Ghana MoMo pre-authorization escrow holds for public EV charging sessions.
            </label>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-[#2d7a3e] via-[#22c55e] to-[#2d7a3e] hover:brightness-110 text-white font-extrabold text-xs tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-black/40 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>CREATE PROFILE & SEND OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
