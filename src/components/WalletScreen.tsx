import React, { useState } from 'react';
import {
  Wallet,
  Lock,
  Plus,
  Check,
  CreditCard,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Building2,
  ShieldCheck
} from 'lucide-react';

interface WalletScreenProps {
  onTopUpSuccess?: (amount: number) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ onTopUpSuccess }) => {
  const [accountType, setAccountType] = useState<'personal' | 'fleet'>('personal');
  const [selectedPreset, setSelectedPreset] = useState<number>(100);
  const [selectedMethod, setSelectedMethod] = useState<string>('mtn');
  const [balance, setBalance] = useState<number>(248.50);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [topUpNotice, setTopUpNotice] = useState<string | null>(null);

  const handleTopUp = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setBalance(prev => prev + selectedPreset);
      setIsProcessing(false);
      setTopUpNotice(`GH₵ ${selectedPreset.toFixed(2)} credited via MTN Mobile Money`);
      if (onTopUpSuccess) onTopUpSuccess(selectedPreset);
      setTimeout(() => setTopUpNotice(null), 4000);
    }, 900);
  };

  return (
    <div id="screen-wallet" className="flex-1 flex flex-col bg-[#0a0e14] overflow-y-auto no-scrollbar p-3.5 sm:p-4 space-y-4 select-none pb-8">
      {/* 1. Account Switcher: Segmented Toggle Pills */}
      <div className="bg-[#10141a] border border-white/[0.08] p-1 rounded-2xl flex items-center">
        <button
          id="btn-wallet-personal"
          onClick={() => setAccountType('personal')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            accountType === 'personal'
              ? 'bg-[#181c24] text-white shadow-sm border border-white/10'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          Personal
        </button>

        <button
          id="btn-wallet-fleet"
          onClick={() => setAccountType('fleet')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            accountType === 'fleet'
              ? 'bg-[#181c24] text-[#00f0ff] shadow-sm border border-[#00f0ff]/30'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          Fleet Account
        </button>
      </div>

      {/* Floating topup toast */}
      {topUpNotice && (
        <div className="bg-[#10141a] border border-[#00e699]/40 text-[#00e699] px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{topUpNotice}</span>
        </div>
      )}

      {/* 2. Hero Balance Card */}
      <div className="bg-gradient-to-br from-[#10141a] to-[#141820] border border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider text-[#94a3b8] uppercase">
            AVAILABLE BALANCE
          </span>

          <span className="px-2.5 py-0.5 rounded-full bg-[#00e699]/10 border border-[#00e699]/30 text-[10px] font-mono font-bold text-[#00e699] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e699] animate-pulse" />
            <span>Active Account</span>
          </span>
        </div>

        <div>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
            GH₵ {balance.toFixed(2)}{' '}
            <span className="text-lg font-normal text-[#94a3b8]">GHS</span>
          </div>
          <p className="text-[11px] text-[#64748b] font-mono mt-1">
            Instant split-billing enabled for Ghana Mobile Money networks
          </p>
        </div>

        {/* Temporary Hold Notice Banner */}
        <div className="bg-[#181c24] border border-white/[0.08] rounded-2xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Lock className="w-3.5 h-3.5 text-[#ffb020] shrink-0" />
            <span className="text-[11px] leading-tight font-mono">
              GH₵ 50.00 temporary hold during active charge
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-lg bg-[#ffb020]/15 border border-[#ffb020]/40 text-[10px] font-mono font-bold text-[#ffb020] shrink-0">
            RESERVED
          </span>
        </div>
      </div>

      {/* 3. Quick Top-Up Section */}
      <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Quick Top-Up Amount</span>
          <span className="text-[11px] text-[#94a3b8] font-mono">No network fee</span>
        </div>

        {/* Preset Chips */}
        <div className="grid grid-cols-4 gap-2">
          {[50, 100, 200].map(amt => (
            <button
              key={amt}
              id={`preset-amt-${amt}`}
              onClick={() => setSelectedPreset(amt)}
              className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                selectedPreset === amt
                  ? 'bg-[#00f0ff] border-[#00f0ff] text-[#0a0e14] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'bg-[#181c24] border-white/[0.08] text-slate-300 hover:border-white/20'
              }`}
            >
              GH₵ {amt}
            </button>
          ))}

          <button
            id="preset-amt-custom"
            onClick={() => {
              const val = prompt('Enter custom GHS top-up amount:');
              if (val && !isNaN(Number(val))) setSelectedPreset(Number(val));
            }}
            className="py-2 rounded-xl text-xs font-mono font-semibold bg-[#181c24] border border-white/[0.08] text-slate-300 hover:border-white/20"
          >
            Custom
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          id="btn-wallet-topup"
          onClick={handleTopUp}
          disabled={isProcessing}
          className="w-full min-h-[46px] rounded-2xl bg-[#00f0ff] hover:bg-[#33f3ff] text-[#0a0e14] font-bold text-xs tracking-wider transition-all glow-cyan-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
        >
          <Wallet className="w-4 h-4 fill-current" />
          <span>{isProcessing ? 'CONFIRMING MOMO STK PUSH...' : `TOP UP WITH MOMO (GH₵ ${selectedPreset})`}</span>
        </button>
      </div>

      {/* 4. Payment Methods */}
      <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Payment Methods</span>
          <button
            id="btn-add-payment-method"
            className="text-[11px] font-mono text-[#00f0ff] hover:underline flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>Add Method</span>
          </button>
        </div>

        <div className="space-y-2">
          {/* Row 1: MTN Mobile Money (Default) */}
          <div
            onClick={() => setSelectedMethod('mtn')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedMethod === 'mtn'
                ? 'bg-[#181c24] border-[#00f0ff]/50'
                : 'bg-[#141820] border-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#ffb020]/15 border border-[#ffb020]/30 flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#ffb020]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">MTN Mobile Money</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[9px] font-mono font-bold text-[#00f0ff]">
                    DEFAULT
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8] font-mono">+233 (024) 890 1204</p>
              </div>
            </div>

            <div className="w-4 h-4 rounded-full bg-[#00f0ff] flex items-center justify-center">
              <Check className="w-3 h-3 text-[#0a0e14] stroke-[3]" />
            </div>
          </div>

          {/* Row 2: Vodafone Cash / Telecel */}
          <div
            onClick={() => setSelectedMethod('vodafone')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedMethod === 'vodafone'
                ? 'bg-[#181c24] border-[#00f0ff]/50'
                : 'bg-[#141820] border-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#ff4d4d]/15 border border-[#ff4d4d]/30 flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#ff4d4d]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-mono block">Vodafone Cash / Telecel</span>
                <p className="text-[11px] text-[#94a3b8] font-mono">+233 (020) 412 8890</p>
              </div>
            </div>

            <div className={`w-4 h-4 rounded-full border ${selectedMethod === 'vodafone' ? 'border-[#00f0ff] bg-[#00f0ff]' : 'border-white/20'}`} />
          </div>

          {/* Row 3: Mastercard Debit */}
          <div
            onClick={() => setSelectedMethod('card')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedMethod === 'card'
                ? 'bg-[#181c24] border-[#00f0ff]/50'
                : 'bg-[#141820] border-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <span className="text-xs font-bold text-white font-mono block">Mastercard Debit</span>
                <p className="text-[11px] text-[#94a3b8] font-mono">Ending in 4091</p>
              </div>
            </div>

            <div className={`w-4 h-4 rounded-full border ${selectedMethod === 'card' ? 'border-[#00f0ff] bg-[#00f0ff]' : 'border-white/20'}`} />
          </div>
        </div>
      </div>

      {/* 5. Recent Activity Feed */}
      <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Recent Activity</span>
          <span className="text-[10px] text-[#64748b] font-mono">Real-time Ledger</span>
        </div>

        <div className="space-y-2.5">
          {/* Item 1 */}
          <div className="p-3 bg-[#141820] border border-white/[0.04] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#00f0ff]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Apex Hub Charging</span>
                <span className="text-[10px] text-[#94a3b8] font-mono">Today, 14:22 · 42.8 kWh</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-white font-mono block">-GH₵ 14.28</span>
              <span className="text-[9px] text-[#00e699] font-mono">Completed</span>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-3 bg-[#141820] border border-white/[0.04] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#00e699]/10 border border-[#00e699]/30 flex items-center justify-center">
                <ArrowDownLeft className="w-3.5 h-3.5 text-[#00e699]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">MoMo Top-Up</span>
                <span className="text-[10px] text-[#94a3b8] font-mono">Yesterday, 18:05</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-[#00e699] font-mono block">+GH₵ 50.00</span>
              <span className="text-[9px] text-[#00e699] font-mono">Completed</span>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-3 bg-[#141820] border border-white/[0.04] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#00f0ff]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Metro Depot Charge</span>
                <span className="text-[10px] text-[#94a3b8] font-mono">22 Oct, 09:14 · 64.0 kWh</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-white font-mono block">-GH₵ 22.40</span>
              <span className="text-[9px] text-[#00e699] font-mono">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
