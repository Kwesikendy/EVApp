// src/components/TermsAndPrivacyModal.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  X,
  Search,
  Check,
  Download,
  ExternalLink,
  ChevronRight,
  Scale,
  Zap,
  Lock,
} from 'lucide-react';
import { XChargeMark } from './XChargeLogo';
import {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  LEGAL_LAST_UPDATED,
  LEGAL_ENTITY_NAME,
  LEGAL_JURISDICTION,
  LEGAL_CONTACT_EMAIL,
  LegalSection,
} from '../legalData';

interface TermsAndPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy';
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export const TermsAndPrivacyModal: React.FC<TermsAndPrivacyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'terms',
  onAccept,
  showAcceptButton = false,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Switch tab if defaultTab changes when opened
  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  const sections = activeTab === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY;

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter((sec) => {
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchContent = sec.content.some((c) => c.toLowerCase().includes(q));
      const matchBadge = sec.badge?.toLowerCase().includes(q);
      return matchTitle || matchContent || matchBadge;
    });
  }, [sections, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="w-full max-w-3xl h-[92vh] bg-[#10141a] border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#141820] border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    ChargeLink GH Legal & Compliance Center
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#4ade80] text-[10px] font-mono font-bold border border-[#22c55e]/25">
                    GHANA LAW
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  {LEGAL_ENTITY_NAME} · {LEGAL_JURISDICTION} · {LEGAL_LAST_UPDATED}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#181c22] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Legal Center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selector & Search Row */}
          <div className="px-4 py-3 bg-[#0d1117] border-b border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center bg-[#141820] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('terms');
                  setSelectedSectionId(null);
                }}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'terms'
                    ? 'bg-[#22c55e] text-[#0a0e14] shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('privacy');
                  setSelectedSectionId(null);
                }}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-[#22c55e] text-[#0a0e14] shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Privacy Policy (Act 843)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clauses (e.g. idle fee, battery, escrow)..."
                className="w-full bg-[#141820] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Quick Jump Category Chips */}
          <div className="px-4 py-2 bg-[#10141a] border-b border-white/[0.04] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
            <span className="text-slate-500 text-[10px] font-mono shrink-0 uppercase tracking-wider">
              Quick Jump:
            </span>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  const el = document.getElementById(`legal-sec-${sec.id}`);
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-2.5 py-1 rounded-lg bg-[#141820] hover:bg-[#1a202c] border border-white/5 text-slate-300 hover:text-[#4ade80] shrink-0 font-medium transition-colors"
              >
                {sec.title.split('.')[1] || sec.title}
              </button>
            ))}
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
            {/* Top Advisory Banner */}
            <div className="p-3.5 rounded-2xl bg-[#141820] border border-[#22c55e]/25 flex items-start gap-3 shadow-md">
              <ShieldCheck className="w-5 h-5 text-[#22c55e] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">
                  Enforceable Under the Laws of the Republic of Ghana
                </span>
                <p className="text-[11px] text-slate-400">
                  This legal instrument sets forth your rights and binding obligations regarding high-voltage EV power dispensing, Ghana Mobile Money pre-authorization escrow, idle stall parking fees, and statutory privacy rights under the <em>Data Protection Act, 2012 (Act 843)</em>.
                </p>
              </div>
            </div>

            {filteredSections.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">No matching clauses found for "{searchQuery}".</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#22c55e] font-semibold underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => (
                <div
                  key={sec.id}
                  id={`legal-sec-${sec.id}`}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    sec.isWarning
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-[#141820]/60 border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {sec.isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      <span>{sec.title}</span>
                    </h4>

                    {sec.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          sec.isWarning
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/30'
                        }`}
                      >
                        {sec.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 text-slate-300 text-xs">
                    {sec.content.map((paragraph, pIdx) => (
                      <p
                        key={pIdx}
                        className={`${
                          paragraph.startsWith('a)') ||
                          paragraph.startsWith('b)') ||
                          paragraph.startsWith('c)') ||
                          paragraph.startsWith('d)') ||
                          paragraph.startsWith('e)')
                            ? 'pl-4 border-l-2 border-white/10 text-slate-300'
                            : ''
                        }`}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Official Entity Address & Contact Block */}
            <div className="p-4 rounded-2xl bg-[#0a0e14] border border-white/10 space-y-2 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <XChargeMark size={20} />
                <span>{LEGAL_ENTITY_NAME} · LEGAL AFFAIRS DEPARTMENT</span>
              </div>
              <p>Registered Address: {LEGAL_STATION_HQ}</p>
              <p>Direct Inquiries & Notices: {LEGAL_CONTACT_EMAIL}</p>
              <p>Regulatory Reference: Energy Commission (Ghana) & Data Protection Commission (Act 843)</p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-[#141820] border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-400 hidden sm:block">
              By using ChargeLink GH, you accept these terms unconditionally.
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#181c24] hover:bg-[#20252e] border border-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>

              {showAcceptButton && (
                <button
                  type="button"
                  onClick={() => {
                    if (onAccept) onAccept();
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0e14] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-black/40"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>I Agree & Accept</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
