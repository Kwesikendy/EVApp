import React, { useState } from 'react';
import type { UserWallet, WalletTransaction } from '../types';
import { Wallet, Smartphone, CreditCard, ArrowDownLeft, ArrowUpRight, Lock, CheckCircle2, RefreshCw, X } from 'lucide-react';

interface WalletModalProps {
  wallet: UserWallet;
  onTopUp: (amount: number, provider: string, phone: string) => Promise<void>;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ wallet, onTopUp, onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState<'MTN' | 'Vodafone' | 'M-Pesa' | 'AirtelTigo'>('MTN');
  const [phoneNumber, setPhoneNumber] = useState(wallet.phoneNumber || '+233 24 981 4421');
  const [amountInput, setAmountInput] = useState<string>('25');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const presetAmounts = [10, 20, 25, 50, 100];

  const handleExecuteTopUp = async () => {
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;

    setIsSubmitting(true);
    setSuccessNotice(null);

    try {
      await onTopUp(val, selectedProvider, phoneNumber);
      setSuccessNotice(`Successfully credited GH₵ ${val.toFixed(2)} via ${selectedProvider} Mobile Money.`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Top-up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-slate-950">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-[#10141a] via-[#142318] to-[#10141a] border border-[#22c55e]/30 rounded-2xl p-5 shadow-xl relative overflow-hidden mb-4">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet className="w-28 h-28 text-[#4ade80]" />
        </div>

        <div className="flex items-center justify-between text-xs text-[#4ade80] font-semibold mb-1">
          <span>ChargeLink GH Split Driver Wallet</span>
          <span className="bg-[#22c55e]/20 text-[#4ade80] px-2 py-0.5 rounded-full border border-[#22c55e]/30">
            {wallet.momoProvider} Active
          </span>
        </div>

        <div className="mt-2">
          <span className="text-xs text-slate-400 font-medium">Available Spend Balance</span>
          <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
            GH₵ {wallet.availableBalance.toFixed(2)}
            <span className="text-xs font-semibold text-slate-400 font-sans ml-1.5">GHS</span>
          </div>
        </div>

        {/* Locked / Pre-auth hold indicator */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Pre-Auth Locked Balance:</span>
          </div>
          <span className="font-mono font-bold text-amber-400">GH₵ {wallet.heldBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* Top-up Form */}
      <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4 mb-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-[#4ade80]" />
          <span>Mobile Money Instant Top-up</span>
        </h3>

        {/* Providers */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {(['MTN', 'Vodafone', 'M-Pesa', 'AirtelTigo'] as const).map(prov => (
            <button
              key={prov}
              type="button"
              onClick={() => setSelectedProvider(prov)}
              className={`py-2 px-1 rounded-xl text-center border text-[11px] font-semibold transition-all ${
                selectedProvider === prov
                  ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#4ade80] shadow-xs'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {prov}
            </button>
          ))}
        </div>

        {/* Phone input */}
        <div className="mb-3">
          <label className="text-[11px] text-slate-400 block mb-1">Registered MoMo Phone Number</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-sky-500 outline-none"
            placeholder="+233 24 000 0000"
          />
        </div>

        {/* Preset Amounts */}
        <div className="mb-3">
          <label className="text-[11px] text-slate-400 block mb-1">Top-Up Amount (GH₵)</label>
          <div className="flex gap-1.5 mb-2">
            {presetAmounts.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountInput(amt.toString())}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                  amountInput === amt.toString()
                    ? 'bg-[#22c55e]/25 border-[#22c55e] text-[#4ade80]'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                GH₵ {amt}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amountInput}
            onChange={e => setAmountInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#22c55e] outline-none"
            placeholder="Custom amount"
          />
        </div>

        {successNotice && (
          <div className="mb-3 p-2.5 bg-emerald-950/70 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <button
          id="btn-execute-topup"
          disabled={isSubmitting}
          onClick={handleExecuteTopUp}
          className="w-full bg-gradient-to-r from-[#2d7a3e] via-[#22c55e] to-[#2d7a3e] hover:brightness-110 active:scale-[0.99] text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownLeft className="w-4 h-4" />}
          <span>{isSubmitting ? 'Simulating MoMo USSD Prompt...' : `Load GH₵ ${amountInput || 0} via ${selectedProvider}`}</span>
        </button>
      </div>

      {/* Transaction Ledger */}
      <div className="bg-[#10141a] border border-white/[0.08] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
          Wallet Ledger & Pre-Auth Records
        </h3>
        <div className="space-y-2">
          {wallet.transactions.map(tx => {
            const isCredit = tx.type === 'TOPUP' || tx.type === 'PREAUTH_RELEASE';
            return (
              <div
                key={tx.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      tx.type === 'PREAUTH_HOLD'
                        ? 'bg-amber-500/20 text-amber-400'
                        : isCredit
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-[#22c55e]/20 text-[#4ade80]'
                    }`}
                  >
                    {tx.type === 'PREAUTH_HOLD' ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : isCredit ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{tx.type.replace('_', ' ')}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[190px]">{tx.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-mono font-bold ${
                      tx.type === 'PREAUTH_HOLD'
                        ? 'text-amber-400'
                        : isCredit
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {tx.type === 'PREAUTH_HOLD' ? 'HOLD ' : isCredit ? '+' : '-'}GH₵ {tx.amount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{tx.reference.substring(0, 14)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
