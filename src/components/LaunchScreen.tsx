import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface LaunchScreenProps {
  onComplete: () => void;
  autoDismissMs?: number; // Optional auto-dismiss duration (e.g. 1500ms)
}

export const LaunchScreen: React.FC<LaunchScreenProps> = ({
  onComplete,
  autoDismissMs = 1800,
}) => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / autoDismissMs) * 100));
      setProgress(pct);
      if (elapsed >= autoDismissMs) {
        clearInterval(interval);
        setTimeout(onComplete, 150);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [autoDismissMs, onComplete]);

  return (
    <motion.div
      id="chargelink-launch-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-[#0a0e14] text-white p-6 sm:p-8 select-none overflow-hidden"
    >
      {/* Background ambient radial gradients */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_40%,rgba(34,197,94,0.18),transparent_65%)]" />
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#1e4d2b]/20 to-transparent pointer-events-none" />

      {/* 1. Top OS Status Pill */}
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111a13] border border-[#22c55e]/30 shadow-lg shadow-black/50"
      >
        <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shadow-[0_0_8px_#22c55e]" />
        <span className="text-[11px] font-mono font-bold tracking-wider text-[#4ade80]">
          CHARGELINK GH OS · V2.4
        </span>
      </motion.div>

      {/* 2. Hero Centerpiece: Official Logo with Breathing Green Halo */}
      <div className="relative flex flex-col items-center text-center space-y-5 my-auto max-w-sm">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Pulsing ambient halo */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#16a34a]/30 via-[#22c55e]/40 to-[#4ade80]/20 blur-xl animate-pulse" />

          {/* Official Client Logo Asset */}
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-2 border-[#4ade80]/30 shadow-2xl shadow-black/80 bg-black flex items-center justify-center">
            <img
              src="/chargelink-logo.jpeg"
              alt="ChargeLink GH"
              className="w-full h-full object-cover object-center"
              draggable={false}
            />
          </div>
        </motion.div>

        {/* Wordmark and Tagline */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-1.5"
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
            Charge<span className="text-[#22c55e]">Link</span> <span className="text-[#4ade80] font-black">GH</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-300">
            Powering a Cleaner Tomorrow
          </p>
        </motion.div>

        {/* Progress Track */}
        <div className="w-48 sm:w-56 space-y-2 pt-2">
          <div className="h-1.5 w-full bg-[#18241b] rounded-full overflow-hidden border border-[#22c55e]/20">
            <motion.div
              className="h-full bg-gradient-to-r from-[#16a34a] via-[#22c55e] to-[#4ade80] rounded-full shadow-[0_0_10px_#22c55e]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#94a3b8]">
            <span className="flex items-center gap-1 text-[#4ade80]">
              <Zap className="w-3 h-3 text-[#22c55e]" />
              Initializing Telemetry
            </span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Station Hardware Footnote */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="w-full max-w-sm flex flex-col items-center gap-1 text-center font-mono text-[10px] text-slate-400 border-t border-white/[0.06] pt-3"
      >
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <span>GREENWOOD EVENT CENTER</span>
          <span>·</span>
          <span className="text-[#4ade80]">KUMASI</span>
        </div>
        <div className="text-[#64748b] text-[9px]">
          OCPP 1.6J · MAXPOWER VCP160 · 160 kW HIGH-SPEED
        </div>
      </motion.div>
    </motion.div>
  );
};
