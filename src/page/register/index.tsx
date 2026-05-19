import { useState } from "react";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import AuthHeader from "../auth/AuthHeader";
import AuthShell from "../auth/AuthShell";
import "../auth/auth.css";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getUserId = () => {
    const key = "smartrank_user_id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    window.localStorage.setItem(key, created);
    return created;
  };

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!name || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!accepted) {
      setError("Please accept the terms to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: getUserId(), email, password, name }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setError(data?.error ?? "Unable to create account.");
        return;
      }

      setMessage("Account created. Redirecting to workspace...");
      window.location.href = "/workspace";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create account.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up secure access for your SmartRank workspace."
      header={<AuthHeader />}
      footer={
        <span>
          Already have an account? <a href="/login">Sign in</a>
        </span>
      }
      asideTitle="Move from plan to pipeline"
      asideCopy="SmartRank connects strategy, execution, and optimization in one cockpit. Your team gets instant visibility and safe automation."
      asideHighlights={[
        "Workspace-level permissions",
        "Usage-based scaling",
        "Dedicated onboarding support",
      ]}
    >
      <form className="auth-form">
        <label className="auth-label">
          Full name
          <div className="auth-input-row">
            <User size={16} />
            <input
              className="auth-input"
              type="text"
              placeholder="Harry Chen"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </label>
        <label className="auth-label">
          Work email
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
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </label>
        <label className="auth-label">
          Confirm password
          <div className="auth-input-row">
            <Lock size={16} />
            <input
              className="auth-input"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </label>
        <label className="auth-check">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          I agree to the Terms of Service and Privacy Policy
        </label>
        {error ? <div className="auth-alert error">{error}</div> : null}
        {message ? <div className="auth-alert success">{message}</div> : null}
        <button className="auth-button" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
