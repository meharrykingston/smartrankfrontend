import { ArrowRight } from "lucide-react";
import "./auth.css";

type AuthHeaderProps = {
  mode?: "auth" | "pricing";
};

const AuthHeader = ({ mode = "auth" }: AuthHeaderProps) => {
  return (
    <header className="auth-header-bar">
      <a className="auth-header-logo" href="/">
        <img src="/1000000603.png" alt="SmartRank logo" className="auth-header-icon" />
        <span>SmartRank</span>
      </a>
      <nav className="auth-header-nav">
        <a href="/#systems">Systems</a>
        <a href="/#velocity">Velocity</a>
        <a href="/pricing">Pricing</a>
        <a href="/#models">Models</a>
        <a href="/#faq">FAQ</a>
      </nav>
      <a className="auth-header-cta" href={mode === "pricing" ? "/register" : "/login"}>
        {mode === "pricing" ? "Start Free Trial" : "Access Terminal"}
        <ArrowRight size={16} />
      </a>
    </header>
  );
};

export default AuthHeader;
