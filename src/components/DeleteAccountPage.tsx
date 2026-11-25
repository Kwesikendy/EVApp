import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';

export function DeleteAccountPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  useEffect(() => {
    const launchScreen = document.getElementById('pwa-launch-screen');
    if (launchScreen) launchScreen.remove();
    document.title = 'Delete Account — Wilpower EV Charging';
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phoneNumber.trim()) {
      setError('Please enter the Ghanaian mobile number registered with your Wilpower account.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/user/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not submit your deletion request. Please email support@wilpowerevhub.com.');
        return;
      }
      setSubmittedRef(data.reference || `DEL-${Date.now().toString(36).toUpperCase()}`);
    } catch {
      setError('Network error submitting request. You may also email support@wilpowerevhub.com directly.');
    } finally {
      setSubmitting(false);
    }
  }

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
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 28,
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
          <a
            href="/privacy"
            style={{
              color: '#9db4a1',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Privacy Policy
          </a>
        </div>

        <div
          style={{
            borderRadius: 22,
            padding: '28px 26px',
            border: '1px solid rgba(207, 239, 200, 0.13)',
            background: 'linear-gradient(180deg, rgba(22, 43, 29, 0.8) 0%, rgba(11, 24, 16, 0.92) 100%)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
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
                WILPOWER · CHARGELINK GH LTD
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
                Account &amp; Data Deletion
              </h1>
            </div>
          </div>

          <p style={{ color: '#a5b9a8', fontSize: 14, lineHeight: 1.65, marginBottom: 22 }}>
            Under the Ghana Data Protection Act, 2012 (Act 843) and Google Play User Data policies, you can request
            permanent deletion of your <strong>Wilpower</strong> driver account and associated personal data at any time.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 14,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 14,
                border: '1px solid rgba(207,239,200,0.1)',
                background: 'rgba(3, 10, 6, 0.52)',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.45)',
              }}
            >
              <strong style={{ display: 'block', color: '#bdf22e', fontSize: 13, marginBottom: 8 }}>
                Data Permanently Deleted
              </strong>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#c4d4c6', fontSize: 13, lineHeight: 1.6 }}>
                <li>Driver profile name, phone number (+233), and email address</li>
                <li>Registered EVs, vehicle models, and license plate numbers</li>
                <li>Saved payment preferences and active app sessions</li>
              </ul>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 14,
                border: '1px solid rgba(207,239,200,0.1)',
                background: 'rgba(3, 10, 6, 0.52)',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.45)',
              }}
            >
              <strong style={{ display: 'block', color: '#f5b86b', fontSize: 13, marginBottom: 8 }}>
                Statutory Financial Retention
              </strong>
              <p style={{ margin: 0, color: '#c4d4c6', fontSize: 13, lineHeight: 1.6 }}>
                Completed Ghana Cedi (GH₵) Mobile Money and card payment receipts may be retained in anonymized form
                for up to 6 years strictly to comply with Ghana Revenue Authority (GRA) financial &amp; tax audit
                obligations. Any remaining refundable wallet balance is settled before closure.
              </p>
            </div>
          </div>

          {submittedRef ? (
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid rgba(189, 242, 46, 0.38)',
                background: 'rgba(189, 242, 46, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#bdf22e', marginBottom: 8 }}>
                <CheckCircle2 size={20} />
                <strong style={{ fontSize: 15 }}>Deletion Request Received</strong>
              </div>
              <p style={{ margin: 0, color: '#dbe8dc', fontSize: 13, lineHeight: 1.6 }}>
                Reference: <code>{submittedRef}</code>. Our CHARGELINK GH LTD privacy team will verify ownership and
                permanently erase your Wilpower account within <strong>7 business days</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 750 }}>Submit Deletion Request</h2>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#b4c8b6' }}>
                  Registered Ghanaian Mobile Number *
                </span>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +233 55 000 0000 or 024 000 0000"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(207,239,200,0.16)',
                    background: 'rgba(3, 10, 6, 0.68)',
                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#b4c8b6' }}>
                  Contact Email for Confirmation (optional)
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(207,239,200,0.16)',
                    background: 'rgba(3, 10, 6, 0.68)',
                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#b4c8b6' }}>
                  Additional Notes (optional)
                </span>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional details or wallet refund instructions..."
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(207,239,200,0.16)',
                    background: 'rgba(3, 10, 6, 0.68)',
                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </label>

              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 107, 107, 0.35)',
                    background: 'rgba(255, 107, 107, 0.1)',
                    color: '#ffb4b4',
                    fontSize: 13,
                  }}
                >
                  <ShieldAlert size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '13px 20px',
                  borderRadius: 12,
                  border: '1px solid rgba(226, 255, 130, 0.65)',
                  background: 'linear-gradient(180deg, #caf948 0%, #b4e921 100%)',
                  color: '#07110b',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: submitting ? 'wait' : 'pointer',
                  boxShadow: '0 8px 20px rgba(189,242,46,0.2), inset 0 1px 0 rgba(255,255,255,0.55)',
                }}
              >
                <Trash2 size={16} />
                <span>{submitting ? 'Submitting Request...' : 'Request Permanent Account Deletion'}</span>
              </button>
            </form>
          )}

          <p style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(207,239,200,0.08)', color: '#7f9984', fontSize: 12, lineHeight: 1.6 }}>
            You can also request account deletion directly by emailing{' '}
            <a href="mailto:support@wilpowerevhub.com" style={{ color: '#bdf22e' }}>
              support@wilpowerevhub.com
            </a>{' '}
            with the subject line <strong>&ldquo;Wilpower Account Deletion&rdquo;</strong> and your registered phone number.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountPage;
