import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
  onVerified: (token: string) => void;
  onError?: (error: string) => void;
}

interface CaptchaData {
  id: string;
  question: string;
  token: string;
  signature: string;
}

export default function Captcha({ onVerified, onError }: CaptchaProps) {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    generate();
  }, []);

  const generate = async () => {
    try {
      const res = await fetch('/api/captcha/generate');
      const data = await res.json();
      setCaptcha(data);
      setAnswer('');
      setVerified(false);
      setError('');
    } catch {
      setError('Failed to load captcha');
    }
  };

  const verify = async () => {
    if (!captcha || !answer) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: captcha.id, answer: parseInt(answer), token: captcha.token }),
      });
      const data = await res.json();
      if (data.verified) {
        setVerified(true);
        onVerified(captcha.token);
      } else {
        setError(data.error || 'Wrong answer');
        generate();
      }
    } catch {
      setError('Verification failed');
      generate();
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06]">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-[13px] text-emerald-400 font-medium">Verified</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {captcha && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] font-mono text-[14px] text-white select-none">
            {captcha.question}
          </div>
        )}
        <button onClick={generate} className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && verify()}
          placeholder="Your answer"
          className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12]"
        />
        <button
          onClick={verify}
          disabled={loading || !answer}
          className="px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
        >
          {loading ? '...' : 'Verify'}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
