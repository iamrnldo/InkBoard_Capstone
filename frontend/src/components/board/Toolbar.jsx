// src/components/board/Toolbar.jsx
import React, { useState } from "react";
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  ArrowRight,
  Type,
  Image,
  Pencil,
  Eraser,
  Minus,
  Diamond,
  Triangle,
  Lock,
  Unlock,
  LayoutTemplate,
  Code2,
  Crosshair,
  Lasso,
  Wand2,
  ChevronDown,
  Globe,
  Layers,
  Zap,
  ZapOff,
} from "lucide-react";
import useAuthStore from "../../store/authStore";

const DRAW_TOOLS = [
  { id: "pen", label: "Pen", icon: Pencil },
  { id: "pencil", label: "Pencil", icon: Pencil },
  { id: "marker", label: "Marker", icon: Pencil },
];

const AI_TOOLS = [
  { id: "text-to-diagram", label: "Text to Diagram" },
  { id: "mermaid-to-inkboard", label: "Mermaid to InkBoard" },
  { id: "wireframe-to-code", label: "Wireframe to Code" },
];

function ToolButton({
  tool,
  active,
  onClick,
  locked,
  children,
  tooltip,
  disabled = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip || tool}
      className={`
        relative group flex items-center justify-center w-9 h-9 rounded-xl
        transition-all duration-150 active:scale-90
        disabled:opacity-40 disabled:cursor-not-allowed
        ${
          active
            ? "bg-primary-500 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/40"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }
      `}
    >
      {children}
      {locked && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
          <Lock className="w-2 h-2 text-white" />
        </span>
      )}
    </button>
  );
}

function Divider() {
  return <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1" />;
}

function DropdownMenu({ children, items, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div onClick={() => setOpen((o) => !o)}>{children}</div>
      {open && (
        <div
          className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-gray-800 rounded-xl
                        shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Toolbar({
  activeTool,
  onToolChange,
  onDrawToolChange,
  activeDrawTool = "pen",
  lockedTool,
  onToggleLock,
  onInsertImage,
  onOpenAI,
  onOpenEmbed,
  onOpenFrame,
  onToggleLaser,
  laserActive,
  isReadOnly = false,
}) {
  const { user } = useAuthStore();
  const isPremium = user?.plan === "premium";
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);

  const mainTools = [
    {
      id: "hand",
      icon: Hand,
      tooltip: "Hand (H) – Pan canvas",
      group: "navigate",
    },
    {
      id: "selection",
      icon: MousePointer2,
      tooltip: "Selection (V)",
      group: "navigate",
    },
    { divider: true },
    {
      id: "rectangle",
      icon: Square,
      tooltip: "Rectangle (R)",
      group: "shape",
    },
    {
      id: "ellipse",
      icon: Circle,
      tooltip: "Ellipse (E)",
      group: "shape",
    },
    {
      id: "diamond",
      icon: Diamond,
      tooltip: "Diamond (D)",
      group: "shape",
    },
    {
      id: "triangle",
      icon: Triangle,
      tooltip: "Triangle",
      group: "shape",
    },
    { divider: true },
    {
      id: "arrow",
      icon: ArrowRight,
      tooltip: "Arrow (A)",
      group: "connector",
    },
    {
      id: "line",
      icon: Minus,
      tooltip: "Line (L)",
      group: "connector",
    },
    { divider: true },
    {
      id: "text",
      icon: Type,
      tooltip: "Text (T)",
      group: "content",
    },
    {
      id: "image",
      icon: Image,
      tooltip: "Image",
      group: "content",
      onClick: onInsertImage,
    },
    { divider: true },
    {
      id: "eraser",
      icon: Eraser,
      tooltip: "Eraser (E)",
      group: "edit",
    },
  ];

  return (
    <div
      className="fixed left-4 top-1/2 -translate-y-1/2 z-30
                    bg-white dark:bg-gray-800 rounded-2xl shadow-xl
                    border border-gray-200 dark:border-gray-700
                    flex flex-col items-center p-2 gap-0.5"
      style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
    >
      {mainTools.map((tool, i) => {
        if (tool.divider) return <Divider key={`div-${i}`} />;
        const Icon = tool.icon;
        return (
          <ToolButton
            key={tool.id}
            tool={tool.id}
            active={activeTool === tool.id && !lockedTool}
            locked={lockedTool === tool.id}
            tooltip={tool.tooltip}
            disabled={isReadOnly && tool.group !== "navigate"}
            onClick={() => {
              if (tool.onClick) {
                tool.onClick();
              } else {
                onToolChange(tool.id);
              }
            }}
          >
            <Icon className="w-4 h-4" />
          </ToolButton>
        );
      })}

      {/* ── Draw tool (with sub-menu) ── */}
      <Divider />
      <div className="relative">
        <DropdownMenu
          items={DRAW_TOOLS}
          onSelect={(t) => {
            onDrawToolChange?.(t.id);
            onToolChange("freedraw");
          }}
        >
          <ToolButton
            tool="freedraw"
            active={activeTool === "freedraw"}
            tooltip="Draw – click arrow for brush type"
            disabled={isReadOnly}
          >
            <Pencil className="w-4 h-4" />
          </ToolButton>
        </DropdownMenu>
      </div>

      {/* ── Lock tool ── */}
      <ToolButton
        tool="lock"
        active={!!lockedTool}
        tooltip="Lock selected tool"
        onClick={onToggleLock}
        disabled={isReadOnly}
      >
        {lockedTool ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Unlock className="w-4 h-4" />
        )}
      </ToolButton>

      {/* ── More tools ── */}
      <Divider />
      <div className="relative">
        <ToolButton
          tool="more"
          active={moreOpen}
          tooltip="More tools"
          onClick={() => setMoreOpen((o) => !o)}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
          />
        </ToolButton>

        {moreOpen && (
          <div
            className="absolute left-full top-0 ml-2 w-52 bg-white dark:bg-gray-800 rounded-2xl
                          shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden p-1.5"
          >
            {/* Frame */}
            <MoreToolItem
              icon={LayoutTemplate}
              label="Frame Tool"
              onClick={() => {
                onOpenFrame?.();
                setMoreOpen(false);
              }}
            />

            {/* Lasso */}
            <MoreToolItem
              icon={Lasso}
              label="Lasso Selection"
              onClick={() => {
                onToolChange("lasso");
                setMoreOpen(false);
              }}
            />

            {/* Laser pointer */}
            <MoreToolItem
              icon={Crosshair}
              label={laserActive ? "Laser: ON" : "Laser Pointer"}
              active={laserActive}
              onClick={() => {
                onToggleLaser?.();
                setMoreOpen(false);
              }}
            />

            {/* Web Embed */}
            <MoreToolItem
              icon={Globe}
              label="Web Embed"
              onClick={() => {
                onOpenEmbed?.();
                setMoreOpen(false);
              }}
            />

            {/* Layers */}
            <MoreToolItem
              icon={Layers}
              label="Frame / Layers"
              onClick={() => {
                onOpenFrame?.();
                setMoreOpen(false);
              }}
            />

            {/* Code embed */}
            <MoreToolItem
              icon={Code2}
              label="Code Block"
              onClick={() => {
                onToolChange("code");
                setMoreOpen(false);
              }}
            />

            {/* ── AI Generate sub-section ── */}
            <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                AI Generate
              </p>
              {AI_TOOLS.map((ai) => (
                <MoreToolItem
                  key={ai.id}
                  icon={isPremium ? Wand2 : ZapOff}
                  label={ai.label}
                  badge={!isPremium ? "Premium" : null}
                  onClick={() => {
                    if (!isPremium) return;
                    onOpenAI?.(ai.id);
                    setMoreOpen(false);
                  }}
                  disabled={!isPremium}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MoreToolItem({ icon: Icon, label, onClick, active, badge, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm
        transition-colors text-left
        ${
          disabled
            ? "opacity-50 cursor-not-allowed text-gray-400"
            : active
              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        }
      `}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
          {badge}
        </span>
      )}
    </button>
  );
}
