// Sign-in, and the forced password change after signing in with the shared initial password.
// Both sit on the BIMLab navy blueprint background: a showcase of the app on the left, the form on the right.
import { type FormEvent, type ReactNode, useState } from 'react';
import { BrandMark } from '@/app/BrandMark';
import { changePassword, login, logout } from '@/data/session';
import type { Person } from '@/domain/ticket';
import { Mascot } from '@/shared/mascot/Mascot';
import { Icon, type IconName } from '@/shared/ui/Icon';
import '@/app/auth.css';

const MIN_PASSWORD_LENGTH = 10;

const FEATURES: Array<{ icon: IconName; title: string }> = [
  { icon: 'bug', title: 'Báo lỗi và theo dõi việc' },
  { icon: 'chat', title: 'Kênh chung của team' },
  { icon: 'link', title: 'Bảng link hay' },
];

/** Floor slabs of the BIMLab mark, drawn large and faint in the background corner. */
function BlueprintFloors() {
  const slab = (y: number) => `M20 ${y}L120 ${y - 50}L220 ${y}L120 ${y + 50}Z`;
  return (
    <svg className="auth-floors" viewBox="0 0 240 260" aria-hidden="true">
      {[200, 140, 80].map((y) => (
        <g key={y}>
          <path d={slab(y)} />
          <path d={`M20 ${y}v14L120 ${y + 64}L220 ${y + 14}v-14`} />
        </g>
      ))}
      <path d="M40 200V94M200 200V94M120 250V144" strokeDasharray="3 5" />
    </svg>
  );
}

function Showcase() {
  return (
    <aside className="auth-showcase" aria-label="Giới thiệu BIMLab Ticket">
      <h2>Một chỗ cho lỗi, việc và link hay của cả team.</h2>
      <ul className="auth-features">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span className="auth-feature-icon"><Icon name={f.icon} size={20} /></span>
            <b>{f.title}</b>
          </li>
        ))}
      </ul>
      <div className="auth-scene" aria-hidden="true">
        <div className="auth-sticky s1"><b>Spring Boot Reference</b><i>Actuator health cho Docker</i></div>
        <div className="auth-sticky s2"><b>Prompt review code</b><i>Dùng trước khi tạo PR</i></div>
        <div className="auth-sticky s3"><b>vitejs/vite</b><i>Proxy /api lúc dev</i></div>
        <Mascot mood="wave" size={118} label="" className="auth-bim" />
      </div>
    </aside>
  );
}

function AuthLayout({ title, lead, error, children }: { title: string; lead?: ReactNode; error: string | null; children: ReactNode }) {
  return (
    <main className="auth-screen">
      <BlueprintFloors />
      <div className="auth-shell">
        <Showcase />
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-brand">
            <BrandMark />
            <img src="/bimlab-logo.png" alt="BIMLab" width={94} height={30} decoding="async" />
            <span>Ticket team IT</span>
          </div>
          <h1 id="auth-title">{title}</h1>
          {lead && <p className="auth-lead">{lead}</p>}
          {error && (
            <p className="auth-error" role="alert">
              <Icon name="alert" size={18} />
              {error}
            </p>
          )}
          {children}
        </section>
      </div>
    </main>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, autoFocus, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; autoFocus?: boolean; hint?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password">
        <input id={id} className="input" type={shown ? 'text' : 'password'} autoComplete={autoComplete} required autoFocus={autoFocus}
          value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} />
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={shown}>
          <Icon name={shown ? 'eyeOff' : 'eye'} size={19} />
        </button>
      </div>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Không thực hiện được, thử lại sau');

export function LoginScreen({ notice }: { notice?: string }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(notice ?? null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Đăng nhập" error={error}>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="login-username">Tên đăng nhập</label>
          <input id="login-username" className="input" autoComplete="username" autoCapitalize="none" spellCheck={false} required
            value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <PasswordField id="login-password" label="Mật khẩu" value={password} onChange={setPassword} autoComplete="current-password" />
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy || !username.trim() || !password}>
          <Icon name="lock" size={18} /> {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </AuthLayout>
  );
}

export function ChangePasswordScreen({ user }: { user: Person }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next.length < MIN_PASSWORD_LENGTH) return setError(`Mật khẩu mới cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
    if (next !== confirm) return setError('Hai lần nhập mật khẩu mới không khớp');
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Đặt mật khẩu riêng" lead={`Chào ${user.name}, hãy đặt mật khẩu riêng để tiếp tục.`} error={error}>
      <form onSubmit={submit} noValidate>
        <input type="text" autoComplete="username" value={user.id} readOnly hidden />
        <PasswordField id="pw-current" label="Mật khẩu tạm" value={current} onChange={setCurrent} autoComplete="current-password" autoFocus />
        <PasswordField id="pw-new" label="Mật khẩu mới" value={next} onChange={setNext} autoComplete="new-password"
          hint={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự, khác mật khẩu tạm.`} />
        <PasswordField id="pw-confirm" label="Nhập lại mật khẩu mới" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy || !current || !next || !confirm}>
          {busy ? 'Đang lưu…' : 'Lưu mật khẩu'}
        </button>
      </form>
      <p className="auth-foot">
        Không phải bạn?{' '}
        <button type="button" onClick={() => void logout()}>
          Đăng xuất
        </button>
      </p>
    </AuthLayout>
  );
}
