import React from 'react';
import { Smartphone, Monitor, Wifi, Battery, Signal } from 'lucide-react';

interface ExpoMobileFrameProps {
  children: React.ReactNode;
  deviceMode: 'phone' | 'fluid';
  onToggleDeviceMode: () => void;
  activeTabTitle: string;
}

export const ExpoMobileFrame: React.FC<ExpoMobileFrameProps> = ({
  children,
  deviceMode,
  onToggleDeviceMode,
  activeTabTitle
}) => {
  if (deviceMode === 'fluid') {
    return (
      <div className="flex-1 w-full h-full flex flex-col bg-slate-950 overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 overflow-hidden">
      {/* Mobile Device Mockup Frame (iPhone 15 Pro styled) */}
      <div className="relative w-full max-w-[410px] h-[96%] max-h-[840px] bg-slate-900 border-[8px] border-slate-800 rounded-[44px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-700/50">
        {/* Dynamic Island / Notch & Phone Status Bar */}
        <div className="w-full bg-slate-950 px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300 z-30 shrink-0">
          <span>9:41</span>

          {/* Dynamic Island */}
          <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center gap-1.5 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500/70 animate-pulse"></div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-300" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Inner Phone Screen Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="w-full bg-slate-950 py-1.5 flex justify-center z-30 shrink-0">
          <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
