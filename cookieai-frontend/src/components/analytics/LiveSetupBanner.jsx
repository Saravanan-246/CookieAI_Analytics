import React, { useState, useEffect, useCallback, useRef } from "react";
import { Check, Copy, ShieldCheck, Rocket } from "lucide-react";

const LiveSetupBanner = ({ site, hasData = false }) => {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);
  const hasTriggered = useRef(false);

  const isLive = hasData;
  const isWaiting = !hasData;

  const BASE =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  /* ---------- UNIQUE KEY PER SITE ---------- */
  const STORAGE_KEY = `cookieai_tracking_done_${site?.siteId}`;

  /* ---------- LOAD VISIBILITY ---------- */
  useEffect(() => {
    if (!site?.siteId) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true") {
        setVisible(false);
      } else {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, [site?.siteId]);

  /* ---------- AUTO HIDE WHEN LIVE ---------- */
  useEffect(() => {
    if (isLive && !hasTriggered.current) {
      hasTriggered.current = true;

      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {}

      setTimeout(() => setVisible(false), 2000);
    }
  }, [isLive, STORAGE_KEY]);

  /* ---------- COPY (WORKS LOCAL + PROD) ---------- */
  const handleCopy = useCallback(() => {
    if (!site?.siteId) return;

    const tag = `<script defer data-site-id="${site.siteId}" src="${BASE}/tracker.js"></script>`;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(tag)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        })
        .catch(() => fallbackCopy(tag));
    } else {
      fallbackCopy(tag);
    }

    function fallbackCopy(text) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    }
  }, [site, BASE]);

  /* ---------- HIDE ---------- */
  if (!site || !visible) return null;

  return (
    <div className="w-full max-w-md mx-auto mt-6 px-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        {/* TOP BAR */}
        <div
          className={`h-[2px] ${
            isLive ? "bg-emerald-500" : "bg-amber-400"
          }`}
        />

        <div className="px-6 py-6 text-center">

          {/* ICON */}
          <div className="w-11 h-11 mx-auto mb-4 flex items-center justify-center rounded-lg bg-gray-50">
            {isLive ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <Rocket className="w-5 h-5 text-gray-700" />
            )}
          </div>

          {/* TITLE */}
          <h3 className="text-sm font-semibold text-gray-900">
            {isLive ? "Tracking Active" : "Install Tracking Script"}
          </h3>

          {/* SUBTEXT */}
          {!isLive && (
            <p className="text-xs text-gray-500 mt-1">
              Add this script inside your &lt;head&gt;
            </p>
          )}

          {/* SCRIPT BOX */}
          {!isLive && (
            <div
              onClick={handleCopy}
              className="mt-4 border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-gray-300 transition"
            >
              <div className="flex justify-between items-center px-3 py-2 text-[11px] bg-gray-50 text-gray-500">
                <span>script</span>
                <span className="flex items-center gap-1">
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </span>
              </div>

              <div className="px-3 py-3 text-xs font-mono text-gray-800 text-left overflow-x-auto">
{`<script defer data-site-id="${site?.siteId}" src="${BASE}/tracker.js"></script>`}
              </div>
            </div>
          )}

          {/* WAITING */}
          {isWaiting && (
            <p className="text-xs text-amber-500 mt-3">
              Waiting for first event...
            </p>
          )}

          {/* SUCCESS */}
          {isLive && (
            <div className="mt-4 px-4 py-2 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
              Data is flowing from {site?.domain || "your site"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LiveSetupBanner);