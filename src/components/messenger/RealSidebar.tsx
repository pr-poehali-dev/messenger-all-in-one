import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { api, ApiChat, ApiUser } from '@/api/client';

interface RealSidebarProps {
  user: { id: number; username: string; display_name: string };
  selectedId: number | null;
  onSelect: (chat: ApiChat) => void;
  onLogout: () => void;
  refreshKey: number;
}

type TabType = 'all' | 'chat' | 'group' | 'channel' | 'bot';

const tabs: { label: string; type: TabType; icon: string }[] = [
  { label: 'Все', type: 'all', icon: 'MessageCircle' },
  { label: 'Чаты', type: 'chat', icon: 'User' },
  { label: 'Группы', type: 'group', icon: 'Users' },
  { label: 'Каналы', type: 'channel', icon: 'Radio' },
  { label: 'Боты', type: 'bot', icon: 'Bot' },
];

const TYPE_AVATAR: Record<string, string> = {
  chat: '💬',
  group: '👥',
  channel: '📡',
  bot: '🤖',
};

export default function RealSidebar({ user, selectedId, onSelect, onLogout, refreshKey }: RealSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadChats();
  }, [refreshKey]);

  const loadChats = async () => {
    try {
      const data = await api.getChats();
      setChats(data.chats);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.searchUsers(search);
        setSearchResults(data.users);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const openChatWithUser = async (u: ApiUser) => {
    try {
      const data = await api.createChat(u.id);
      setSearch('');
      setSearchResults([]);
      const newChat: ApiChat = {
        id: data.chat_id,
        type: 'chat',
        name: u.display_name,
        unread: 0,
        last_message: '',
        time: '',
      };
      onSelect(newChat);
      loadChats();
    } catch {
      // silent
    }
  };

  const avatarLetter = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  const filtered = chats.filter(c =>
    (activeTab === 'all' || c.type === activeTab) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span className="logo-dot" />
          Pulse
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="icon-btn" onClick={() => setShowSearch(!showSearch)} title="Найти пользователя">
            <Icon name="UserPlus" size={18} />
          </button>
          <button className="icon-btn" onClick={onLogout} title="Выйти">
            <Icon name="LogOut" size={18} />
          </button>
        </div>
      </div>

      <div className="sidebar-user-info">
        <div className="sidebar-avatar">{avatarLetter(user.display_name)}</div>
        <span className="sidebar-username">{user.display_name}</span>
      </div>

      <div className="search-wrap">
        <Icon name="Search" size={15} className="search-icon" />
        <input
          className="search-input"
          placeholder={showSearch ? 'Найти пользователя...' : 'Поиск чатов...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {searching && <Icon name="Loader" size={14} className="search-icon" style={{ right: 10, left: 'auto' }} />}
      </div>

      {showSearch && searchResults.length > 0 && (
        <div className="search-dropdown">
          {searchResults.map(u => (
            <button key={u.id} className="search-result-item" onClick={() => openChatWithUser(u)}>
              <div className="avatar avatar--chat avatar--sm">{avatarLetter(u.display_name)}</div>
              <div>
                <div className="chat-name">{u.display_name}</div>
                <div className="chat-last">@{u.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSearch && search.length >= 2 && searchResults.length === 0 && !searching && (
        <div className="search-empty">Пользователи не найдены</div>
      )}

      <div className="tabs-row">
        {tabs.map(t => (
          <button
            key={t.type}
            className={`tab-btn ${activeTab === t.type ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.type)}
          >
            <Icon name={t.icon} size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="chat-list">
        {filtered.length === 0 && (
          <div className="chat-list-empty">
            {chats.length === 0 ? 'Чатов пока нет. Найдите пользователя через 👤+' : 'Ничего не найдено'}
          </div>
        )}
        {filtered.map(chat => (
          <button
            key={chat.id}
            className={`chat-item ${selectedId === chat.id ? 'chat-item--active' : ''}`}
            onClick={() => onSelect(chat)}
          >
            <div className="avatar-wrap">
              <div className={`avatar avatar--${chat.type}`}>
                {TYPE_AVATAR[chat.type] || avatarLetter(chat.name)}
              </div>
            </div>
            <div className="chat-info">
              <div className="chat-top">
                <span className="chat-name">{chat.name}</span>
                <span className="chat-time">{chat.time}</span>
              </div>
              <div className="chat-bottom">
                <span className="chat-last">{chat.last_message || 'Нет сообщений'}</span>
                {chat.unread > 0 && (
                  <span className="badge">{chat.unread > 99 ? '99+' : chat.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="nav-btn nav-btn--active">
          <Icon name="MessageCircle" size={20} />
        </button>
        <button className="nav-btn">
          <Icon name="Phone" size={20} />
        </button>
        <button className="nav-btn">
          <Icon name="Bookmark" size={20} />
        </button>
        <button className="nav-btn">
          <Icon name="Settings" size={20} />
        </button>
      </div>
    </aside>
  );
}
