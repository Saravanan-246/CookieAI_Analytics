import React, { useState, useEffect, useCallback, useRef } from "react";
import { Copy, Check, ExternalLink, Rocket, Activity, Zap, ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "cookieai_banner_dismissed";

const LiveSetupBanner = ({
  site,
  hasData = false,
  openScript,
  onCheckStatus
}) => {
  const [copied, setCopied] = useState(false);
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  
  const hasTriggeredCollapse = useRef(false);

  const installed = Boolean(site?.installed || site?.trackingInstalled);
  const isNoScript = !installed;
  const isWaiting = installed && !hasData;
  const isLive = hasData;

  const handleDismiss = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setDismissed(true);
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch (err) {
        console.error("Storage error:", err);
      }
    }, 400);
  }, []);

  useEffect(() => {
    if (isLive && !hasTriggeredCollapse.current) {
      hasTriggeredCollapse.current = true;
      const t = setTimeout(() => handleDismiss(), 4000);
      return () => clearTimeout(t);
    }
  }, [isLive, handleDismiss]);

  useEffect(() => {
    if (site?.siteId && !hasData) {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setDismissed(false);
      setFading(false);
      hasTriggeredCollapse.current = false;
    }
  }, [site?.siteId, hasData]);

const handleCopy = useCallback(() => {
  if (!site?.siteId) return;

  const TRACKER_BASE =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const tag = `<script defer data-site-id="${site.siteId}" src="${TRACKER_BASE}/tracker.js"></script>`;

  navigator.clipboard.writeText(tag).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  });

}, [site]);

  const handleVisit = useCallback(() => {
    if (site?.domain) window.open(`https://${site.domain}`, "_blank");
    onCheckStatus?.();
  }, [site, onCheckStatus]);

  if (!site || dismissed) return null;

return (
  <div style={{
    maxWidth: "520px",
    margin: "40px auto",
    transition: "all 0.3s ease",
    opacity: fading ? 0 : 1
  }}>

    <div style={{
      background: "#fff",
      borderRadius: "16px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
      overflow: "hidden"
    }}>

      {/* TOP BAR */}
      <div style={{
        height: "3px",
        background: isLive ? "#10b981" : isWaiting ? "#f59e0b" : "#6366f1"
      }} />

      <div style={{ padding: "22px", textAlign: "center" }}>

        {/* ICON */}
        <div style={{
          width: "52px",
          height: "52px",
          borderRadius: "12px",
          margin: "0 auto 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb"
        }}>
          {isNoScript && <Zap size={20} />}
          {isWaiting && <Rocket size={20} />}
          {isLive && <ShieldCheck size={20} />}
        </div>

        {/* TITLE */}
        <h3 style={{
          fontSize: "16px",
          fontWeight: "700",
          marginBottom: "4px"
        }}>
          {isLive ? "Tracking Active 🎉" : "Install Tracking Script"}
        </h3>

        {/* SUBTEXT */}
        {!isLive && (
          <p style={{
            fontSize: "13px",
            color: "#6b7280",
            marginBottom: "14px"
          }}>
            Click to copy and paste inside <b>&lt;head&gt;</b>
          </p>
        )}

        {/* 🔥 CLICKABLE CODE BLOCK */}
        {!isLive && (
          <div
            onClick={handleCopy}
            style={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              background: "#0b1220",
              cursor: "pointer",
              overflow: "hidden",
              transition: "all 0.2s ease"
            }}
          >

            {/* HEADER */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 10px",
              background: "#111827",
              fontSize: "11px",
              color: copied ? "#10b981" : "#9ca3af"
            }}>
              <span>script</span>
              <span>{copied ? "Copied ✓" : "Click to copy"}</span>
            </div>

            {/* CODE */}
            <div style={{
              padding: "12px",
              fontSize: "12px",
              color: "#e5e7eb",
              fontFamily: "monospace",
              textAlign: "left",
              overflowX: "auto"
            }}>
{`<script defer data-site-id="${site?.siteId}" src="${window.location.origin.replace(":3000", ":5000")}/tracker.js"></script>`}
            </div>
          </div>
        )}

        {/* STATUS */}
        {isWaiting && (
          <div style={{
            marginTop: "10px",
            fontSize: "12px",
            color: "#f59e0b"
          }}>
            Waiting for first event...
          </div>
        )}

        {/* SUCCESS */}
        {isLive && (
          <div style={{
            marginTop: "12px",
            padding: "10px",
            borderRadius: "10px",
            background: "#ecfdf5",
            color: "#065f46",
            fontSize: "13px",
            fontWeight: "600"
          }}>
            ✓ Data is flowing from <b>{site?.domain}</b>
          </div>
        )}

      </div>
    </div>
  </div>
);
};

export default React.memo(LiveSetupBanner);