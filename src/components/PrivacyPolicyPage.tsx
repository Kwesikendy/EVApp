import React, { useEffect } from 'react';
import { ShieldCheck, ArrowLeft, Mail, MapPin, Trash2 } from 'lucide-react';
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_LAST_UPDATED,
  LEGAL_STATION_HQ,
  PRIVACY_POLICY,
} from '../legalData';

export const PrivacyPolicyPage: React.FC = () => {
  useEffect(() => {
    const launchScreen = document.getElementById('pwa-launch-screen');
    if (launchScreen) launchScreen.remove();
    document.title = 'Privacy Policy — Willpower EV Charging';
  }, []);

  return (
    <div className="min-h-screen bg-[#07110B] text-[#F1F5F9] px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#BDF22E] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Willpower
          </a>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-[#BDF22E]/30 bg-[#BDF22E]/10 text-[#BDF22E]">
            Act 843 Compliant
          </span>
        </div>

        <header className="rounded-2xl border border-white/10 bg-[#0D1A12] p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#BDF22E]/15 border border-[#BDF22E]/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#BDF22E]" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#BDF22E] font-bold">
                {LEGAL_ENTITY_NAME}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Willpower Privacy Policy
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            This Privacy Policy governs the <strong>Willpower</strong> mobile application (Android &amp; iOS), web application, and EV charging services operated by <strong>{LEGAL_ENTITY_NAME}</strong> in the Republic of Ghana.
          </p>
          <p className="text-xs text-slate-400 mt-3">
            Last Updated: {LEGAL_LAST_UPDATED}
          </p>
        </header>

        <main className="space-y-4">
          {PRIVACY_POLICY.map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-white/10 bg-[#0D1A12]/80 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {section.title}
                </h2>
                {section.badge && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#BDF22E]/15 text-[#BDF22E] border border-[#BDF22E]/25">
                    {section.badge}
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                {section.content.map((para, idx) => (
                  <p key={idx} className="text-sm text-slate-300 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section
            id="account-deletion"
            className="rounded-2xl border border-[#BDF22E]/25 bg-[#0D1A12]/90 p-5 sm:p-6"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <Trash2 className="w-5 h-5 text-[#BDF22E]" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                7. Account &amp; Data Deletion Requests
              </h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              You may request permanent deletion of your Willpower driver account, profile, saved vehicles, and personal telemetry at any time:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
              <li>
                Send an email to{' '}
                <a
                  href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=Willpower%20Account%20Deletion%20Request`}
                  className="text-[#BDF22E] font-semibold hover:underline"
                >
                  {LEGAL_CONTACT_EMAIL}
                </a>{' '}
                with your registered Ghanaian mobile number (+233...).
              </li>
              <li>
                We verify ownership via OTP and delete or anonymize personal profile data within 14 business days, retaining only statutory financial/tax records required under Ghanaian law.
              </li>
            </ul>
          </section>
        </main>

        <footer className="mt-6 rounded-2xl border border-white/10 bg-[#0D1A12] p-5 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Mail className="w-4 h-4 text-[#BDF22E]" />
            <span>Data Protection Officer: {LEGAL_CONTACT_EMAIL}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#BDF22E] shrink-0" />
            <span>{LEGAL_STATION_HQ}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
