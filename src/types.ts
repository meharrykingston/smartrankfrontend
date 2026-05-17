export type View = 'landing' | 'chat' | 'pricing' | 'admin';

export type ChatRole = 'assistant' | 'user' | 'operator' | 'system';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  status?: 'working' | 'queued' | 'streaming' | 'merged' | 'published';
};

export type GuestSession = {
  guestId: string;
  username: string;
  workspaceId: string;
  messageCount: number;
  requiresLogin: boolean;
};

export type WorkspaceState = {
  session: GuestSession;
  messages: ChatMessage[];
};

export type AdminThread = {
  workspaceId: string;
  username: string;
  title: string;
  status: 'new' | 'working' | 'queued' | 'review' | 'published';
  lastMessage: string;
  updatedAt: string;
};
