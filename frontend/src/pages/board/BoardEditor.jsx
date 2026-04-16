// src/pages/board/BoardEditor.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Share2,
  Wifi,
  WifiOff,
  Wand2,
  X,
  Send,
} from "lucide-react";
import { io } from "socket.io-client";
import { useBoardEditor } from "../../hooks/useBoard";
import useAuthStore from "../../store/authStore";
import { boardAPI, aiAPI } from "../../api";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import LoadingSpinner, {
  PageLoader,
} from "../../components/common/LoadingSpinner";
import CollaboratorCursors from "../../components/board/CollaboratorCursors";
import { generateAvatarUrl, canUseAI, canShareEdit } from "../../utils/helpers";
import toast from "react-hot-toast";

const ExcalidrawComponent = lazy(() =>
  import("@excalidraw/excalidraw").then((m) => ({ default: m.Excalidraw })),
);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

/* ─────────────────────────────────────────────────────────────
   Helper: sanitize appState agar aman untuk Excalidraw
   - collaborators harus Map (bukan object/array)
   - buang field yang bisa bikin crash
───────────────────────────────────────────────────────────── */
function sanitizeAppState(appState = {}) {
  // Collaborators HARUS berupa Map
  let collaborators = appState.collaborators;

  if (!collaborators || Array.isArray(collaborators)) {
    // Array atau null → konversi ke Map kosong
    collaborators = new Map();
  } else if (collaborators instanceof Map) {
    // Sudah Map → biarkan
    collaborators = collaborators;
  } else if (typeof collaborators === "object") {
    // Plain object → konversi ke Map
    try {
      collaborators = new Map(Object.entries(collaborators));
    } catch (_) {
      collaborators = new Map();
    }
  } else {
    collaborators = new Map();
  }

  return {
    // Safe defaults
    viewBackgroundColor: appState.viewBackgroundColor ?? "#ffffff",
    currentItemFontFamily: appState.currentItemFontFamily ?? 1,
    // Spread sisanya tapi timpa collaborators
    ...appState,
    // WAJIB Map
    collaborators,
  };
}

/* ─────────────────────────────────────────────────────────────
   Share Modal
───────────────────────────────────────────────────────────── */
function ShareModal({ board, user, onClose }) {
  const [allowEdit, setAllowEdit] = useState(board?.allow_edit || false);
  const [shareData, setShareData] = useState(
    board?.share_token
      ? {
          shareUrl: `${window.location.origin}/board/share/${board.share_token}`,
          allowEdit: board.allow_edit,
        }
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasEditPlan = canShareEdit(user?.plan);

  const generateLink = async () => {
    setLoading(true);
    try {
      const { data } = await boardAPI.shareBoard(board.id, {
        allow_edit: allowEdit,
      });
      setShareData(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(shareData.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  return (
    <Modal isOpen onClose={onClose} title="Share Board" size="md">
      <div className="space-y-4">
        {shareData ? (
          <>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareData.shareUrl}
                className="input-base text-sm flex-1 font-mono"
              />
              <Button onClick={copy} variant={copied ? "secondary" : "primary"}>
                {copied ? "✓ Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              {shareData.allowEdit
                ? "✏️ Anyone with this link can view and edit."
                : "👁 Anyone with this link can view only."}
            </p>
            <Button
              variant="secondary"
              fullWidth
              onClick={generateLink}
              loading={loading}
            >
              Regenerate Link
            </Button>
          </>
        ) : (
          <>
            {hasEditPlan && (
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowEdit}
                  onChange={(e) => setAllowEdit(e.target.checked)}
                  className="w-4 h-4 accent-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allow editing
                  </p>
                  <p className="text-xs text-gray-400">
                    Collaborators can make changes.
                  </p>
                </div>
              </label>
            )}
            {!hasEditPlan && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                💡 Upgrade to Pro or Premium for edit-access sharing.
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button loading={loading} onClick={generateLink} icon={Share2}>
                Create Link
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   AI Panel
───────────────────────────────────────────────────────────── */
function AIPanel({ boardId, excalidrawAPI, onClose }) {
  const [activeTab, setActiveTab] = useState("text-to-diagram");
  const [prompt, setPrompt] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [framework, setFramework] = useState("react");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const tabs = [
    { id: "text-to-diagram", label: "Text → Diagram" },
    { id: "mermaid-to-inkboard", label: "Mermaid → Board" },
    { id: "wireframe-to-code", label: "Wireframe → Code" },
  ];

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (activeTab === "text-to-diagram") {
        res = await aiAPI.textToDiagram({ prompt, board_id: boardId });
        const diagram = res.data.data.diagram;
        if (excalidrawAPI && diagram?.elements?.length > 0) {
          excalidrawAPI.updateScene({
            elements: [
              ...(excalidrawAPI.getSceneElements() || []),
              ...diagram.elements,
            ],
          });
          toast.success("Diagram added to canvas!");
        }
        setResult({ type: "diagram", data: diagram });
      } else if (activeTab === "mermaid-to-inkboard") {
        res = await aiAPI.mermaidToInkboard({
          mermaid_code: mermaidCode,
          board_id: boardId,
        });
        const diagram = res.data.data.diagram;
        if (excalidrawAPI && diagram?.elements?.length > 0) {
          excalidrawAPI.updateScene({
            elements: [
              ...(excalidrawAPI.getSceneElements() || []),
              ...diagram.elements,
            ],
          });
          toast.success("Mermaid diagram converted!");
        }
        setResult({ type: "diagram", data: diagram });
      } else {
        const canvasData = {
          elements: excalidrawAPI?.getSceneElements() || [],
        };
        res = await aiAPI.wireframeToCode({
          canvas_data: canvasData,
          framework,
          description,
          board_id: boardId,
        });
        setResult({ type: "code", data: res.data.data.code });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (result?.data) {
      navigator.clipboard.writeText(result.data);
      toast.success("Code copied!");
    }
  };

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800
                    border-l border-gray-200 dark:border-gray-700
                    flex flex-col z-20 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            AI InkBoard
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResult(null);
            }}
            className={`flex-1 px-2 py-2.5 text-xs font-semibold transition-colors border-b-2
                        ${
                          activeTab === tab.id
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
                        }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === "text-to-diagram" && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Describe a diagram and AI will generate it on your canvas.
            </p>
            <textarea
              className="input-base resize-none text-sm"
              rows={5}
              placeholder="e.g. A login flow with user → login page → dashboard..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </>
        )}

        {activeTab === "mermaid-to-inkboard" && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paste Mermaid syntax to convert it to Inkboard elements.
            </p>
            <textarea
              className="input-base resize-none text-sm font-mono"
              rows={7}
              placeholder={
                "graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[End]\n  B -->|No| A"
              }
              value={mermaidCode}
              onChange={(e) => setMermaidCode(e.target.value)}
            />
          </>
        )}

        {activeTab === "wireframe-to-code" && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI reads your canvas wireframe and generates UI code.
            </p>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                Framework
              </label>
              <select
                className="input-base text-sm"
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
              >
                <option value="react">React + Tailwind</option>
                <option value="html">HTML + Tailwind</option>
                <option value="vue">Vue + Tailwind</option>
              </select>
            </div>
            <textarea
              className="input-base resize-none text-sm"
              rows={3}
              placeholder="Optional: describe this wireframe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </>
        )}

        {/* Result */}
        {result && (
          <div className="mt-2">
            {result.type === "code" ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Generated Code
                  </p>
                  <button
                    onClick={copyCode}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Copy
                  </button>
                </div>
                <pre className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-xs overflow-auto max-h-48 font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {result.data}
                </pre>
              </div>
            ) : (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                  ✓ Added to canvas ({result.data?.elements?.length || 0}{" "}
                  elements)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <Button fullWidth loading={loading} onClick={run} icon={Send}>
          Generate
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Board Editor (Main)
───────────────────────────────────────────────────────────── */
export default function BoardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    board,
    isLoading,
    isConnected,
    isSaving,
    activeUsers,
    broadcastChange,
    broadcastCursor,
    scheduleAutoSave,
    saveNow,
    updateTitle,
  } = useBoardEditor(id);

  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const socketRef = useRef(null);
  const titleRef = useRef(null);

  /* ── Socket.io ── */
  useEffect(() => {
    if (!id || !user) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-board", {
        boardId: id,
        userId: user.id,
        username: user.username,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, user]);

  /* ── Remote canvas update ── */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !excalidrawAPI) return;

    const handler = ({ elements, from }) => {
      if (from === socket.id) return;
      try {
        excalidrawAPI.updateScene({ elements });
      } catch (_) {}
    };

    socket.on("canvas-update", handler);
    return () => socket.off("canvas-update", handler);
  }, [excalidrawAPI]);

  /* ── Canvas onChange ── */
  const handleChange = useCallback(
    (elements, appState, files) => {
      // Strip collaborators (Map) sebelum simpan ke DB
      // karena Map tidak bisa di-JSON.stringify dengan benar
      const { collaborators: _c, ...safeAppState } = appState;
      const canvasData = { elements, appState: safeAppState, files };
      scheduleAutoSave(canvasData);
      broadcastChange(elements, appState);
    },
    [scheduleAutoSave, broadcastChange],
  );

  /* ── Ctrl+S ── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (excalidrawAPI) {
          const elements = excalidrawAPI.getSceneElements();
          const appState = excalidrawAPI.getAppState();
          const files = excalidrawAPI.getFiles();
          // Strip collaborators sebelum save
          const { collaborators: _c, ...safeAppState } = appState;
          saveNow({ elements, appState: safeAppState, files });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [excalidrawAPI, saveNow]);

  /* ── Title ── */
  const startEditTitle = () => {
    setTitleDraft(board?.title || "");
    setEditingTitle(true);
    setTimeout(() => titleRef.current?.select(), 50);
  };

  const saveTitle = async () => {
    setEditingTitle(false);
    if (titleDraft && titleDraft !== board?.title) {
      await updateTitle(titleDraft);
    }
  };

  /* ── Permissions ── */
  const isOwner = board?.user_id === user?.id;
  const hasEditPerm =
    isOwner ||
    (Array.isArray(board?.collaborators) &&
      board.collaborators.some(
        (c) => c.id === user?.id && ["edit", "admin"].includes(c.permission),
      ));
  const isReadOnly = !hasEditPerm && !board?.allow_edit;

  if (isLoading || !board) return <PageLoader />;

  /* ── Build safe initialData ── */
  const initialData = {
    elements: board.canvas_data?.elements ?? [],
    // ✅ Sanitize appState: pastikan collaborators adalah Map
    appState: sanitizeAppState(board.canvas_data?.appState ?? {}),
    files: board.canvas_data?.files ?? {},
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-950">
      {/* ── Top Bar ── */}
      <div
        className="h-12 bg-white dark:bg-gray-900 border-b border-gray-200
                      dark:border-gray-700 flex items-center px-3 gap-2 z-20 flex-shrink-0"
      >
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Logo */}
        <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs">✏️</span>
        </div>

        {/* Title */}
        {editingTitle ? (
          <input
            ref={titleRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") setEditingTitle(false);
            }}
            className="text-sm font-semibold bg-transparent border-b border-primary-500
                       outline-none text-gray-800 dark:text-gray-200 max-w-[200px] px-1"
          />
        ) : (
          <button
            onClick={!isReadOnly ? startEditTitle : undefined}
            className={`text-sm font-semibold text-gray-700 dark:text-gray-300
                       truncate max-w-[200px]
                       ${!isReadOnly ? "hover:text-gray-900 dark:hover:text-white cursor-text" : "cursor-default"}`}
          >
            {board.title}
          </button>
        )}

        {/* Saving indicator */}
        {isSaving && (
          <span className="text-xs text-gray-400 flex items-center gap-1 ml-1">
            <LoadingSpinner size="sm" />
            Saving…
          </span>
        )}

        <div className="flex-1" />

        {/* Connection */}
        <div className="flex items-center gap-1 text-xs">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500 hidden sm:block">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-400 hidden sm:block">Offline</span>
            </>
          )}
        </div>

        {/* Active users */}
        {activeUsers.length > 0 && (
          <div className="hidden sm:flex items-center -space-x-2">
            {activeUsers.slice(0, 4).map((u) => (
              <img
                key={u.socketId}
                src={generateAvatarUrl(u.username)}
                alt={u.username}
                title={u.username}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
              />
            ))}
            {activeUsers.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-gray-500">
                  +{activeUsers.length - 4}
                </span>
              </div>
            )}
          </div>
        )}

        {/* AI button */}
        {canUseAI(user?.plan) && (
          <button
            onClick={() => setShowAI((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                        text-xs font-semibold transition-colors
                        ${
                          showAI
                            ? "gradient-brand text-white"
                            : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100"
                        }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            AI
          </button>
        )}

        {/* Share */}
        {isOwner && (
          <Button
            size="sm"
            variant="outline"
            icon={Share2}
            onClick={() => setShowShare(true)}
          >
            Share
          </Button>
        )}

        {/* Save */}
        {!isReadOnly && (
          <Button
            size="sm"
            icon={Save}
            onClick={() => {
              if (excalidrawAPI) {
                const elements = excalidrawAPI.getSceneElements();
                const appState = excalidrawAPI.getAppState();
                const files = excalidrawAPI.getFiles();
                const { collaborators: _c, ...safeAppState } = appState;
                saveNow({ elements, appState: safeAppState, files });
              }
            }}
          >
            Save
          </Button>
        )}
      </div>

      {/* ── Canvas + AI Panel ── */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 min-w-0 relative">
          <Suspense fallback={<PageLoader />}>
            <ExcalidrawComponent
              ref={setExcalidrawAPI}
              initialData={initialData}
              onChange={handleChange}
              viewModeEnabled={isReadOnly}
              UIOptions={{
                canvasActions: {
                  changeViewBackgroundColor: !isReadOnly,
                  clearCanvas: !isReadOnly,
                  export: { saveFileToDisk: true },
                  loadScene: !isReadOnly,
                  saveToActiveFile: false,
                  toggleTheme: true,
                  saveAsImage: true,
                },
                tools: {
                  image: !isReadOnly,
                },
              }}
            />
          </Suspense>
          <CollaboratorCursors socket={socketRef.current} boardId={id} />
        </div>

        {showAI && (
          <AIPanel
            boardId={id}
            excalidrawAPI={excalidrawAPI}
            onClose={() => setShowAI(false)}
          />
        )}
      </div>

      {/* Modals */}
      {showShare && (
        <ShareModal
          board={board}
          user={user}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
