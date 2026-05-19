import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import {
  BarChart3,
  CalendarDays,
  PanelLeft,
  ChevronRight,
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
  provider: 'guest' | 'google' | 'email'
  plan: 'free' | 'premium'
  email: string | null
  name: string | null
  limit: number
  used: number
  remaining: number
  conversationLimit: number
  conversationCount: number
  canCreateConversation: boolean
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

type RenderMessage = {
  id: string
  sender: 'user' | 'admin'
  text: string
  segments: string[]
  time: string
  createdAt: number
  attachments?: ComposerAttachment[]
  groupedIds: string[]
}

type PendingContext = {
  id: string
  text: string
  attachments: ComposerAttachment[]
  status: 'pending' | 'sending' | 'folded'
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
    title: 'Reading request...',
    detail: 'Pulling the latest request into the live session.',
  },
  {
    threshold: 5_000,
    title: 'Finding outcome...',
    detail: 'Locking the likely direction before writing.',
  },
  {
    threshold: 10_000,
    title: 'Extracting signals...',
    detail: 'Scanning the strongest context from the active thread.',
  },
  {
    threshold: 16_000,
    title: 'Compacting context...',
    detail: 'Compressing the live context before the answer expands.',
  },
  {
    threshold: 24_000,
    title: 'Finding leverage...',
    detail: 'Prioritizing the best response path.',
  },
  {
    threshold: 33_000,
    title: 'Structuring response...',
    detail: 'Shaping the answer into the next useful block.',
  },
  {
    threshold: 45_000,
    title: 'Preparing answer...',
    detail: 'Keeping the session active while delivery completes.',
  },
] as const

const AGENT_STATE_PREFIX = '[[state]] '
const isAgentProgressMessage = (message: ChatMessage | null | undefined) =>
  Boolean(message && message.sender === 'admin' && message.text.trim().startsWith(AGENT_STATE_PREFIX))
const getAgentProgressText = (message: ChatMessage | null | undefined) =>
  message?.text.trim().startsWith(AGENT_STATE_PREFIX)
    ? message.text.trim().slice(AGENT_STATE_PREFIX.length).trim()
    : message?.text.trim() ?? ''

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
  const [showMobileRail, setShowMobileRail] = useState(false)
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [session, setSession] = useState<UserSession | null>(null)
  const [sendError, setSendError] = useState('')
  const [profileNotice, setProfileNotice] = useState('')
  const [showSettingsSheet, setShowSettingsSheet] = useState(false)
  const [authSheetMode, setAuthSheetMode] = useState<'login' | 'register'>('register')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [queuedContexts, setQueuedContexts] = useState<PendingContext[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatBodyRef = useRef<HTMLDivElement>(null)
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

  const progressMessages = messages.filter((message) => isAgentProgressMessage(message))
  const visibleMessages = messages.filter((message) => !isAgentProgressMessage(message))
  const renderMessages = useMemo<RenderMessage[]>(() => {
    const grouped: RenderMessage[] = []

    for (const message of visibleMessages) {
      const last = grouped[grouped.length - 1]
      const canMergeAdmin =
        message.sender === 'admin' &&
        last?.sender === 'admin' &&
        message.attachments?.length === 0 &&
        (last.attachments?.length ?? 0) === 0

      if (canMergeAdmin && last) {
        last.segments.push(message.text)
        last.text = `${last.text}\n\n${message.text}`
        last.time = message.time
        last.createdAt = message.createdAt
        last.id = message.id
        last.groupedIds.push(message.id)
        continue
      }

      grouped.push({
        id: message.id,
        sender: message.sender,
        text: message.text,
        segments: [message.text],
        time: message.time,
        createdAt: message.createdAt,
        attachments: message.attachments,
        groupedIds: [message.id],
      })
    }

    return grouped
  }, [visibleMessages])
  const latestUserMessage = [...messages].reverse().find((message) => message.sender === 'user') ?? null
  const latestMeaningfulAdminMessage = [...messages]
    .reverse()
    .find((message) => message.sender === 'admin' && !isAgentProgressMessage(message)) ?? null
  const latestProgressMessage = [...progressMessages].reverse()[0] ?? null
  const recentProgressTrail = progressMessages.slice(-4).map((message) => getAgentProgressText(message))
  const hasPendingAdminReply = latestUserMessage
    ? !latestMeaningfulAdminMessage || latestMeaningfulAdminMessage.createdAt < latestUserMessage.createdAt
    : false
  const pendingDuration = latestUserMessage ? Date.now() - latestUserMessage.createdAt : 0
  const showSearching = hasPendingAdminReply
  const showRetrying = hasPendingAdminReply && pendingDuration > 20_000 && pendingDuration <= 60_000
  const showTrafficNotice = hasPendingAdminReply && pendingDuration > 60_000
  const guestLimitReached = Boolean(session && !session.isAuthenticated && session.used >= 20)
  const freeLimitReached = Boolean(session && session.isAuthenticated && session.plan !== 'premium' && session.used >= 40)
  const shouldShowAuthTulip = guestLimitReached
  const shouldShowUpgradeTulip = freeLimitReached
  const simulationStep =
    latestProgressMessage
      ? {
          title: getAgentProgressText(latestProgressMessage),
          detail: pendingDuration > 45_000 ? 'Keeping the thread warm while the answer finalizes.' : 'Live session is still compressing context.',
        }
      : ([...SIMULATION_STEPS]
    .reverse()
    .find((step) => pendingDuration >= step.threshold) ?? SIMULATION_STEPS[0])
  const simulationPhaseIndex = [...SIMULATION_STEPS]
    .map((step) => step.threshold)
    .filter((threshold) => pendingDuration >= threshold).length - 1
  const simulationTimeline = ['Read', 'Signals', 'Compact', 'Leverage', 'Draft']
  const simulationTimelineIndex = Math.min(
    Math.max(simulationPhaseIndex, 0),
    simulationTimeline.length - 1,
  )
  const showLiveReasoning = showSearching || isTypingLive

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
    if (nextConversations.length === 0) {
      setActiveConversationId('')
      return
    }
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
    if (!typingMessageId) return
    const body = chatBodyRef.current
    if (!body) return
    body.scrollTo({
      top: body.scrollHeight,
      behavior: 'smooth',
    })
  }, [typingText, typingMessageId])

  useEffect(() => {
    if (!userId || hasPendingAdminReply || queuedContexts.length === 0 || isUploading) return
    const next = queuedContexts.find((entry) => entry.status === 'pending')
    if (!next) return
    let cancelled = false

    const run = async () => {
      setQueuedContexts((current) =>
        current.map((entry) => (entry.id === next.id ? { ...entry, status: 'sending' } : entry)),
      )
      const ok = await sendUserMessage(next.text, next.attachments)
      if (cancelled) return
      if (!cancelled) {
        if (ok) {
          setQueuedContexts((current) =>
            current.map((entry) => (entry.id === next.id ? { ...entry, status: 'folded' } : entry)),
          )
          window.setTimeout(() => {
            setQueuedContexts((current) => current.filter((entry) => entry.id !== next.id))
          }, 1400)
        } else {
          setQueuedContexts((current) =>
            current.map((entry) => (entry.id === next.id ? { ...entry, status: 'pending' } : entry)),
          )
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [queuedContexts, hasPendingAdminReply, userId, isUploading])

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
    const latestAdmin = [...messages]
      .reverse()
      .find((message) => message.sender === 'admin' && !isAgentProgressMessage(message))
    if (!activeConversationId) return
    const previousCount = messageCountByConversationRef.current[activeConversationId]
    const currentCount = messages.length

    if (previousCount === undefined) {
      messageCountByConversationRef.current[activeConversationId] = currentCount
      for (const message of messages) {
        if (message.sender === 'admin' && !isAgentProgressMessage(message)) {
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
        setShowMobileRail(false)
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
    setSendError('')
    const response = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title }),
    })
    const data = (await safeJson(response)) as { ok?: boolean; conversation?: Conversation; error?: string } | null
    if (!response.ok || !data?.ok) {
      setSendError(data?.error ?? 'Unable to create conversation.')
      await loadSession(userId)
      return
    }
    const created = data.conversation as Conversation
    await loadConversations(userId)
    await loadSession(userId)
    setActiveConversationId(created.id)
    setMessages([])
    setHasStartedChat(false)
    setUnreadByConversation((current) => ({ ...current, [created.id]: false }))
    return created.id
  }

  const sendUserMessage = async (text: string, nextAttachments: ComposerAttachment[] = []) => {
    if (!userId) return false
    setSendError('')
    setProfileNotice('')
    let conversationId = activeConversationId
    if (!conversationId) {
      const createdId = await createNewConversation('New chat')
      conversationId = createdId || ''
    }
    if (!conversationId) return false
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
        return false
      }
      await loadMessages(userId, conversationId)
      await loadConversations(userId)
      await loadSession(userId)
      setUnreadByConversation((current) => ({ ...current, [conversationId]: false }))
      return true
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unable to send message.')
      return false
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await handleSendNow()
  }

  const handleSendNow = async () => {
    if (shouldShowAuthTulip || shouldShowUpgradeTulip) return
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

  const handleQueueContext = () => {
    if (shouldShowAuthTulip || shouldShowUpgradeTulip) return
    const message = prompt.trim()
    if (!message && attachments.length === 0) return
    const payload = message || 'Please review attached files.'
    const nextAttachments = [...attachments]
    setQueuedContexts((current) => [
      ...current,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text: payload,
        attachments: nextAttachments,
        status: 'pending',
      },
    ])
    setPrompt('')
    setAttachments([])
    setShowSuggestions(false)
    setShowAttachMenu(false)
    setHasStartedChat(true)
    setProfileNotice('Context queued and will fold into the same live thread.')
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
      setProfileNotice(`${type === 'image' ? 'Image' : 'Document'} too large. Max allowed: ${formatSize(maxSize)}.`)
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
    setShowMobileRail(false)
    inputRef.current?.focus()
  }

  const handleProfileAction = (action: 'settings' | 'upgrade') => {
    setShowProfileMenu(false)
    if (action === 'upgrade') {
      window.location.href = '/pricing'
      return
    }
    setShowSettingsSheet(true)
  }

  const handleEmailAuth = async () => {
    if (!userId) return
    const trimmedEmail = authEmail.trim()
    const trimmedName = authName.trim()
    if (authSheetMode === 'register' && !trimmedName) {
      setAuthError('Please enter your name to continue.')
      setAuthMessage('')
      return
    }
    if (!trimmedEmail) {
      setAuthError('Please enter your email address.')
      setAuthMessage('')
      return
    }
    if (!authPassword.trim()) {
      setAuthError('Please enter your password.')
      setAuthMessage('')
      return
    }
    setAuthLoading(true)
    setAuthError('')
    setAuthMessage('')
    try {
      const endpoint = authSheetMode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: trimmedName,
          email: trimmedEmail,
          password: authPassword,
        }),
      })
      const data = (await safeJson(response)) as { ok?: boolean; session?: UserSession; error?: string } | null
      if (!response.ok || !data?.ok || !data.session) {
        setAuthError(data?.error ?? 'Unable to continue with email right now.')
        return
      }
      setSession(data.session)
      setAuthMessage(authSheetMode === 'register' ? 'Account created. You can keep going.' : 'Signed in. Workspace updated.')
      setAuthPassword('')
      setAuthName('')
      setAuthEmail('')
      setSendError('')
      await loadSession(userId)
      setTimeout(() => {
        setAuthMessage('')
      }, 2000)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to continue with email right now.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleUpgradePremium = async () => {
    if (!userId) return
    setAuthLoading(true)
    setAuthError('')
    try {
      const response = await fetch('/api/auth/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = (await safeJson(response)) as { ok?: boolean; session?: UserSession; error?: string } | null
      if (!response.ok || !data?.ok || !data.session) {
        setAuthError(data?.error ?? 'Unable to activate Premium right now.')
        return
      }
      setSession(data.session)
      setShowSettingsSheet(false)
      setProfileNotice('Premium is active for this workspace.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    if (!userId) return
    setAuthLoading(true)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      window.localStorage.removeItem('smartrank_user_id')
      window.localStorage.removeItem('SmartRank_session')
      window.location.reload()
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
        {showMobileRail ? (
          <button
            type="button"
            className="workspace-mobile-overlay"
            aria-label="Close conversation panel"
            onClick={() => setShowMobileRail(false)}
          />
        ) : null}

        <aside className={`workspace-rail ${showMobileRail ? 'workspace-rail-open' : ''}`} aria-label="Primary Navigation">
          <div className="workspace-brand">
            <img src="/1000000595.png" alt="SmartRank logo" className="workspace-logo" />
          </div>
          <button
            type="button"
            className="workspace-new-chat-btn"
            onClick={() => void handleNewChat()}
            disabled={session ? !session.canCreateConversation : false}
            title={session && !session.canCreateConversation ? 'Free plan includes one chat. Upgrade for more.' : undefined}
          >
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
                  setShowMobileRail(false)
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
            <div className="workspace-head-left">
              <button
                type="button"
                className="workspace-mobile-nav-btn"
                aria-label="Open conversations"
                onClick={() => setShowMobileRail(true)}
              >
                <PanelLeft size={18} />
              </button>
              <div className="workspace-mobile-thread-pill">
                {activeConversation?.title || 'New chat'}
              </div>
            </div>
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
                  <span>
                    {session?.plan === 'premium'
                      ? 'Premium workspace'
                      : session?.isAuthenticated
                        ? 'Email connected'
                        : 'Guest session'}
                  </span>
                </div>
                <button type="button" onClick={() => handleProfileAction('upgrade')}>
                  <Crown size={15} />
                  <span>{session?.plan === 'premium' ? 'Premium active' : 'Upgrade plan'}</span>
                </button>
                <button type="button" onClick={() => handleProfileAction('settings')}>
                  <Settings size={15} />
                  <span>Settings</span>
                </button>
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
              <div ref={chatBodyRef} className="workspace-chat-body">
                {renderMessages.length === 0 ? (
                  <p className="workspace-empty-chat">Start typing to begin your new chat.</p>
                ) : (
                  renderMessages.map((message) => (
                    <article key={message.id} className={`workspace-msg ${message.sender}`}>
                      {message.sender === 'admin' ? <div className="workspace-msg-label">SmartRank</div> : null}
                      {message.sender === 'admin' && typingMessageId && message.groupedIds.includes(typingMessageId) ? (
                        <div className="workspace-msg-bridge">
                          <div className="workspace-msg-bridge-chip">
                            <span className="workspace-msg-bridge-dot" />
                            <span>Reasoning live</span>
                          </div>
                          <div className="workspace-msg-bridge-text">
                            {getAgentProgressText(latestProgressMessage) || 'Continuing from the active reasoning trace.'}
                          </div>
                        </div>
                      ) : null}
                      <div className="workspace-msg-content">
                        {message.sender === 'admin' && typingMessageId && message.groupedIds.includes(typingMessageId)
                          ? (
                            <div className="workspace-streaming-copy">
                              {renderMarkdownText(
                                [...message.segments.slice(0, -1), typingText || ''].filter(Boolean).join('\n\n'),
                              )}
                              {isTypingLive ? <span className="workspace-streaming-cursor" aria-hidden="true" /> : null}
                            </div>
                          )
                          : renderMarkdownText(message.text)}
                      </div>
                      {message.attachments && message.attachments.length > 0 ? (
                        <div className="workspace-msg-attachments">
                          {message.attachments.map((file) => (
                            <div key={file.id} className="workspace-msg-attachment">
                              {file.type === 'image' && file.downloadUrl ? (
                                <a href={file.downloadUrl} target="_blank" rel="noreferrer" className="workspace-msg-attachment-preview">
                                  <img src={file.downloadUrl} alt={file.name} className="workspace-msg-attachment-image" />
                                  <span>{file.name}</span>
                                  <small>{formatSize(file.size)}</small>
                                </a>
                              ) : (
                                <>
                                  {file.type === 'image' ? <ImageIcon size={13} /> : <FileText size={13} />}
                                  {file.downloadUrl ? (
                                    <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                                      {file.name}
                                    </a>
                                  ) : (
                                    <span>{file.name}</span>
                                  )}
                                  <small>{formatSize(file.size)}</small>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <span>{message.time}</span>
                    </article>
                  ))
                )}
                {showLiveReasoning ? (
                  <article
                    className={`workspace-msg admin workspace-searching workspace-sim-card ${
                      isTypingLive && !showSearching ? 'workspace-sim-card-inline' : ''
                    }`}
                    key={`searching-${clockTick}-${typingMessageId ?? 'idle'}`}
                  >
                    <div className="workspace-sim-head">
                      <div className="workspace-sim-avatar">SR</div>
                      <div className="workspace-sim-head-copy">
                        <strong>
                          {isTypingLive
                            ? 'Continuing while the answer streams'
                            : showRetrying
                              ? 'Still reasoning'
                              : 'Reasoning live'}
                        </strong>
                        <span>
                          {isTypingLive
                            ? 'The same session is still refining the next lines.'
                            : showRetrying
                              ? 'Delivery is retrying in the same thread'
                              : 'Compact reasoning is still active'}
                        </span>
                      </div>
                      <div className="workspace-sim-chip">Active</div>
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
                    <div className="workspace-sim-timeline" aria-hidden="true">
                      {simulationTimeline.map((item, index) => (
                        <div
                          key={item}
                          className={`workspace-sim-timeline-item ${
                            index < simulationTimelineIndex ? 'done' : index === simulationTimelineIndex ? 'active' : ''
                          }`}
                        >
                          <span className="workspace-sim-timeline-dot" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    {recentProgressTrail.length > 0 ? (
                      <div className="workspace-sim-trace">
                        {recentProgressTrail.map((item, index) => (
                          <div
                            key={`${item}-${index}`}
                            className={`workspace-sim-trace-line ${
                              index === recentProgressTrail.length - 1 ? 'active' : ''
                            }`}
                          >
                            <span className="workspace-sim-trace-marker" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="workspace-sim-progress" aria-hidden="true">
                      <span className="workspace-sim-progress-bar" />
                    </div>
                  </article>
                ) : null}
                {showTrafficNotice ? (
                  <article className="workspace-msg admin workspace-traffic-notice">
                    <div className="workspace-msg-content">
                      {renderMarkdownText(
                        'Due to high traffic the response can take time. Create your free account now and we will keep this workspace moving.',
                      )}
                    </div>
                    <div className="workspace-upgrade-actions">
                      <button type="button" onClick={() => setAuthSheetMode('register')} disabled={authLoading}>
                        {authLoading ? 'Opening...' : 'Continue with email'}
                      </button>
                    </div>
                  </article>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
            </section>
          ) : null}

          {showSettingsSheet ? (
            <section className="workspace-settings-sheet" aria-label="Workspace settings">
              <div className="workspace-settings-head">
                <div>
                  <strong>Settings</strong>
                  <span>Manage your account, plan, and workspace access.</span>
                </div>
                <button type="button" className="workspace-sheet-close" onClick={() => setShowSettingsSheet(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="workspace-settings-grid">
                <div className="workspace-settings-card">
                  <small>Account</small>
                  <strong>{session?.email ?? session?.name ?? 'Guest workspace'}</strong>
                  <span>
                    {session?.isAuthenticated
                      ? 'Your free account keeps this chat history tied to your email.'
                      : 'Sign in to keep this workspace attached to your email.'}
                  </span>
                </div>
                <div className="workspace-settings-card">
                  <small>Plan</small>
                  <strong>{session?.plan === 'premium' ? 'Premium' : 'Free'}</strong>
                  <span>
                    {session?.plan === 'premium'
                      ? 'Multiple chats and expanded message capacity are active.'
                      : 'Free includes one chat. Premium unlocks more workspaces and longer usage.'}
                  </span>
                </div>
              </div>
              <div className="workspace-settings-actions">
                {session?.plan !== 'premium' ? (
                  <button type="button" className="workspace-sheet-primary" onClick={() => void handleUpgradePremium()}>
                    {authLoading ? 'Activating Premium...' : 'Activate Premium for $24/mo'}
                  </button>
                ) : null}
                <button type="button" className="workspace-sheet-secondary" onClick={() => void handleLogout()}>
                  <LogOut size={15} />
                  <span>{authLoading ? 'Signing out...' : 'Log out'}</span>
                </button>
              </div>
            </section>
          ) : null}

          {shouldShowAuthTulip ? (
            <section className="workspace-tulip" aria-label="Continue with email">
              <div className="workspace-tulip-copy">
                <strong>Keep this workspace going</strong>
                <span>You’ve used the free guest allowance. Sign in to unlock 20 more messages in this same chat.</span>
              </div>
              <div className="workspace-auth-toggle">
                <button
                  type="button"
                  className={authSheetMode === 'register' ? 'active' : ''}
                  onClick={() => setAuthSheetMode('register')}
                >
                  Create account
                </button>
                <button
                  type="button"
                  className={authSheetMode === 'login' ? 'active' : ''}
                  onClick={() => setAuthSheetMode('login')}
                >
                  Log in
                </button>
              </div>
              <div className="workspace-auth-fields">
                {authSheetMode === 'register' ? (
                  <input
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    placeholder="Your name"
                    aria-label="Your name"
                  />
                ) : null}
                <input
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="you@company.com"
                  aria-label="Email address"
                />
                <input
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                />
              </div>
              {authError ? <div className="workspace-tulip-hint error">{authError}</div> : null}
              {authMessage ? <div className="workspace-tulip-hint">{authMessage}</div> : null}
              <button type="button" className="workspace-tulip-cta" onClick={() => void handleEmailAuth()}>
                {authLoading
                  ? 'Connecting...'
                  : authSheetMode === 'register'
                    ? 'Continue with email'
                    : 'Log in and continue'}
              </button>
            </section>
          ) : null}

          {shouldShowUpgradeTulip ? (
            <section className="workspace-tulip workspace-tulip-premium" aria-label="Upgrade to Premium">
              <div className="workspace-tulip-copy">
                <strong>Free usage complete</strong>
                <span>Upgrade to Premium for $24/mo and keep SmartRank running across more chats, more context, and more agent cycles.</span>
              </div>
              {authError ? <div className="workspace-tulip-hint error">{authError}</div> : null}
              <button type="button" className="workspace-tulip-cta" onClick={() => void handleUpgradePremium()}>
                {authLoading ? 'Activating Premium...' : 'Upgrade to Premium'}
              </button>
            </section>
          ) : null}

          <form
            className={`workspace-input-wrap ${hasStartedChat || focusChatMode ? 'workspace-input-wrap-chat' : ''}`}
            onSubmit={(event) => void handleSubmit(event)}
          >
            {queuedContexts.length > 0 ? (
              <div className="workspace-queue-strip" aria-label="Queued context">
                <span className="workspace-queue-label">Queued context</span>
                <div className="workspace-queue-items">
                  {queuedContexts.map((item, index) => (
                    <div key={item.id} className={`workspace-queue-item ${item.status}`}>
                      <span className={`workspace-queue-state ${item.status}`}>{item.status}</span>
                      <span>{index + 1}. {item.text}</span>
                      <button
                        type="button"
                        aria-label={`Remove queued context ${index + 1}`}
                        onClick={() => setQueuedContexts((current) => current.filter((entry) => entry.id !== item.id))}
                        disabled={item.status === 'sending'}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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
            <div className="workspace-composer-actions" aria-label="Composer actions">
              <button type="button" className="workspace-composer-chip active" onClick={() => void handleSendNow()}>
                <ChevronRight size={13} />
                <span>Steer now</span>
              </button>
              <button
                type="button"
                className="workspace-composer-chip"
                onClick={handleQueueContext}
                disabled={!prompt.trim() && attachments.length === 0}
              >
                <PanelLeft size={13} />
                <span>Queue context</span>
              </button>
            </div>
            {isUploading ? <div className="workspace-uploading-hint">Uploading files and continuing task...</div> : null}
            {sendError ? <div className="workspace-uploading-hint workspace-error-hint">{sendError}</div> : null}
            {profileNotice ? <div className="workspace-uploading-hint">{profileNotice}</div> : null}
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
