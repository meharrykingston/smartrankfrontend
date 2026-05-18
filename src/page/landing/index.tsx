import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Globe2,
  Instagram,
  Search,
  ShoppingBag,
  Target,
} from 'lucide-react'
import './landing.css'

const integrations = [
  { label: 'Google', icon: Search },
  { label: 'WordPress', icon: Globe2 },
  { label: 'Facebook', icon: Bot },
  { label: 'Instagram', icon: Instagram },
  { label: 'Shopify', icon: ShoppingBag },
]

const results = [
  { value: '+84%', label: 'organic traffic lift in 90 days' },
  { value: '3x', label: 'posting consistency across channels' },
  { value: '2x', label: 'keyword coverage on core pages' },
]

const engineCards = [
  {
    title: 'SEO automation',
    description: 'Find content gaps, refresh metadata, improve internal links, and keep technical hygiene moving.',
  },
  {
    title: 'Social automation',
    description: 'Turn growth goals into social calendars, channel-ready captions, and timed distribution.',
  },
  {
    title: 'Content automation',
    description: 'Draft, publish, refresh, and repurpose articles through your CMS without manual busywork.',
  },
  {
    title: 'Ads automation',
    description: 'Sync intent signals into campaign actions, budget shifts, and messaging experiments.',
  },
  {
    title: 'AI visibility optimization',
    description: 'Strengthen the content and entity signals that help your brand show up in AI-led discovery.',
  },
]

const steps = [
  'Connect your accounts',
  'Tell SmartRank your goal',
  'Review the plan before execution',
  'Watch execution happen automatically',
]

const heroPrompts = [
  'increase traffic',
  'grow instagram',
  'publish blogs weekly',
]

const createDemoSession = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    'SmartRank_session',
    JSON.stringify({
      access_token: 'demo',
      user: { email: 'demo@SmartRank.ai', name: 'Growth Operator' },
    }),
  )
}

export default function LandingPage() {
  const [promptIndex, setPromptIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % heroPrompts.length)
    }, 2400)
    return () => window.clearInterval(timer)
  }, [])

  const handleStartGrowing = () => {
    createDemoSession()
    window.location.href = '/workspace'
  }

  return (
    <div className="growth-landing">
      <div className="landing-atmosphere" aria-hidden="true">
        <div className="landing-glow landing-glow-a" />
        <div className="landing-glow landing-glow-b" />
        <div className="landing-grid" />
      </div>

      <header className="landing-nav">
        <a href="/" className="landing-brand">
          <img src="/1000000603.png" alt="SmartRank logo" className="landing-brand-mark" />
          <span>SmartRank</span>
        </a>
        <nav className="landing-links">
          <a href="#how-it-works">How it works</a>
          <a href="#integrations">Integrations</a>
          <a href="#results">Results</a>
          <a href="#engine">Automation engine</a>
        </nav>
        <div className="landing-nav-actions">
          <a href="/login" className="landing-link-button">
            Sign in
          </a>
          <button type="button" className="landing-primary-button" onClick={handleStartGrowing}>
            Start Growing
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-pill">
              <Gauge size={15} />
              Intent-driven growth operations
            </div>
            <h1>Tell SmartRank what to grow. It does the rest.</h1>
            <p>
              SmartRank turns plain-language intent into connected execution across SEO, content,
              social, analytics, and commerce systems.
            </p>
            <div className="landing-intent-preview">
              <span className="intent-label">Try saying</span>
              <div className="intent-prompt">
                <Target size={18} />
                <span>{heroPrompts[promptIndex]}</span>
              </div>
            </div>
            <div className="landing-hero-actions">
              <button type="button" className="landing-primary-button" onClick={handleStartGrowing}>
                Start Growing
                <ArrowRight size={16} />
              </button>
              <a href="#how-it-works" className="landing-secondary-button">
                See how it works
                <ChevronRight size={16} />
              </a>
            </div>
          </div>

          <div className="landing-hero-panel">
            <div className="hero-panel-header">
              <span>Growth command center</span>
              <span className="status-chip">Live preview</span>
            </div>
            <div className="hero-command-card">
              <div className="hero-command-title">Intent</div>
              <div className="hero-command-value">Increase traffic</div>
            </div>
            <div className="hero-plan-card">
              <div className="hero-plan-header">
                <BarChart3 size={18} />
                <span>SmartRank will</span>
              </div>
              <ul>
                <li>Publish 4 SEO blogs</li>
                <li>Optimize 12 pages</li>
                <li>Schedule 10 social posts</li>
                <li>Improve keyword coverage</li>
              </ul>
            </div>
            <div className="hero-timeline-card">
              <div className="hero-timeline-row done">
                <CheckCircle2 size={16} />
                Blog briefs generated
              </div>
              <div className="hero-timeline-row done">
                <CheckCircle2 size={16} />
                Internal linking opportunities mapped
              </div>
              <div className="hero-timeline-row">
                <span className="timeline-pulse" />
                Social distribution queued
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="landing-section">
          <div className="section-heading">
            <span>How it works</span>
            <h2>One command in. A full execution plan out.</h2>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <article key={step} className="step-card">
                <span className="step-index">0{index + 1}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="integrations" className="landing-section">
          <div className="section-heading">
            <span>Integrations</span>
            <h2>Built around the systems growth teams already depend on.</h2>
          </div>
          <div className="integration-strip">
            {integrations.map(({ label, icon: Icon }) => (
              <div key={label} className="integration-pill">
                <Icon size={18} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="results" className="landing-section">
          <div className="section-heading">
            <span>Results</span>
            <h2>Outcome-first positioning from the first scroll.</h2>
          </div>
          <div className="results-grid">
            {results.map((item) => (
              <article key={item.label} className="result-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="engine" className="landing-section">
          <div className="section-heading">
            <span>Automation engine</span>
            <h2>SmartRank coordinates the work across the channels that move growth.</h2>
          </div>
          <div className="engine-grid">
            {engineCards.map((card) => (
              <article key={card.title} className="engine-card">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
