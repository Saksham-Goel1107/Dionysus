'use client';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function UnlockPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [mode, setMode] = useState<'update' | 'disable' | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Incorrect password.');
        setLoading(false);
        return false;
      }
      setSuccess('Unlocked successfully!');
      return true;
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return false;
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to update password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, disable: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Password lock disabled. Your account is now unlocked.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to disable password lock.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setShowDialog(false);
    }
  };

  // Helper to check current password before opening dialog
  const checkCurrentPassword = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword }),
      });
      const data = await res.json();
      setLoading(false);
      if (!data.success) {
        setError(data.error || 'Incorrect password.');
        return false;
      }
      return true;
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return false;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          resolvedTheme === 'dark'
            ? 'radial-gradient(circle at 60% 40%, #2d2d2d 0%, #111 100%)'
            : 'radial-gradient(circle at 60% 40%, #f0f4ff 0%, #e2e8f0 100%)',
      }}
    >
      <form
        onSubmit={mode === 'update' ? handleUpdate : handleUnlock}
        style={{
          background: resolvedTheme === 'dark' ? 'rgba(30,30,30,0.98)' : '#fff',
          borderRadius: 20,
          boxShadow:
            resolvedTheme === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.25)'
              : '0 8px 32px rgba(60,100,255,0.08)',
          padding: '2.5rem 2rem 2rem 2rem',
          minWidth: 320,
          maxWidth: 420,
          border: resolvedTheme === 'dark' ? '2px solid #3af' : '2px solid #3a8cff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '2.5rem',
            marginBottom: 18,
            filter:
              resolvedTheme === 'dark'
                ? 'drop-shadow(0 2px 8px #3af)'
                : 'drop-shadow(0 2px 8px #3a8cff)',
          }}
        >
          🔓
        </span>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: 10,
            color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
          }}
        >
          Unlock / Update Password
        </h1>
        <p
          style={{
            fontSize: '1rem',
            opacity: 0.92,
            marginBottom: 20,
            color: resolvedTheme === 'dark' ? '#ccc' : '#333',
            textAlign: 'center',
          }}
        >
          Enter your current password to unlock, update, or disable password lock.
        </p>
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 8,
            border: resolvedTheme === 'dark' ? '1px solid #444' : '1px solid #bcd',
            background: resolvedTheme === 'dark' ? '#181818' : '#f8fafc',
            color: resolvedTheme === 'dark' ? '#fff' : '#222',
            fontSize: '1rem',
            outline: 'none',
            marginBottom: 14,
          }}
          disabled={loading}
        />
        {mode === 'update' && (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: resolvedTheme === 'dark' ? '1px solid #444' : '1px solid #bcd',
                background: resolvedTheme === 'dark' ? '#181818' : '#f8fafc',
                color: resolvedTheme === 'dark' ? '#fff' : '#222',
                fontSize: '1rem',
                outline: 'none',
                marginBottom: 14,
              }}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: resolvedTheme === 'dark' ? '1px solid #444' : '1px solid #bcd',
                background: resolvedTheme === 'dark' ? '#181818' : '#f8fafc',
                color: resolvedTheme === 'dark' ? '#fff' : '#222',
                fontSize: '1rem',
                outline: 'none',
                marginBottom: 14,
              }}
              disabled={loading}
            />
          </>
        )}
        {error && <div style={{ color: '#f33', marginBottom: 12, fontWeight: 500 }}>{error}</div>}
        {success && (
          <div
            style={{
              color: resolvedTheme === 'dark' ? '#3af' : '#3a8cff',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            {success}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              if (!currentPassword) {
                setError('Please enter your current password first.');
                return;
              }
              const ok = await checkCurrentPassword();
              if (ok) {
                setMode('update');
                setShowDialog(true);
              }
            }}
            className="flex-1"
            disabled={loading}
          >
            Update Password
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              if (!currentPassword) {
                setError('Please enter your current password first.');
                return;
              }
              const ok = await checkCurrentPassword();
              if (ok) {
                setMode('disable');
                setShowDialog(true);
              }
            }}
            className="flex-1"
            disabled={loading}
          >
            Turn Off Lock
          </Button>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {mode === 'update' ? 'Update Password' : 'Disable Password Lock'}
              </DialogTitle>
            </DialogHeader>
            <div style={{ margin: '1rem 0' }}>
              {mode === 'update'
                ? 'Are you sure you want to update your password?'
                : 'Are you sure you want to disable password lock? This will remove your password protection.'}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowDialog(false)} variant="secondary">
                Cancel
              </Button>
              <Button
                onClick={mode === 'update' ? handleUpdate : handleDisable}
                variant={mode === 'update' ? 'default' : 'destructive'}
                disabled={loading}
              >
                {mode === 'update' ? 'Update' : 'Disable'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </div>
  );
}
