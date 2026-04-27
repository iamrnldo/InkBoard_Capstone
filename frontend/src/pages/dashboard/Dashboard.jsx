  // src/pages/dashboard/Dashboard.jsx
  import React, { useState, useCallback } from "react";
  import { useNavigate } from "react-router-dom";
  import {
    Plus,
    Search,
    Grid3X3,
    List,
    MoreHorizontal,
    Trash2,
    Copy,
    Share2,
    Globe,
    Lock,
    Clock,
    PenTool,
  } from "lucide-react";
  import { useBoards } from "../../hooks/useBoard";
  import useAuthStore from "../../store/authStore";
  import Button from "../../components/common/Button";
  import Modal from "../../components/common/Modal";
  import Input from "../../components/common/Input";
  import LoadingSpinner from "../../components/common/LoadingSpinner";
  import {
    timeAgo,
    truncate,
    generateAvatarUrl,
    PLAN_LIMITS,
  } from "../../utils/helpers";
  import { boardAPI } from "../../api";
  import toast from "react-hot-toast";

  /* ─────────────────────────────────────────────────────────────
    Board Menu
  ───────────────────────────────────────────────────────────── */
  function BoardMenu({ items, onClose }) {
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-gray-800
                        rounded-xl shadow-xl border border-gray-100 dark:border-gray-700
                        overflow-hidden animate-scale-in"
        >
          {items.map((item, i) => {
            if (item.divider)
              return (
                <div
                  key={`d-${i}`}
                  className="my-1 border-t border-gray-100 dark:border-gray-700"
                />
              );
            return (
              <button
                key={item.label}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors
                            ${
                              item.danger
                                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </>
    );
  }

// src/pages/dashboard/Dashboard.jsx

// Tambah komponen LastUsedBoard di atas BoardCard
function LastUsedBoard({ board, onDelete, onDuplicate, onShare }) {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" /> Last Opened
      </p>
      <div
        className="card hover:shadow-xl transition-all duration-300 cursor-pointer group
                   flex flex-col sm:flex-row overflow-hidden"
        onClick={() => navigate(`/board/${board.id}`)}
      >
        {/* Thumbnail */}
        <div className="sm:w-72 h-40 sm:h-auto bg-gradient-to-br from-gray-50 to-gray-100
                        dark:from-gray-700 dark:to-gray-800 relative overflow-hidden
                        flex items-center justify-center flex-shrink-0">
          {board.thumbnail_url ? (
            <img
              src={board.thumbnail_url}
              alt={board.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-10">
              <PenTool className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200
                          flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white
                             text-sm font-semibold bg-black/50 px-4 py-2 rounded-xl">
              Open Board
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {board.title}
              </h3>
              {board.is_public ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full
                                 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400
                                 flex items-center gap-1 flex-shrink-0">
                  <Globe className="w-3 h-3" /> Public
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full
                                 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400
                                 flex items-center gap-1 flex-shrink-0">
                  <Lock className="w-3 h-3" /> Private
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Last edited {timeAgo(board.updated_at)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              onClick={() => navigate(`/board/${board.id}`)}
              icon={PenTool}
            >
              Open
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={Copy}
              onClick={() => onDuplicate(board.id)}
            >
              Duplicate
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={Share2}
              onClick={() => onShare(board)}
            >
              Share
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={Trash2}
              onClick={() => onDelete(board.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

  /* ─────────────────────────────────────────────────────────────
    Board Card
  ───────────────────────────────────────────────────────────── */
  function BoardCard({ board, onDelete, onDuplicate, onShare, viewMode }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const menuItems = [
      {
        icon: Copy,
        label: "Duplicate",
        onClick: () => onDuplicate(board.id),
      },
      {
        icon: Share2,
        label: "Share",
        onClick: () => onShare(board),
      },
      { divider: true },
      {
        icon: Trash2,
        label: "Delete",
        onClick: () => onDelete(board.id),
        danger: true,
      },
    ];

    /* ── List mode ── */
    if (viewMode === "list") {
      return (
        <div
          className="card px-4 py-3 flex items-center gap-4 hover:shadow-md
                    transition-all duration-200 cursor-pointer group"
          onClick={() => navigate(`/board/${board.id}`)}
        >
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
              {board.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {timeAgo(board.updated_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {board.is_public ? (
              <Globe className="w-4 h-4 text-green-500" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                          hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0
                          group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <BoardMenu items={menuItems} onClose={() => setMenuOpen(false)} />
              )}
            </div>
          </div>
        </div>
      );
    }

    /* ── Grid mode ── */
    return (
      <div
        className="card hover:shadow-lg transition-all duration-200
                  cursor-pointer group flex flex-col"
        onClick={() => navigate(`/board/${board.id}`)}
      >
        {/* Thumbnail */}
        <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden flex items-center justify-center">
          {board.thumbnail_url ? (
            <img
              src={board.thumbnail_url}
              alt={board.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20">
              <PenTool className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold bg-black/50 px-3 py-1.5 rounded-lg">
              Open Board
            </span>
          </div>

          {/* Visibility badge */}
          <div className="absolute top-2 right-2">
            {board.is_public ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Public
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
              {truncate(board.title, 28)}
            </p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(board.updated_at)}
            </p>
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <BoardMenu items={menuItems} onClose={() => setMenuOpen(false)} />
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
    Share Modal
  ───────────────────────────────────────────────────────────── */
  function ShareModal({ board, onClose }) {
    const { user } = useAuthStore();
    const canEdit = ["pro", "premium"].includes(user?.plan);
    const [allowEdit, setAllowEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [copied, setCopied] = useState(false);

    const share = async () => {
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

    const copyLink = () => {
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
                  className="input-base text-sm flex-1"
                />
                <Button
                  onClick={copyLink}
                  variant={copied ? "secondary" : "primary"}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                {shareData.allowEdit
                  ? "Anyone with this link can view and edit."
                  : "Anyone with this link can view only."}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Share <strong>{board.title}</strong> with others.
              </p>

              {canEdit && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
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
                      Viewers can also make changes to this board.
                    </p>
                  </div>
                </label>
              )}

              {!canEdit && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 Upgrade to Pro or Premium to share with edit access.
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button loading={loading} onClick={share} icon={Share2}>
                  Generate Link
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    );
  }

  /* ─────────────────────────────────────────────────────────────
    New Board Modal
  ───────────────────────────────────────────────────────────── */
  function NewBoardModal({ onClose, onCreate }) {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
      setLoading(true);
      await onCreate({ title: title || "Untitled Board" });
      setLoading(false);
      onClose();
    };

    return (
      <Modal isOpen onClose={onClose} title="Create New Board" size="sm">
        <div className="space-y-4">
          <Input
            label="Board Name"
            placeholder="My Awesome Board"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button loading={loading} onClick={handleCreate} icon={Plus}>
              Create Board
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─────────────────────────────────────────────────────────────
    Dashboard - My Boards
  ───────────────────────────────────────────────────────────── */
  export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    const [newBoardOpen, setNewBoardOpen] = useState(false);
    const [shareBoard, setShareBoard] = useState(null);

    const { boards, isLoading, createBoard, deleteBoard, duplicateBoard } =
      useBoards({ search });

    const limit = PLAN_LIMITS[user?.plan]?.boards ?? 1;
    const atLimit = limit !== -1 && boards.length >= limit;

    /* ── Create board ── */
    const handleCreate = async (data) => {
      const result = await createBoard(data);
      if (result.success) {
        navigate(`/board/${result.board.id}`);
      }
    };

    /* ── Delete board ── */
    const handleDelete = useCallback(
      async (id) => {
        if (!window.confirm("Delete this board? This cannot be undone.")) return;
        await deleteBoard(id);
      },
      [deleteBoard],
    );

    /* ── Duplicate board ── */
    const handleDuplicate = useCallback(
      async (id) => {
        if (atLimit) {
          toast.error(
            "Board limit reached. Upgrade your plan to create more boards.",
          );
          return;
        }
        await duplicateBoard(id);
      },
      [duplicateBoard, atLimit],
    );

    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Boards
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {limit === -1
                ? `${boards.length} board${boards.length !== 1 ? "s" : ""}`
                : `${boards.length} / ${limit} board${limit > 1 ? "s" : ""} used`}
            </p>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search boards…"
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
                  ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* New board button */}
          <Button
            icon={Plus}
            onClick={() => {
              if (atLimit) {
                toast.error(
                  "Board limit reached. Upgrade to create more boards.",
                );
                return;
              }
              setNewBoardOpen(true);
            }}
            disabled={atLimit}
          >
            New Board
          </Button>
        </div>

        {/* ── Upgrade banner ── */}
        {atLimit && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-200 dark:border-primary-700 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                Board limit reached ({boards.length}/{limit})
              </p>
              <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-0.5">
                Upgrade your plan to create more boards.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate("/billing")}>
              Upgrade Plan
            </Button>
          </div>
        )}

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mb-4 shadow-lg">
              <PenTool className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {search ? "No boards found" : "No boards yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
              {search
                ? `No boards match "${search}"`
                : "Create your first board and start drawing!"}
            </p>
            {!search && (
              <Button
                icon={Plus}
                size="lg"
                onClick={() => setNewBoardOpen(true)}
              >
                Create Your First Board
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Last Used - hanya tampil jika tidak sedang search */}
            {!search && (
              <LastUsedBoard
                board={boards[0]} // boards sudah diurutkan by updated_at dari API
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onShare={setShareBoard}
              />
            )}

            {/* All Boards */}
            {boards.length > 1 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  All Boards
                </p>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Skip index 0 karena sudah ditampilkan di Last Used */}
                    {(search ? boards : boards.slice(1)).map((board) => (
                      <BoardCard
                        key={board.id}
                        board={board}
                        viewMode="grid"
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onShare={setShareBoard}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(search ? boards : boards.slice(1)).map((board) => (
                      <BoardCard
                        key={board.id}
                        board={board}
                        viewMode="list"
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onShare={setShareBoard}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Modals ── */}
        {newBoardOpen && (
          <NewBoardModal
            onClose={() => setNewBoardOpen(false)}
            onCreate={handleCreate}
          />
        )}
        {shareBoard && (
          <ShareModal board={shareBoard} onClose={() => setShareBoard(null)} />
        )}
      </div>
    );
  }
