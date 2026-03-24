import { useState } from 'react';
import Sidebar from '@/components/messenger/Sidebar';
import ChatWindow from '@/components/messenger/ChatWindow';
import { chats, Chat } from '@/data/mockData';

export default function Index() {
  const [selected, setSelected] = useState<Chat | null>(null);

  return (
    <div className="messenger-root">
      <Sidebar chats={chats} selectedId={selected?.id ?? null} onSelect={setSelected} />
      <ChatWindow chat={selected} />
    </div>
  );
}
