import React from 'react';
import { Compass, Plug, Wallet, Truck } from 'lucide-react';
import { motion } from 'motion/react';

export type TabKey = 'map' | 'charge' | 'wallet' | 'fleet';

interface ModernBottomNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isCharging?: boolean;
}

export const ModernBottomNav: React.FC<ModernBottomNavProps> = ({
  activeTab,
  onSelectTab,
  isCharging = false,
}) => {
  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'map', label: 'Map', icon: Compass },
    { key: 'charge', label: 'Charge', icon: Plug },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'fleet', label: 'Fleet', icon: Truck },
  ];

  return (
    <nav
      id="xcharge-bottom-nav"
      className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-[#10141a] border-t border-white/[0.08] px-2 shrink-0 z-30 select-none"
    >
      <div className="w-full max-w-md mx-auto h-full grid grid-cols-4">
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;

        return (
          <motion.button
            key={tab.key}
            id={`nav-tab-${tab.key}`}
            onClick={() => onSelectTab(tab.key)}
            whileTap={{ scale: 0.92 }}
            className="flex flex-col items-center justify-center min-h-[44px] py-1 transition-all relative group cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive
                    ? 'text-[#22c55e]'
                    : 'text-[#64748b] group-hover:text-slate-300'
                }`}
              />

              {/* Pulse indicator for live charging session */}
              {tab.key === 'charge' && isCharging && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
              )}
            </div>

            <span
              className={`text-[11px] font-medium tracking-wide mt-1 transition-colors ${
                isActive ? 'text-[#4ade80] font-semibold' : 'text-[#64748b] group-hover:text-slate-300'
              }`}
            >
              {tab.label}
            </span>

            {/* Smooth sliding accent dot beneath active tab */}
            {isActive && (
              <motion.span
                layoutId="bottomNavIndicator"
                className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#22c55e]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </motion.button>
        );
      })}
      </div>
    </nav>
  );
};
