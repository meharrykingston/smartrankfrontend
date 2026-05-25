import { useEffect, useMemo, useState } from 'react'
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

const resourceItems = [
  'Business Process',
  'Sales Pipeline',
  'Strategy Deck',
  'Operations Portal',
] as const

const operationsTodos = [
  'Understand the current operations goal',
  'Identify all active daily business work',
  'Separate tasks into urgent, important, and low-priority',
  'Define the main execution priorities for today',
  'Create a clear task ownership structure',
  'Map the current execution flow from start to completion',
  'Find blockers slowing down daily work',
  'Decide which tasks need approval before moving forward',
  'Create today’s operations action plan',
  'Prepare the structure for daily progress updates',
  'Assign next workstreams to Process, Execution, Automation, and Reporting agents',
] as const

const agentDefinitions = [
  {
    id: 'ops-director',
    label: 'Ops Director Agent',
    summary:
      'The Ops Director Agent is currently analyzing the business operations structure, active workstreams, execution priorities, internal coordination flow, and operational bottlenecks. The objective is to understand how daily work is currently being managed, identify where execution slows down, determine which tasks require structured tracking or approvals, and define the highest-priority operational goals for the workspace. This stage establishes the operational direction before workflows, reporting systems, task structures, and execution pipelines are organized further.',
    command: 'ops.run()',
    prompt:
      'I mainly want the workspace to help centralize operations, structure task flow, improving execution clarity and operational visibility.',
    queueLabel: 'Queue',
    actionLabel: 'Steer',
  },
  {
    id: 'process-architect',
    label: 'Process Architect Agent',
    summary:
      'The Process Architect Agent is mapping how recurring work moves through the business, where handoffs break, which steps repeat, and which workflows should be standardized. The goal is to turn scattered execution into clear repeatable systems with defined stages, inputs, owners, and output expectations.',
    command: 'process.run()',
    prompt:
      'I want to map the current workflows clearly, remove duplication, and define repeatable processes across the team.',
    queueLabel: 'Queue',
    actionLabel: 'Steer',
  },
  {
    id: 'execution-coordinator',
    label: 'Execution Coordinator Agent',
    summary:
      'The Execution Coordinator Agent is reviewing delivery cadence, sequencing, task ownership, and the timing of dependencies across active initiatives. The focus is to keep work moving, surface what needs attention next, and reduce confusion between planning and actual execution.',
    command: 'execute.run()',
    prompt:
      'I need help coordinating the work currently in motion and making sure execution stays aligned day to day.',
    queueLabel: 'Queue',
    actionLabel: 'Steer',
  },
  {
    id: 'systems-automation',
    label: 'Systems Automation Agent',
    summary:
      'The Systems Automation Agent is identifying manual work that can be converted into templates, triggers, automations, and supporting systems. The objective is to reduce repetitive effort, improve reliability, and create stronger operational leverage through structured automation.',
    command: 'systems.run()',
    prompt:
      'I want to identify repetitive work and turn it into automations, triggers, and cleaner operational systems.',
    queueLabel: 'Queue',
    actionLabel: 'Steer',
  },
  {
    id: 'operations-reporting',
    label: 'Operations Reporting Agent',
    summary:
      'The Operations Reporting Agent is organizing reporting needs across operations, including updates, status tracking, measurable progress, and team visibility. The aim is to create clean reporting structures that make business activity easier to monitor and easier to act on.',
    command: 'reporting.run()',
    prompt:
      'I need stronger reporting, visibility, and structured updates so I can see what is actually happening operationally.',
    queueLabel: 'Queue',
    actionLabel: 'Steer',
  },
] as const

const workflowOutputByMode = {
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

const baseLogs = [
  { time: '12:01:12', level: 'INFO', message: 'Request received' },
  { time: '12:01:15', level: 'INFO', message: 'Processing input' },
  { time: '12:01:18', level: 'INFO', message: 'Routing to appropriate unit' },
  { time: '12:01:22', level: 'SUCCESS', message: 'Task completed' },
  { time: '12:01:25', level: 'INFO', message: 'Awaiting next input' },
] as const

type ViewState = 'home' | 'workspace'
type WorkflowMode =
  | 'operations'
  | 'virtualTeam'
  | 'leads'
  | 'assets'
  | 'marketing'
  | 'crisis'
type AgentId = (typeof agentDefinitions)[number]['id']
type ComposerAction = 'steer' | 'queue'

const modeByTitle: Record<(typeof cards)[number]['title'], WorkflowMode> = {
  'Run My Operations': 'operations',
  'Create My Virtual Team': 'virtualTeam',
  'Manage Leads & Customers': 'leads',
  'Build Business Assets': 'assets',
  'Grow My Marketing': 'marketing',
  'Fix a Business Crisis': 'crisis',
}

function SidebarCogIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z" />
      <path d="M19.4 13.1v-2.2l-1.9-.5a6.3 6.3 0 0 0-.7-1.7l1-1.7-1.6-1.6-1.7 1a6.3 6.3 0 0 0-1.7-.7l-.5-1.9h-2.2l-.5 1.9a6.3 6.3 0 0 0-1.7.7l-1.7-1-1.6 1.6 1 1.7a6.3 6.3 0 0 0-.7 1.7l-1.9.5v2.2l1.9.5a6.3 6.3 0 0 0 .7 1.7l-1 1.7 1.6 1.6 1.7-1a6.3 6.3 0 0 0 1.7.7l.5 1.9h2.2l.5-1.9a6.3 6.3 0 0 0 1.7-.7l1.7 1 1.6-1.6-1-1.7a6.3 6.3 0 0 0 .7-1.7l1.9-.5Z" />
    </svg>
  )
}

function SidebarBrainIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4.4a3.1 3.1 0 0 0-4.8 2.6 3 3 0 0 0-.9 5.6 3.2 3.2 0 0 0 1.5 5.8H10" />
      <path d="M14 4.4a3.1 3.1 0 0 1 4.8 2.6 3 3 0 0 1 .9 5.6 3.2 3.2 0 0 1-1.5 5.8H14" />
      <path d="M10 4.5V20" />
      <path d="M14 4.5V20" />
      <path d="M7.8 8.1H10" />
      <path d="M14 8.1h2.2" />
      <path d="M8.6 12H10" />
      <path d="M14 12h1.4" />
      <path d="M7.8 16H10" />
      <path d="M14 16h2.2" />
    </svg>
  )
}

function SidebarFileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3.8h6.2l3.8 3.8V20.2H7z" />
      <path d="M13.2 3.8v3.8H17" />
    </svg>
  )
}

function SidebarBoardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.2 5.2h15.6v11.6H4.2z" />
      <path d="M8.1 18.8h7.8" />
      <path d="m7.2 13.5 2.5-3 2.1 1.8 3.4-4" />
    </svg>
  )
}

function SidebarCardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.2 6.2h15.6v11.6H4.2z" />
      <path d="M4.2 10.1h15.6" />
    </svg>
  )
}

function TodoFlagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 21V5.2" />
      <path d="M6.8 6h8l1.4 2.5H10l-1.6 2.6H6.8z" />
    </svg>
  )
}

function OutputPanelIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4.5" width="16" height="15" rx="2.5" />
      <path d="M7 12h10" />
    </svg>
  )
}

function App() {
  const [view, setView] = useState<ViewState>('home')
  const [message, setMessage] = useState('')
  const [workspaceMessage, setWorkspaceMessage] = useState('')
  const [activePrompt, setActivePrompt] = useState<string>(cards[0].command)
  const [activeMode, setActiveMode] = useState<WorkflowMode>('operations')
  const [activeAgentId, setActiveAgentId] = useState<AgentId>('ops-director')
  const [composerAction, setComposerAction] = useState<ComposerAction>('steer')
  const [progress, setProgress] = useState(64)
  const [runLabel, setRunLabel] = useState('ops.run()')
  const [stepStates, setStepStates] = useState([true, true, true, false, false])

  const activeAgent = useMemo(
    () =>
      agentDefinitions.find((agent) => agent.id === activeAgentId) ?? agentDefinitions[0],
    [activeAgentId],
  )

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
  }, [view, activeAgentId, activePrompt])

  const startWorkflow = (prompt: string, mode: WorkflowMode) => {
    const normalizedPrompt = prompt.trim()
    setActivePrompt(normalizedPrompt)
    setActiveMode(mode)
    setActiveAgentId('ops-director')
    setRunLabel('ops.run()')
    setWorkspaceMessage(normalizedPrompt || agentDefinitions[0].prompt)
    setView('workspace')
    setMessage('')
    setComposerAction('steer')
  }

  const handleHomeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = message.trim()
    if (!trimmed) {
      return
    }

    startWorkflow(trimmed, 'operations')
  }

  const handleWorkspaceSubmit = (action: ComposerAction) => {
    const fallbackMessage =
      workspaceMessage.trim() || activePrompt || activeAgent.prompt
    const label = action === 'steer' ? 'Steer' : 'Queue'

    setComposerAction(action)
    setActivePrompt(fallbackMessage)
    setWorkspaceMessage(fallbackMessage)
    setRunLabel(
      action === 'steer'
        ? `${activeAgent.label.split(' ')[0].toLowerCase()}.steer()`
        : `${activeAgent.label.split(' ')[0].toLowerCase()}.queue()`,
    )

    const progressSeed = action === 'steer' ? 72 : 48
    setProgress(progressSeed)
    setStepStates(action === 'steer' ? [true, true, true, true, false] : [true, true, false, false, false])

    void label
  }

  const handleAgentSelect = (agentId: AgentId) => {
    const agent = agentDefinitions.find((item) => item.id === agentId)
    if (!agent) {
      return
    }

    setActiveAgentId(agentId)
    setRunLabel(
      composerAction === 'queue'
        ? `${agent.label.split(' ')[0].toLowerCase()}.queue()`
        : `${agent.label.split(' ')[0].toLowerCase()}.run()`,
    )
    setWorkspaceMessage(agent.prompt)
    setActivePrompt(agent.prompt)
  }

  const currentOutput =
    activeMode === 'operations' ? activeAgent.summary : workflowOutputByMode[activeMode]

  const resourceIconMap = [SidebarFileIcon, SidebarCardIcon, SidebarBoardIcon, SidebarCardIcon]

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
            <button className="sidebar-action is-active is-primary" type="button">
              <span className="sidebar-icon"><SidebarCogIcon /></span>
              <span>Operation Management</span>
            </button>

            {agentDefinitions.map((agent) => (
              <button
                key={agent.id}
                className={`sidebar-action ${activeAgentId === agent.id ? 'is-selected' : ''}`}
                type="button"
                onClick={() => handleAgentSelect(agent.id)}
              >
                <span className="sidebar-icon"><SidebarBrainIcon /></span>
                <span>{agent.label}</span>
              </button>
            ))}

            <div className="sidebar-resource-list">
              {resourceItems.map((resource, index) => {
                const Icon = resourceIconMap[index] ?? SidebarFileIcon
                return (
                  <button key={resource} className="sidebar-resource" type="button">
                    <span className="sidebar-resource-icon"><Icon /></span>
                    <span>{resource}</span>
                  </button>
                )
              })}
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
                <span className="workspace-breadcrumb-mark"><SidebarBrainIcon /></span>
                <span>{activeAgent.label}</span>
                <span className="workspace-breadcrumb-arrow">›</span>
              </div>

              <section className="todo-panel">
                <div className="todo-header">
                  <div className="todo-title">
                    <span className="todo-title-icon"><TodoFlagIcon /></span>
                    <strong>Todos</strong>
                  </div>
                  <span className="todo-count">{operationsTodos.length}</span>
                </div>

                <ul className="todo-list">
                  {operationsTodos.map((item, index) => (
                    <li key={item} className={index === 0 ? 'is-current' : ''}>
                      <span className="todo-dot" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="terminal-list">
                <div className="terminal-line">
                  <span className="terminal-mark">{'>'}_</span>
                  <strong>Terminal</strong>
                  <span className="terminal-step">
                    {composerAction === 'queue'
                      ? 'Queued for structured execution handoff'
                      : 'Live steering context updated for active agent'}
                  </span>
                </div>
              </div>

              <form
                className={`workspace-composer is-${composerAction}`}
                onSubmit={(event) => {
                  event.preventDefault()
                  handleWorkspaceSubmit(composerAction)
                }}
              >
                <textarea
                  value={workspaceMessage}
                  onChange={(event) => setWorkspaceMessage(event.target.value)}
                  placeholder="I mainly want the workspace to help centralize operations, structure task flow, improving..."
                  aria-label="Send a Message"
                  rows={4}
                />
                <div className="workspace-composer-footer">
                  <button
                    type="button"
                    className="workspace-plus-button"
                    aria-label="Add context"
                  >
                    +
                  </button>
                  <div className="workspace-action-group">
                    <button
                      type="button"
                      className={`workspace-action-pill ${composerAction === 'steer' ? 'is-active' : ''}`}
                      onClick={() => {
                        setComposerAction('steer')
                        handleWorkspaceSubmit('steer')
                      }}
                    >
                      Steer
                    </button>
                    <button
                      type="button"
                      className={`workspace-action-pill ${composerAction === 'queue' ? 'is-active' : ''}`}
                      onClick={() => {
                        setComposerAction('queue')
                        handleWorkspaceSubmit('queue')
                      }}
                    >
                      Queue
                    </button>
                  </div>
                </div>
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
                    <span className="sim-output-icon"><OutputPanelIcon /></span>
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

        <form className={`composer ${view === 'workspace' ? 'is-hidden' : ''}`} onSubmit={handleHomeSubmit}>
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
