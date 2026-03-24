import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Chat, Message } from '@/data/mockData';

interface ChatWindowProps {
  chat: Chat | null;
}

export default function ChatWindow({ chat }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) setMessages(chat.messages);
  }, [chat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: 'sent',
    };
    setMessages(prev => [...prev, msg]);
    setInput('');

    if (chat?.type === 'bot') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: 'Понял тебя! Обрабатываю запрос...',
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
        }]);
      }, 800);
    }
  };

  if (!chat) {
    return (
      <div className="chat-empty">
        <div className="empty-icon">
          <Icon name="MessageCircle" size={48} />
        </div>
        <p className="empty-title">Выберите чат</p>
        <p className="empty-sub">Начните общение или создайте новый чат</p>
      </div>
    );
  }

  const typeLabel: Record<string, string> = {
    chat: 'в сети',
    group: 'группа',
    channel: 'канал',
    bot: 'бот',
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className={`avatar avatar--${chat.type} avatar--sm`}>{chat.avatar}</div>
          <div>
            <div className="chat-header-name">
              {chat.name}
              {chat.verified && <Icon name="BadgeCheck" size={14} className="verified-icon" />}
            </div>
            <div className="chat-header-sub">
              {chat.online ? (
                <><span className="online-text">● </span>{typeLabel[chat.type]}</>
              ) : typeLabel[chat.type]}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn"><Icon name="Search" size={18} /></button>
          <button className="icon-btn"><Icon name="Phone" size={18} /></button>
          <button className="icon-btn"><Icon name="MoreVertical" size={18} /></button>
        </div>
      </div>

      <div className="messages-area">
        {messages.map((msg, i) => {
          const showDate = i === 0;
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="date-divider">
                  <span>Сегодня</span>
                </div>
              )}
              <div className={`msg-row ${msg.isOwn ? 'msg-row--own' : ''}`}>
                {!msg.isOwn && (
                  <div className={`avatar avatar--${chat.type} avatar--xs`}>{chat.avatar}</div>
                )}
                <div className={`bubble ${msg.isOwn ? 'bubble--own' : 'bubble--other'}`}>
                  <p>{msg.text}</p>
                  <div className="bubble-meta">
                    <span className="bubble-time">{msg.time}</span>
                    {msg.isOwn && (
                      <span className="bubble-status">
                        {msg.status === 'read' ? (
                          <Icon name="CheckCheck" size={12} className="status-read" />
                        ) : (
                          <Icon name="Check" size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {chat.type !== 'channel' && (
        <div className="input-area">
          <button className="icon-btn"><Icon name="Paperclip" size={18} /></button>
          <div className="input-wrap">
            <input
              className="msg-input"
              placeholder="Написать сообщение..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            />
            <button className="icon-btn emoji-btn"><Icon name="Smile" size={18} /></button>
          </div>
          <button
            className={`send-btn ${input.trim() ? 'send-btn--active' : ''}`}
            onClick={send}
          >
            <Icon name="Send" size={18} />
          </button>
        </div>
      )}

      {chat.type === 'channel' && (
        <div className="channel-footer">
          <Icon name="Radio" size={14} />
          <span>Это канал — только для чтения</span>
        </div>
      )}
    </div>
  );
}
