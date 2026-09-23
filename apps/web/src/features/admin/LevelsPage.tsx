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
      <header className="admin-title-row">
        <div>
          <p className="admin-eyebrow">Game content</p>
          <h1>Level library</h1>
          <p className="admin-page-intro">
            Build the puzzle sequence players see in the public game.
          </p>
        </div>
        <Link className="button-link" to="/admin/levels/new">
          <span aria-hidden="true">＋</span>
          Create level
        </Link>
      </header>

      {error && (
        <div className="admin-error admin-card" role="alert">
          <span className="admin-state-icon" aria-hidden="true">!</span>
          <div>
            <h2>Levels couldn&apos;t be loaded</h2>
            <p>{error}</p>
            <button type="button" onClick={() => void load()}>Try again</button>
          </div>
        </div>
      )}
      {!levels && !error && (
        <div className="admin-loading-list" role="status">
          <span className="admin-spinner" aria-hidden="true" />
          <span>Loading level library…</span>
        </div>
      )}

      {levels && levels.length === 0 && (
        <section className="admin-card admin-empty-state">
          <span className="admin-state-icon empty-grid-icon" aria-hidden="true">◇</span>
          <p className="admin-eyebrow">Blank canvas</p>
          <h2>Create your first level</h2>
          <p>Design a starting pattern, set its click limit, and preview it before publishing.</p>
          <Link className="button-link" to="/admin/levels/new">Create level</Link>
        </section>
      )}

      {levels && levels.length > 0 && (
        <>
          <div className="library-summary">
            <p>
              <strong>{levels.length}</strong> {levels.length === 1 ? "level" : "levels"}
            </p>
            <span>{levels.filter((level) => level.status === "published").length} published</span>
          </div>
          <section className="level-admin-list" aria-label="Levels">
            {levels.map((level, index) => {
              const published = level.status === "published";
              const previousPublished = levels
                .slice(0, index)
                .some((item) => item.status === "published");
              const nextPublished = levels
                .slice(index + 1)
                .some((item) => item.status === "published");
              return (
                <article
                  className="admin-card level-admin-row"
                  key={level.id}
                  aria-busy={busyId === level.id}
                >
                  <div className="level-admin-summary">
                    <div className="level-position" aria-hidden="true">
                      {published && level.position
                        ? String(level.position).padStart(2, "0")
                        : "—"}
                    </div>
                    <div>
                      <div className="level-title-line">
                        <h2>{level.title}</h2>
                        <span className={`status-chip status-${level.status}`}>
                          {level.status}
                        </span>
                      </div>
                      <p className="level-slug">/{level.slug}</p>
                      <dl className="level-meta">
                        <div>
                          <dt>Board</dt>
                          <dd>{level.width} × {level.height}</dd>
                        </div>
                        <div>
                          <dt>Clicks</dt>
                          <dd>{level.clickLimit}</dd>
                        </div>
                        <div>
                          <dt>Revision</dt>
                          <dd>{level.revision}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <div className="admin-actions">
                    {published && (
                      <div className="reorder-actions" aria-label={`Reorder ${level.title}`}>
                        <button
                          type="button"
                          className="icon-button button-secondary"
                          aria-label={`Move ${level.title} up`}
                          disabled={busyId !== null || !previousPublished}
                          onClick={() => void move(level, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="icon-button button-secondary"
                          aria-label={`Move ${level.title} down`}
                          disabled={busyId !== null || !nextPublished}
                          onClick={() => void move(level, 1)}
                        >
                          ↓
                        </button>
                      </div>
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
          </section>
        </>
      )}
    </main>
  );
}
