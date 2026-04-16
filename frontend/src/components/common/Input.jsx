import React, { forwardRef } from "react";

const Input = forwardRef(
  (
    { label, error, hint, icon: Icon, type = "text", className = "", ...props },
    ref,
  ) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`input-base ${Icon ? "pl-10" : ""} ${error ? "border-red-400 focus:ring-red-400" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  ),
);

Input.displayName = "Input";
export default Input;
