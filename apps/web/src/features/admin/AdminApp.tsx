import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  AdminApiError,
  checkSession,
  login,
  logout,
} from "../../api/admin";
import { LevelEditorPage } from "./LevelEditorPage";
import { LevelsPage } from "./LevelsPage";

function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
      navigate("/admin/levels", { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login">
      <div className="admin-login-wrap">
        <Link className="admin-login-brand" to="/" aria-label="Expand game">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <strong>expand</strong>
        </Link>
        <form className="admin-card admin-login-card" onSubmit={submit}>
          <div className="admin-login-heading">
            <p className="admin-eyebrow">Level studio</p>
            <h1>Welcome back</h1>
            <p>Sign in to create, preview, and publish game levels.</p>
          </div>
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            autoComplete="current-password"
            required
            autoFocus
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <p className="admin-error admin-inline-alert" role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </p>
          )}
          <button
            className="button-primary button-wide"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
          <Link className="admin-back-link" to="/">
            <span aria-hidden="true">←</span>
            Back to game
          </Link>
        </form>
        <p className="admin-login-footnote">Authorized access only</p>
      </div>
    </main>
  );
}

function RequireAdmin() {
  const [state, setState] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );
  const location = useLocation();

  useEffect(() => {
    let active = true;
    void checkSession()
      .then(() => {
        if (active) setState("allowed");
      })
      .catch((error: unknown) => {
        if (active) {
          setState(
            error instanceof AdminApiError && error.status === 401
              ? "denied"
              : "denied",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <main className="admin-route-status" role="status">
        <span className="admin-spinner" aria-hidden="true" />
        <strong>Opening level studio</strong>
        <span>Checking your session…</span>
      </main>
    );
  }
  if (state === "denied") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  return <Outlet />;
}

function AdminFrame() {
  const navigate = useNavigate();

  async function signOut() {
    try {
      await logout();
    } finally {
      navigate("/admin/login", { replace: true });
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link to="/admin/levels" className="admin-brand">
          <span className="brand-mark brand-mark-small" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>expand</strong>
            <small>Level studio</small>
          </span>
        </Link>
        <nav aria-label="Admin navigation">
          <Link className="admin-nav-link" to="/">
            <span aria-hidden="true">↗</span>
            View game
          </Link>
          <button type="button" className="button-secondary" onClick={() => void signOut()}>
            Sign out
          </button>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

export function AdminApp() {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminFrame />}>
          <Route path="/admin" element={<Navigate to="/admin/levels" replace />} />
          <Route path="/admin/levels" element={<LevelsPage />} />
          <Route path="/admin/levels/new" element={<LevelEditorPage />} />
          <Route path="/admin/levels/:id" element={<LevelEditorPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin/levels" replace />} />
    </Routes>
  );
}
