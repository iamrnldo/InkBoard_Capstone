// src/hooks/useThumbnail.js
import { useCallback, useRef } from "react";
import { boardAPI } from "../api";

/**
 * Captures a screenshot of a DOM element and uploads it as the board thumbnail.
 *
 * @param {string} boardId - UUID of the board
 * @returns {{ captureThumbnail: (el: HTMLElement) => Promise<void> }}
 */
export function useThumbnail(boardId) {
  const isCapturing = useRef(false);

  const captureThumbnail = useCallback(
    async (targetElement) => {
      if (!boardId || !targetElement || isCapturing.current) return;

      isCapturing.current = true;
      try {
        const html2canvas = (await import("html2canvas")).default;

        const canvas = await html2canvas(targetElement, {
          useCORS: true,
          allowTaint: true,
          scale: 0.5, // half-resolution is enough for thumbnails
          logging: false,
          backgroundColor: "#ffffff",
          // Any element with data-thumbnail-ignore="true" is excluded
          ignoreElements: (el) => el.dataset?.thumbnailIgnore === "true",
        });

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              isCapturing.current = false;
              return;
            }
            const formData = new FormData();
            formData.append("thumbnail", blob, "thumbnail.jpg");
            try {
              await boardAPI.uploadThumbnail(boardId, formData);
            } catch (err) {
              console.warn("[useThumbnail] Upload failed:", err.message);
            } finally {
              isCapturing.current = false;
            }
          },
          "image/jpeg",
          0.75,
        );
      } catch (err) {
        console.warn("[useThumbnail] Capture failed:", err.message);
        isCapturing.current = false;
      }
    },
    [boardId],
  );

  return { captureThumbnail };
}
