import { useState, useEffect } from "react";
import { Copy, Check, Eye, EyeOff, Code2, Terminal } from "lucide-react";
import Modal from "../ui/Modal";

const ScriptModal = ({ isOpen, onClose, scriptData, loading }) => {
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setShowAdvanced(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    const textToCopy = scriptData?.script;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      // Revert icon after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Embed Tracking Script">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-32 bg-slate-100 rounded-lg" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Embed Tracking Script">
      <div className="max-w-2xl space-y-6 antialiased">
        
        {/* --- Header Section --- */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">
            <Code2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Add tracking to your website</h3>
            <p className="text-xs text-slate-500 mt-1">
              Insert this snippet into the <code className="bg-slate-100 px-1 rounded text-blue-700 font-mono">&lt;head&gt;</code> section of your HTML.
            </p>
          </div>
        </div>

        {/* --- Modern Code Block (The "GPT" Style) --- */}
        <div className="relative group rounded-xl border border-slate-700 bg-[#0d1117] overflow-hidden shadow-2xl">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-slate-400" />
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">javascript</span>
            </div>
            
            <button
              onClick={handleCopy}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                ${copied 
                  ? "text-emerald-400 bg-emerald-400/10" 
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
                }
              `}
            >
              {copied ? (
                <>
                  <Check size={14} className="animate-in zoom-in duration-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy code</span>
                </>
              )}
            </button>
          </div>

          {/* Script Content */}
          <div className="p-4 overflow-x-auto custom-scrollbar">
            <pre className="text-sm font-mono leading-relaxed">
              <code className="text-emerald-400">
                {scriptData?.script || "// No script generated"}
              </code>
            </pre>
          </div>
        </div>

        {/* --- Metadata Row --- */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Site ID</span>
          <code className="text-sm font-mono text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
            {scriptData?.siteId}
          </code>
        </div>

        {/* --- Advanced Toggle --- */}
        <div className="border-t border-slate-100 pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
          >
            {showAdvanced ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAdvanced ? "Hide Details" : "Advanced View"}
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 animate-in slide-in-from-top-2 duration-300">
              <p className="text-[11px] text-slate-500 leading-relaxed italic">
                This script uses <span className="font-bold">defer</span> to ensure zero impact on your site's loading speed. 
                Data is sent over a secure SSL connection and is privacy-compliant by default.
              </p>
            </div>
          )}
        </div>

        {/* --- Status Message --- */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <p className="text-xs text-blue-800 font-medium">
            Waiting for first visit... Your dashboard will update automatically.
          </p>
        </div>

      </div>
    </Modal>
  );
};

export default ScriptModal;