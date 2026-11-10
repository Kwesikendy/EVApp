import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChargeLink ErrorBoundary caught]', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleResetSession = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) caches.delete(name);
        });
      }
    } catch {}
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: '#10141a',
            color: '#f8fbf4',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#181c22',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: 24,
              padding: '36px 28px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 20px',
                borderRadius: '50%',
                background: 'rgba(0, 240, 255, 0.08)',
                border: '2px solid #00f0ff',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 0 20px rgba(0,240,255,0.2)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>

            <span style={{ fontSize: 11, letterSpacing: 2, color: '#00f0ff', textTransform: 'uppercase', fontWeight: 700 }}>
              ChargeLink GH Recovery
            </span>
            <h2 style={{ margin: '8px 0 12px', fontSize: 22, fontWeight: 700, color: '#fff' }}>
              App encountered an interruption
            </h2>
            <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>
              {this.state.error?.message || 'A client-side state issue was detected. Resetting session cache will restore normal operation immediately.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={this.handleResetSession}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: '#00f0ff',
                  color: '#10141a',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                Clear Session & Reload
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Simple Reload
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
