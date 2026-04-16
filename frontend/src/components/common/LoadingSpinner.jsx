import React from "react";

export default function LoadingSpinner({ size = "md", className = "" }) {
  const s = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" }[size];
  return (
    <div
      className={`${s} ${className} animate-spin rounded-full border-2 border-gray-200 border-t-primary-500`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center">
          <span className="text-white text-2xl">✏️</span>
        </div>
        <LoadingSpinner size="md" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Loading Inkboard…
        </p>
      </div>
    </div>
  );
}
