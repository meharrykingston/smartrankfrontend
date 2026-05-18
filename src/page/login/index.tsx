import { useEffect, useState } from "react";
import { ArrowRight, Chrome, Facebook, Lock, Mail } from "lucide-react";
import AuthHeader from "../auth/AuthHeader";
import AuthShell from "../auth/AuthShell";
import "../auth/auth.css";

type DemoAccount = {
  email: string;
  password: string;
};

const getOAuthTokens = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.hash.replace("#", ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken) return null;
  return { accessToken, refreshToken };
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [demo, setDemo] = useState<DemoAccount | null>(null);

  useEffect(() => {
    const tokens = getOAuthTokens();
    if (!tokens) return;

    const verifyOAuth = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/auth/oauth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: tokens.accessToken }),
        });
        const data = await response.json();
        if (!response.ok || !data?.ok) {
          setError(data?.error ?? "OAuth sign-in failed.");
          return;
        }
        localStorage.setItem(
          "SmartRank_session",
          JSON.stringify({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken })
        );
        setMessage("Signed in. Redirecting to workspace...");
        window.location.href = "/workspace";
      } catch (err) {
        const message = err instanceof Error ? err.message : "OAuth sign-in failed.";
        setError(message);
      } finally {
        setLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    verifyOAuth();
  }, []);

  useEffect(() => {
    const fetchDemo = async () => {
      try {
        const response = await fetch("/api/auth/demo");
        const data = await response.json();
        if (response.ok && data?.ok) {
          setDemo({ email: data.email, password: data.password });
        }
      } catch {
        // ignore demo fetch errors
      }
    };
    fetchDemo();
  }, []);

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setError(data?.error ?? "Unable to sign in.");
        return;
      }

      if (data?.session) {
        localStorage.setItem("SmartRank_session", JSON.stringify(data.session));
      }
      setMessage("Signed in. Redirecting to workspace...");
      window.location.href = "/workspace";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = async (provider: "google" | "facebook") => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok || !data?.url) {
        setError(data?.error ?? "Unable to start OAuth.");
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start OAuth.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const useDemo = () => {
    if (!demo) return;
    setEmail(demo.email);
    setPassword(demo.password);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue building autonomous growth systems."
      header={<AuthHeader />}
      footer={
        <span>
          New to SmartRank? <a href="/register">Create an account</a>
        </span>
      }
    >
      {demo ? (
        <div className="auth-demo">
          <div>
            <p className="auth-demo-title">Demo credentials</p>
            <p className="auth-demo-line">Email: {demo.email}</p>
            <p className="auth-demo-line">Password: {demo.password}</p>
          </div>
          <button type="button" className="auth-demo-btn" onClick={useDemo}>
            Use demo
          </button>
        </div>
      ) : null}

      <form className="auth-form">
        <label className="auth-label">
          Email address
          <div className="auth-input-row">
            <Mail size={16} />
            <input
              className="auth-input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </label>
        <label className="auth-label">
          Password
          <div className="auth-input-row">
            <Lock size={16} />
            <input
              className="auth-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </label>
        <div className="auth-row">
          <label className="auth-check">
            <input type="checkbox" />
            Keep me signed in
          </label>
          <a href="/forgot">Forgot password?</a>
        </div>
        {error ? <div className="auth-alert error">{error}</div> : null}
        {message ? <div className="auth-alert success">{message}</div> : null}
        <button className="auth-button" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="auth-divider">or continue with</div>

      <div className="auth-oauth">
        <button type="button" onClick={() => startOAuth("google")} disabled={loading}>
          <Chrome size={16} />
          Continue with Google
        </button>
        <button type="button" onClick={() => startOAuth("facebook")} disabled={loading}>
          <Facebook size={16} />
          Continue with Facebook
        </button>
        <button type="button">
          <Mail size={16} />
          Continue with Email
        </button>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
