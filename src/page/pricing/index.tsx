import { ArrowRight, BadgeCheck, Check, CircleUserRound, Sparkles } from "lucide-react";
import "./pricing.css";

const tiers = [
  {
    name: "ProModel X1",
    price: "$79",
    cadence: "/mo",
    description: "Baseline reasoning engine for SEO, CRO, and content operations.",
    features: [
      "2 active workspaces",
      "Up to 10 automated campaigns",
      "Core analytics suite",
      "Community support",
    ],
    highlight: false,
  },
  {
    name: "VectorMesh V2",
    price: "$249",
    cadence: "/mo",
    description: "High-speed orchestration for multi-channel growth pipelines.",
    features: [
      "Unlimited workspaces",
      "Cross-channel orchestration",
      "Predictive opportunity scoring",
      "Priority support + SLA",
    ],
    highlight: true,
  },
  {
    name: "SignalForge S3",
    price: "Custom",
    cadence: "",
    description: "Enterprise-grade creative synthesis with governance controls.",
    features: [
      "Dedicated success lead",
      "Custom models + data residency",
      "Audit trails + approvals",
      "Procurement ready",
    ],
    highlight: false,
  },
];

const PricingPage = () => {
  return (
    <div className="pricing-root">
      <header className="pricing-header">
        <div className="pricing-brand">
          <img src="/1000000603.png" alt="SmartRank logo" className="pricing-logo" />
          <div>
            <p>SmartRank</p>
            <span>Pricing</span>
          </div>
        </div>
        <nav>
          <a href="/">Overview</a>
          <a href="/">Systems</a>
          <a href="/">Models</a>
          <a href="/workspace">Workspace</a>
        </nav>
        <div className="pricing-actions">
          <a className="pricing-profile-btn" href="/profile" aria-label="Profile">
            <CircleUserRound size={18} />
          </a>
        </div>
      </header>

      <main className="pricing-main">
        <section className="pricing-hero">
          <div>
            <div className="pricing-pill">
              <Sparkles size={14} />
              Launch plans that scale with your growth
            </div>
            <h1>Choose the operating system for autonomous growth.</h1>
            <p>
              SmartRank pricing keeps teams aligned: start with Core, accelerate with Velocity, or
              unlock full governance with Enterprise.
            </p>
            <div className="pricing-hero-actions">
              <a className="pricing-cta" href="/register">
                Activate workspace
                <ArrowRight size={16} />
              </a>
              <a className="pricing-ghost" href="/login">
                Compare features
              </a>
            </div>
          </div>
          <div className="pricing-hero-card">
            <div className="pricing-hero-top">
              <BadgeCheck size={18} />
              Verified savings
            </div>
            <h3>Save 18% with annual billing</h3>
            <p>Switch to annual for predictable budgets and priority onboarding.</p>
            <div className="pricing-hero-metrics">
              <div>
                <strong>96%</strong>
                <span>Retention</span>
              </div>
              <div>
                <strong>2.4x</strong>
                <span>Pipeline velocity</span>
              </div>
              <div>
                <strong>28 days</strong>
                <span>Avg. time to ROI</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pricing-grid">
          {tiers.map((tier) => (
            <article key={tier.name} className={tier.highlight ? "pricing-card highlight" : "pricing-card"}>
              {tier.highlight ? <div className="pricing-tag">Most chosen</div> : null}
              <h3>{tier.name}</h3>
              <div className="pricing-price">
                <span>{tier.price}</span>
                <small>{tier.cadence}</small>
              </div>
              <p>{tier.description}</p>
              <ul>
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className={tier.highlight ? "pricing-button" : "pricing-button ghost"} type="button">
                {tier.highlight ? "Activate VectorMesh" : "Talk to sales"}
              </button>
            </article>
          ))}
        </section>

        <section className="pricing-footer">
          <div>
            <h2>Need custom infrastructure?</h2>
            <p>
              We can deploy SmartRank inside your stack with dedicated models, compliance controls, and
              onboarding support.
            </p>
          </div>
          <a className="pricing-cta" href="/register">
            Schedule a walkthrough
            <ArrowRight size={16} />
          </a>
        </section>
      </main>
    </div>
  );
};

export default PricingPage;
