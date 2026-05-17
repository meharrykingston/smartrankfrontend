import { useEffect, useState } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import {
  bootstrapWorkspace,
  createWorkspaceSocket,
  getAdminInbox,
  getLoginUrl,
  operatorReply,
  sendUserMessage
} from './api';
import type { AdminThread, ChatMessage, GuestSession, View } from './types';

const requestExamples = [
  'Bring more qualified enquiries from LinkedIn this month',
  'Fix my website so more visitors contact me',
  'Write a landing page that makes people book calls',
  'Create a full search visibility plan for my website',
  'Write cold emails for people likely to buy',
  'Create a launch campaign for my new product',
  'Find why my ads are not converting',
  'Turn my Instagram into a serious enquiry channel',
  'Create my complete marketing operating system',
  'Rewrite my homepage so it sounds premium',
  'Create a follow-up sequence for warm leads',
  'Build a personal brand plan for a founder',
  'Create short-video scripts for my service',
  'Plan my newsletter for the next 30 days',
  'Create Facebook ad variations for testing',
  'Create a comparison page against competitors'
];

const recentWork = [
  'SaaS enquiry system',
  'Homepage conversion fix',
  'LinkedIn founder plan',
  'Search visibility roadmap',
  'Cold email sequence'
];

const workingSteps = [
  'Understanding the request',
  'Preparing the right output structure',
  'Creating the first version',
  'Waiting for operator polish'
];

const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function routeTo(view: View) {
  if (view === 'admin') window.location.hash = '#/admin';
  else if (view === 'chat') window.location.hash = '#/chat';
  else if (view === 'pricing') window.location.hash = '#/pricing';
  else window.location.hash = '#/';
}

function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'dark' | 'ghost' | 'ghostDark' }) {
  const styles = {
    primary: 'btn-primary',
    dark: 'btn-dark',
    ghost: 'btn-ghost',
    ghostDark: 'btn-ghost-dark'
  };

  return (
    <button {...props} className={cx('btn', styles[variant], className)}>
      {children}
    </button>
  );
}

function ShellNav({ view, setView }: { view: View; setView: (view: View) => void }) {
  const isAdmin = view === 'admin';
  const start = () => {
    setView('chat');
    routeTo('chat');
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <button onClick={() => { setView('landing'); routeTo('landing'); }} className="brand">
          <span className="brand-mark">SR</span>
          <span className="brand-text">
            <strong>Smart Rank</strong>
            <small>Agentic AI for marketing work</small>
          </span>
        </button>

        {!isAdmin && (
          <div className="nav-links">
            <a href="#outcomes">Outcomes</a>
            <a href="#workspace">Workspace</a>
            <a href="#requests">What to ask</a>
            <a href="#pricing">Pricing</a>
          </div>
        )}

        {!isAdmin ? <Button onClick={start}>Start free</Button> : <span className="admin-pill">/admin</span>}
      </div>
    </nav>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  light = false,
  wide = false
}: {
  eyebrow: string;
  title: string;
  body?: string;
  light?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={cx('section-heading', wide && 'wide', light && 'light')}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {body && <p className="section-body">{body}</p>}
    </div>
  );
}

function Landing({ setView }: { setView: (view: View) => void }) {
  const start = () => {
    setView('chat');
    routeTo('chat');
  };

  return (
    <div className="page page-dark">
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="badge">Agentic AI workspace for companies that want marketing handled</div>
            <h1>Your marketing command box.</h1>
            <p>
              Tell Smart Rank what you need: more enquiries, better pages, stronger posts, ad fixes, emails,
              launch campaigns, or search visibility. It turns the request into clear work inside one calm workspace.
            </p>
            <div className="actions">
              <Button onClick={start}>Start free</Button>
              <Button variant="ghost" onClick={() => document.getElementById('requests')?.scrollIntoView({ behavior: 'smooth' })}>
                See what people ask
              </Button>
            </div>
            <div className="hero-points">
              {[
                ['No dashboards first', 'Start with one sentence.'],
                ['No agency confusion', 'The workspace shows progress.'],
                ['No blank page', 'Outputs are structured for you.']
              ].map(([title, body]) => (
                <div key={title} className="mini-card">
                  <strong>{title}</strong>
                  <span>{body}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="preview-shell">
            <div className="preview-card">
              <div className="preview-header">
                <div>
                  <strong>Live workspace preview</strong>
                  <span>What the user feels after asking</span>
                </div>
                <b>Working</b>
              </div>
              <div className="mini-chat">
                <div className="bubble user">I need more qualified enquiries from my website and LinkedIn.</div>
                <div className="bubble assistant">
                  <div className="pulse-line"><span /> Smart Rank is preparing your first version</div>
                  <ul>
                    <li>Reads what the user actually wants</li>
                    <li>Turns it into pages, posts, emails, ads, and next steps</li>
                    <li>Keeps the user updated while the work is prepared</li>
                  </ul>
                </div>
                <div className="status-row">
                  {['Request', 'Prepare', 'Deliver'].map((x, i) => <span key={x} className={i === 1 ? 'active' : ''}>{x}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="outcomes" className="section section-light">
        <div className="container">
          <SectionHeading
            light
            eyebrow="What it actually helps with"
            title="Not another empty AI box. A place to get marketing work produced."
            body="The user should not need to understand marketing terminology. They should ask for a result and receive a structured output that can be used, edited, shared, or continued."
            wide
          />
          <div className="card-grid four">
            {[
              ['More enquiries', 'LinkedIn, website, Instagram, email, and landing page requests turned into action plans and copy.'],
              ['Better pages', 'Homepage sections, offer positioning, CTAs, comparison pages, FAQs, and conversion improvements.'],
              ['Consistent posting', 'Founder posts, short-video hooks, carousel ideas, newsletters, launch posts, and repurposing workflows.'],
              ['Clear campaigns', 'Product launches, paid ad angles, follow-up sequences, referral ideas, and outreach messages.']
            ].map(([title, body]) => (
              <article key={title} className="info-card light-card">
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="The problem"
            title="Most tools make the user become the marketer."
            body="Smart Rank should feel different. The user does not come to manage a hundred buttons. They come because they want something prepared: a page, a campaign, a sequence, a plan, a set of posts, or a better way to turn attention into enquiries."
            wide
          />
          <div className="card-grid three">
            {[
              ['Before', 'Open a tool, choose a template, learn the workflow, copy/paste outputs, and still decide what to do next.'],
              ['With Smart Rank', 'Type the result you want. The workspace begins structuring the work and keeps the user moving.'],
              ['End result', 'Useful deliverables: copy, campaign ideas, page sections, follow-ups, and clear next actions.']
            ].map(([title, body]) => (
              <article key={title} className="info-card dark-card large-text">
                <span>{title}</span>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workspace" className="section section-light">
        <div className="container workspace-grid">
          <div>
            <SectionHeading
              light
              eyebrow="Workspace"
              title="One request becomes a working thread."
              body="The user sees a familiar chat experience with recent work, file upload, examples, progress states, and a large composer. It should feel calm like ChatGPT, useful like Cursor, and specific to marketing work."
            />
            <div className="actions top-space">
              <Button variant="dark" onClick={start}>Open workspace</Button>
              <Button variant="ghostDark" onClick={() => document.getElementById('requests')?.scrollIntoView({ behavior: 'smooth' })}>
                View request examples
              </Button>
            </div>
          </div>
          <WorkspaceMock />
        </div>
      </section>

      <section id="requests" className="section">
        <div className="container">
          <SectionHeading
            eyebrow="What people can ask"
            title="Plain requests, not marketing jargon."
            body="These should feel like things business owners actually type when they want help. Every card opens the same workspace."
            wide
          />
          <div className="request-grid">
            {requestExamples.map((prompt) => (
              <button key={prompt} onClick={start} className="request-card">{prompt}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <SectionHeading
            light
            eyebrow="What Smart Rank can prepare"
            title="From one request to many usable outputs."
            body="The product should feel like the user is delegating marketing work, even if the interface never over-explains the system behind it."
            wide
          />
          <div className="card-grid three">
            {[
              ['Landing pages', 'Headlines, sections, CTAs, FAQs, comparison blocks, trust sections, and offer copy.'],
              ['Social content', 'LinkedIn posts, carousels, short-video scripts, hooks, captions, and repurposing plans.'],
              ['Email and outreach', 'Cold emails, follow-ups, warm lead sequences, partnership messages, and reactivation flows.'],
              ['Search visibility', 'Topic clusters, metadata, keyword maps, blog outlines, local pages, and competitor angles.'],
              ['Paid campaigns', 'Ad angles, headlines, creative briefs, landing page alignment, and testing ideas.'],
              ['Launch systems', 'Countdown campaigns, launch-week content, announcement emails, social kits, and PR angles.']
            ].map(([title, body]) => (
              <article key={title} className="info-card light-card">
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section split-section">
        <div className="container split-grid">
          <div className="white-panel">
            <span>Files and context</span>
            <h2>The workspace should understand more than a prompt.</h2>
            <p>Users can attach PDFs, images, website notes, old copy, product docs, campaign examples, or code. Smart Rank should make those files feel part of the request.</p>
          </div>
          <div className="black-panel">
            <span>Behind the scenes</span>
            <h2>The user sees progress, not process confusion.</h2>
            <p>The interface can show preparing, reviewing, streaming, and completed states. The user does not need to see operator controls, admin queues, or internal handling.</p>
          </div>
        </div>
      </section>

      <Pricing setView={setView} />
      <FAQ />

      <section className="final-cta">
        <div className="container final-box">
          <div>
            <span>Start</span>
            <h2>Open the workspace and type what you need.</h2>
            <p>The first request is the product. Everything should lead there.</p>
          </div>
          <Button variant="dark" onClick={start}>Start free</Button>
        </div>
      </section>
    </div>
  );
}

function WorkspaceMock() {
  return (
    <div className="workspace-mock-shell">
      <div className="workspace-mock">
        <aside>
          <button>+ New request</button>
          {recentWork.slice(0, 4).map((item, i) => <span key={item} className={i === 0 ? 'selected' : ''}>{item}</span>)}
        </aside>
        <main>
          <header><strong>Smart Rank Workspace</strong><small>Preparing first version</small></header>
          <div className="mock-body">
            <p className="mock-user">Create a complete marketing system for my product.</p>
            <div className="mock-assistant"><strong>Smart Rank is preparing</strong><i /><i /><i /></div>
          </div>
          <footer>Message Smart Rank...</footer>
        </main>
      </div>
    </div>
  );
}

function Pricing({ setView }: { setView: (view: View) => void }) {
  const start = () => { setView('chat'); routeTo('chat'); };
  return (
    <section id="pricing" className="section section-light">
      <div className="container">
        <div className="pricing-head">
          <SectionHeading
            light
            eyebrow="Pricing"
            title="Start free. Upgrade when your team needs more output."
            body="Basic is free. The landing should already explain why a user would start now."
          />
          <Button variant="dark" onClick={start}>Start free</Button>
        </div>
        <div className="card-grid three">
          {[
            ['Basic', 'Free', 'Try Smart Rank, start requests, explore the workspace, and understand how it feels.'],
            ['Smart Rank', '₹2,999/mo', 'For founders who need consistent pages, posts, emails, ads, launch assets, and search work.'],
            ['Operator', 'Custom', 'For teams that need review, file handling, managed requests, priority output, and internal workflows.']
          ].map(([name, price, desc], i) => (
            <article key={name} className={cx('price-card', i === 1 && 'featured')}>
              <span>{name}</span>
              <h3>{price}</h3>
              <p>{desc}</p>
              <Button variant={i === 1 ? 'primary' : 'dark'} onClick={start}>Choose plan</Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow="Questions" title="Clear answers before the user starts." body="A real landing page needs enough context to build trust before sending the user into the workspace." wide />
        <div className="faq-grid">
          {[
            ['Is Smart Rank just a chatbot?', 'No. The user experience is chat-first, but the product is designed around prepared outputs, files, progress states, and continued work threads.'],
            ['What should I ask first?', 'Ask for the result you want: more calls, better page copy, stronger emails, launch content, ad fixes, or search visibility.'],
            ['Can I upload files?', 'Yes. The workspace direction supports images, PDFs, documents, code, website notes, and old campaign examples.'],
            ['Where is admin?', 'Admin is separate and hidden from the user side. The user workspace stays clean and never shows operator controls.']
          ].map(([q, a]) => (
            <article key={q} className="faq-card"><h3>{q}</h3><p>{a}</p></article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkAnimation() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((value) => (value + 1) % workingSteps.length), 1300);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="work-animation">
      <div className="work-orb"><span /><b /></div>
      <div className="work-content">
        <div className="work-head"><div><span>Smart Rank</span><h3>Preparing the first version</h3></div><b>Working</b></div>
        <div className="step-list">
          {workingSteps.map((item, index) => <p key={item} className={index === step ? 'active' : ''}><span />{item}</p>)}
        </div>
        <div className="skeleton"><i /><i /><i /></div>
      </div>
    </div>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const login = async (provider: 'google' | 'github' | 'email') => {
    const url = await getLoginUrl(provider);
    if (url !== '#/chat') window.location.href = url;
    else onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="login-modal">
        <div className="modal-head"><div><span>Continue with account</span><h2>Save your workspace</h2></div><button onClick={onClose}>×</button></div>
        <p>You have used 20 messages as a guest. Sign in once to keep this workspace, files, replies, and prepared outputs connected to you.</p>
        <button className="google-btn" onClick={() => login('google')}><span>G</span>Continue with Google</button>
        <div className="login-row"><button onClick={() => login('email')}>Email login</button><button onClick={() => login('github')}>GitHub</button></div>
        <small>The real app connects this to Supabase Auth. This preview shows the user flow.</small>
      </div>
    </div>
  );
}

function Chat({ setView }: { setView: (view: View) => void }) {
  const [input, setInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [session, setSession] = useState<GuestSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    bootstrapWorkspace().then((state) => {
      setSession(state.session);
      setMessages(state.messages);
      socket = createWorkspaceSocket(state.session.workspaceId, (message) => {
        setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message]);
      });
    });
    return () => socket?.close();
  }, []);

  useEffect(() => {
    if (session?.requiresLogin) setShowLogin(true);
  }, [session?.requiresLogin]);

  const send = async (text = input) => {
    const clean = text.trim();
    if (!clean) return;
    setInput('');
    setHasStarted(true);
    const optimistic: ChatMessage = { id: uid(), role: 'user', text: clean, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    const state = await sendUserMessage(clean);
    setSession(state.session);
    setMessages(state.messages.length ? state.messages : (prev) => prev);
  };

  const resetPreview = () => {
    localStorage.removeItem('smart-rank-session');
    localStorage.removeItem('smart-rank-messages');
    bootstrapWorkspace().then((state) => {
      setHasStarted(false);
      setSession(state.session);
      setMessages(state.messages);
      setInput('');
      setShowLogin(false);
    });
  };

  const username = session?.username ?? 'guest_sr_0000';
  const count = session?.messageCount ?? 0;

  return (
    <div className="chat-layout">
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <aside className="chat-sidebar">
        <div className="sidebar-top"><button>First workspace</button><p>Only one workspace is created for a first-time guest. More workspaces unlock after login.</p></div>
        <div className="sidebar-main">
          <span className="sidebar-label">Current workspace</span>
          <button className="workspace-selected"><strong>Untitled request</strong><small>Guest workspace</small></button>
          <div className="guest-card"><span>Guest identity</span><strong>{username}</strong><small>Temporary username until login.</small></div>
          <div className="guest-card"><div className="counter"><span>Guest messages</span><span>{count}/20</span></div><div className="bar"><i style={{ width: `${Math.min(count / 20, 1) * 100}%` }} /></div></div>
        </div>
        <div className="sidebar-bottom"><button onClick={() => { setView('landing'); routeTo('landing'); }}>← Smart Rank home</button><button onClick={resetPreview}>Reset preview workspace</button></div>
      </aside>

      <main className="chat-main">
        <header className="chat-header"><div><h1>Smart Rank Workspace</h1><p>{username} · {count}/20 guest messages</p></div><Button variant="ghost" onClick={() => setShowLogin(true)}>Login</Button></header>
        <div className="chat-scroll">
          <div className="chat-inner">
            {!hasStarted && messages.length <= 1 && (
              <div className="chat-empty">
                <div className="empty-mark">SR</div>
                <h2>What do you need done?</h2>
                <p>No account needed at first. A temporary workspace starts instantly. After 20 messages, Smart Rank asks you to sign in and save everything.</p>
                <div className="starter-grid">{requestExamples.slice(0, 4).map((prompt) => <button key={prompt} onClick={() => send(prompt)}>{prompt}</button>)}</div>
              </div>
            )}
            <div className="message-list">
              {messages.map((message) => (
                <div key={message.id} className={cx('message-row', message.role === 'user' && 'right')}>
                  <div className={cx('message-bubble', message.role === 'user' ? 'user-message' : 'assistant-message')}>
                    <span>{message.role === 'user' ? username : message.role === 'operator' ? 'Smart Rank' : 'Smart Rank'}</span>
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
              {hasStarted && <WorkAnimation />}
            </div>
          </div>
        </div>
        <footer className="composer-wrap"><div className="composer"><textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3} placeholder="Message Smart Rank..." /><div><span><button>Attach file</button><button onClick={() => setInput('I need more qualified enquiries from my website')}>Example</button><b>Login after 20 messages</b></span><Button onClick={() => send()} disabled={!input.trim()}>Send</Button></div></div></footer>
      </main>
    </div>
  );
}

function Admin() {
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState('I’m preparing your complete marketing system. I’ll send it in sections: offer, website fixes, LinkedIn posts, cold email, and launch campaign.');

  useEffect(() => {
    getAdminInbox().then(setThreads);
  }, []);

  const current = threads[selected] ?? threads[0];
  const sendOperatorReply = async (mode: 'queue' | 'stream' | 'merge' | 'publish') => {
    if (!current) return;
    await operatorReply(current.workspaceId, draft, mode);
  };

  return (
    <div className="admin-page">
      <div className="admin-hero"><div className="container"><span>/admin only</span><h1>Operator Inbox</h1><p>Simple workflow: open a request, read context, write the reply, then queue, stream, merge, or publish.</p></div></div>
      <div className="container admin-grid">
        <section className="admin-card"><div className="admin-card-head"><h2>1. Choose request</h2><b>{threads.length}</b></div><div className="thread-list">{threads.map((thread, i) => <button key={thread.workspaceId} onClick={() => setSelected(i)} className={selected === i ? 'selected' : ''}><div><strong>{thread.title}</strong><span>{thread.status}</span></div><p>{thread.lastMessage}</p></button>)}</div></section>
        <section className="admin-card"><div className="admin-read-head"><span>2. Read context</span><h2>{current?.title ?? 'No selected request'}</h2><p>User: {current?.username ?? '-'}</p></div><div className="user-context"><span>User message</span><p>{current?.lastMessage ?? 'No request yet.'}</p></div><div className="file-row">{['website-url.txt', 'brand-notes.pdf', 'old-copy.md'].map((file) => <span key={file}>{file}</span>)}</div></section>
        <section className="admin-card"><h2>3. Send update</h2><p>Write once. Choose how the user receives it.</p><textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={10} /><div className="operator-actions">{(['queue', 'stream', 'merge', 'publish'] as const).map((mode) => <button key={mode} onClick={() => sendOperatorReply(mode)}><strong>{mode}</strong><span>{mode === 'queue' ? 'Hold update' : mode === 'stream' ? 'Show live' : mode === 'merge' ? 'Combine edits' : 'Final answer'}</span></button>)}</div><div className="upload-actions">{['Upload image', 'Upload PDF', 'Attach code', 'Attach doc'].map((x) => <button key={x}>{x}</button>)}</div></section>
      </div>
    </div>
  );
}

function PricingPage({ setView }: { setView: (view: View) => void }) {
  return <div className="page"><Pricing setView={setView} /></div>;
}

export default function App() {
  const [view, setView] = useState<View>(() => {
    if (window.location.hash === '#/admin') return 'admin';
    if (window.location.hash === '#/chat') return 'chat';
    if (window.location.hash === '#/pricing') return 'pricing';
    return 'landing';
  });

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === '#/admin') setView('admin');
      else if (window.location.hash === '#/chat') setView('chat');
      else if (window.location.hash === '#/pricing') setView('pricing');
      else setView('landing');
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return (
    <main className="app-shell">
      <ShellNav view={view} setView={setView} />
      {view === 'admin' ? <Admin /> : view === 'chat' ? <Chat setView={setView} /> : view === 'pricing' ? <PricingPage setView={setView} /> : <Landing setView={setView} />}
    </main>
  );
}
