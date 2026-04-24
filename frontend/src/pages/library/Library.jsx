// src/pages/library/Library.jsx
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Grid3X3,
  List,
  Plus,
  Download,
  Star,
  Layout,
  Code2,
  PenTool,
  Layers,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";
import { boardAPI } from "../../api";
import { generateAvatarUrl, PLAN_LIMITS } from "../../utils/helpers";
import toast from "react-hot-toast";

/* ── Template data (built-in library) ── */
const BUILT_IN_TEMPLATES = [
  {
    id: "flowchart-basic",
    title: "Basic Flowchart",
    description: "Simple flowchart with decision nodes",
    category: "diagram",
    icon: Layers,
    color: "from-blue-500 to-cyan-500",
    tags: ["flowchart", "diagram", "basic"],
    use_count: 1240,
    is_builtin: true,
  },
  {
    id: "wireframe-landing",
    title: "Landing Page Wireframe",
    description: "Clean landing page layout wireframe",
    category: "wireframe",
    icon: Layout,
    color: "from-purple-500 to-pink-500",
    tags: ["wireframe", "landing", "ui"],
    use_count: 980,
    is_builtin: true,
  },
  {
    id: "erd-basic",
    title: "Entity Relationship Diagram",
    description: "Database ERD template with tables",
    category: "diagram",
    icon: Code2,
    color: "from-green-500 to-emerald-500",
    tags: ["erd", "database", "diagram"],
    use_count: 756,
    is_builtin: true,
  },
  {
    id: "mindmap-basic",
    title: "Mind Map",
    description: "Central topic with branching ideas",
    category: "mindmap",
    icon: Star,
    color: "from-orange-500 to-yellow-500",
    tags: ["mindmap", "brainstorm", "ideas"],
    use_count: 2100,
    is_builtin: true,
  },
  {
    id: "kanban-board",
    title: "Kanban Board",
    description: "To-do, In Progress, Done columns",
    category: "planning",
    icon: Layers,
    color: "from-indigo-500 to-purple-500",
    tags: ["kanban", "planning", "agile"],
    use_count: 1560,
    is_builtin: true,
  },
  {
    id: "user-journey",
    title: "User Journey Map",
    description: "Map user experience from start to finish",
    category: "ux",
    icon: PenTool,
    color: "from-pink-500 to-rose-500",
    tags: ["ux", "journey", "user"],
    use_count: 432,
    is_builtin: true,
  },
  {
    id: "swot-analysis",
    title: "SWOT Analysis",
    description: "Strengths, Weaknesses, Opportunities, Threats",
    category: "planning",
    icon: Grid3X3,
    color: "from-teal-500 to-cyan-500",
    tags: ["swot", "analysis", "business"],
    use_count: 890,
    is_builtin: true,
  },
  {
    id: "wireframe-mobile",
    title: "Mobile App Wireframe",
    description: "Mobile app screens and navigation flow",
    category: "wireframe",
    icon: Layout,
    color: "from-violet-500 to-purple-500",
    tags: ["wireframe", "mobile", "app"],
    use_count: 670,
    is_builtin: true,
  },
];

const CATEGORIES = [
  { id: "", label: "All" },
  { id: "diagram", label: "Diagrams" },
  { id: "wireframe", label: "Wireframes" },
  { id: "mindmap", label: "Mind Maps" },
  { id: "planning", label: "Planning" },
  { id: "ux", label: "UX" },
];

/* ── Template Card ── */
function TemplateCard({ template, onUse, viewMode }) {
  const Icon = template.icon || BookOpen;

  if (viewMode === "list") {
    return (
      <div className="card px-4 py-3 flex items-center gap-4 hover:shadow-md transition-all duration-200 group">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
            {template.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {template.description}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400 hidden sm:block">
            {template.use_count?.toLocaleString()} uses
          </span>
          <Button size="sm" onClick={() => onUse(template)}>
            Use Template
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col">
      {/* Preview area */}
      <div
        className={`h-36 bg-gradient-to-br ${template.color} relative flex items-center justify-center`}
      >
        <Icon className="w-16 h-16 text-white/30" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <Button
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onUse(template)}
          >
            Use Template
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            {template.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-auto">
          {template.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Download className="w-3 h-3" />
            {template.use_count?.toLocaleString()}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium capitalize">
            {template.category}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Use Template Modal ── */
function UseTemplateModal({ template, onClose, onConfirm }) {
  const [boardName, setBoardName] = useState(template?.title || "");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(template, boardName);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Use Template" size="sm">
      <div className="space-y-4">
        <div
          className={`h-24 rounded-xl bg-gradient-to-br ${template?.color} flex items-center justify-center`}
        >
          {template?.icon && (
            <template.icon className="w-12 h-12 text-white/50" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {template?.title}
          </p>
          <p className="text-xs text-gray-400">{template?.description}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Board Name
          </label>
          <input
            className="input-base"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="My Board"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={loading} onClick={handleConfirm}>
            Create Board
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Main Library Page ── */
export default function Library() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  const canUseLibrary = PLAN_LIMITS[user?.plan]?.library !== false;

  /* ── Filter templates ── */
  const filtered = BUILT_IN_TEMPLATES.filter((t) => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags?.some((tag) => tag.includes(search.toLowerCase()));
    const matchCategory = !category || t.category === category;
    return matchSearch && matchCategory;
  });

  /* ── Use template: create board with template data ── */
  const handleUseTemplate = async (template, boardName) => {
    try {
      // Built-in templates use empty canvas (just sets the title)
      const { data } = await boardAPI.createBoard({
        title: boardName || template.title,
        description: template.description,
        canvas_data: getTemplateCanvas(template.id),
      });
      toast.success(`Board "${boardName}" created from template!`);
      navigate(`/board/${data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create board");
    }
  };

  /* ── Minimal canvas data per template ── */
  const getTemplateCanvas = (templateId) => {
    const base = {
      appState: { viewBackgroundColor: "#ffffff" },
      files: {},
    };

    const templates = {
      "flowchart-basic": {
        ...base,
        elements: [
          {
            id: "start",
            type: "ellipse",
            x: 300,
            y: 50,
            width: 120,
            height: 50,
            strokeColor: "#6366f1",
            backgroundColor: "#eef2ff",
            fillStyle: "solid",
            strokeWidth: 2,
            roughness: 0,
            opacity: 100,
          },
          {
            id: "start-text",
            type: "text",
            x: 330,
            y: 65,
            width: 60,
            height: 20,
            text: "Start",
            strokeColor: "#4338ca",
            fontSize: 14,
            fontFamily: 1,
          },
          {
            id: "process",
            type: "rectangle",
            x: 280,
            y: 160,
            width: 160,
            height: 60,
            strokeColor: "#6366f1",
            backgroundColor: "#eef2ff",
            fillStyle: "solid",
            strokeWidth: 2,
            roughness: 0,
            opacity: 100,
          },
          {
            id: "process-text",
            type: "text",
            x: 300,
            y: 182,
            width: 120,
            height: 20,
            text: "Process",
            strokeColor: "#4338ca",
            fontSize: 14,
            fontFamily: 1,
          },
          {
            id: "decision",
            type: "diamond",
            x: 270,
            y: 280,
            width: 180,
            height: 80,
            strokeColor: "#8b5cf6",
            backgroundColor: "#f5f3ff",
            fillStyle: "solid",
            strokeWidth: 2,
            roughness: 0,
            opacity: 100,
          },
          {
            id: "decision-text",
            type: "text",
            x: 300,
            y: 312,
            width: 120,
            height: 20,
            text: "Decision?",
            strokeColor: "#6d28d9",
            fontSize: 14,
            fontFamily: 1,
          },
          {
            id: "end",
            type: "ellipse",
            x: 300,
            y: 420,
            width: 120,
            height: 50,
            strokeColor: "#6366f1",
            backgroundColor: "#eef2ff",
            fillStyle: "solid",
            strokeWidth: 2,
            roughness: 0,
            opacity: 100,
          },
          {
            id: "end-text",
            type: "text",
            x: 335,
            y: 437,
            width: 50,
            height: 20,
            text: "End",
            strokeColor: "#4338ca",
            fontSize: 14,
            fontFamily: 1,
          },
        ],
      },
      "mindmap-basic": {
        ...base,
        elements: [
          {
            id: "center",
            type: "ellipse",
            x: 300,
            y: 250,
            width: 160,
            height: 80,
            strokeColor: "#6366f1",
            backgroundColor: "#6366f1",
            fillStyle: "solid",
            strokeWidth: 2,
            roughness: 0,
            opacity: 100,
          },
          {
            id: "center-text",
            type: "text",
            x: 330,
            y: 280,
            width: 100,
            height: 20,
            text: "Main Topic",
            strokeColor: "#ffffff",
            fontSize: 16,
            fontFamily: 1,
          },
          ...[
            { x: 80, y: 120, label: "Idea 1", color: "#8b5cf6" },
            { x: 560, y: 120, label: "Idea 2", color: "#06b6d4" },
            { x: 80, y: 360, label: "Idea 3", color: "#10b981" },
            { x: 560, y: 360, label: "Idea 4", color: "#f59e0b" },
          ].flatMap((item, i) => [
            {
              id: `branch-${i}`,
              type: "rectangle",
              x: item.x,
              y: item.y,
              width: 130,
              height: 50,
              strokeColor: item.color,
              backgroundColor: item.color + "20",
              fillStyle: "solid",
              strokeWidth: 2,
              roughness: 0,
              opacity: 100,
            },
            {
              id: `branch-text-${i}`,
              type: "text",
              x: item.x + 20,
              y: item.y + 15,
              width: 90,
              height: 20,
              text: item.label,
              strokeColor: item.color,
              fontSize: 14,
              fontFamily: 1,
            },
          ]),
        ],
      },
      "kanban-board": {
        ...base,
        elements: [
          ...[
            { x: 50, label: "📋 To Do", color: "#6366f1" },
            { x: 320, label: "⚡ In Progress", color: "#f59e0b" },
            { x: 590, label: "✅ Done", color: "#10b981" },
          ].flatMap((col, ci) => [
            {
              id: `col-${ci}`,
              type: "rectangle",
              x: col.x,
              y: 30,
              width: 240,
              height: 500,
              strokeColor: col.color,
              backgroundColor: col.color + "10",
              fillStyle: "solid",
              strokeWidth: 2,
              roughness: 0,
              opacity: 100,
            },
            {
              id: `col-title-${ci}`,
              type: "text",
              x: col.x + 10,
              y: 45,
              width: 200,
              height: 25,
              text: col.label,
              strokeColor: col.color,
              fontSize: 16,
              fontFamily: 1,
            },
            ...[0, 1].map((ri) => ({
              id: `card-${ci}-${ri}`,
              type: "rectangle",
              x: col.x + 10,
              y: 90 + ri * 80,
              width: 220,
              height: 60,
              strokeColor: "#e5e7eb",
              backgroundColor: "#ffffff",
              fillStyle: "solid",
              strokeWidth: 1,
              roughness: 0,
              opacity: 100,
            })),
          ]),
        ],
      },
      "swot-analysis": {
        ...base,
        elements: [
          ...[
            {
              x: 50,
              y: 50,
              label: "💪 Strengths",
              color: "#10b981",
              bg: "#d1fae5",
            },
            {
              x: 420,
              y: 50,
              label: "⚠️ Weaknesses",
              color: "#ef4444",
              bg: "#fee2e2",
            },
            {
              x: 50,
              y: 320,
              label: "🚀 Opportunities",
              color: "#3b82f6",
              bg: "#dbeafe",
            },
            {
              x: 420,
              y: 320,
              label: "⚡ Threats",
              color: "#f59e0b",
              bg: "#fef3c7",
            },
          ].flatMap((quad, i) => [
            {
              id: `quad-${i}`,
              type: "rectangle",
              x: quad.x,
              y: quad.y,
              width: 350,
              height: 250,
              strokeColor: quad.color,
              backgroundColor: quad.bg,
              fillStyle: "solid",
              strokeWidth: 2,
              roughness: 0,
              opacity: 100,
            },
            {
              id: `quad-title-${i}`,
              type: "text",
              x: quad.x + 15,
              y: quad.y + 15,
              width: 250,
              height: 25,
              text: quad.label,
              strokeColor: quad.color,
              fontSize: 16,
              fontFamily: 1,
            },
          ]),
        ],
      },
    };

    return templates[templateId] || { ...base, elements: [] };
  };

  if (!canUseLibrary) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 text-center">
        <Lock className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Library Locked
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Upgrade your plan to access the template library.
        </p>
        <Button onClick={() => navigate("/billing")}>Upgrade Plan</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-500" />
            InkBoard Library
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filtered.length} templates available
          </p>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9 w-full sm:w-56"
          />
        </div>

        {/* View toggle */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-white dark:bg-gray-700 shadow text-primary-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-white dark:bg-gray-700 shadow text-primary-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                        ${
                          category === cat.id
                            ? "gradient-brand text-white shadow"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates grid/list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No templates found for "{search}"
          </p>
          <button
            onClick={() => {
              setSearch("");
              setCategory("");
            }}
            className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode="grid"
              onUse={setSelectedTemplate}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode="list"
              onUse={setSelectedTemplate}
            />
          ))}
        </div>
      )}

      {/* Use Template Modal */}
      {selectedTemplate && (
        <UseTemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onConfirm={handleUseTemplate}
        />
      )}
    </div>
  );
}
