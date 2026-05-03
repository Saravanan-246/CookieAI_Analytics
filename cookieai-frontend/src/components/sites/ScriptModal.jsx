import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Terminal,
  Code2,
  X,
  Sparkles,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import Modal from "../ui/Modal";

const ScriptModal = ({
  isOpen,
  onClose,
  loading,
  socketConnected,
  site,
  onCheckStatus
}) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setChecking(false);
    }
  }, [isOpen]);

  /* ================= LOGIC PRESERVED ================= */
  const TRACKER_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const siteId = site?.siteId || "";
  const script = siteId
    ? `<script defer data-site-id="${siteId}" src="${TRACKER_BASE}/tracker.js"></script>`
    : "Generating script...";

  const isScriptReady = script && script !== "Generating script...";
  const isLive = Boolean(socketConnected || site?.installed);

  const handleCopy = async () => {
    if (!isScriptReady) return;
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("Copy failed");
    }
  };

  const handleCheck = () => {
    setChecking(true);
    onCheckStatus?.();
    setTimeout(() => setChecking(false), 1500);
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-16 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </Modal>
    );
  }

return (
  <Modal isOpen={isOpen} onClose={onClose}>
    <div className="relative p-6">

      {/* CLOSE */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
      >
        <X className="w-5 h-5" />
      </button>

      {/* HEADER */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 mb-4">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-bold text-violet-700 uppercase">
            Quick Setup
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">
          Install Tracking Script
        </h2>

        <p className="text-gray-500 text-sm mt-2">
          Paste this inside your{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-violet-600 text-xs font-semibold">
            &lt;head&gt;
          </code>{" "}
          tag
        </p>
      </div>

      {/* CODE BOX */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
          <span className="text-xs text-gray-500 font-mono">
            tracker.js
          </span>

          <button
            onClick={handleCopy}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              copied
                ? "bg-green-500 text-white"
                : "bg-gray-900 text-white hover:bg-black"
            }`}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* CODE */}
        <pre className="p-4 text-sm font-mono bg-black text-green-400 overflow-x-auto">
{script}
        </pre>
      </div>

      {/* STATUS */}
      <div className="flex items-center justify-between mt-6">

        <div className="flex items-center gap-2 text-sm font-medium">
          <span
            className={`w-2 h-2 rounded-full ${
              isLive ? "bg-green-500 animate-pulse" : "bg-gray-300"
            }`}
          />
          {isLive ? "Live tracking active" : "Waiting for visit"}
        </div>

        {!isLive ? (
          <button
            onClick={handleCheck}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg font-semibold transition"
          >
            {checking ? "Checking..." : "Check"}
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-semibold transition"
          >
            Done
          </button>
        )}
      </div>

    </div>
  </Modal>
);
};

export default ScriptModal;