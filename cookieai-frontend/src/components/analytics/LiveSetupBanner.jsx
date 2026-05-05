import React, { useState, useEffect, useCallback, useRef } from "react";
import { Check, Copy, ShieldCheck, Rocket } from "lucide-react";

const STORAGE_KEY = "cookieai_tracking_done";

const LiveSetupBanner = ({ site, hasData = false }) => {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);
  const hasTriggered = useRef(false);

  const isLive = hasData;
  const isWaiting = !hasData;

  const BASE =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  /* ---------- LOAD VISIBILITY ---------- */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true") {
      setVisible(false);
    }
  }, []);

  /* ---------- AUTO HIDE ---------- */
  useEffect(() => {
    if (isLive && !hasTriggered.current) {
      hasTriggered.current = true;

      localStorage.setItem(STORAGE_KEY, "true");

      setTimeout(() => setVisible(false), 2000);
    }
  }, [isLive]);

  /* ---------- RESET ON NEW SITE ---------- */
  useEffect(() => {
    if (site?.siteId) {
      localStorage.removeItem(STORAGE_KEY);
      setVisible(true);
      hasTriggered.current = false;
    }
  }, [site?.siteId]);

  /* ---------- COPY ---------- */
  const handleCopy = useCallback(() => {
    if (!site?.siteId) return;

    const tag = `<script defer data-site-id="${site.siteId}" src="${BASE}/tracker.js"></script>`;

    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [site, BASE]);

  if (!site || !visible) return null;

  return (
    <div className="w-full max-w-lg mx-auto mt-6 px-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        {/* STATUS BAR */}
        <div
          className={`h-[2px] ${
            isLive ? "bg-emerald-500" : "bg-amber-400"
          }`}
        />

        <div className="px-6 py-6 text-center">

          {/* ICON */}
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-lg bg-gray-50">
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