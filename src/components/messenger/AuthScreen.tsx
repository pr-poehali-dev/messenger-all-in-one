import { useState, useRef } from 'react';
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

type Step = 'phone' | 'code';

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    setError('');
    setLoading(true);
    try {
      await api.sendCode(phone, mode);
      setStep('code');
      setCode(['', '', '', '', '', '']);
      startCountdown();
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendCode();
  };

  const handleCodeChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) {
      codeRefs.current[idx + 1]?.focus();
    }
    if (next.every(d => d !== '') && next.join('').length === 6) {
      submitCode(next.join(''));
    }
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const submitCode = async (codeStr: string) => {
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'register') {
        result = await api.register(phone, displayName, codeStr);
      } else {
        result = await api.login(phone, codeStr);
      }
      localStorage.setItem('pulse_token', result.token);
      localStorage.setItem('pulse_user', JSON.stringify(result.user));
      onAuth(result.user, result.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      setCode(['', '', '', '', '', '']);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCode(code.join(''));
  };

  const resetToPhone = () => {
    setStep('phone');
    setCode(['', '', '', '', '', '']);
    setError('');
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setStep('phone');
    setCode(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-dot" />
          Pulse
        </div>

        {step === 'phone' ? (
          <>
            <p className="auth-sub">
              {mode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте аккаунт'}
            </p>
            <form onSubmit={handlePhoneSubmit} className="auth-form">
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

              {error && (
                <div className="auth-error">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading
                  ? <Icon name="Loader" size={18} className="auth-spinner" />
                  : 'Получить код'}
              </button>
            </form>

            <div className="auth-switch">
              {mode === 'login' ? (
                <>Нет аккаунта?{' '}
                  <button className="auth-link" onClick={() => switchMode('register')}>
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>Уже есть аккаунт?{' '}
                  <button className="auth-link" onClick={() => switchMode('login')}>
                    Войти
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="auth-sub">
              Введите код из SMS, отправленного на<br />
              <strong>{phone}</strong>
            </p>
            <form onSubmit={handleCodeSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Код из SMS</label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {code.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => { codeRefs.current[idx] = el; }}
                      className="auth-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(idx, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(idx, e)}
                      style={{ width: '44px', textAlign: 'center', fontSize: '20px', fontWeight: 600, padding: '8px 4px' }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="auth-error">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </div>
              )}

              <button type="submit" className="auth-btn" disabled={loading || code.join('').length < 6}>
                {loading
                  ? <Icon name="Loader" size={18} className="auth-spinner" />
                  : 'Подтвердить'}
              </button>
            </form>

            <div className="auth-switch">
              {countdown > 0 ? (
                <span>Повторная отправка через {countdown} сек.</span>
              ) : (
                <button className="auth-link" onClick={sendCode} disabled={loading}>
                  Отправить код повторно
                </button>
              )}
            </div>
            <div className="auth-switch" style={{ marginTop: '4px' }}>
              <button className="auth-link" onClick={resetToPhone}>
                Изменить номер
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
