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
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

    {/* MODAL ONLY (NO OVERLAY) */}
    <div
      className={`
        relative w-full ${sizes[size]}
        bg-white rounded-2xl
        shadow-[0_25px_80px_rgba(0,0,0,0.25)]
        border border-gray-100
        max-h-[90vh] overflow-hidden
        animate-[scaleIn_.18s_ease]
      `}
    >

      {/* HEADER */}
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-sm font-semibold text-gray-900">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* BODY */}
      <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
        {children}
      </div>

      {/* FOOTER */}
      {footer && (
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  </div>
);
};

export default Modal;