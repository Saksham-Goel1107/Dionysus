'use client';
import * as React from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; copied: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null, copied: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleDashboard = () => {
    window.location.replace('/dashboard');
  };

  copyError = async () => {
    if (!this.state.error) return;

    const errorText = `Error: ${this.state.error.message}\n\nStack Trace:\n${this.state.error.stack || 'No stack trace available'}`;

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  reportOnGitHub = () => {
    if (!this.state.error) return;

    const title = encodeURIComponent(`Bug Report: ${this.state.error.message}`);
    const body = encodeURIComponent(
      `## Bug Report\n\n**Error Message:**\n${this.state.error.message}\n\n**Stack Trace:**\n\`\`\`\n${this.state.error.stack || 'No stack trace available'}\n\`\`\`\n\n**Browser:** ${navigator.userAgent}\n**URL:** ${window.location.href}\n**Timestamp:** ${new Date().toISOString()}\n\n**Steps to Reproduce:**\n1. \n2. \n3. \n\n**Expected Behavior:**\n\n\n**Actual Behavior:**\n\n`,
    );

    const url = `https://github.com/saksham-goel1107/dionysus/issues/new?title=${title}&body=${body}&labels=bug`;
    window.open(url, '_blank');
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
              <p>Please report this issue to help us improve the application.</p>
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
            <div style={{ display: 'flex', gap: 8, marginTop: 16, width: '100%' }}>
              <button
                onClick={this.copyError}
                style={{
                  background: this.state.copied
                    ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(90deg, #6b7280 0%, #4b5563 100%)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flex: 1,
                }}
              >
                {this.state.copied ? '✓ Copied!' : 'Copy Error'}
              </button>
              <button
                onClick={this.reportOnGitHub}
                style={{
                  background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flex: 1,
                }}
              >
                Report on GitHub
              </button>
            </div>
            <DialogFooter style={{ justifyContent: 'center', marginTop: 16, width: '100%' }}>
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
                  maxWidth: 200,
                  margin: '0 8px',
                }}
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(90deg, #22c55e 0%, #38bdf8 100%)',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 16,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.12)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  width: '100%',
                  maxWidth: 200,
                  margin: '0 8px',
                  outline: 'none',
                }}
                aria-label="Refresh the page"
                title="Refresh the page"
                autoFocus
              >
                Refresh
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
    return this.props.children;
  }
}
