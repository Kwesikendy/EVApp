import React, { useEffect } from 'react';
import { ArrowLeft, FileText, Mail, MapPin, ShieldAlert } from 'lucide-react';
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_LAST_UPDATED,
  LEGAL_STATION_HQ,
  TERMS_OF_SERVICE,
} from '../legalData';

export const TermsOfServicePage: React.FC = () => {
  useEffect(() => {
    const launchScreen = document.getElementById('pwa-launch-screen');
    if (launchScreen) launchScreen.remove();
    document.title = 'Terms of Service — Wilpower EV Charging';
  }, []);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background:
          'radial-gradient(circle at 85% 0%, rgba(189,242,46,0.08), transparent 28rem), #07110b',
        color: '#f4f8f2',
        padding: '32px 20px 64px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#bdf22e',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Wilpower</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/privacy" style={{ color: '#9db4a1', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              Privacy Policy
            </a>
            <a href="/delete-account" style={{ color: '#9db4a1', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              Delete Account
            </a>
          </div>
        </div>

        <header
          style={{
            borderRadius: 22,
            padding: '28px 26px',
            marginBottom: 20,
            border: '1px solid rgba(207, 239, 200, 0.13)',
            background: 'linear-gradient(180deg, rgba(22, 43, 29, 0.8) 0%, rgba(11, 24, 16, 0.92) 100%)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <img
              src="/willpower/WillPower_App_Icon_V3.png"
              alt="Wilpower"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                objectFit: 'cover',
                border: '1px solid rgba(207,239,200,0.16)',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  color: '#bdf22e',
                  textTransform: 'uppercase',
                }}
              >
                WILPOWER · OPERATED BY {LEGAL_ENTITY_NAME}
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
                Terms of Service
              </h1>
            </div>
          </div>

          <p style={{ margin: '0 0 14px', color: '#a5b9a8', fontSize: 14, lineHeight: 1.65 }}>
            These Terms of Service govern your use of the <strong>Wilpower</strong> mobile app, web application,
            Ghana Cedi (GH₵) wallet, and EV fast-charging stations operated by <strong>{LEGAL_ENTITY_NAME}</strong>{' '}
            in the Republic of Ghana.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: '#8ba590', fontSize: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} color="#bdf22e" />
              Last Updated: {LEGAL_LAST_UPDATED}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="#bdf22e" />
              {LEGAL_STATION_HQ}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} color="#bdf22e" />
              {LEGAL_CONTACT_EMAIL}
            </span>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {TERMS_OF_SERVICE.map((section) => (
            <section
              key={section.id}
              style={{
                borderRadius: 18,
                padding: '22px 24px',
                border: section.isWarning
                  ? '1px solid rgba(245, 184, 107, 0.28)'
                  : '1px solid rgba(207, 239, 200, 0.11)',
                background: section.isWarning
                  ? 'linear-gradient(180deg, rgba(44, 34, 18, 0.55) 0%, rgba(16, 20, 14, 0.88) 100%)'
                  : 'linear-gradient(180deg, rgba(18, 36, 24, 0.72) 0%, rgba(10, 21, 14, 0.88) 100%)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 12,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 750, color: '#f8fbf4' }}>{section.title}</h2>
                {section.badge && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: section.isWarning ? '#f5b86b' : '#bdf22e',
                      background: section.isWarning ? 'rgba(245, 184, 107, 0.12)' : 'rgba(189, 242, 46, 0.12)',
                      border: section.isWarning
                        ? '1px solid rgba(245, 184, 107, 0.32)'
                        : '1px solid rgba(189, 242, 46, 0.28)',
                    }}
                  >
                    {section.isWarning && <ShieldAlert size={12} />}
                    {section.badge}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.content.map((paragraph, idx) => (
                  <p key={idx} style={{ margin: 0, color: '#c4d4c6', fontSize: 13.5, lineHeight: 1.68 }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
