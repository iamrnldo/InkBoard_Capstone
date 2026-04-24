// src/hooks/useBoard.js
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import useBoardStore from "../store/boardStore";
import useAuthStore from "../store/authStore";
import { boardAPI } from "../api";
import toast from "react-hot-toast";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

/**
 * Hook for board list management (dashboard).
 */
export function useBoards(params = {}) {
  const store = useBoardStore();

  useEffect(() => {
    store.fetchBoards(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.search, params.archived, params.page]);

  const createBoard = useCallback(
    async (data = {}) => {
      const result = await store.createBoard(data);
      if (result.success) {
        toast.success("Board created!");
      } else {
        toast.error(result.message || "Failed to create board");
      }
      return result;
    },
    [store],
  );

  const deleteBoard = useCallback(
    async (id) => {
      const result = await store.deleteBoard(id);
      if (result.success) {
        toast.success("Board deleted");
      } else {
        toast.error(result.message || "Failed to delete board");
      }
      return result;
    },
    [store],
  );

  const duplicateBoard = useCallback(async (id) => {
    try {
      const { data } = await boardAPI.duplicateBoard(id);
      store.fetchBoards(params);
      toast.success("Board duplicated!");
      return { success: true, board: data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to duplicate";
      toast.error(msg);
      return { success: false, message: msg };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareBoard = useCallback(async (id, allowEdit = false) => {
    try {
      const { data } = await boardAPI.shareBoard(id, {
        allow_edit: allowEdit,
      });
      return { success: true, data: data.data };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to share board";
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, []);

  return {
    boards: store.boards,
    isLoading: store.isLoading,
    pagination: store.pagination,
    createBoard,
    deleteBoard,
    duplicateBoard,
    shareBoard,
    refetch: () => store.fetchBoards(params),
  };
}

/**
 * Hook for the board editor (real-time collaboration via Socket.io).
 */
export function useBoardEditor(boardId) {
  const store = useBoardStore();
  const { user } = useAuthStore();
  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* ── Load board ── */
  useEffect(() => {
    if (!boardId) return;
    store.fetchBoard(boardId);
    return () => store.clearCurrentBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  /* ── Socket.io ── */
  useEffect(() => {
    if (!boardId || !user) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: localStorage.getItem("accessToken") },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-board", {
        boardId,
        userId: user.id,
        username: user.username,
      });
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("users-update", (users) => {
      store.setActiveUsers(users);
    });

    socket.on("canvas-update", ({ elements, appState }) => {
      store.setCurrentBoard((prev) =>
        prev
          ? {
              ...prev,
              canvas_data: {
                ...prev.canvas_data,
                elements,
                appState,
              },
            }
          : prev,
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      store.setActiveUsers([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, user?.id]);

  /* ── Broadcast canvas change ── */
  const broadcastChange = useCallback(
    (elements, appState) => {
      socketRef.current?.emit("canvas-update", {
        boardId,
        elements,
        appState,
      });
    },
    [boardId],
  );

  /* ── Broadcast cursor ── */
  const broadcastCursor = useCallback(
    (x, y) => {
      socketRef.current?.emit("cursor-move", {
        boardId,
        x,
        y,
        userId: user?.id,
        username: user?.username,
      });
    },
    [boardId, user?.id, user?.username],
  );

  /* ── Auto-save (debounced 2 s) ── */
  const scheduleAutoSave = useCallback(
    (canvasData) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await boardAPI.updateBoard(boardId, { canvas_data: canvasData });
        } catch (_) {
          /* silent */
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    },
    [boardId],
  );

  /* ── Manual save ── */
  const saveNow = useCallback(
    async (canvasData) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setIsSaving(true);
      try {
        await boardAPI.updateBoard(boardId, { canvas_data: canvasData });
        toast.success("Board saved!");
      } catch (_) {
        toast.error("Failed to save board");
      } finally {
        setIsSaving(false);
      }
    },
    [boardId],
  );

  /* ── Update title ── */
  const updateTitle = useCallback(
    async (title) => {
      const result = await store.updateBoard(boardId, { title });
      if (!result.success) toast.error("Failed to update title");
      return result;
    },
    [boardId, store],
  );

  return {
    board: store.currentBoard,
    isLoading: store.isLoading,
    isConnected,
    isSaving,
    activeUsers: store.activeUsers,
    broadcastChange,
    broadcastCursor,
    scheduleAutoSave,
    saveNow,
    updateTitle,
  };
}
