import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle2, ArrowRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Purge any legacy 24-hour dismissal lockout so users never lose the prompt
    try {
      localStorage.removeItem('chargelink_pwa_dismissed');
    } catch {}

    // 2. Check if already running in standalone PWA mode (added to home screen)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) return;

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    // 4. Always present the installation banner on browser open after a brief 1.2s delay
    const initialTimer = setTimeout(() => {
      setShowBanner(true);
    }, 1200);

    // 5. Capture Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    // 6. Custom event to trigger install UI from any button/menu
    const handleOpenRequest = () => {
      if (isIosDevice) {
        setShowIosGuide(true);
      } else if (deferredPrompt) {
        handleInstallClick();
      } else {
        setShowIosGuide(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('chargelink-open-pwa-install', handleOpenRequest);

    // App installed handler
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowIosGuide(false);
      setDeferredPrompt(null);
      console.log('[ChargeLink PWA] Successfully installed on device!');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('chargelink-open-pwa-install', handleOpenRequest);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for browsers without beforeinstallprompt (Safari, Firefox, etc.)
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss only for the current moment, but gentle reminder re-arms after 90 seconds if still browsing
    setTimeout(() => {
      if (!isStandalone && !isInstalled) {
        setShowBanner(true);
      }
    }, 90000);
  };

  if (isStandalone || isInstalled) {
    return null;
  }

  return (
    <>
      {/* 1. Bottom Floating Installation Banner */}
      {showBanner && !showIosGuide && (
        <div className="fixed bottom-20 sm:bottom-6 inset-x-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#111a13]/95 backdrop-blur-xl border border-[#2d7a3e]/40 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center gap-3 relative ring-1 ring-[#2d7a3e]/20">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-xl bg-[#111a13] border border-[#2d7a3e]/30 p-1 shrink-0 flex items-center justify-center shadow-inner overflow-hidden">
              <img src="/chargelink-logo.jpeg" alt="ChargeLink GH" className="w-full h-full object-contain rounded-lg" />
            </div>

            {/* Information */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-wide">
                  {isIos ? 'Install ChargeLink GH on iPhone' : 'Install ChargeLink GH'}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#2d7a3e]/20 text-[#5c9e3a] text-[9px] font-mono font-bold uppercase">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                {isIos ? 'Tap Share → Add to Home Screen' : 'Add to home screen for 1-tap instant charging'}
              </p>
            </div>

            {/* Install CTA */}
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-[#2d7a3e] hover:bg-[#5c9e3a] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-black/40 transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install</span>
            </button>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close for now"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Compact Floating Pill (Shown if user mistakenly dismissed the banner so they never have to search for it) */}
      {!showBanner && !showIosGuide && (
        <button
          onClick={() => {
            if (isIos) {
              setShowIosGuide(true);
            } else if (deferredPrompt) {
              handleInstallClick();
            } else {
              setShowIosGuide(true);
            }
          }}
          className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 px-3.5 py-2 rounded-full bg-[#111a13]/95 backdrop-blur-xl border border-[#2d7a3e]/50 text-white shadow-xl flex items-center gap-2 text-xs font-bold hover:bg-[#192418] hover:border-[#5c9e3a] active:scale-95 transition-all cursor-pointer group"
          title="Install ChargeLink GH on your device"
        >
          <div className="w-2 h-2 rounded-full bg-[#5c9e3a] animate-ping" />
          <Download className="w-3.5 h-3.5 text-[#5c9e3a] group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-mono font-bold text-white">
            {isIos ? 'Install on iPhone' : 'Install App'}
          </span>
        </button>
      )}

      {/* 2. iOS Safari Installation Modal Guide */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-[#141922] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#111a13] border border-[#2d7a3e]/40 p-1.5 shrink-0 overflow-hidden">
                <img src="/chargelink-logo.jpeg" alt="ChargeLink GH" className="w-full h-full object-contain rounded-md" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install ChargeLink GH on iPhone</h3>
                <p className="text-xs text-slate-400">Add to Home Screen in 2 quick steps</p>
              </div>
            </div>

            <div className="space-y-3.5 py-2">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-[#2d7a3e]/10 text-[#5c9e3a] flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">1. Tap the Share button</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tap the Safari share icon <Share className="w-3 h-3 inline text-[#5c9e3a] mx-0.5" /> at the bottom or top of your screen.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-[#00e699]/10 text-[#00e699] flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">2. Select "Add to Home Screen"</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scroll down and tap <span className="text-white font-medium">Add to Home Screen</span>, then tap <span className="text-[#22c55e] font-bold">Add</span> in the top-right corner.
                  </p>
                </div>
              </div>

              {/* Result */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 text-[11px] text-[#22c55e]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Runs as a standalone full-screen app with 1-tap instant launch.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-4 py-3 rounded-xl bg-[#22c55e] text-[#0a0e14] font-bold text-sm hover:bg-[#16a34a] transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
