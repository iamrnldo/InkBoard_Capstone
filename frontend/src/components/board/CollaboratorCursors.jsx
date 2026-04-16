// src/components/board/CollaboratorCursors.jsx
import React, { useEffect, useRef, useState } from "react";

const CURSOR_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

function getColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export default function CollaboratorCursors({ socket, boardId }) {
  const [cursors, setCursors] = useState({});
  const timeoutsRef = useRef({});

  useEffect(() => {
    if (!socket) return;

    const handler = ({ x, y, userId, username, socketId }) => {
      setCursors((prev) => ({
        ...prev,
        [socketId]: { x, y, userId, username, color: getColor(userId) },
      }));

      // Remove cursor after 5s of inactivity
      if (timeoutsRef.current[socketId]) {
        clearTimeout(timeoutsRef.current[socketId]);
      }
      timeoutsRef.current[socketId] = setTimeout(() => {
        setCursors((prev) => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      }, 5000);
    };

    socket.on("cursor-move", handler);

    const leaveHandler = ({ userId }) => {
      setCursors((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k].userId === userId) delete next[k];
        });
        return next;
      });
    };

    socket.on("user-left", leaveHandler);

    return () => {
      socket.off("cursor-move", handler);
      socket.off("user-left", leaveHandler);
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, [socket]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Object.entries(cursors).map(([socketId, cursor]) => (
        <div
          key={socketId}
          className="absolute transition-all duration-75"
          style={{ left: cursor.x, top: cursor.y }}
        >
          {/* Cursor SVG */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
          >
            <path
              d="M4 2L16 10L10 11L7 18L4 2Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          {/* Label */}
          <div
            className="absolute left-4 top-0 px-1.5 py-0.5 rounded-md text-white text-[11px]
                        font-semibold whitespace-nowrap shadow-lg"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.username}
          </div>
        </div>
      ))}
    </div>
  );
}
