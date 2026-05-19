import { useState } from 'react'
import { ArrowRight, BadgeCheck, Check, CircleUserRound, Sparkles } from 'lucide-react'
import './pricing.css'

const getUserId = () => {
  const key = 'smartrank_user_id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const created = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  window.localStorage.setItem(key, created)
  return created
}

const tiers = [
  {
    name: 'Free',
    price: '$0',
    cadence: '/mo',
    description: 'Best for first-touch trials and a single live workspace.',
    features: [
      '1 active chat workspace',
      '20 guest messages',
      '40 messages after email sign-in',
      'Live admin support thread',
    ],
    highlight: false,
  },
  {
    name: 'Premium',
    price: '$24',
    cadence: '/mo',
    description: 'Built for founders who want SmartRank to keep working without the free-plan ceiling.',
    features: [
      'Multiple workspaces',
      'Expanded message allowance',
      'Longer-running agent support',
      'Priority premium nudges and automation',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    description: 'For teams that need custom infrastructure, approvals, and rollout support.',
    features: [
      'Custom onboarding',
      'Governance and approvals',
      'Dedicated support lane',
      'Deployment planning assistance',
    ],
    highlight: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const activatePremium = async () => {
    const userId = getUserId()
    setLoading(true)
    setNotice('')
    try {
      const response = await fetch('/api/auth/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await response.json()
      if (!response.ok || !data?.ok) {
        setNotice(data?.error ?? 'Unable to activate Premium right now.')
        return
      }
      setNotice('Premium activated for this workspace. Redirecting...')
      window.setTimeout(() => {
        window.location.href = '/workspace'
      }, 900)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to activate Premium right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pricing-root">
      <header className="pricing-header">
        <div className="pricing-brand">
          <img src="/1000000595.png" alt="SmartRank logo" className="pricing-logo" />
          <div>
            <p>SmartRank</p>
            <span>Plans</span>
          </div>
        </div>
        <nav>
          <a href="/workspace">Workspace</a>
          <a href="/login">Log in</a>
          <a href="/register">Sign up</a>
        </nav>
        <div className="pricing-actions">
          <a className="pricing-profile-btn" href="/workspace" aria-label="Back to workspace">
            <CircleUserRound size={18} />
          </a>
        </div>
      </header>

      <main className="pricing-main">
        <section className="pricing-hero">
          <div>
            <div className="pricing-pill">
              <Sparkles size={14} />
              Plans tuned for US SaaS and agency growth teams
            </div>
            <h1>Choose the SmartRank plan that keeps the agent moving.</h1>
            <p>
              Start free with one workspace and lightweight usage. Upgrade to Premium when you want
              more chats, more continuity, and a stronger always-on operator feel.
            </p>
            <div className="pricing-hero-actions">
              <button className="pricing-cta pricing-cta-button" type="button" onClick={() => void activatePremium()}>
                {loading ? 'Activating Premium...' : 'Start Premium'}
                <ArrowRight size={16} />
              </button>
              <a className="pricing-ghost" href="/workspace">
                Stay on free
              </a>
            </div>
            {notice ? <div className="pricing-notice">{notice}</div> : null}
          </div>
          <div className="pricing-hero-card">
            <div className="pricing-hero-top">
              <BadgeCheck size={18} />
              Recommended for active operators
            </div>
            <h3>Premium keeps the workspace alive longer</h3>
            <p>
              Free is perfect for evaluation. Premium is where SmartRank starts feeling like a true
              always-on operator instead of a limited trial.
            </p>
            <div className="pricing-hero-metrics">
              <div>
                <strong>1</strong>
                <span>Free chat</span>
              </div>
              <div>
                <strong>$24</strong>
                <span>Premium / month</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Agent continuity</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pricing-grid">
          {tiers.map((tier) => (
            <article key={tier.name} className={tier.highlight ? 'pricing-card highlight' : 'pricing-card'}>
              {tier.highlight ? <div className="pricing-tag">Best for growth teams</div> : null}
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
              {tier.name === 'Premium' ? (
                <button className="pricing-button" type="button" onClick={() => void activatePremium()}>
                  {loading ? 'Activating...' : 'Activate Premium'}
                </button>
              ) : (
                <button className="pricing-button ghost" type="button" onClick={() => (window.location.href = '/workspace')}>
                  {tier.name === 'Free' ? 'Continue free' : 'Talk to sales'}
                </button>
              )}
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
