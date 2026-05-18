import { ReactNode } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import "./auth.css";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  asideTitle?: string;
  asideCopy?: string;
  asideHighlights?: string[];
};

const AuthShell = ({
  title,
  subtitle,
  children,
  footer,
  header,
  asideTitle = "SmartRank Workspace",
  asideCopy =
    "Launch autonomous growth loops with secure, auditable access. Your team gets a single control plane for research, content, and deployment.",
  asideHighlights = [
    "Agentic pipelines with human override",
    "Role-based access and activity trails",
    "SSO-ready in minutes",
  ],
}: AuthShellProps) => {
  return (
    <div className="auth-root">
      <div className="auth-backdrop" aria-hidden="true" />
      {header}
      <div className="auth-grid">
        <section className="auth-panel">
          <div className="auth-brand">
            <div className="auth-logo">
              <span />
            </div>
            <div>
              <p className="auth-brand-title">SmartRank</p>
              <p className="auth-brand-sub">Secure access portal</p>
            </div>
          </div>

          <div className="auth-header">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          {children}

          {footer ? <div className="auth-footer">{footer}</div> : null}
        </section>

        <aside className="auth-aside">
          <div className="auth-aside-card">
            <div className="auth-aside-pill">
              <span className="auth-aside-dot" />
              Verified infrastructure
            </div>
            <h2>{asideTitle}</h2>
            <p>{asideCopy}</p>
            <div className="auth-aside-list">
              {asideHighlights.map((item) => (
                <div key={item} className="auth-aside-item">
                  <CheckCircle2 size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <button className="auth-ghost" type="button">
              Explore platform
              <ArrowRight size={16} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AuthShell;
