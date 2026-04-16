import { create } from "zustand";
import { boardAPI } from "../api";

const useBoardStore = create((set, get) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  pagination: { total: 0, page: 1, limit: 20 },
  collaborators: [],
  activeUsers: [],

  fetchBoards: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await boardAPI.getBoards(params);
      set({
        boards: data.data.boards,
        pagination: data.data.pagination,
        isLoading: false,
      });
    } catch (_) {
      set({ isLoading: false });
    }
  },

  createBoard: async (boardData) => {
    try {
      const { data } = await boardAPI.createBoard(boardData);
      set((s) => ({ boards: [data.data, ...s.boards] }));
      return { success: true, board: data.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to create board",
      };
    }
  },

  fetchBoard: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await boardAPI.getBoard(id);
      set({
        currentBoard: data.data,
        collaborators: data.data.collaborators || [],
        isLoading: false,
      });
      return { success: true, board: data.data };
    } catch (err) {
      set({ isLoading: false });
      return { success: false };
    }
  },

  updateBoard: async (id, updates) => {
    try {
      const { data } = await boardAPI.updateBoard(id, updates);
      set((s) => ({
        currentBoard: s.currentBoard?.id === id ? data.data : s.currentBoard,
        boards: s.boards.map((b) => (b.id === id ? data.data : b)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  deleteBoard: async (id) => {
    try {
      await boardAPI.deleteBoard(id);
      set((s) => ({ boards: s.boards.filter((b) => b.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  setCurrentBoard: (board) => set({ currentBoard: board }),
  setActiveUsers: (users) => set({ activeUsers: users }),
  clearCurrentBoard: () =>
    set({ currentBoard: null, collaborators: [], activeUsers: [] }),
}));

export default useBoardStore;
