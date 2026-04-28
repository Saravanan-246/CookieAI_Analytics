import React, { useEffect } from "react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
}) => {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      const handleEsc = (e) => {
        if (e.key === "Escape") onClose();
      };

      window.addEventListener("keydown", handleEsc);

      return () => {
        window.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">

      {/* WRAPPER FOR PERFECT CENTERING */}
      <div className="w-full flex items-center justify-center">

        {/* MODAL */}
        <div
          className={`
            w-full ${sizes[size]}
            bg-white rounded-2xl
            border border-slate-200
            shadow-[0_20px_60px_rgba(0,0,0,0.15)]
            max-h-[85vh]
            flex flex-col
            overflow-hidden
            animate-[scaleIn_.18s_ease]
          `}
        >

          {/* HEADER */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
              <h3 className="text-sm font-semibold text-slate-900">
                {title}
              </h3>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* BODY */}
          <div className="px-6 py-5 overflow-y-auto flex-1 text-sm text-slate-700">
            {children}
          </div>

          {/* FOOTER */}
          {footer && (
            <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-2">
              {footer}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Modal;