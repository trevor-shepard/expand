import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { LevelInput } from "@expand/contracts";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AdminApiError,
  createAdminLevel,
  getAdminLevel,
  updateAdminLevel,
} from "../../api/admin";
import {
  EMPTY_LEVEL_EDITOR,
  editorStateToInput,
  levelToEditorState,
  resizeEditorGrid,
  type LevelEditorState,
} from "./editor-model";
import { InitialCellGrid } from "./InitialCellGrid";
import { PlaytestPreview } from "./PlaytestPreview";

export function LevelEditorPage() {
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);
  const [state, setState] = useState<LevelEditorState>(EMPTY_LEVEL_EDITOR);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setState(EMPTY_LEVEL_EDITOR);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    void getAdminLevel(id)
      .then((level) => {
        if (active) setState(levelToEditorState(level));
      })
      .catch((requestError: unknown) => {
        if (active) {
          if (
            requestError instanceof AdminApiError &&
            requestError.status === 401
          ) {
            navigate("/admin/login", { replace: true });
            return;
          }
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load level",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const previewInput = useMemo<LevelInput | null>(() => {
    try {
      return editorStateToInput(state);
    } catch {
      return null;
    }
  }, [state]);

  function setField(
    field: "slug" | "title" | "description" | "clickLimit",
    value: string,
  ) {
    setState((current) => ({ ...current, [field]: value }));
  }

  function setDimension(field: "width" | "height", value: string) {
    setState((current) => {
      const next = { ...current, [field]: value };
      const width = Number(next.width);
      const height = Number(next.height);
      if (
        Number.isInteger(width) &&
        Number.isInteger(height) &&
        width >= 2 &&
        width <= 50 &&
        height >= 2 &&
        height <= 50
      ) {
        return resizeEditorGrid(next, width, height);
      }
      return next;
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const input = editorStateToInput(state);
      const saved = id
        ? await updateAdminLevel(id, input)
        : await createAdminLevel(input);
      navigate(`/admin/levels/${saved.id}`, { replace: !id });
      setState(levelToEditorState(saved));
    } catch (requestError) {
      if (requestError instanceof AdminApiError && requestError.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save level",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-main admin-editor-loading" role="status">
        <span className="admin-spinner" aria-hidden="true" />
        <strong>Loading level editor</strong>
        <span>Preparing the grid and preview…</span>
      </main>
    );
  }

  const width = Number(state.width);
  const height = Number(state.height);
  const validGridSize =
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width >= 2 &&
    width <= 50 &&
    height >= 2 &&
    height <= 50;

  return (
    <main className="admin-main">
      <header className="admin-title-row editor-title-row">
        <div>
          <p className="admin-eyebrow">{editing ? "Edit content" : "New content"}</p>
          <h1>{editing ? state.title || "Untitled level" : "Create level"}</h1>
          <p className="admin-page-intro">
            {editing
              ? "Refine the rules, starting pattern, and player experience."
              : "Shape a starting pattern and test it before it reaches players."}
          </p>
        </div>
        <Link className="button-link button-secondary" to="/admin/levels">
          <span aria-hidden="true">←</span>
          Back to levels
        </Link>
      </header>

      {error && (
        <div className="admin-error admin-card admin-inline-alert" role="alert">
          <span aria-hidden="true">!</span>
          <p>{error}</p>
        </div>
      )}

      <form className="editor-layout" onSubmit={save}>
        <section className="admin-card editor-fields">
          <div className="editor-section-heading">
            <span>01</span>
            <div>
              <h2>Level details</h2>
              <p>Name the puzzle and define its limits.</p>
            </div>
          </div>
          <label htmlFor="level-title">Title</label>
          <input
            id="level-title"
            value={state.title}
            required
            maxLength={80}
            placeholder="A memorable level name"
            onChange={(event) => setField("title", event.target.value)}
          />
          <label htmlFor="level-slug">Slug</label>
          <input
            id="level-slug"
            value={state.slug}
            required
            maxLength={64}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="lowercase-kebab-case"
            onChange={(event) => setField("slug", event.target.value)}
          />
          <p className="field-hint">Used in the level URL and internal references.</p>
          <label htmlFor="level-description">Description</label>
          <textarea
            id="level-description"
            value={state.description}
            maxLength={500}
            rows={3}
            placeholder="Give players a little context (optional)"
            onChange={(event) => setField("description", event.target.value)}
          />
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="level-width">Width</label>
              <input
                id="level-width"
                type="number"
                min={2}
                max={50}
                value={state.width}
                required
                onChange={(event) => setDimension("width", event.target.value)}
              />
            </div>
            <div className="field-group">
              <label htmlFor="level-height">Height</label>
              <input
                id="level-height"
                type="number"
                min={2}
                max={50}
                value={state.height}
                required
                onChange={(event) => setDimension("height", event.target.value)}
              />
            </div>
            <div className="field-group">
              <label htmlFor="level-click-limit">Click limit</label>
              <input
                id="level-click-limit"
                type="number"
                min={1}
                value={state.clickLimit}
                required
                onChange={(event) => setField("clickLimit", event.target.value)}
              />
            </div>
          </div>
          <button
            className="button-primary button-wide editor-save-button"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Create draft"}
            {!saving && <span aria-hidden="true">→</span>}
          </button>
        </section>

        <section className="admin-card editor-grid-panel">
          <div className="editor-section-heading">
            <span>02</span>
            <div>
              <h2>Starting pattern</h2>
              <p>Choose which cells begin alive.</p>
            </div>
          </div>
          <div className="grid-legend" aria-hidden="true">
            <span><i className="legend-cell" /> Empty</span>
            <span><i className="legend-cell selected" /> Alive</span>
          </div>
          {validGridSize ? (
            <InitialCellGrid
              width={width}
              height={height}
              cells={state.initialLiveCells}
              onChange={(initialLiveCells) =>
                setState((current) => ({ ...current, initialLiveCells }))}
            />
          ) : (
            <p className="admin-error">Width and height must be between 2 and 50.</p>
          )}
        </section>

        <section className="admin-card editor-preview-panel">
          <div className="editor-section-heading">
            <span>03</span>
            <div>
              <h2>Playtest preview</h2>
              <p>Try the pattern with the same engine your players use.</p>
            </div>
          </div>
          <PlaytestPreview input={previewInput} />
        </section>
      </form>
    </main>
  );
}
