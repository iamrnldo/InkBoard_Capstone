// src/components/board/Canvas.jsx
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import { PageLoader } from "../common/LoadingSpinner";

const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then((m) => ({ default: m.Excalidraw })),
);

export default function Canvas({
  boardData,
  onDataChange,
  viewModeEnabled = false,
  isReadOnly = false,
  activeTool = "selection",
  activeDrawTool = "pen",
  onSelectedElementsChange,
  excalidrawRef,
}) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  /* ── Forward ref to parent ── */
  useEffect(() => {
    if (excalidrawRef && excalidrawAPI) {
      excalidrawRef.current = excalidrawAPI;
    }
  }, [excalidrawAPI, excalidrawRef]);

  /* ── Map our tool IDs to Excalidraw tool names ── */
  const mapTool = (tool) => {
    const MAP = {
      selection: "selection",
      hand: "hand",
      rectangle: "rectangle",
      ellipse: "ellipse",
      diamond: "diamond",
      triangle: "triangle",
      arrow: "arrow",
      line: "line",
      text: "text",
      image: "image",
      freedraw: "freedraw",
      eraser: "eraser",
      lasso: "selection",
    };
    return MAP[tool] || "selection";
  };

  /* ── Sync active tool to Excalidraw ── */
  useEffect(() => {
    if (!excalidrawAPI) return;
    try {
      excalidrawAPI.setActiveTool({ type: mapTool(activeTool) });
    } catch (_) {}
  }, [activeTool, excalidrawAPI]);

  /* ── onChange handler ── */
  const handleChange = useCallback(
    (elements, appState, files) => {
      onDataChange?.({ elements, appState, files });
    },
    [onDataChange],
  );

  /* ── onPointerUpdate for cursor sharing ── */
  const handlePointerUpdate = useCallback(({ pointer }) => {
    // Lifted to parent via prop if needed
  }, []);

  const UIOptions = {
    canvasActions: {
      changeViewBackgroundColor: true,
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
  };

  return (
    <div className="w-full h-full">
      <Suspense fallback={<PageLoader />}>
        <Excalidraw
          ref={setExcalidrawAPI}
          initialData={{
            elements: boardData?.elements ?? [],
            appState: {
              ...(boardData?.appState ?? {}),
              viewBackgroundColor:
                boardData?.appState?.viewBackgroundColor ?? "#ffffff",
              currentItemFontFamily: 1,
            },
            files: boardData?.files ?? {},
          }}
          onChange={handleChange}
          onPointerUpdate={handlePointerUpdate}
          viewModeEnabled={viewModeEnabled || isReadOnly}
          UIOptions={UIOptions}
          theme="light"
          langCode="en"
          onCollabButtonClick={undefined}
        />
      </Suspense>
    </div>
  );
}
