// src/components/board/ThumbnailCapture.jsx
import { useEffect, useRef } from "react";
import { useThumbnail } from "../../hooks/useThumbnail";

/**
 * Drop this inside BoardEditor. Renders nothing but:
 *  - Captures thumbnail 3 s after mount (board just opened)
 *  - Re-captures every time user is idle for `idleMs` ms
 *  - Captures once more on tab/window close
 *
 * Props:
 *   boardId    – UUID of the board (from useParams)
 *   targetRef  – ref pointing at the canvas wrapper div
 *   idleMs     – ms of inactivity before auto-capture (default 6000)
 *   enabled    – set false to pause (e.g. while a modal is open)
 */
export default function ThumbnailCapture({
  boardId,
  targetRef,
  idleMs = 6000,
  enabled = true,
}) {
  const { captureThumbnail } = useThumbnail(boardId);
  const idleTimer = useRef(null);

  // Helper: get the DOM element to screenshot
  const getTarget = () => {
    if (targetRef?.current) return targetRef.current;
    // Fallback: id you'll add to the Excalidraw wrapper div
    return document.getElementById("board-canvas-root");
  };

  const scheduleCapture = () => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      const el = getTarget();
      if (el) captureThumbnail(el);
    }, idleMs);
  };

  useEffect(() => {
    if (!enabled || !boardId) return;

    // Events that signal the user stopped interacting
    const events = ["mouseup", "keyup", "touchend", "pointerup"];
    events.forEach((e) =>
      window.addEventListener(e, scheduleCapture, { passive: true }),
    );

    // Initial capture after board finishes loading
    const initTimer = setTimeout(() => {
      const el = getTarget();
      if (el) captureThumbnail(el);
    }, 3000);

    // Capture when user closes / navigates away
    const handleUnload = () => {
      const el = getTarget();
      if (el) captureThumbnail(el);
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, scheduleCapture));
      window.removeEventListener("beforeunload", handleUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, boardId]);

  return null; // purely behavioural
}
