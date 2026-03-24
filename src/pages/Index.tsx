import { useState, useEffect } from 'react';
import AuthScreen from '@/components/messenger/AuthScreen';
import RealSidebar from '@/components/messenger/RealSidebar';
import RealChatWindow from '@/components/messenger/RealChatWindow';
import { api, ApiChat } from '@/api/client';

interface User {
  id: number;
  username: string;
  display_name: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ApiChat | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('pulse_user');
    const savedToken = localStorage.getItem('pulse_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      api.me().then(data => {
        setUser(data.user);
      }).catch(() => {
        localStorage.removeItem('pulse_token');
        localStorage.removeItem('pulse_user');
        setUser(null);
      }).finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleAuth = (authUser: User, token: string) => {
    localStorage.setItem('pulse_token', token);
    localStorage.setItem('pulse_user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setSelectedChat(null);
  };

  if (checking) {
    return (
      <div className="auth-screen">
        <div style={{ color: 'var(--p-text-secondary)', fontSize: 14 }}>Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <div className="messenger-root">
      <RealSidebar
        user={user}
        selectedId={selectedChat?.id ?? null}
        onSelect={setSelectedChat}
        onLogout={handleLogout}
        refreshKey={refreshKey}
      />
      <RealChatWindow
        chat={selectedChat}
        userId={user.id}
        onMessageSent={() => setRefreshKey(k => k + 1)}
      />
    </div>
  );
}
