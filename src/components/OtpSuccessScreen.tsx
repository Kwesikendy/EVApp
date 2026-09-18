import React from 'react';
import { Check, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { XChargeLogo } from './XChargeLogo';

interface OtpSuccessScreenProps {
  user?: any;
  onEnterDashboard: () => void;
}

export const OtpSuccessScreen: React.FC<OtpSuccessScreenProps> = ({
  user,
  onEnterDashboard,
}) => {
  const driverName = user?.displayName || 'EV Driver';
  const balanceStr = user?.walletBalance !== undefined
    ? `GH₵ ${Number(user.walletBalance).toFixed(2)} Active`
    : 'GH₵ 245.50 Active';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0a0e14] text-slate-100 overflow-y-auto no-scrollbar select-none">
      <div className="w-full max-w-sm space-y-6 my-auto text-center">
        {/* Top Protocol Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00e699]/10 border border-[#00e699]/30 text-[10px] font-mono font-bold text-[#00e699]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-BIT TELEMETRY AUTHENTICATED</span>
        </div>

        {/* Animated Success Emblem */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#00f0ff]/15 animate-ping" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#10141a] to-[#181c24] border-2 border-[#00f0ff] flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.4)]">
            <Check className="w-12 h-12 text-[#00f0ff] stroke-[3]" />
          </div>
        </div>

        {/* Brand and Welcome Header */}
        <div className="space-y-2">
          <div className="flex justify-center mb-1">
            <XChargeLogo size="md" variant="full" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Identity Verified
          </h1>
          <p className="text-xs text-[#94a3b8] max-w-xs mx-auto">
            Welcome back, <span className="text-[#00f0ff] font-semibold">{driverName}</span>. Real-time telemetry link established to the Accra Ultra-Fast Grid.
          </p>
        </div>

        {/* Sync Checklist Card */}
        <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-2.5 text-left shadow-xl">
          <div className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00e699] stroke-[3]" />
              <span className="text-slate-300">OCPP 2.0.1 Protocol</span>
            </div>
            <span className="text-[10px] font-mono text-[#00e699] font-bold">CONNECTED</span>
          </div>

          <div className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00e699] stroke-[3]" />
              <span className="text-slate-300">MoMo Escrow Wallet</span>
            </div>
            <span className="text-[10px] font-mono text-[#00f0ff] font-bold">{balanceStr}</span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00e699] stroke-[3]" />
              <span className="text-slate-300">Accra Superhubs (5)</span>
            </div>
            <span className="text-[10px] font-mono text-[#00e699] font-bold">SYNCED</span>
          </div>
        </div>

        {/* Enter Dashboard CTA */}
        <button
          type="button"
          onClick={onEnterDashboard}
          className="w-full min-h-[48px] rounded-2xl bg-[#00f0ff] hover:bg-[#33f3ff] text-[#0a0e14] font-extrabold text-xs tracking-wider transition-all glow-cyan-sm flex items-center justify-center gap-2 active:scale-[0.99] shadow-xl"
        >
          <span>ENTER HYPERCHARGE OS</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
