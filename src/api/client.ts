import func2url from '../../backend/func2url.json';

const AUTH_URL = func2url.auth;
const CHATS_URL = func2url.chats;
const MESSAGES_URL = func2url.messages;

function getToken(): string {
  return localStorage.getItem('pulse_token') || '';
}

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': getToken(),
  };
}

async function parseBody(res: Response) {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'string') return JSON.parse(parsed);
    return parsed;
  } catch {
    return { error: text };
  }
}

export const api = {
  async register(phone: string, displayName: string, password: string) {
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ action: 'register', phone, display_name: displayName, password }),
    });
    const data = await parseBody(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
    return data as { token: string; user: { id: number; username: string; display_name: string } };
  },

  async login(phone: string, password: string) {
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ action: 'login', phone, password }),
    });
    const data = await parseBody(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка входа');
    return data as { token: string; user: { id: number; username: string; display_name: string } };
  },

  async me() {
    const res = await fetch(AUTH_URL, {
      method: 'GET',
      headers: headers(),
    });
    const data = await parseBody(res);
    if (!res.ok) throw new Error('Не авторизован');
    return data as { user: { id: number; username: string; display_name: string } };
  },

  async logout() {
    await fetch(AUTH_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ action: 'logout' }),
    });
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user');
  },

  async getChats() {
    const res = await fetch(`${CHATS_URL}?action=list`, { headers: headers() });
    const data = await parseBody(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки чатов');
    return data as { chats: ApiChat[] };
  },

  async searchUsers(q: string) {
    const res = await fetch(`${CHATS_URL}?action=search&q=${encodeURIComponent(q)}`, { headers: headers() });
    const data = await parseBody(res);
    return data as { users: ApiUser[] };
  },

  async createChat(userId: number) {
    const res = await fetch(CHATS_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ action: 'create', user_id: userId, type: 'chat' }),
    });
    const data = await parseBody(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка создания чата');
    return data as { chat_id: number };
  },

  async getMessages(chatId: number) {
    const res = await fetch(`${MESSAGES_URL}?chat_id=${chatId}`, { headers: headers() });
    const data = await parseBody(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки сообщений');
    return data as { messages: ApiMessage[] };
  },

  async sendMessage(chatId: number, text: string) {
    const res = await fetch(MESSAGES_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await parseBody(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка отправки');
    return data as { message: ApiMessage };
  },
};

export interface ApiChat {
  id: number;
  type: 'chat' | 'group' | 'channel' | 'bot';
  name: string;
  unread: number;
  last_message: string;
  time: string;
}

export interface ApiUser {
  id: number;
  username: string;
  display_name: string;
}

export interface ApiMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  text: string;
  time: string;
  is_own: boolean;
  is_read: boolean;
}