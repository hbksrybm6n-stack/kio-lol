import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("kio_cookie_consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("kio_cookie_consent", "accepted");
    fetch("/api/cookie-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: "accepted" }),
    }).catch(() => {});
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("kio_cookie_consent", "declined");
    fetch("/api/cookie-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: "declined" }),
    }).catch(() => {});
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-[400px] z-50"
        >
          <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0a]/90 backdrop-blur-xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/[0.04] shrink-0 mt-0.5">
                <Cookie size={16} className="text-[#a1a1aa]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white font-medium mb-1">Cookie Notice</p>
                <p className="text-[12px] text-[#52525b] leading-relaxed mb-3">
                  We use cookies to enhance your experience. By continuing to visit this site, you agree to our use of cookies.
                  {" "}
                  <Link to="/legal/cookie-policy" className="text-[#8b5cf6] hover:underline">
                    Learn more
                  </Link>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAccept}
                    className="px-4 py-1.5 rounded-lg bg-white text-black text-[12px] font-bold hover:bg-white/90 transition-all cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleDecline}
                    className="px-4 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[12px] font-medium text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
              <button
                onClick={handleDecline}
                className="p-1 rounded-md text-[#3f3f46] hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
