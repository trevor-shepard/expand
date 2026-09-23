import { useCallback, useEffect, useState } from "react";
import type { AdminLevel } from "@expand/contracts";
import { Link, useNavigate } from "react-router-dom";
import {
  AdminApiError,
  listAdminLevels,
  reorderAdminLevels,
  runLevelAction,
} from "../../api/admin";

export function LevelsPage() {
  const [levels, setLevels] = useState<AdminLevel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setError(null);
      setLevels(await listAdminLevels());
    } catch (requestError) {
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load levels",
      );
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(
    level: AdminLevel,
    action: "publish" | "unpublish" | "archive",
  ) {
    if (
      action === "archive" &&
      !window.confirm(`Archive “${level.title}”?`)
    ) {
      return;
    }
    setBusyId(level.id);
    try {
      await runLevelAction(level.id, action);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : `Unable to ${action} level`,
      );
    } finally {
      setBusyId(null);
    }
  }

  async function move(level: AdminLevel, direction: -1 | 1) {
    if (!levels || level.status !== "published") return;
    const publishedIds = levels
      .filter((item) => item.status === "published")
      .map((item) => item.id);
    const from = publishedIds.indexOf(level.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= publishedIds.length) return;
    [publishedIds[from], publishedIds[to]] = [
      publishedIds[to],
      publishedIds[from],
    ];

    setBusyId(level.id);
    try {
      await reorderAdminLevels(publishedIds);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reorder levels",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="admin-main">
      <div className="admin-title-row">
        <div>
          <p className="admin-eyebrow">Content</p>
          <h1>Levels</h1>
        </div>
        <Link className="button-link" to="/admin/levels/new">Create level</Link>
      </div>

      {error && (
        <div className="admin-error admin-card" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void load()}>Try again</button>
        </div>
      )}
      {!levels && !error && <p>Loading levels…</p>}

      {levels && (
        <div className="level-admin-list">
          {levels.map((level, index) => {
            const published = level.status === "published";
            const previousPublished = levels
              .slice(0, index)
              .some((item) => item.status === "published");
            const nextPublished = levels
              .slice(index + 1)
              .some((item) => item.status === "published");
            return (
              <article className="admin-card level-admin-row" key={level.id}>
                <div className="level-admin-summary">
                  <span className={`status-chip status-${level.status}`}>
                    {level.status}
                  </span>
                  <div>
                    <h2>{level.title}</h2>
                    <p>
                      {level.slug} · {level.width}×{level.height} · revision{" "}
                      {level.revision}
                    </p>
                  </div>
                </div>
                <div className="admin-actions">
                  {published && (
                    <>
                      <button
                        type="button"
                        aria-label={`Move ${level.title} up`}
                        disabled={busyId !== null || !previousPublished}
                        onClick={() => void move(level, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${level.title} down`}
                        disabled={busyId !== null || !nextPublished}
                        onClick={() => void move(level, 1)}
                      >
                        ↓
                      </button>
                    </>
                  )}
                  <Link className="button-link button-secondary" to={`/admin/levels/${level.id}`}>
                    Edit
                  </Link>
                  {published ? (
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void changeStatus(level, "unpublish")}
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void changeStatus(level, "publish")}
                    >
                      Publish
                    </button>
                  )}
                  {level.status !== "archived" && (
                    <button
                      type="button"
                      className="button-danger"
                      disabled={busyId !== null}
                      onClick={() => void changeStatus(level, "archive")}
                    >
                      Archive
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
