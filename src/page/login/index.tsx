import { useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import AuthHeader from "../auth/AuthHeader";
import AuthShell from "../auth/AuthShell";
import "../auth/auth.css";

const getUserId = () => {
  const key = "smartrank_user_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  window.localStorage.setItem(key, created);
  return created;
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
        body: JSON.stringify({ userId: getUserId(), email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setError(data?.error ?? "Unable to sign in.");
        return;
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
    </AuthShell>
  );
};

export default LoginPage;
