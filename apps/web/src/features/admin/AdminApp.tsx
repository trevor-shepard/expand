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
      <form className="admin-card admin-login-card" onSubmit={submit}>
        <p className="admin-eyebrow">Expand operations</p>
        <h1>Admin sign in</h1>
        <label>
          Password
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            required
            autoFocus
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <Link to="/">Back to game</Link>
      </form>
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
    return <p className="admin-route-status">Checking session…</p>;
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
        <div>
          <p className="admin-eyebrow">Expand operations</p>
          <Link to="/admin/levels" className="admin-brand">Level admin</Link>
        </div>
        <nav aria-label="Admin navigation">
          <Link to="/">View game</Link>
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
