import { Link, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 px-4">
      <AlertTriangle size={48} className="text-[#3f3f46]" />
      <div className="text-center">
        <h1 className="text-[48px] font-extrabold text-white leading-none tracking-tighter">500</h1>
        <p className="text-[15px] text-[#52525b] mt-2">Something went wrong.</p>
        {error && (
          <p className="text-[12px] text-[#3f3f46] mt-1 font-mono max-w-md truncate">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer"
        >
          Try Again
        </button>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-full border border-white/10 text-[13px] font-medium text-white hover:bg-white/[0.05] transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
