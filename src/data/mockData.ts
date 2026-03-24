export type ChatType = 'chat' | 'group' | 'channel' | 'bot';

export interface Message {
  id: string;
  text: string;
  time: string;
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  type: ChatType;
  online?: boolean;
  verified?: boolean;
  messages: Message[];
}

export const chats: Chat[] = [
  {
    id: '1',
    name: 'Алексей Волков',
    avatar: 'АВ',
    lastMessage: 'Окей, увидимся завтра!',
    time: '14:32',
    unread: 2,
    type: 'chat',
    online: true,
    messages: [
      { id: 'm1', text: 'Привет! Как дела?', time: '14:20', isOwn: false },
      { id: 'm2', text: 'Всё отлично, спасибо! А у тебя?', time: '14:21', isOwn: true, status: 'read' },
      { id: 'm3', text: 'Тоже хорошо. Созвонимся сегодня вечером?', time: '14:25', isOwn: false },
      { id: 'm4', text: 'Давай в 19:00, устраивает?', time: '14:28', isOwn: true, status: 'read' },
      { id: 'm5', text: 'Окей, увидимся завтра!', time: '14:32', isOwn: false },
    ]
  },
  {
    id: '2',
    name: 'Дизайн-команда',
    avatar: '🎨',
    lastMessage: 'Макеты готовы, смотрите в Figma',
    time: '13:15',
    unread: 5,
    type: 'group',
    messages: [
      { id: 'm1', text: 'Всем привет! Начинаем спринт', time: '10:00', isOwn: false },
      { id: 'm2', text: 'Готов к работе!', time: '10:05', isOwn: true, status: 'read' },
      { id: 'm3', text: 'Макеты готовы, смотрите в Figma', time: '13:15', isOwn: false },
    ]
  },
  {
    id: '3',
    name: 'TechNews',
    avatar: '📡',
    lastMessage: 'Apple представила новый чип M4 Ultra',
    time: '12:00',
    unread: 12,
    type: 'channel',
    verified: true,
    messages: [
      { id: 'm1', text: 'OpenAI выпустила GPT-5 с новыми возможностями', time: '09:00', isOwn: false },
      { id: 'm2', text: 'Google анонсировала Gemini 2.0 Ultra', time: '10:30', isOwn: false },
      { id: 'm3', text: 'Apple представила новый чип M4 Ultra', time: '12:00', isOwn: false },
    ]
  },
  {
    id: '4',
    name: 'Помощник AI',
    avatar: '🤖',
    lastMessage: 'Чем могу помочь?',
    time: '11:45',
    unread: 0,
    type: 'bot',
    online: true,
    messages: [
      { id: 'm1', text: 'Привет! Я твой личный AI-ассистент. Чем могу помочь?', time: '11:40', isOwn: false },
      { id: 'm2', text: 'Расскажи мне о погоде сегодня', time: '11:42', isOwn: true, status: 'read' },
      { id: 'm3', text: 'Сегодня в Москве облачно, +12°C. Ветер слабый, осадков не ожидается.', time: '11:43', isOwn: false },
      { id: 'm4', text: 'Чем могу помочь?', time: '11:45', isOwn: false },
    ]
  },
  {
    id: '5',
    name: 'Мария Соколова',
    avatar: 'МС',
    lastMessage: 'Отправила документы на почту',
    time: 'Вчера',
    unread: 0,
    type: 'chat',
    messages: [
      { id: 'm1', text: 'Нужны документы для контракта', time: '09:00', isOwn: false },
      { id: 'm2', text: 'Хорошо, пришли реквизиты', time: '09:15', isOwn: true, status: 'read' },
      { id: 'm3', text: 'Отправила документы на почту', time: '09:45', isOwn: false },
    ]
  },
  {
    id: '6',
    name: 'Маркетинг',
    avatar: '📊',
    lastMessage: 'Отчёт за Q1 готов',
    time: 'Вчера',
    unread: 0,
    type: 'group',
    messages: [
      { id: 'm1', text: 'Коллеги, отчёт за Q1 готов', time: '17:00', isOwn: false },
      { id: 'm2', text: 'Отлично! Скину на проверку', time: '17:10', isOwn: true, status: 'read' },
    ]
  },
  {
    id: '7',
    name: 'Design Daily',
    avatar: '✦',
    lastMessage: 'Топ-10 трендов UI в 2025 году',
    time: 'Вчера',
    unread: 3,
    type: 'channel',
    verified: true,
    messages: [
      { id: 'm1', text: 'Топ-10 трендов UI в 2025 году', time: '18:00', isOwn: false },
    ]
  },
  {
    id: '8',
    name: 'Погода-бот',
    avatar: '🌤',
    lastMessage: 'Завтра в Москве +15°C',
    time: 'Пн',
    unread: 0,
    type: 'bot',
    messages: [
      { id: 'm1', text: 'Завтра в Москве +15°C, переменная облачность', time: '20:00', isOwn: false },
    ]
  },
];
