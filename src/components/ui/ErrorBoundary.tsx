'use client';
import * as React from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleDashboard = () => {
    window.location.replace('/dashboard');
  };

  render() {
    if (this.state.error) {
      return (
        <Dialog open>
          <DialogContent
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
              boxShadow: '0 8px 32px rgba(31, 41, 55, 0.15)',
              borderRadius: 16,
              padding: 32,
              maxWidth: 480,
              margin: '0 auto',
              width: '95vw',
              minWidth: 0,
              maxHeight: '90vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <DialogHeader>
              <DialogTitle
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#1e293b',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f87171 0%, #fbbf24 100%)',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    marginRight: 8,
                  }}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="12" fill="#f87171" />
                    <path d="M12 7v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1" fill="#fff" />
                  </svg>
                </span>
                Exception Occurred
              </DialogTitle>
            </DialogHeader>
            <div
              style={{
                margin: '24px 0 16px 0',
                color: '#334155',
                fontSize: 17,
                lineHeight: 1.6,
                width: '100%',
              }}
            >
              <p style={{ marginBottom: 8 }}>
                <strong>Oops!</strong> Something went wrong and the app cannot continue.
              </p>
              <p>
                Please{' '}
                <a
                  href="https://github.com/Saksham-Goel1107/dionysus/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#2563eb',
                    textDecoration: 'underline',
                    fontWeight: 600,
                  }}
                >
                  report this on GitHub
                </a>{' '}
                with details.
              </p>
              <div
                style={{
                  background: 'linear-gradient(90deg, #fef3c7 0%, #fee2e2 100%)',
                  color: '#b91c1c',
                  padding: '14px 16px',
                  borderRadius: 8,
                  marginTop: 18,
                  fontSize: 15,
                  fontFamily: 'Menlo, Monaco, Consolas, monospace',
                  maxHeight: 220,
                  overflow: 'auto',
                  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.08)',
                  border: '1px solid #fde68a',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  width: '100%',
                }}
              >
                {this.state.error.message}
                {this.state.error.stack && (
                  <details style={{ marginTop: 12, color: '#b91c1c', fontSize: 13 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Stack Trace</summary>
                    <pre style={{ maxHeight: 120, overflow: 'auto', margin: 0 }}>
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
            <DialogFooter style={{ justifyContent: 'center', marginTop: 24, width: '100%' }}>
              <button
                onClick={this.handleDashboard}
                style={{
                  background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 16,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  width: '100%',
                  maxWidth: 320,
                  minWidth: 120,
                  margin: '0 auto',
                  display: 'block',
                }}
              >
                Go to Dashboard
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
    return this.props.children;
  }
}
