import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  CircleUserRound,
  Crown,
  FileText,
  LoaderCircle,
  LogOut,
  Image as ImageIcon,
  Mail,
  Paperclip,
  PenLine,
  Search,
  SendHorizontal,
  Settings,
  Shield,
  Sparkles,
  X,
} from 'lucide-react'
import './workspace.css'

type QuickTask = {
  title: string
  description: string
  icon: typeof Search
  tone: 'violet' | 'mint' | 'amber' | 'pink' | 'cyan' | 'blue'
}

type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
}

type UserSession = {
  userId: string
  isAuthenticated: boolean
  provider: 'guest' | 'google'
  email: string | null
  name: string | null
  limit: number
  used: number
  remaining: number
}

type ChatMessage = {
  id: string
  sender: 'user' | 'admin'
  text: string
  time: string
  createdAt: number
  attachments?: ComposerAttachment[]
}

type ComposerAttachment = {
  id: string
  name: string
  size: number
  type: 'image' | 'document'
  file?: File
  storageId?: string
  contentType?: string
  downloadUrl?: string
  uploadedAt?: number
}

const QUICK_TASKS: QuickTask[] = [
  {
    title: 'Analyze SEO',
    description: 'Check keyword rankings and competitor gaps.',
    icon: Search,
    tone: 'violet',
  },
  {
    title: 'Grow Instagram',
    description: 'Generate a content strategy and viral predictions.',
    icon: Sparkles,
    tone: 'mint',
  },
  {
    title: 'Write Email Copy',
    description: 'Draft high-converting newsletters and sequences.',
    icon: Mail,
    tone: 'amber',
  },
  {
    title: 'Social Calendar',
    description: 'Plan your posting schedule for the month.',
    icon: CalendarDays,
    tone: 'pink',
  },
  {
    title: 'Competitor Scan',
    description: 'Identify weaknesses in rival strategies.',
    icon: BarChart3,
    tone: 'cyan',
  },
  {
    title: 'Brand Voice',
    description: 'Define your tone and personality guidelines.',
    icon: PenLine,
    tone: 'blue',
  },
]

const INPUT_SUGGESTIONS = [
  'Create a 30-day LinkedIn strategy for SaaS founders.',
  'Generate 20 viral tweet ideas for AI startups.',
  'Write a high-converting landing page for my product.',
  'Analyze my competitor’s marketing strategy.',
  'Create a full SEO plan for my website.',
  'Generate blog ideas for fintech startups.',
  'Build a content calendar for Instagram.',
  'Write an email sequence for cold leads.',
  'Improve my startup positioning statement.',
  'Generate high-CTR YouTube titles.',
  'Create Facebook ads for my AI product.',
  'Find low-competition SEO keywords.',
  'Rewrite my homepage copy for conversions.',
  'Generate a startup elevator pitch.',
  'Create a growth strategy for a new SaaS.',
  'Audit my website SEO performance.',
]

const SIMULATION_STEPS = [
  {
    threshold: 0,
    title: 'Reading your workspace',
    detail: 'Parsing the latest prompt and lining up the next growth actions.',
  },
  {
    threshold: 8_000,
    title: 'Researching live context',
    detail: 'Comparing intent, past messages, and the strongest next recommendation.',
  },
  {
    threshold: 18_000,
    title: 'Drafting the response',
    detail: 'Structuring the answer into clear sections before delivery.',
  },
  {
    threshold: 35_000,
    title: 'Retrying delivery',
    detail: 'High load detected, continuing to stream the response as soon as it is ready.',
  },
] as const

const getUserId = () => {
  const key = 'smartrank_user_id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const created = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  window.localStorage.setItem(key, created)
  return created
}

export default function Workspace() {
  const [userId, setUserId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [focusChatMode, setFocusChatMode] = useState(false)
  const [clockTick, setClockTick] = useState(Date.now())
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const [typingText, setTypingText] = useState('')
  const [isTypingLive, setIsTypingLive] = useState(false)
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, boolean>>({})
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [session, setSession] = useState<UserSession | null>(null)
  const [sendError, setSendError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const attachButtonRef = useRef<HTMLButtonElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const messageCountByConversationRef = useRef<Record<string, number>>({})
  const animatedAdminIdsRef = useRef<Set<string>>(new Set())

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [activeConversationId, conversations],
  )

  const latestUserMessage = [...messages].reverse().find((message) => message.sender === 'user') ?? null
  const latestAdminMessage = [...messages].reverse().find((message) => message.sender === 'admin') ?? null
  const hasPendingAdminReply = latestUserMessage
    ? !latestAdminMessage || latestAdminMessage.createdAt < latestUserMessage.createdAt
    : false
  const pendingDuration = latestUserMessage ? Date.now() - latestUserMessage.createdAt : 0
  const showSearching = hasPendingAdminReply && pendingDuration <= 60_000
  const showRetrying = hasPendingAdminReply && pendingDuration > 20_000 && pendingDuration <= 60_000
  const showTrafficNotice = hasPendingAdminReply && pendingDuration > 60_000
  const simulationStep = [...SIMULATION_STEPS]
    .reverse()
    .find((step) => pendingDuration >= step.threshold) ?? SIMULATION_STEPS[0]

  const filteredSuggestions = INPUT_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(prompt.trim().toLowerCase()),
  ).slice(0, 8)

  const safeJson = async (response: Response) => {
    const text = await response.text()
    if (!text) return null
    try {
      return JSON.parse(text) as unknown
    } catch {
      return null
    }
  }

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024
  const MAX_DOC_SIZE = 10 * 1024 * 1024

  const formatSize = (size: number) => {
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const loadConversations = async (currentUserId: string) => {
    const response = await fetch(`/api/chat/conversations?userId=${encodeURIComponent(currentUserId)}`)
    const data = (await safeJson(response)) as { ok?: boolean; conversations?: Conversation[] } | null
    if (!response.ok || !data?.ok) return
    const nextConversations = data.conversations as Conversation[]
    setConversations(nextConversations)
    if (!activeConversationId && nextConversations[0]) {
      setActiveConversationId(nextConversations[0].id)
    }
  }

  const loadSession = async (currentUserId: string) => {
    const response = await fetch(`/api/auth/session?userId=${encodeURIComponent(currentUserId)}`)
    const data = (await safeJson(response)) as { ok?: boolean; session?: UserSession } | null
    if (!response.ok || !data?.ok || !data.session) return
    setSession(data.session)
  }

  const loadMessages = async (currentUserId: string, conversationId: string) => {
    if (!conversationId) return
    const response = await fetch(
      `/api/chat/messages?userId=${encodeURIComponent(currentUserId)}&conversationId=${encodeURIComponent(
        conversationId,
      )}`,
    )
    const data = (await safeJson(response)) as { ok?: boolean; messages?: ChatMessage[] } | null
    if (!response.ok || !data?.ok) return
    const nextMessages = data.messages as ChatMessage[]
    setMessages(nextMessages)
    if (nextMessages.length > 0) {
      setHasStartedChat(true)
    }
  }

  useEffect(() => {
    const createdUserId = getUserId()
    setUserId(createdUserId)
    void loadConversations(createdUserId)
    void loadSession(createdUserId)
  }, [])

  useEffect(() => {
    if (!userId || !activeConversationId) return
    void loadMessages(userId, activeConversationId)
    setUnreadByConversation((current) => ({ ...current, [activeConversationId]: false }))
  }, [userId, activeConversationId])

  useEffect(() => {
    if (!userId) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/chat?userId=${encodeURIComponent(userId)}`)

    socket.onmessage = (rawEvent) => {
      try {
        const payload = JSON.parse(rawEvent.data as string) as {
          type?: string
          event?: { conversationId?: string }
        }
        const incomingConversationId = payload.event?.conversationId
        if (incomingConversationId && incomingConversationId !== activeConversationId) {
          setUnreadByConversation((current) => ({ ...current, [incomingConversationId]: true }))
        }
      } catch {
        // no-op for non-json socket frames
      }

      void loadConversations(userId)
      void loadSession(userId)
      if (activeConversationId) {
        void loadMessages(userId, activeConversationId)
      }
    }

    return () => socket.close()
  }, [userId, activeConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const latestMessage = messages[messages.length - 1]
    if (!latestMessage || !activeConversationId) return
    if (latestMessage.sender === 'admin') {
      setUnreadByConversation((current) => ({
        ...current,
        [activeConversationId]: false,
      }))
    }
  }, [messages, activeConversationId])

  useEffect(() => {
    const latestAdmin = [...messages].reverse().find((message) => message.sender === 'admin')
    if (!activeConversationId) return
    const previousCount = messageCountByConversationRef.current[activeConversationId]
    const currentCount = messages.length

    if (previousCount === undefined) {
      messageCountByConversationRef.current[activeConversationId] = currentCount
      for (const message of messages) {
        if (message.sender === 'admin') {
          animatedAdminIdsRef.current.add(message.id)
        }
      }
      setTypingMessageId(null)
      setTypingText('')
      setIsTypingLive(false)
      return
    }

    messageCountByConversationRef.current[activeConversationId] = currentCount
    if (!latestAdmin) return

    const adminMessages = messages.filter((message) => message.sender === 'admin')

    if (animatedAdminIdsRef.current.has(latestAdmin.id)) {
      return
    }

    if (currentCount <= previousCount) {
      return
    }

    animatedAdminIdsRef.current.add(latestAdmin.id)
    setTypingMessageId(latestAdmin.id)
    setTypingText('')
    setIsTypingLive(true)

    let index = 0
    const full = latestAdmin.text
    const tick = () => {
      const nextChunk =
        full.slice(index).startsWith('\n\n') ? 2 : full.slice(index).startsWith('\n') ? 1 : Math.max(1, Math.ceil(Math.random() * 4))
      index += nextChunk
      setTypingText(full.slice(0, index))
      if (index >= full.length) {
        setTypingText(full)
        setIsTypingLive(false)
        return
      }
      const delay =
        full[index - 1] === '\n' ? 120 : ['.', '!', '?', ':'].includes(full[index - 1] ?? '') ? 110 : 22 + Math.round(Math.random() * 34)
      timeout = window.setTimeout(tick, delay)
    }

    let timeout = window.setTimeout(tick, 60)

    return () => window.clearTimeout(timeout)
  }, [messages, activeConversationId])

  useEffect(() => {
    if (!activeConversationId) return
    setTypingMessageId(null)
    setTypingText('')
    setIsTypingLive(false)
  }, [activeConversationId])

  useEffect(() => {
    const interval = window.setInterval(() => setClockTick(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (showAttachMenu) {
        if (!attachMenuRef.current?.contains(target) && !attachButtonRef.current?.contains(target)) {
          setShowAttachMenu(false)
        }
      }
      if (showProfileMenu) {
        if (!profileMenuRef.current?.contains(target) && !profileButtonRef.current?.contains(target)) {
          setShowProfileMenu(false)
        }
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAttachMenu(false)
        setShowProfileMenu(false)
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [showAttachMenu, showProfileMenu])

  const createNewConversation = async (title?: string) => {
    if (!userId) return
    const response = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title }),
    })
    const data = (await safeJson(response)) as { ok?: boolean; conversation?: Conversation } | null
    if (!response.ok || !data?.ok) return
    const created = data.conversation as Conversation
    await loadConversations(userId)
    setActiveConversationId(created.id)
    setMessages([])
    setHasStartedChat(false)
    setUnreadByConversation((current) => ({ ...current, [created.id]: false }))
    return created.id
  }

  const sendUserMessage = async (text: string, nextAttachments: ComposerAttachment[] = []) => {
    if (!userId) return
    setSendError('')
    let conversationId = activeConversationId
    if (!conversationId) {
      const createdId = await createNewConversation('New chat')
      conversationId = createdId || ''
    }
    if (!conversationId) return
    setIsUploading(true)
    try {
      const uploadedAttachments = await Promise.all(
        nextAttachments.map(async (attachment) => {
          if (!attachment.file) return attachment
          const formData = new FormData()
          formData.append('userId', userId)
          formData.append('conversationId', conversationId)
          formData.append('sender', 'user')
          formData.append('attachmentType', attachment.type)
          formData.append('file', attachment.file)

          const uploadResponse = await fetch('/api/chat/uploads', {
            method: 'POST',
            body: formData,
          })
          const uploadData = (await safeJson(uploadResponse)) as { ok?: boolean; attachment?: ComposerAttachment } | null
          if (!uploadResponse.ok || !uploadData?.ok || !uploadData.attachment) {
            throw new Error('Unable to upload attachment')
          }
          return uploadData.attachment
        }),
      )

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          conversationId,
          sender: 'user',
          text,
          attachments: uploadedAttachments.map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
            storageId: attachment.storageId,
            contentType: attachment.contentType,
            downloadUrl: attachment.downloadUrl,
            uploadedAt: attachment.uploadedAt,
          })),
        }),
      })
      const data = (await safeJson(response)) as
        | { ok?: boolean; error?: string; usage?: { remaining?: number; limit?: number; used?: number } }
        | null
      if (!response.ok || !data?.ok) {
        setSendError(data?.error ?? 'Unable to send message.')
        await loadSession(userId)
        return
      }
      await loadMessages(userId, conversationId)
      await loadConversations(userId)
      await loadSession(userId)
      setUnreadByConversation((current) => ({ ...current, [conversationId]: false }))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const message = prompt.trim()
    if (!message && attachments.length === 0) return
    const payload = message || 'Please review attached files.'
    const nextAttachments = [...attachments]
    setPrompt('')
    setShowSuggestions(false)
    setShowAttachMenu(false)
    setHasStartedChat(true)
    await sendUserMessage(payload, nextAttachments)
    setAttachments([])
  }

  const handleTaskClick = async (title: string) => {
    if (title === 'Competitor Scan') {
      const taskText = 'Analyze my competitor’s marketing strategy.'
      await createNewConversation('Competitor Scan')
      setFocusChatMode(true)
      await sendUserMessage(taskText)
      return
    }

    const selectedTask = QUICK_TASKS.find((task) => task.title === title)
    const taskText = selectedTask?.description ?? `Help me with ${title.toLowerCase()}.`
    setFocusChatMode(false)
    setShowSuggestions(false)
    setHasStartedChat(true)
    await sendUserMessage(taskText)
  }

  const handleSuggestionPick = (value: string) => {
    setPrompt(value)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const addAttachment = (file: File, type: 'image' | 'document') => {
    const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_DOC_SIZE
    if (file.size > maxSize) {
      window.alert(
        `${type === 'image' ? 'Image' : 'Document'} too large. Max allowed: ${formatSize(maxSize)}.`,
      )
      return
    }
    setAttachments((current) => [
      ...current,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: file.size,
        type,
        file,
      },
    ])
  }

  const handleImagePick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    Array.from(files).forEach((file) => addAttachment(file, 'image'))
    event.target.value = ''
    setShowAttachMenu(false)
  }

  const handleDocPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    Array.from(files).forEach((file) => addAttachment(file, 'document'))
    event.target.value = ''
    setShowAttachMenu(false)
  }

  const handleNewChat = async () => {
    setFocusChatMode(false)
    setHasStartedChat(false)
    await createNewConversation('New chat')
    inputRef.current?.focus()
  }

  const handleProfileAction = (action: 'settings' | 'upgrade' | 'help' | 'admin' | 'logout') => {
    setShowProfileMenu(false)
    if (action === 'logout') {
      window.localStorage.removeItem('smartrank_user_id')
      window.localStorage.removeItem('SmartRank_session')
      window.location.reload()
      return
    }
    if (action === 'help') {
      window.alert('Help center and onboarding flows will live here next.')
      return
    }
    if (action === 'upgrade') {
      window.alert('Upgrade plans and workspace limits will be connected here.')
      return
    }
    window.alert('Settings drawer will be connected here.')
  }

  const handleGoogleLogin = async () => {
    if (!userId) return
    setAuthLoading(true)
    try {
      const response = await fetch('/api/auth/google-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = (await safeJson(response)) as { ok?: boolean; session?: UserSession } | null
      if (!response.ok || !data?.ok || !data.session) {
        setSendError('Unable to sign in with Google right now.')
        return
      }
      localStorage.setItem('SmartRank_session', JSON.stringify(data.session))
      setSession(data.session)
      setSendError('')
    } finally {
      setAuthLoading(false)
    }
  }

  const renderInlineMarkdown = (text: string): ReactNode[] => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={`code-${index}`} className="workspace-inline-code">
            {part.slice(1, -1)}
          </code>
        )
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`strong-${index}`}>{part.slice(2, -2)}</strong>
      }
      return <span key={`text-${index}`}>{part}</span>
    })
  }

  const renderMarkdownText = (text: string) => {
    if (text.includes('```')) {
      const block = text.replace(/```/g, '').trim()
      return <pre className="workspace-code-block">{block}</pre>
    }

    const lines = text.split('\n').filter((line) => line.trim().length > 0)
    const listItems = lines.filter((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))
    if (listItems.length === lines.length && lines.length > 0) {
      return (
        <ul className="workspace-md-list">
          {listItems.map((item) => (
            <li key={item}>{renderInlineMarkdown(item.replace(/^[-*]\s+/, ''))}</li>
          ))}
        </ul>
      )
    }

    return (
      <div className="workspace-md-paragraph">
        {lines.map((line) => (
          <p key={line}>{renderInlineMarkdown(line)}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="workspace-page">
      <section className="workspace-window" aria-label="SmartRank Workspace">
        <aside className="workspace-rail" aria-label="Primary Navigation">
          <div className="workspace-brand">
            <img src="/1000000603.png" alt="SmartRank logo" className="workspace-logo" />
            <div className="workspace-brand-copy">
              <strong>SmartRank</strong>
              <span>Autonomous growth operator</span>
            </div>
          </div>
          <button type="button" className="workspace-new-chat-btn" onClick={() => void handleNewChat()}>
            + New chat
          </button>
          <div className="workspace-conversation-list">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`workspace-conversation-item ${conversation.id === activeConversationId ? 'active' : ''}`}
                onClick={() => {
                  setActiveConversationId(conversation.id)
                  const hasMessages = conversation.messageCount > 0
                  setHasStartedChat(hasMessages)
                  setFocusChatMode(false)
                  setUnreadByConversation((current) => ({ ...current, [conversation.id]: false }))
                }}
              >
                <span className="workspace-conversation-title">{conversation.title || 'New chat'}</span>
                {unreadByConversation[conversation.id] ? <span className="workspace-unread-dot" /> : null}
              </button>
            ))}
          </div>
        </aside>

        <main className={`workspace-main ${hasStartedChat || focusChatMode ? 'workspace-main-chat' : ''}`}>
          <header className="workspace-head">
            <button
              ref={profileButtonRef}
              type="button"
              className="workspace-profile-btn"
              aria-label="Profile"
              onClick={() => setShowProfileMenu((current) => !current)}
            >
              <CircleUserRound size={18} />
            </button>
            {showProfileMenu ? (
              <div ref={profileMenuRef} className="workspace-profile-menu" aria-label="Profile menu">
                <div className="workspace-profile-menu-head">
                  <strong>SmartRank Workspace</strong>
                  <span>{session?.isAuthenticated ? 'Google connected' : 'Guest session'}</span>
                </div>
                {!session?.isAuthenticated ? (
                  <button type="button" onClick={() => void handleGoogleLogin()}>
                    <Sparkles size={15} />
                    <span>{authLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
                  </button>
                ) : null}
                <button type="button" onClick={() => handleProfileAction('upgrade')}>
                  <Crown size={15} />
                  <span>Upgrade plan</span>
                </button>
                <button type="button" onClick={() => handleProfileAction('settings')}>
                  <Settings size={15} />
                  <span>Settings</span>
                </button>
                <button type="button" onClick={() => handleProfileAction('help')}>
                  <CircleHelp size={15} />
                  <span>Help center</span>
                </button>
                {session?.isAuthenticated ? (
                  <button type="button" onClick={() => handleProfileAction('logout')}>
                    <LogOut size={15} />
                    <span>Sign out</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </header>

          {!hasStartedChat && !focusChatMode && (
            <>
              <div className="workspace-orb" aria-hidden="true" />
              <h1 className="workspace-title">How can I help you grow today?</h1>
              <p className="workspace-subtitle">Select a task or describe your goal below.</p>

              <section className="task-grid" aria-label="Quick Actions">
                {QUICK_TASKS.map(({ title, description, icon: Icon, tone }) => (
                  <button
                    type="button"
                    key={title}
                    className="task-card"
                    onClick={() => void handleTaskClick(title)}
                  >
                    <div className="task-head">
                      <Icon size={15} className={`task-icon tone-${tone}`} />
                      <span>{title}</span>
                    </div>
                    <p>{description}</p>
                  </button>
                ))}
              </section>
            </>
          )}

          {hasStartedChat || focusChatMode || messages.length > 0 ? (
            <section className="workspace-chat" aria-label="Chat Conversation">
              <div className="workspace-chat-title">{activeConversation?.title || 'New chat'}</div>
              <div className="workspace-chat-body">
                {messages.length === 0 ? (
                  <p className="workspace-empty-chat">Start typing to begin your new chat.</p>
                ) : (
                  messages.map((message) => (
                    <article key={message.id} className={`workspace-msg ${message.sender}`}>
                      <div className="workspace-msg-content">
                        {message.sender === 'admin' && typingMessageId === message.id
                          ? (
                            <div className="workspace-streaming-copy">
                              {renderMarkdownText(typingText || '')}
                              {isTypingLive ? <span className="workspace-streaming-cursor" aria-hidden="true" /> : null}
                            </div>
                          )
                          : renderMarkdownText(message.text)}
                      </div>
                      {message.attachments && message.attachments.length > 0 ? (
                        <div className="workspace-msg-attachments">
                          {message.attachments.map((file) => (
                            <div key={file.id} className="workspace-msg-attachment">
                              {file.type === 'image' ? <ImageIcon size={13} /> : <FileText size={13} />}
                              {file.downloadUrl ? (
                                <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                                  {file.name}
                                </a>
                              ) : (
                                <span>{file.name}</span>
                              )}
                              <small>{formatSize(file.size)}</small>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <span>{message.time}</span>
                    </article>
                  ))
                )}
                {showSearching ? (
                  <article className="workspace-msg admin workspace-searching workspace-sim-card" key={`searching-${clockTick}`}>
                    <div className="workspace-sim-head">
                      <div className="workspace-sim-avatar">SR</div>
                      <div>
                        <strong>SmartRank is working</strong>
                        <span>{showRetrying ? 'Live retry in progress' : 'Live response simulation'}</span>
                      </div>
                    </div>
                    <div className="workspace-sim-body">
                      <div className="workspace-sim-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="workspace-msg-content workspace-sim-copy">
                        <p>{simulationStep.title}</p>
                        <p>{simulationStep.detail}</p>
                      </div>
                    </div>
                  </article>
                ) : null}
                {showTrafficNotice ? (
                  <article className="workspace-msg admin workspace-traffic-notice">
                    <div className="workspace-msg-content">
                      {renderMarkdownText(
                        'Due to high traffic the response can take time. Sign in with Google now and we will notify you as soon as it is ready.',
                      )}
                    </div>
                    <div className="workspace-upgrade-actions">
                      <button type="button" onClick={() => void handleGoogleLogin()} disabled={authLoading}>
                        {authLoading ? 'Connecting...' : 'Continue with Google'}
                      </button>
                    </div>
                  </article>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
            </section>
          ) : null}

          <form
            className={`workspace-input-wrap ${hasStartedChat || focusChatMode ? 'workspace-input-wrap-chat' : ''}`}
            onSubmit={(event) => void handleSubmit(event)}
          >
            {attachments.length > 0 ? (
              <div className="workspace-attachments">
                {attachments.map((file) => (
                  <div key={file.id} className="workspace-attachment-chip">
                    <span>{file.name}</span>
                    <small>{formatSize(file.size)}</small>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() =>
                        setAttachments((current) => current.filter((entry) => entry.id !== file.id))
                      }
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="workspace-input-shell">
              <button
                ref={attachButtonRef}
                type="button"
                className="attach-btn"
                aria-label="Attach files"
                onClick={() => setShowAttachMenu((current) => !current)}
              >
                <Paperclip size={15} />
              </button>
              <input
                ref={inputRef}
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ask SmartRank..."
                className="workspace-input"
                aria-label="Ask SmartRank"
              />
              <button type="submit" className="send-btn" aria-label="Send prompt">
                {isUploading ? <LoaderCircle size={16} className="workspace-spinner" /> : <SendHorizontal size={16} />}
              </button>
            </div>
            {isUploading ? <div className="workspace-uploading-hint">Uploading files and continuing task...</div> : null}
            {sendError ? <div className="workspace-uploading-hint workspace-error-hint">{sendError}</div> : null}
            {showAttachMenu ? (
              <div ref={attachMenuRef} className="workspace-attach-menu" aria-label="Attachment options">
                <button type="button" onClick={() => imageInputRef.current?.click()}>
                  <ImageIcon size={14} />
                  Image
                  <small>Up to 5 MB</small>
                </button>
                <button type="button" onClick={() => docInputRef.current?.click()}>
                  <FileText size={14} />
                  Document
                  <small>Up to 10 MB</small>
                </button>
              </div>
            ) : null}
            {showSuggestions && prompt.trim().length > 0 && filteredSuggestions.length > 0 ? (
              <div className="workspace-suggestions" aria-label="Prompt suggestions">
                {filteredSuggestions.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className="workspace-suggestion-item"
                    onClick={() => handleSuggestionPick(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleImagePick}
            />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.csv,.ppt,.pptx,.xls,.xlsx"
              multiple
              hidden
              onChange={handleDocPick}
            />
          </form>
        </main>
      </section>
    </div>
  )
}
