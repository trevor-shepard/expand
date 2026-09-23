import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { LevelInput } from "@expand/contracts";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
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
  }, [id]);

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
    return <main className="admin-main"><p>Loading level…</p></main>;
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
      <div className="admin-title-row">
        <div>
          <p className="admin-eyebrow">{editing ? "Edit content" : "New content"}</p>
          <h1>{editing ? state.title || "Untitled level" : "Create level"}</h1>
        </div>
        <Link className="button-link button-secondary" to="/admin/levels">
          Back to levels
        </Link>
      </div>

      {error && <p className="admin-error admin-card" role="alert">{error}</p>}

      <form className="editor-layout" onSubmit={save}>
        <section className="admin-card editor-fields">
          <h2>Level details</h2>
          <label>
            Title
            <input
              value={state.title}
              required
              maxLength={80}
              onChange={(event) => setField("title", event.target.value)}
            />
          </label>
          <label>
            Slug
            <input
              value={state.slug}
              required
              maxLength={64}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="lowercase-kebab-case"
              onChange={(event) => setField("slug", event.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              value={state.description}
              maxLength={500}
              rows={3}
              onChange={(event) => setField("description", event.target.value)}
            />
          </label>
          <div className="field-row">
            <label>
              Width
              <input
                type="number"
                min={2}
                max={50}
                value={state.width}
                required
                onChange={(event) => setDimension("width", event.target.value)}
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min={2}
                max={50}
                value={state.height}
                required
                onChange={(event) => setDimension("height", event.target.value)}
              />
            </label>
            <label>
              Click limit
              <input
                type="number"
                min={1}
                value={state.clickLimit}
                required
                onChange={(event) => setField("clickLimit", event.target.value)}
              />
            </label>
          </div>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create draft"}
          </button>
        </section>

        <section className="admin-card editor-grid-panel">
          <h2>Initial live cells</h2>
          <p className="admin-hint">
            Click cells to toggle the pattern. Active cells are dark.
          </p>
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
          <h2>Playtest preview</h2>
          <p className="admin-hint">
            This preview uses the same game engine as the public game.
          </p>
          <PlaytestPreview input={previewInput} />
        </section>
      </form>
    </main>
  );
}
