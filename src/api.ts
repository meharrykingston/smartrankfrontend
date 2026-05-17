import type { AdminThread, ChatMessage, GuestSession, WorkspaceState } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const DEMO_FALLBACK = import.meta.env.VITE_ENABLE_DEMO_FALLBACK !== 'false';

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

function localSession(): GuestSession {
  const cached = localStorage.getItem('smart-rank-session');
  if (cached) return JSON.parse(cached) as GuestSession;
  const session: GuestSession = {
    guestId: uid(),
    username: `guest_sr_${Math.floor(1000 + Math.random() * 9000)}`,
    workspaceId: uid(),
    messageCount: 0,
    requiresLogin: false
  };
  localStorage.setItem('smart-rank-session', JSON.stringify(session));
  localStorage.setItem('smart-rank-messages', JSON.stringify([
    {
      id: uid(),
      role: 'assistant',
      text: 'Tell me what you need done. You can ask for more enquiries, better pages, ad fixes, launch posts, email sequences, or search visibility.',
      createdAt: now()
    }
  ]));
  return session;
}

function saveSession(session: GuestSession) {
  localStorage.setItem('smart-rank-session', JSON.stringify(session));
}

function localMessages(): ChatMessage[] {
  const raw = localStorage.getItem('smart-rank-messages');
  return raw ? JSON.parse(raw) as ChatMessage[] : [];
}

function saveMessages(messages: ChatMessage[]) {
  localStorage.setItem('smart-rank-messages', JSON.stringify(messages));
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init
  });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json() as Promise<T>;
}

export async function bootstrapWorkspace(): Promise<WorkspaceState> {
  try {
    const existing = localStorage.getItem('smart-rank-session');
    const payload = existing ? { guestId: (JSON.parse(existing) as GuestSession).guestId } : {};
    const state = await http<WorkspaceState>('/actions/session/start', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    saveSession(state.session);
    saveMessages(state.messages);
    return state;
  } catch (error) {
    if (!DEMO_FALLBACK) throw error;
    return { session: localSession(), messages: localMessages() };
  }
}

export async function sendUserMessage(text: string): Promise<WorkspaceState> {
  const session = localSession();
  try {
    const state = await http<WorkspaceState>('/actions/messages/send', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: session.workspaceId, guestId: session.guestId, text })
    });
    saveSession(state.session);
    saveMessages(state.messages);
    return state;
  } catch (error) {
    if (!DEMO_FALLBACK) throw error;
    const nextSession = {
      ...session,
      messageCount: session.messageCount + 1,
      requiresLogin: session.messageCount + 1 >= 20
    };
    const nextMessages = [
      ...localMessages(),
      { id: uid(), role: 'user' as const, text, createdAt: now() }
    ];
    saveSession(nextSession);
    saveMessages(nextMessages);
    return { session: nextSession, messages: nextMessages };
  }
}

export function createWorkspaceSocket(workspaceId: string, onMessage: (message: ChatMessage) => void): WebSocket | null {
  try {
    const wsUrl = API_URL.replace(/^http/, 'ws');
    const socket = new WebSocket(`${wsUrl}/ws?workspaceId=${encodeURIComponent(workspaceId)}`);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'message') onMessage(payload.message as ChatMessage);
    };
    return socket;
  } catch {
    return null;
  }
}

export async function getLoginUrl(provider: 'google' | 'github' | 'email' = 'google'): Promise<string> {
  if (provider === 'email') return '#/chat';
  try {
    const data = await http<{ url: string }>(`/actions/auth/provider/${provider}`, { method: 'POST' });
    return data.url;
  } catch {
    return '#/chat';
  }
}

export async function getAdminInbox(): Promise<AdminThread[]> {
  try {
    return await http<AdminThread[]>('/actions/admin/inbox');
  } catch {
    return [
      { workspaceId: 'demo-1', username: 'guest_sr_4821', title: 'SaaS enquiry system', status: 'new', lastMessage: 'Needs complete marketing system', updatedAt: now() },
      { workspaceId: 'demo-2', username: 'guest_sr_1937', title: 'Search roadmap', status: 'queued', lastMessage: 'Keywords, pages, and publishing map', updatedAt: now() },
      { workspaceId: 'demo-3', username: 'guest_sr_7064', title: 'Launch campaign', status: 'review', lastMessage: 'Launch posts and email flow', updatedAt: now() }
    ];
  }
}

export async function operatorReply(workspaceId: string, text: string, mode: 'queue' | 'stream' | 'merge' | 'publish') {
  return http('/actions/operator/reply', {
    method: 'POST',
    body: JSON.stringify({ workspaceId, text, mode })
  });
}
