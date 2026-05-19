import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  PanelLeft,
  Paperclip,
  SendHorizontal,
  Shield,
  X,
} from 'lucide-react'
import './admin.css'

type AdminUser = {
  userId: string
  latestConversationId: string | null
  latestMessage: string
  latestTime: string
  updatedAt: number
}

type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
}

type ChatMessage = {
  id: string
  sender: 'user' | 'admin'
  text: string
  time: string
  createdAt: number
  attachments?: AdminAttachment[]
}

type AdminAttachment = {
  id: string
  name: string
  size: number
  type: 'image' | 'document'
  downloadUrl?: string
  file?: File
}

type AdminChallenge = {
  challengeId: string
  prompt: string
  expiresInMs: number
}

type RenderMessage = {
  id: string
  sender: 'user' | 'admin'
  text: string
  time: string
  createdAt: number
  attachments?: AdminAttachment[]
  segments: string[]
  groupedIds: string[]
}

const AGENT_STATE_PREFIX = '[[state]] '
const AGENT_STATE_OPTIONS = [
  'Reading request...',
  'Finding outcome...',
  'Extracting signals...',
  'Compacting context...',
  'Finding leverage...',
  'Structuring response...',
  'Preparing answer...',
] as const

const isAgentProgressMessage = (message: ChatMessage | null | undefined) =>
  Boolean(message && message.sender === 'admin' && message.text.trim().startsWith(AGENT_STATE_PREFIX))

const getAgentProgressText = (message: ChatMessage | null | undefined) =>
  message?.text.trim().startsWith(AGENT_STATE_PREFIX)
    ? message.text.trim().slice(AGENT_STATE_PREFIX.length).trim()
    : message?.text.trim() ?? ''

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reply, setReply] = useState('')
  const [attachments, setAttachments] = useState<AdminAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminUsername, setAdminUsername] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<AdminChallenge | null>(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [adminActionError, setAdminActionError] = useState('')
  const [showMobileQueue, setShowMobileQueue] = useState(false)
  const [agentStateText, setAgentStateText] = useState<string>(AGENT_STATE_OPTIONS[0])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId) ?? null,
    [selectedUserId, users],
  )
  const progressMessages = useMemo(
    () => messages.filter((message) => isAgentProgressMessage(message)),
    [messages],
  )
  const visibleMessages = useMemo(
    () => messages.filter((message) => !isAgentProgressMessage(message)),
    [messages],
  )
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
        time: message.time,
        createdAt: message.createdAt,
        attachments: message.attachments,
        segments: [message.text],
        groupedIds: [message.id],
      })
    }

    return grouped
  }, [visibleMessages])
  const latestProgressMessage = useMemo(() => [...progressMessages].reverse()[0] ?? null, [progressMessages])
  const conversationAttachments = useMemo(
    () =>
      visibleMessages.flatMap((message) =>
        (message.attachments ?? []).map((attachment) => ({
          ...attachment,
          sender: message.sender,
          time: message.time,
        })),
      ),
    [visibleMessages],
  )

  const safeJson = async (response: Response) => {
    const text = await response.text()
    if (!text) return null
    try {
      return JSON.parse(text) as unknown
    } catch {
      return null
    }
  }

  const refreshChallenge = async () => {
    const response = await fetch('/api/admin/auth/challenge', { credentials: 'include' })
    const data = (await safeJson(response)) as { ok?: boolean; challenge?: AdminChallenge } | null
    if (!response.ok || !data?.ok || !data.challenge) return
    setChallenge(data.challenge)
  }

  const checkSession = async () => {
    const response = await fetch('/api/admin/auth/session', { credentials: 'include' })
    const data = (await safeJson(response)) as
      | { ok?: boolean; authenticated?: boolean; username?: string | null }
      | null
    if (!response.ok || !data?.ok) {
      setAuthChecked(true)
      return
    }

    const authenticated = Boolean(data.authenticated)
    setIsAuthenticated(authenticated)
    setAdminUsername(data.username ?? null)
    setAuthChecked(true)
    if (!authenticated) {
      await refreshChallenge()
    }
  }

  const adminFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(input, {
      ...init,
      credentials: 'include',
    })
    if (response.status === 401) {
      setIsAuthenticated(false)
      setAdminUsername(null)
      setUsers([])
      setConversations([])
      setMessages([])
      setSelectedUserId('')
      setActiveConversationId('')
      setAuthError('Admin session expired. Please sign in again.')
      await refreshChallenge()
    }
    return response
  }

  const loadUsers = async () => {
    const response = await adminFetch('/api/admin/chats')
    const data = (await safeJson(response)) as { ok?: boolean; users?: AdminUser[] } | null
    if (!response.ok || !data?.ok) return
    const nextUsers = data.users as AdminUser[]
    setUsers(nextUsers)
    setSelectedUserId((current) => {
      if (current && nextUsers.some((user) => user.userId === current)) {
        return current
      }
      return nextUsers[0]?.userId ?? ''
    })
  }

  const loadConversations = async (userId: string) => {
    const response = await adminFetch(`/api/admin/chats/${encodeURIComponent(userId)}/conversations`)
    const data = (await safeJson(response)) as { ok?: boolean; conversations?: Conversation[] } | null
    if (!response.ok || !data?.ok) return
    const nextConversations = data.conversations as Conversation[]
    setConversations(nextConversations)
    setActiveConversationId((current) => {
      if (current && nextConversations.some((conversation) => conversation.id === current)) {
        return current
      }
      return nextConversations[0]?.id ?? ''
    })
  }

  const loadMessages = async (userId: string, conversationId: string) => {
    if (!conversationId) return
    const response = await adminFetch(
      `/api/admin/chats/${encodeURIComponent(userId)}/messages?conversationId=${encodeURIComponent(conversationId)}`,
    )
    const data = (await safeJson(response)) as { ok?: boolean; messages?: ChatMessage[] } | null
    if (!response.ok || !data?.ok) return
    setMessages(data.messages as ChatMessage[])
  }

  useEffect(() => {
    void checkSession()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    void loadUsers()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !selectedUserId) return
    setActiveConversationId('')
    setMessages([])
    void loadConversations(selectedUserId)
  }, [isAuthenticated, selectedUserId])

  useEffect(() => {
    if (!isAuthenticated || !selectedUserId || !activeConversationId) return
    void loadMessages(selectedUserId, activeConversationId)
  }, [isAuthenticated, selectedUserId, activeConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedUserId) {
      setShowMobileQueue(false)
    }
  }, [selectedUserId, activeConversationId])

  useEffect(() => {
    if (!isAuthenticated || !selectedUserId) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(
      `${protocol}//${window.location.host}/ws/chat?userId=${encodeURIComponent(selectedUserId)}`,
    )

    socket.onmessage = () => {
      void loadUsers()
      void loadConversations(selectedUserId)
      if (activeConversationId) {
        void loadMessages(selectedUserId, activeConversationId)
      }
    }

    return () => socket.close()
  }, [isAuthenticated, selectedUserId, activeConversationId])

  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!challenge) {
      await refreshChallenge()
      return
    }

    setAuthLoading(true)
    setAuthError('')
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
          challengeId: challenge.challengeId,
          captchaAnswer,
        }),
      })
      const data = (await safeJson(response)) as
        | { ok?: boolean; authenticated?: boolean; username?: string | null; error?: string }
        | null
      if (!response.ok || !data?.ok || !data.authenticated) {
        setAuthError(data?.error ?? 'Unable to sign in.')
        await refreshChallenge()
        setCaptchaAnswer('')
        return
      }

      setIsAuthenticated(true)
      setAdminUsername(data.username ?? loginUsername)
      setCaptchaAnswer('')
      setChallenge(null)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setIsAuthenticated(false)
    setAdminUsername(null)
    setUsers([])
    setConversations([])
    setMessages([])
    setSelectedUserId('')
    setActiveConversationId('')
    setReply('')
    setAttachments([])
    setLoginPassword('')
    setCaptchaAnswer('')
    await refreshChallenge()
  }

  const handleReplySubmit = async (event: FormEvent) => {
    event.preventDefault()
    setAdminActionError('')
    if (!selectedUserId || !activeConversationId) {
      setAdminActionError('Select a user conversation before sending a reply.')
      return
    }
    const message = reply.trim()
    if (!message && attachments.length === 0) {
      setAdminActionError('Write a reply or attach a file before sending.')
      return
    }

    setIsUploading(true)
    try {
      const uploadedAttachments = await Promise.all(
        attachments.map(async (attachment) => {
          if (!attachment.file) return attachment
          const formData = new FormData()
          formData.append('userId', selectedUserId)
          formData.append('conversationId', activeConversationId)
          formData.append('sender', 'admin')
          formData.append('attachmentType', attachment.type)
          formData.append('file', attachment.file)
          const uploadResponse = await adminFetch('/api/chat/uploads', {
            method: 'POST',
            body: formData,
          })
          const uploadData = (await safeJson(uploadResponse)) as
            | { ok?: boolean; attachment?: AdminAttachment; error?: string }
            | null
          if (!uploadResponse.ok || !uploadData?.ok || !uploadData.attachment) {
            throw new Error(uploadData?.error ?? 'Unable to upload attachment')
          }
          return uploadData.attachment
        }),
      )

      const response = await adminFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          conversationId: activeConversationId,
          sender: 'admin',
          text: message || 'Admin uploaded supporting files.',
          attachments: uploadedAttachments.map((attachment) => ({
            id: attachment.id,
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
            downloadUrl: attachment.downloadUrl,
          })),
        }),
      })
      const data = (await safeJson(response)) as { ok?: boolean; error?: string } | null
      if (!response.ok || !data?.ok) {
        setAdminActionError(data?.error ?? 'Unable to send reply right now.')
        return
      }

      setReply('')
      setAttachments([])
      setAdminActionError('')
      await loadMessages(selectedUserId, activeConversationId)
      await loadUsers()
    } catch (error) {
      setAdminActionError(error instanceof Error ? error.message : 'Unable to send reply right now.')
    } finally {
      setIsUploading(false)
    }
  }

  const addAttachment = (file: File) => {
    const type = file.type.startsWith('image/') ? 'image' : 'document'
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

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    Array.from(files).forEach(addAttachment)
    event.target.value = ''
  }

  const handlePremiumPrompt = async () => {
    setAdminActionError('')
    if (!selectedUserId || !activeConversationId) {
      setAdminActionError('Select a user conversation before sending the premium prompt.')
      return
    }
    const response = await adminFetch(`/api/admin/chats/${encodeURIComponent(selectedUserId)}/premium-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConversationId }),
    })
    const data = (await safeJson(response)) as { ok?: boolean; error?: string } | null
    if (!response.ok || !data?.ok) {
      setAdminActionError(data?.error ?? 'Unable to send premium prompt right now.')
      return
    }
    await loadMessages(selectedUserId, activeConversationId)
    await loadUsers()
  }

  const handlePushAgentState = async () => {
    setAdminActionError('')
    if (!selectedUserId || !activeConversationId) {
      setAdminActionError('Select a user conversation before updating agent state.')
      return
    }
    const text = agentStateText.trim()
    if (!text) {
      setAdminActionError('Choose or write a state before updating it.')
      return
    }
    const response = await adminFetch(`/api/admin/chats/${encodeURIComponent(selectedUserId)}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConversationId, text }),
    })
    const data = (await safeJson(response)) as { ok?: boolean; error?: string } | null
    if (!response.ok || !data?.ok) {
      setAdminActionError(data?.error ?? 'Unable to update agent state right now.')
      return
    }
    await loadMessages(selectedUserId, activeConversationId)
    await loadUsers()
  }

  if (!authChecked) {
    return (
      <div className="admin-auth-root">
        <div className="admin-auth-card">
          <LoaderCircle className="admin-spinner" size={18} />
          <p>Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-auth-root">
        <form className="admin-auth-card" onSubmit={(event) => void handleAuthSubmit(event)}>
          <div className="admin-auth-badge">
            <LockKeyhole size={16} />
            <span>Protected admin access</span>
          </div>
          <h1>Sign in to SmartRank Admin</h1>
          <p>Solve the captcha and enter admin credentials to continue.</p>
          <label className="admin-auth-field">
            <span>Username</span>
            <input value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} />
          </label>
          <label className="admin-auth-field">
            <span>Password</span>
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
            />
          </label>
          <label className="admin-auth-field">
            <span>Captcha</span>
            <div className="admin-captcha-row">
              <div className="admin-captcha-prompt">{challenge?.prompt ?? 'Loading captcha...'}</div>
              <button type="button" className="admin-captcha-refresh" onClick={() => void refreshChallenge()}>
                Refresh
              </button>
            </div>
            <input value={captchaAnswer} onChange={(event) => setCaptchaAnswer(event.target.value)} />
          </label>
          {authError ? <div className="admin-auth-error">{authError}</div> : null}
          <button type="submit" className="admin-auth-submit" disabled={authLoading || !challenge}>
            {authLoading ? 'Signing in...' : 'Unlock admin'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-root">
      <header className="admin-topbar">
        <div className="admin-brand">
          <Shield size={16} />
          <span>SmartRank Admin</span>
        </div>
        <div className="admin-topbar-actions">
          <span className="admin-session-pill">{adminUsername ?? 'admin'}</span>
          <button type="button" className="admin-logout-btn" onClick={() => void handleLogout()}>
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="admin-layout">
        {showMobileQueue ? (
          <button
            type="button"
            className="admin-mobile-overlay"
            aria-label="Close queue"
            onClick={() => setShowMobileQueue(false)}
          />
        ) : null}

        <aside className={`admin-users ${showMobileQueue ? 'admin-users-open' : ''}`}>
          <div className="admin-users-head">
            <h2>Live queue</h2>
            <span>{users.length} active</span>
          </div>
          <div className="admin-user-list">
            {users.length === 0 ? <div className="admin-user-empty">No live users yet.</div> : null}
            {users.map((user) => (
              <button
                key={user.userId}
                type="button"
                className={`admin-user-item ${user.userId === selectedUserId ? 'active' : ''}`}
                onClick={() => setSelectedUserId(user.userId)}
              >
                <div className="admin-user-item-top">
                  <div className="admin-user-name">
                    <span className="admin-user-dot" />
                    <strong>{user.userId}</strong>
                  </div>
                  <span>{user.latestTime || 'No time'}</span>
                </div>
                <p>{user.latestMessage || 'No messages yet'}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-chat">
          <header className="admin-chat-head">
            <div className="admin-chat-head-copy">
              <div className="admin-chat-mobile-tools">
                <button
                  type="button"
                  className="admin-mobile-nav-btn"
                  aria-label="Open user queue"
                  onClick={() => setShowMobileQueue(true)}
                >
                  <PanelLeft size={18} />
                </button>
                <span className="admin-chat-mobile-pill">
                  {selectedUser?.userId || 'Select a user'}
                </span>
              </div>
              <span className="admin-thread-kicker">Active conversation</span>
              <h1>{selectedUser?.userId || 'Select a user'}</h1>
              <p>
                {conversations.find((conversation) => conversation.id === activeConversationId)?.title ||
                  'No conversation selected'}
              </p>
            </div>
            {conversations.length > 0 ? (
              <div className="admin-head-actions">
                <div className="admin-state-controls">
                  <input
                    className="admin-state-input"
                    value={agentStateText}
                    onChange={(event) => setAgentStateText(event.target.value)}
                    list="admin-agent-states"
                    placeholder="Update agent state..."
                  />
                  <datalist id="admin-agent-states">
                    {AGENT_STATE_OPTIONS.map((state) => (
                      <option key={state} value={state} />
                    ))}
                  </datalist>
                  <button type="button" className="admin-state-btn" onClick={() => void handlePushAgentState()}>
                    Push state
                  </button>
                </div>
                <button type="button" className="admin-premium-btn" onClick={() => void handlePremiumPrompt()}>
                  Send premium prompt
                </button>
                <select
                  className="admin-conversation-select"
                  value={activeConversationId}
                  onChange={(event) => setActiveConversationId(event.target.value)}
                >
                  {conversations.map((conversation) => (
                    <option key={conversation.id} value={conversation.id}>
                      {conversation.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </header>

          <div className="admin-thread-shell">
            <div className="admin-messages">
              {renderMessages.map((message) => (
                <article
                  key={message.id}
                  className={`admin-message ${message.sender === 'admin' ? 'admin' : 'user'}`}
                >
                  {message.sender === 'admin' ? <div className="admin-message-label">SmartRank</div> : <div className="admin-message-label">User</div>}
                  <p>{message.text}</p>
                  {message.attachments && message.attachments.length > 0 ? (
                    <div className="admin-message-attachments">
                      {message.attachments.map((file) => (
                        <div key={file.id} className="admin-message-attachment">
                          {file.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                          {file.downloadUrl ? (
                            <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                              {file.name}
                            </a>
                          ) : (
                            <span>{file.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <time>{message.time}</time>
                </article>
              ))}
              {latestProgressMessage ? (
                <section className="admin-agent-card" aria-label="Agent activity">
                  <div className="admin-agent-card-head">
                    <div>
                      <strong>Agent activity</strong>
                      <span>Live reasoning state</span>
                    </div>
                    <div className="admin-agent-chip">Active</div>
                  </div>
                  <div className="admin-agent-current">{getAgentProgressText(latestProgressMessage)}</div>
                  <div className="admin-agent-steps" aria-hidden="true">
                    {AGENT_STATE_OPTIONS.slice(0, 5).map((state, index) => {
                      const activeIndex = Math.min(progressMessages.length, 5) - 1
                      return (
                        <div
                          key={state}
                          className={`admin-agent-step ${index < activeIndex ? 'done' : index === activeIndex ? 'active' : ''}`}
                        >
                          <span />
                          <small>{state.replace('...', '')}</small>
                        </div>
                      )
                    })}
                  </div>
                  <div className="admin-agent-bar">
                    <span />
                  </div>
                </section>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <aside className="admin-preview-rail" aria-label="Attachment preview">
              <div className="admin-preview-head">
                <strong>Thread assets</strong>
                <span>{conversationAttachments.length} items</span>
              </div>
              <div className="admin-preview-list">
                {conversationAttachments.length === 0 ? (
                  <div className="admin-preview-empty">Uploads from admin or user will stay visible here while the chat continues.</div>
                ) : null}
                {conversationAttachments.map((file) => (
                  <div key={`${file.id}-${file.time}`} className="admin-preview-card">
                    <div className="admin-preview-meta">
                      <span>{file.sender === 'admin' ? 'Admin' : 'User'}</span>
                      <small>{file.time}</small>
                    </div>
                    {file.type === 'image' && file.downloadUrl ? (
                      <a href={file.downloadUrl} target="_blank" rel="noreferrer" className="admin-preview-image-link">
                        <img src={file.downloadUrl} alt={file.name} className="admin-preview-image" />
                      </a>
                    ) : (
                      <div className="admin-preview-doc">
                        <FileText size={15} />
                        <div>
                          <strong>{file.name}</strong>
                          <small>{file.type}</small>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <form className="admin-reply" onSubmit={(event) => void handleReplySubmit(event)}>
            {attachments.length > 0 ? (
              <div className="admin-pending-attachments">
                {attachments.map((file) => (
                  <div key={file.id} className="admin-pending-attachment">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="admin-pending-remove"
                      onClick={() => setAttachments((current) => current.filter((entry) => entry.id !== file.id))}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <button type="button" className="admin-attach-btn" onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={16} />
            </button>
            <input
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Reply to user..."
              aria-label="Admin reply"
            />
            <button type="submit" className="admin-send-btn" aria-label="Send reply">
              <SendHorizontal size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.ppt,.pptx,.xls,.xlsx"
              onChange={handleFilePick}
            />
            {isUploading ? <span className="admin-uploading-hint">Uploading...</span> : null}
            {adminActionError ? <span className="admin-uploading-hint admin-error-hint">{adminActionError}</span> : null}
          </form>
        </section>
      </main>
    </div>
  )
}
