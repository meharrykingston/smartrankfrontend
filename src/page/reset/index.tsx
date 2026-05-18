import { useMemo, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import AuthHeader from "../auth/AuthHeader";
import AuthShell from "../auth/AuthShell";
import "../auth/auth.css";

const parseTokens = () => {
  if (typeof window === "undefined") return { accessToken: "", refreshToken: "" };
  const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
  const searchParams = new URLSearchParams(window.location.search);
  return {
    accessToken: hashParams.get("access_token") || searchParams.get("access_token") || "",
    refreshToken: hashParams.get("refresh_token") || searchParams.get("refresh_token") || "",
  };
};

const ResetPage = () => {
  const tokens = useMemo(() => parseTokens(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!tokens.accessToken) {
      setError("Reset link is missing or expired. Please request a new one.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setError(data?.error ?? "Unable to reset password.");
        return;
      }
      setMessage("Password updated. You can now sign in.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reset password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create a new password"
      subtitle="Choose a strong password to keep your SmartRank workspace protected."
      header={<AuthHeader />}
      footer={
        <span>
          Need to start over? <a href="/forgot">Request a new link</a>
        </span>
      }
      asideTitle="Your workspace, secured"
      asideCopy="Every password update triggers a full session reset across devices to protect your active workflows."
      asideHighlights={[
        "Instant session termination",
        "Password strength monitoring",
        "24/7 security monitoring",
      ]}
    >
      <form className="auth-form">
        <label className="auth-label">
          New password
          <div className="auth-input-row">
            <Lock size={16} />
            <input
              className="auth-input"
              type="password"
              placeholder="Create a new password"
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
              placeholder="Repeat the new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </label>
        {error ? <div className="auth-alert error">{error}</div> : null}
        {message ? <div className="auth-alert success">{message}</div> : null}
        <button className="auth-button" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Updating..." : "Update password"}
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthShell>
  );
};

export default ResetPage;
