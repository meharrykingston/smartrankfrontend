import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import AuthHeader from "../auth/AuthHeader";
import AuthShell from "../auth/AuthShell";
import "../auth/auth.css";

const ForgotPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    if (!email) {
      setError("Please enter your workspace email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        setError(data?.error ?? "Unable to send reset link.");
        return;
      }
      setMessage("Reset link sent. Check your inbox for next steps.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send reset link.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your access"
      subtitle="Enter the email tied to your workspace. We will send a secure reset link."
      header={<AuthHeader />}
      footer={
        <span>
          Remembered your password? <a href="/login">Back to sign in</a>
        </span>
      }
      asideTitle="Recovery with confidence"
      asideCopy="We protect every reset request with verification and audit logs, so your workspace stays secure even during account recovery."
      asideHighlights={[
        "Secure reset tokens",
        "Time-bound recovery links",
        "Immediate session revocation",
      ]}
    >
      <form className="auth-form">
        <label className="auth-label">
          Workspace email
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
        {error ? <div className="auth-alert error">{error}</div> : null}
        {message ? <div className="auth-alert success">{message}</div> : null}
        <button className="auth-button" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
          <ArrowRight size={16} />
        </button>
        <p className="auth-helper">
          If you no longer have access to this email, contact your workspace admin for manual recovery.
        </p>
      </form>
    </AuthShell>
  );
};

export default ForgotPage;
