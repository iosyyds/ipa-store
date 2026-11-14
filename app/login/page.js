'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doLogin, doRegister } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';
import WxScanLogin from '@/components/WxScanLogin';

function LoginInner() {
  const router = useRouter();
  const toast = useToast();
  const redirect = useSearchParams().get('redirect') || '/';

  const [isLogin, setIsLogin] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(true);

  const [loginAccount, setLoginAccount] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const [regName, setRegName] = useState('');
  const [regNick, setRegNick] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPass2, setRegPass2] = useState('');
  const [regBusy, setRegBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const st = await (await import('@/lib/api')).API.settings();
        if (st.register_open === '0') {
          setRegisterOpen(false);
          setIsLogin(true);
        }
      } catch (e) { /* 默认开放 */ }
    })();
  }, []);

  async function onLogin(e) {
    e.preventDefault();
    setLoginBusy(true);
    try {
      await doLogin({ account: loginAccount.trim(), password: loginPass });
      router.push(redirect);
    } catch (err) {
      toast(err.message, 'error');
      setLoginBusy(false);
    }
  }

  async function onRegister(e) {
    e.preventDefault();
    if (!/^[A-Za-z0-9]{3,10}$/.test(regName.trim()))
      return toast('用户名需 3-10 位字母或数字', 'error');
    if (regPass !== regPass2)
      return toast('两次输入的密码不一致', 'error');
    setRegBusy(true);
    try {
      await doRegister({
        username: regName.trim(),
        nickname: regNick.trim(),
        email: regEmail.trim(),
        password: regPass,
      });
      router.push(redirect);
    } catch (err) {
      toast(err.message, 'error');
      setRegBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <img src="/favicon.svg" alt="甜甜-IPA应用库" />
        </div>
        <h1>{isLogin ? '欢迎回来' : '创建账号'}</h1>
        <p>{isLogin ? '登录后下载应用、管理授权码' : '注册即可兑换授权码、下载应用'}</p>

        {registerOpen && (
          <div className="seg">
            <button type="button" className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>登录</button>
            <button type="button" className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>注册</button>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={onLogin}>
            <div className="field">
              <label>账号 / 邮箱</label>
              <input className="input" value={loginAccount} onChange={(e) => setLoginAccount(e.target.value)} autoComplete="username" required />
            </div>
            <div className="field">
              <label>密码</label>
              <input className="input" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} autoComplete="current-password" required />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loginBusy}>
              {loginBusy ? '登录中…' : '登 录'}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister}>
            <div className="field">
              <label>用户名（3-10 位字母或数字）</label>
              <input className="input" value={regName} onChange={(e) => setRegName(e.target.value)} autoComplete="username" pattern="[A-Za-z0-9]{3,10}" required />
            </div>
            <div className="field">
              <label>昵称（选填，不填则用用户名）</label>
              <input className="input" value={regNick} onChange={(e) => setRegNick(e.target.value)} autoComplete="nickname" maxLength={12} />
            </div>
            <div className="field">
              <label>邮箱</label>
              <input className="input" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="field">
              <label>密码（至少 6 位）</label>
              <input className="input" type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} autoComplete="new-password" required />
            </div>
            <div className="field">
              <label>确认密码</label>
              <input className="input" type="password" value={regPass2} onChange={(e) => setRegPass2(e.target.value)} autoComplete="new-password" required />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={regBusy}>
              {regBusy ? '注册中…' : '注 册'}
            </button>
          </form>
        )}

        <WxScanLogin redirect={redirect} />

        {!registerOpen && (
          <div className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 14 }}>
            注册已关闭，如需账号请联系管理员
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="empty">加载中…</div>}>
      <LoginInner />
    </Suspense>
  );
}
