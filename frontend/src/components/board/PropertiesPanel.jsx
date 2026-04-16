// src/components/board/PropertiesPanel.jsx
import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { X, ChevronDown } from "lucide-react";

const STROKE_WIDTHS = [1, 2, 4, 8];
const FONT_SIZES = [12, 14, 16, 20, 24, 32, 48];
const OPACITIES = [25, 50, 75, 100];

const COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#6366f1",
  "#06b6d4",
];

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(color)}
      className={`w-6 h-6 rounded-lg border-2 transition-transform hover:scale-110 active:scale-95
                  ${selected ? "border-primary-500 scale-110" : "border-transparent"}`}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold
                   uppercase tracking-wide text-gray-500 dark:text-gray-400
                   hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        {title}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function ColorPickerPopover({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
        {label}
      </label>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200
                   dark:border-gray-600 bg-white dark:bg-gray-800 text-sm w-full"
      >
        <div
          className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: value }}
        />
        <span className="text-gray-700 dark:text-gray-300 font-mono text-xs flex-1 text-left">
          {value}
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600">
          <HexColorPicker color={value} onChange={onChange} />
          <div className="grid grid-cols-6 gap-1 mt-2">
            {COLORS.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                selected={value === c}
                onClick={(v) => {
                  onChange(v);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-2 w-full text-xs text-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default function PropertiesPanel({
  selectedElements,
  onChange,
  onClose,
}) {
  const [props, setProps] = useState({
    strokeColor: "#000000",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    fontSize: 16,
    fontFamily: 1,
    textAlign: "left",
  });

  /* ── Sync from selected element ── */
  useEffect(() => {
    if (!selectedElements?.length) return;
    const el = selectedElements[0];
    setProps({
      strokeColor: el.strokeColor ?? "#000000",
      backgroundColor: el.backgroundColor ?? "transparent",
      fillStyle: el.fillStyle ?? "solid",
      strokeWidth: el.strokeWidth ?? 2,
      roughness: el.roughness ?? 1,
      opacity: el.opacity ?? 100,
      fontSize: el.fontSize ?? 16,
      fontFamily: el.fontFamily ?? 1,
      textAlign: el.textAlign ?? "left",
    });
  }, [selectedElements]);

  const update = (key, value) => {
    const next = { ...props, [key]: value };
    setProps(next);
    onChange?.(next);
  };

  const hasText = selectedElements?.some((el) =>
    ["text", "freedraw"].includes(el.type),
  );

  if (!selectedElements?.length) {
    return (
      <div className="w-60 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Properties
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400 text-center px-4">
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Properties
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stroke */}
      <Section title="Stroke">
        <ColorPickerPopover
          label="Stroke Color"
          value={props.strokeColor}
          onChange={(v) => update("strokeColor", v)}
        />
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Width
          </label>
          <div className="flex gap-1.5">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => update("strokeWidth", w)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                            ${
                              props.strokeWidth === w
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                                : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                            }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Fill */}
      <Section title="Fill">
        <ColorPickerPopover
          label="Background Color"
          value={
            props.backgroundColor === "transparent"
              ? "#ffffff"
              : props.backgroundColor
          }
          onChange={(v) => update("backgroundColor", v)}
        />
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Fill Style
          </label>
          <div className="grid grid-cols-3 gap-1">
            {["solid", "hachure", "cross-hatch"].map((style) => (
              <button
                key={style}
                onClick={() => update("fillStyle", style)}
                className={`py-1 rounded-lg text-[11px] font-medium border capitalize transition-colors
                            ${
                              props.fillStyle === style
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                                : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300"
                            }`}
              >
                {style === "cross-hatch" ? "cross" : style}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Opacity */}
      <Section title="Opacity">
        <div className="flex gap-1.5">
          {OPACITIES.map((o) => (
            <button
              key={o}
              onClick={() => update("opacity", o)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                          ${
                            props.opacity === o
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                              : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                          }`}
            >
              {o}%
            </button>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={props.opacity}
          onChange={(e) => update("opacity", Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </Section>

      {/* Roughness */}
      <Section title="Style">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Roughness
          </label>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((r) => (
              <button
                key={r}
                onClick={() => update("roughness", r)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                            ${
                              props.roughness === r
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                                : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300"
                            }`}
              >
                {["Smooth", "Normal", "Rough"][r]}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Text (only when text element selected) */}
      {hasText && (
        <Section title="Text">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Font Size
            </label>
            <select
              className="input-base text-sm"
              value={props.fontSize}
              onChange={(e) => update("fontSize", Number(e.target.value))}
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}px
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Align
            </label>
            <div className="flex gap-1.5">
              {["left", "center", "right"].map((a) => (
                <button
                  key={a}
                  onClick={() => update("textAlign", a)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors
                              ${
                                props.textAlign === a
                                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
                                  : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300"
                              }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
