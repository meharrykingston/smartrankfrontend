import { useEffect, useState } from 'react'
import logo from './assets/logomaterial/logo.png'
import './App.css'

const cards = [
  {
    title: 'Run My Operations',
    description:
      'Manage daily business work, tasks, updates, priorities, and execution flow.',
    command: 'Manage daily business work, tasks, updates, priorities, and execution flow.',
  },
  {
    title: 'Create My Virtual Team',
    description:
      'Set up agentic employees for research, content, CRM, reporting, and operations.',
    command:
      'Set up an agentic virtual team for research, content, CRM, reporting, and operations.',
  },
  {
    title: 'Manage Leads & Customers',
    description:
      'Organize leads, follow-ups, customer records, pipelines, and response systems.',
    command:
      'Organize leads, follow-ups, customer records, pipelines, and response systems.',
  },
  {
    title: 'Build Business Assets',
    description:
      'Create documents, reports, SOPs, proposals, landing pages, and internal files.',
    command:
      'Create documents, reports, SOPs, proposals, landing pages, and internal files.',
  },
  {
    title: 'Grow My Marketing',
    description:
      'Build campaigns, content, offers, landing pages, and growth actions.',
    command: 'Build campaigns, content, offers, landing pages, and growth actions.',
  },
  {
    title: 'Fix a Business Crisis',
    description:
      'Turn urgent problems into clear risks, responses, decisions, and next steps.',
    command:
      'Turn urgent problems into clear risks, responses, decisions, and next steps.',
  },
] as const

const agents = [
  'Ops Director Agent',
  'Process Architect Agent',
  'Execution Coordinator Agent',
  'Systems Automation Agent',
  'Operations Reporting Agent',
] as const

const resources = [
  'Business Process',
  'Sales Pipeline',
  'Strategy Deck',
  'Operations Portal',
] as const

const todoItems = [
  'Explore existing engine structure from uploaded zip',
  'Expand world taxonomy with more domains/subdomains',
  'Expand market_objects.json with 300+ objects with DNA',
  'Expand archetypes.json with 20+ archetypes',
  'Improve universal_intake.py classification',
  'Expand region intelligence in world_regions.json',
  'Improve ad intent system',
  'Improve output quality with all required fields',
  'Add accuracy warning to reports',
  'Test all 5 test commands',
  'Verify backward compatibility with all existing runners',
] as const

const baseLogs = [
  { time: '12:01:12', level: 'INFO', message: 'Request received' },
  { time: '12:01:15', level: 'INFO', message: 'Processing input' },
  { time: '12:01:18', level: 'INFO', message: 'Routing to appropriate unit' },
  { time: '12:01:22', level: 'SUCCESS', message: 'Task completed' },
  { time: '12:01:25', level: 'INFO', message: 'Awaiting next input' },
] as const

const outputByMode = {
  operations:
    'Understood. We’ll organize the daily business flow into a structured workspace including active tasks, execution priorities, updates, approvals, reporting, and ongoing operations management. The workspace will continuously track progress and keep execution moving while reducing the need to manually coordinate everything across different people and tools...',
  virtualTeam:
    'Your virtual team workspace is being assembled with specialist agents for research, delivery, reporting, and follow-through. Each role will get a scoped queue, communication rules, and handoff logic so the team can operate as one coordinated system...',
  leads:
    'We’re setting up a lead and customer command center with structured pipelines, reminders, follow-up sequencing, response notes, and status visibility so no prospect or account goes dark...',
  assets:
    'This workspace will generate the assets your business needs on demand, from SOPs and reports to proposals, internal docs, and launch-ready pages, all grouped into a clean production flow...',
  marketing:
    'Your growth workspace is being prepared with campaign planning, content production, offer management, launch checklists, and performance tracking so marketing moves faster with less friction...',
  crisis:
    'We’re opening a crisis response workspace focused on immediate triage, impact assessment, decision framing, assigned owners, and the fastest next actions to stabilize the situation...',
} as const

type ViewState = 'home' | 'workspace'
type WorkflowMode =
  | 'operations'
  | 'virtualTeam'
  | 'leads'
  | 'assets'
  | 'marketing'
  | 'crisis'

const modeByTitle: Record<(typeof cards)[number]['title'], WorkflowMode> = {
  'Run My Operations': 'operations',
  'Create My Virtual Team': 'virtualTeam',
  'Manage Leads & Customers': 'leads',
  'Build Business Assets': 'assets',
  'Grow My Marketing': 'marketing',
  'Fix a Business Crisis': 'crisis',
}

function App() {
  const [view, setView] = useState<ViewState>('home')
  const [message, setMessage] = useState('')
  const [activePrompt, setActivePrompt] = useState<string>(cards[0].command)
  const [activeMode, setActiveMode] = useState<WorkflowMode>('operations')
  const [progress, setProgress] = useState(64)
  const [runLabel, setRunLabel] = useState('ops.run()')
  const [stepStates, setStepStates] = useState([true, true, true, false, false])

  useEffect(() => {
    if (view !== 'workspace') {
      return
    }

    setProgress(18)
    setStepStates([true, false, false, false, false])

    const checkpoints = [18, 33, 52, 74, 96]
    let index = 0

    const interval = window.setInterval(() => {
      index += 1

      setProgress(checkpoints[Math.min(index, checkpoints.length - 1)] ?? 96)
      setStepStates((current) =>
        current.map((_, stepIndex) => stepIndex <= index),
      )

      if (index >= checkpoints.length - 1) {
        window.clearInterval(interval)
      }
    }, 680)

    return () => window.clearInterval(interval)
  }, [view, activeMode, activePrompt])

  const startWorkflow = (prompt: string, mode: WorkflowMode) => {
    setActivePrompt(prompt)
    setActiveMode(mode)
    setRunLabel(mode === 'operations' ? 'ops.run()' : `${mode}.run()`)
    setView('workspace')
    setMessage('')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = message.trim()
    if (!trimmed) {
      return
    }

    startWorkflow(trimmed, 'operations')
  }

  const currentOutput = outputByMode[activeMode]
  const terminalSteps =
    activeMode === 'operations'
      ? ['List uploaded files', 'Unzip engine source files']
      : ['Initialize workspace blueprint', 'Assign agent responsibilities']

  return (
    <main className={`app-shell ${view === 'workspace' ? 'workspace-active' : ''}`}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <img className="brand-logo" src={logo} alt="Smart Rank" />
        </div>

        {view === 'home' ? (
          <button className="workspace-button" type="button">
            <span className="workspace-plus">+</span>
            <span>New Workspace</span>
          </button>
        ) : (
          <div className="sidebar-stack">
            <button className="sidebar-action is-active" type="button">
              <span className="sidebar-icon">⚙</span>
              <span>Operation Management</span>
            </button>

            {agents.map((agent) => (
              <button key={agent} className="sidebar-action" type="button">
                <span className="sidebar-icon">◔</span>
                <span>{agent}</span>
              </button>
            ))}

            <div className="sidebar-resource-list">
              {resources.map((resource) => (
                <button key={resource} className="sidebar-resource" type="button">
                  <span className="sidebar-resource-icon">□</span>
                  <span>{resource}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <section className="main-panel">
        <header className="topbar">
          {view === 'workspace' ? (
            <button className="back-chip" type="button" onClick={() => setView('home')}>
              Back
            </button>
          ) : null}

          <button className="profile-button" type="button" aria-label="Open profile">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
              <path d="M4.5 19.5a7.5 7.5 0 0 1 15 0" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </button>
        </header>

        <div className={`home-scene ${view === 'workspace' ? 'is-hidden' : ''}`}>
          <div className="hero-section">
            <div className="orb" aria-hidden="true" />
            <h1>How can I help you today?</h1>
          </div>

          <section className="prompt-grid" aria-label="Suggested prompts">
            {cards.map((card, index) => (
              <button
                key={card.title}
                className="prompt-card"
                style={{ animationDelay: `${index * 90}ms` }}
                type="button"
                onClick={() => startWorkflow(card.command, modeByTitle[card.title])}
              >
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </button>
            ))}
          </section>
        </div>

        <div className={`workspace-scene ${view === 'workspace' ? 'is-visible' : ''}`}>
          <section className="workspace-grid">
            <div className="workspace-left">
              <article className="message-preview">
                <p>{activePrompt}</p>
                <button type="button">Show full message</button>
              </article>

              <div className="workspace-breadcrumb">
                <span className="workspace-breadcrumb-mark">✺</span>
                <span>Smart Rank</span>
                <span className="workspace-breadcrumb-arrow">›</span>
              </div>

              <section className="todo-panel">
                <div className="todo-header">
                  <div className="todo-title">
                    <span>⚐</span>
                    <strong>Todos</strong>
                  </div>
                  <span className="todo-count">{todoItems.length}</span>
                </div>

                <ul className="todo-list">
                  {todoItems.map((item, index) => (
                    <li key={item} className={index === 0 ? 'is-current' : ''}>
                      <span className="todo-dot" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="terminal-list">
                {terminalSteps.map((step) => (
                  <div key={step} className="terminal-line">
                    <span className="terminal-mark">{'>'}_</span>
                    <strong>Terminal</strong>
                    <span className="terminal-step">{step}</span>
                  </div>
                ))}
              </div>

              <div className="workspace-explainer">
                <p>Let me read all the critical source files to understand the current structure:</p>
              </div>

              <form className="workspace-composer" onSubmit={handleSubmit}>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Send a Message"
                  aria-label="Send a Message"
                  rows={4}
                />
                <button type="submit" aria-label="Send message">
                  +
                </button>
              </form>
            </div>

            <div className="workspace-right">
              <article className="sim-panel">
                <div className="sim-topline">
                  <div className="sim-command">
                    <span className="sim-arrow">›</span>
                    <span>{runLabel}</span>
                    <span className="sim-caret" />
                  </div>
                  <div className="sim-live">• LIVE</div>
                </div>

                <div className="step-flow">
                  {[1, 2, 3, 4, 5].map((step, index) => (
                    <div key={step} className="step-node-wrap">
                      <div className={`step-node ${stepStates[index] ? 'is-done' : ''}`}>
                        {step === 1 ? '↓' : step === 2 ? '≡' : step === 3 ? '⌘' : step === 4 ? '▷' : '✓'}
                      </div>
                      <div className="step-number">{String(step).padStart(2, '0')}</div>
                      <div className={`step-status ${stepStates[index] ? 'is-on' : ''}`} />
                    </div>
                  ))}
                </div>

                <div className="progress-card">
                  <div className="progress-head">
                    <span>› progress</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="log-card">
                  <div className="log-head">
                    <span>› log.stream</span>
                    <span>⋮</span>
                  </div>
                  <div className="log-table">
                    {baseLogs.map((log, index) => (
                      <div key={`${log.time}-${index}`} className="log-row">
                        <span>{log.time}</span>
                        <span>|</span>
                        <span className={`log-level ${log.level.toLowerCase()}`}>{log.level}</span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sim-output">
                  <div className="sim-output-head">
                    <span className="sim-output-icon">▣</span>
                    <span>&gt;_ smartrank</span>
                  </div>
                  <div className="sim-output-body">
                    <p>{currentOutput}</p>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <form className={`composer ${view === 'workspace' ? 'is-hidden' : ''}`} onSubmit={handleSubmit}>
          <button className="composer-attach" type="button" aria-label="Attach file">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.5 12.5 14.86 6.2a3 3 0 0 1 4.24 4.24l-8.13 8.13a5 5 0 1 1-7.07-7.07l8.48-8.49" />
            </svg>
          </button>
          <input
            className="composer-input"
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask SmartRank..."
            aria-label="Ask SmartRank"
          />
          <button className="composer-send" type="submit" aria-label="Send message">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20 20 12 4 4l3 8-3 8Z" />
            </svg>
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
