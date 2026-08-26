import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 px-4">
      <ShieldOff size={48} className="text-[#3f3f46]" />
      <div className="text-center">
        <h1 className="text-[48px] font-extrabold text-white leading-none tracking-tighter">403</h1>
        <p className="text-[15px] text-[#52525b] mt-2">You don't have access to this page.</p>
      </div>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all mt-4"
      >
        Go Home
      </Link>
    </div>
  );
}
