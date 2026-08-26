import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-center">
        <h1 className="text-[80px] font-extrabold text-white leading-none tracking-tighter">404</h1>
        <p className="text-[15px] text-[#52525b] mt-2">This page doesn't exist.</p>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all"
        >
          Go Home
        </Link>
        <Link
          to="/discover"
          className="px-5 py-2.5 rounded-full border border-white/10 text-[13px] font-medium text-white hover:bg-white/[0.05] transition-all"
        >
          Discover
        </Link>
      </div>
    </div>
  );
}
