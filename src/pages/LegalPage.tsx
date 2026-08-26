import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, ArrowLeft } from "lucide-react";
import { legalApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const LEGAL_PAGES = [
  { slug: "terms", title: "Terms of Service" },
  { slug: "privacy", title: "Privacy Policy" },
  { slug: "dmca", title: "DMCA Policy" },
  { slug: "impressum", title: "Impressum" },
  { slug: "cookie-policy", title: "Cookie Policy" },
];

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) loadPage();
  }, [slug]);

  const loadPage = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await legalApi.getPage(slug!);
      if (!data || !data.title) {
        setNotFound(true);
      } else {
        setPage(data);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-bold text-white">404</h1>
        <p className="text-[#52525b] text-sm">Page not found</p>
        <Link to="/" className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/15 transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-[1100px] mx-auto px-6 py-12 flex gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-12">
            <Link
              to="/"
              className="flex items-center gap-2 text-[13px] text-[#52525b] hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
            <nav className="space-y-0.5">
              {LEGAL_PAGES.map((p) => (
                <Link
                  key={p.slug}
                  to={`/legal/${p.slug}`}
                  className={`block px-3 py-2 rounded-lg text-[13px] transition-all ${
                    p.slug === slug
                      ? "bg-white/[0.06] text-white font-medium"
                      : "text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.03]"
                  }`}
                >
                  {p.title}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile back */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.04]">
          <div className="max-w-[1100px] mx-auto px-6 h-12 flex items-center gap-3">
            <Link to="/" className="text-[13px] text-[#52525b] hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft size={14} />
              Back
            </Link>
          </div>
        </div>

        {/* Content */}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 min-w-0"
        >
          <div className="lg:mt-0 mt-14">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={20} className="text-[#3f3f46]" />
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {page.title}
              </h1>
            </div>
            {page.updated_at && (
              <p className="text-[12px] text-[#3f3f46] mb-8">
                Last updated: {formatDate(page.updated_at)}
              </p>
            )}
            <div
              className="prose prose-invert prose-sm max-w-none
                [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-4 [&_h1]:mt-8
                [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-3 [&_h2]:mt-6
                [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-white [&_h3]:mb-2 [&_h3]:mt-4
                [&_p]:text-[14px] [&_p]:text-[#a1a1aa] [&_p]:leading-relaxed [&_p]:mb-4
                [&_a]:text-[#8b5cf6] [&_a]:no-underline hover:[&_a]:underline
                [&_ul]:space-y-2 [&_ul]:my-4
                [&_ol]:space-y-2 [&_ol]:my-4
                [&_li]:text-[14px] [&_li]:text-[#a1a1aa]
                [&_strong]:text-white
                [&_hr]:border-white/[0.06] [&_hr]:my-8"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </motion.main>
      </div>
    </div>
  );
}
