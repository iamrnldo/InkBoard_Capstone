// src/components/common/Modal.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom"; // tambah ini
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showClose = true,
}) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-5xl",
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Pakai createPortal agar modal keluar dari stacking context manapun
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-lg"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizes[size]} bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
                    animate-scale-in border border-gray-100 dark:border-gray-700`}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between p-6 pb-0">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body, // render langsung ke body, bypass semua stacking context
  );
}
