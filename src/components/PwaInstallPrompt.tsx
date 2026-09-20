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
    // 1. Check if already running in standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) return;

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    // 3. Check dismissed cache (wait 24 hours if dismissed)
    const dismissedUntil = localStorage.getItem('xcharge_pwa_dismissed');
    const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();

    // 4. Capture Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    // 5. Custom event to trigger install UI from any button/menu
    const handleOpenRequest = () => {
      if (isIosDevice) {
        setShowIosGuide(true);
      } else {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('xcharge-open-pwa-install', handleOpenRequest);

    // If iOS and not dismissed, show banner after a short delay
    if (isIosDevice && !isDismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('xcharge-open-pwa-install', handleOpenRequest);
      };
    }

    // App installed handler
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('[XCharge PWA] Successfully installed on device!');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
      // Fallback for non-iOS browsers without beforeinstallprompt
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 24 hours
    localStorage.setItem('xcharge_pwa_dismissed', (Date.now() + 86400000).toString());
  };

  if (isStandalone || isInstalled || (!showBanner && !showIosGuide)) {
    return null;
  }

  return (
    <>
      {/* 1. Bottom Floating Installation Banner */}
      {showBanner && !showIosGuide && (
        <div className="fixed bottom-20 sm:bottom-6 inset-x-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#141922]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center gap-3 relative">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-xl bg-[#10141a] border border-white/10 p-1.5 shrink-0 flex items-center justify-center shadow-inner">
              <img src="/icons/xcharge-mark.svg" alt="XCHARGE" className="w-full h-full object-contain" />
            </div>

            {/* Information */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-wide">Install XCHARGE App</span>
                <span className="px-1.5 py-0.2 rounded bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-mono font-bold uppercase">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                Add to your home screen for instant 1-tap charging
              </p>
            </div>

            {/* Install CTA */}
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-[#00f0ff] hover:bg-[#55f5ff] text-[#0a0e14] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-black/40 transition-all shrink-0 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install</span>
            </button>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
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
              <div className="w-12 h-12 rounded-xl bg-[#10141a] border border-[#00f0ff]/40 p-2 shrink-0">
                <img src="/icons/xcharge-mark.svg" alt="XCHARGE" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install XCHARGE on iPhone</h3>
                <p className="text-xs text-slate-400">Add to Home Screen in 2 quick steps</p>
              </div>
            </div>

            <div className="space-y-3.5 py-2">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">1. Tap the Share button</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tap the Safari share icon <Share className="w-3 h-3 inline text-[#00f0ff] mx-0.5" /> at the bottom or top of your screen.
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
                    Scroll down and tap <span className="text-white font-medium">Add to Home Screen</span>, then tap <span className="text-[#00f0ff] font-bold">Add</span> in the top-right corner.
                  </p>
                </div>
              </div>

              {/* Result */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00f0ff]/5 border border-[#00f0ff]/20 text-[11px] text-[#00f0ff]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Runs as a standalone full-screen app with 1-tap instant launch.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-4 py-3 rounded-xl bg-[#00f0ff] text-[#0a0e14] font-bold text-sm hover:bg-[#55f5ff] transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
