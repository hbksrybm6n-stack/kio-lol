import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { accountApi } from '@/lib/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token provided');
      return;
    }

    accountApi
      .confirmEmailVerification(token)
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Invalid or expired token');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.04] flex items-center justify-center">
              <Loader2 size={28} className="text-[#52525b] animate-spin" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Verifying Email</h1>
              <p className="text-[13px] text-[#52525b]">Please wait while we verify your email address...</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-400/[0.08] flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Email Verified</h1>
              <p className="text-[13px] text-[#52525b]">Your email has been successfully verified.</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-400/[0.08] flex items-center justify-center">
              <XCircle size={28} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Verification Failed</h1>
              <p className="text-[13px] text-[#52525b]">{errorMsg}</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all"
            >
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
