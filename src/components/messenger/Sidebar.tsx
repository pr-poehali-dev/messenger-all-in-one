import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Chat, ChatType } from '@/data/mockData';

interface SidebarProps {
  chats: Chat[];
  selectedId: string | null;
  onSelect: (chat: Chat) => void;
}

const tabs: { label: string; type: ChatType | 'all'; icon: string }[] = [
  { label: 'Все', type: 'all', icon: 'MessageCircle' },
  { label: 'Чаты', type: 'chat', icon: 'User' },
  { label: 'Группы', type: 'group', icon: 'Users' },
  { label: 'Каналы', type: 'channel', icon: 'Radio' },
  { label: 'Боты', type: 'bot', icon: 'Bot' },
];

export default function Sidebar({ chats, selectedId, onSelect }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<ChatType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = chats.filter(c => {
    const matchTab = activeTab === 'all' || c.type === activeTab;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span className="logo-dot" />
          Pulse
        </div>
        <button className="icon-btn">
          <Icon name="PenSquare" size={18} />
        </button>
      </div>

      <div className="search-wrap">
        <Icon name="Search" size={15} className="search-icon" />
        <input
          className="search-input"
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

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
        {filtered.map(chat => (
          <button
            key={chat.id}
            className={`chat-item ${selectedId === chat.id ? 'chat-item--active' : ''}`}
            onClick={() => onSelect(chat)}
          >
            <div className="avatar-wrap">
              <div className={`avatar avatar--${chat.type}`}>
                {chat.avatar}
              </div>
              {chat.online && <span className="online-dot" />}
            </div>
            <div className="chat-info">
              <div className="chat-top">
                <span className="chat-name">
                  {chat.name}
                  {chat.verified && <Icon name="BadgeCheck" size={13} className="verified-icon" />}
                </span>
                <span className="chat-time">{chat.time}</span>
              </div>
              <div className="chat-bottom">
                <span className="chat-last">{chat.lastMessage}</span>
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
