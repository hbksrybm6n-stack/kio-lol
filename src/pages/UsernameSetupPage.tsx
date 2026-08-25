import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { validateUsername, debounce } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export default function UsernameSetupPage() {
  const navigate = useNavigate();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkAvailability = useCallback(
    debounce(async (value: string) => {
      if (!validateUsername(value).valid) {
        setStatus('invalid');
        return;
      }
      setStatus('checking');
      try {
        const res = await profileApi.checkUsername(value);
        setStatus(res.available ? 'available' : 'taken');
      } catch {
        setStatus('available');
      }
    }, 400),
    []
  );

  useEffect(() => {
    if (!username) { setStatus('idle'); return; }
    checkAvailability(username);
  }, [username, checkAvailability]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (status !== 'available') return;
    setLoading(true);
    try {
      await profileApi.create({ display_name: displayName, username });
      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  }

  const statusColor = {
    idle: '',
    checking: 'text-white/30',
    available: 'text-emerald-400',
    taken: 'text-red-400',
    invalid: 'text-red-400',
  }[status];

  const statusText = {
    idle: '',
    checking: 'Checking availability...',
    available: 'Username is available',
    taken: 'Username is taken',
    invalid: 'Letters, numbers, hyphens only (3-30 chars)',
  }[status];

  return (
    <div className="min-h-screen bg-[var(--color-nx-bg)] flex items-center justify-center px-4">
      <div className={cn(
        'w-full max-w-sm rounded-2xl border border-white/[0.06]',
        'bg-[var(--color-nx-surface)] p-8'
      )}>
        <p className="text-sm font-semibold text-white mb-6">kio.lol</p>
        <h1 className="text-xl font-bold text-white mb-1">Choose your username</h1>
        <p className="text-sm text-white/40 mb-6">This will be your profile URL</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
            required
          />
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value.toLowerCase())}
              required
            />
            {status !== 'idle' && (
              <p className={cn('mt-1.5 text-xs', statusColor)}>{statusText}</p>
            )}
            {username && validateUsername(username).valid && (
              <p className="mt-1 text-xs text-white/20">kio.lol/@{username}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || status !== 'available'}
            className="w-full"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
