import React, { useEffect, useState, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { boardAPI } from "../../api";
import { PageLoader } from "../../components/common/LoadingSpinner";

const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then((m) => ({ default: m.Excalidraw })),
);

export default function SharedBoard() {
  const { token } = useParams();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    boardAPI
      .getSharedBoard(token)
      .then(({ data }) => {
        setBoard(data.data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <PageLoader />;

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="card p-10 text-center max-w-sm">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Board Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            This board doesn't exist or isn't public.
          </p>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="h-10 glass border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center">
            <span className="text-white text-xs">✏️</span>
          </div>
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            {board.title}
          </span>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">
          by @{board.owner_username}
        </span>
        <Link
          to="/register"
          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline ml-2"
        >
          Sign up free →
        </Link>
      </div>
      <div className="flex-1 min-h-0">
        <Suspense fallback={<PageLoader />}>
          <Excalidraw
            initialData={{
              elements: board.canvas_data?.elements || [],
              appState: {
                ...(board.canvas_data?.appState || {}),
                viewBackgroundColor: "#ffffff",
              },
              files: board.canvas_data?.files || {},
            }}
            viewModeEnabled={!board.allow_edit}
          />
        </Suspense>
      </div>
    </div>
  );
}
