import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/api/client';

interface AuthScreenProps {
  onAuth: (user: { id: number; username: string; display_name: string }, token: string) => void;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  let d = digits;
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);

  let result = '+7';
  if (d.length > 1) result += ' (' + d.slice(1, 4);
  if (d.length >= 4) result += ') ' + d.slice(4, 7);
  if (d.length >= 7) result += '-' + d.slice(7, 9);
  if (d.length >= 9) result += '-' + d.slice(9, 11);
  return result;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'register') {
        result = await api.register(phone, displayName, password);
      } else {
        result = await api.login(phone, password);
      }
      localStorage.setItem('pulse_token', result.token);
      localStorage.setItem('pulse_user', JSON.stringify(result.user));
      onAuth(result.user, result.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-dot" />
          Pulse
        </div>
        <p className="auth-sub">
          {mode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте аккаунт'}
        </p>

        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Номер телефона</label>
            <div className="auth-input-wrap">
              <Icon name="Phone" size={16} className="auth-input-icon" />
              <input
                className="auth-input"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={handlePhoneChange}
                autoComplete="tel"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label className="auth-label">Имя</label>
              <div className="auth-input-wrap">
                <Icon name="User" size={16} className="auth-input-icon" />
                <input
                  className="auth-input"
                  placeholder="Ваше имя"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Пароль</label>
            <div className="auth-input-wrap">
              <Icon name="Lock" size={16} className="auth-input-icon" />
              <input
                className="auth-input"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <Icon name="Loader" size={18} className="auth-spinner" />
            ) : (
              mode === 'login' ? 'Войти' : 'Зарегистрироваться'
            )}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Нет аккаунта?{' '}
              <button className="auth-link" onClick={() => { setMode('register'); setError(''); }}>
                Зарегистрироваться
              </button>
            </>
          ) : (
            <>Уже есть аккаунт?{' '}
              <button className="auth-link" onClick={() => { setMode('login'); setError(''); }}>
                Войти
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
