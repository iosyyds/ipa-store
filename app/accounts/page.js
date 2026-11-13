'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { isLoggedIn, clearSession } from '@/lib/auth';

const SITES = [
  {
    url: 'https://shareid.tools12345.com/',
    name: 'Shadowrocket 共享账号',
    desc: '小火箭 / 苹果共享账号',
  },
  {
    url: 'https://id.tangping.icu/',
    name: '小火箭 ID 共享',
    desc: '美区 / 香港区 / 台湾区 Apple ID',
  },
  {
    url: 'https://ios.wwkejishe.top/',
    name: '小火箭共享账号网站',
    desc: '美区已购小火箭，每日更新',
  },
  {
    url: 'https://52id.org/',
    name: '52ID 苹果共享 ID',
    desc: '美 / 日 / 港 / 台 / 国区，每日更新',
  },
  {
    url: 'https://ids.ailiao.eu/',
    name: '爱辽共享小火箭',
    desc: '免费小火箭账号与美区 Apple ID，实时更新',
  },
];

// 任意一张有效授权即可：状态正常且未过期
function isValidLicense(l) {
  if (Number(l.status) !== 1) return false;
  if (l.expires_at && new Date(l.expires_at).getTime() < Date.now()) return false;
  return true;
}

export default function AccountsPage() {
  const router = useRouter();
  // loading：校验中；locked：已登录但无有效授权；ready：已授权可看
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login?redirect=' + encodeURIComponent('/accounts'));
      return;
    }
    let alive = true;
    (async () => {
      try {
        const lic = await API.user.licenses();
        if (!alive) return;
        const ok = Array.isArray(lic) && lic.some(isValidLicense);
        setPhase(ok ? 'ready' : 'locked');
      } catch (e) {
        if (!alive) return;
        // 登录态失效：清掉过期令牌并回到登录页
        if (e.status === 401 || e.code === 401) {
          clearSession();
          router.replace('/login?redirect=' + encodeURIComponent('/accounts'));
          return;
        }
        setPhase('locked');
      }
    })();
    return () => { alive = false; };
  }, [router]);

  if (phase === 'loading') return <div className="empty">加载中…</div>;

  if (phase === 'locked') {
    return (
      <div className="accounts-wrap">
        <div className="account-lock">
          <span className="account-lock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
              <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
              <circle cx="12" cy="15.5" r="1.4" />
              <path d="M12 16.9v1.6" />
            </svg>
          </span>
          <h2 className="account-lock-title">该内容需要授权</h2>
          <p className="account-lock-desc">
            你还没有有效授权码，兑换后即可查看小火箭共享账号。
          </p>
          <div className="account-lock-actions">
            <button
              className="btn btn-primary"
              onClick={() => router.push('/user?redirect=' + encodeURIComponent('/accounts'))}
            >
              去兑换授权码
            </button>
            <button className="btn btn-ghost" onClick={() => router.push('/')}>
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="accounts-wrap">
      <h1 className="accounts-title">小火箭共享账号</h1>
      <p className="accounts-sub">精选可用的小火箭 / 外区 Apple ID 共享站</p>

      <div className="account-warn">
        <span className="account-warn-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </span>
        <div className="account-warn-text">
          网站中任何广告请勿相信、购买、下单！
        </div>
      </div>

      <div className="account-list">
        {SITES.map((s) => (
          <a
            key={s.url}
            className="account-row"
            href={s.url}
            target="_blank"
            rel="noopener nofollow"
          >
            <span className="account-row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3a14 14 0 0 1 0 18" />
                <path d="M12 3a14 14 0 0 0 0 18" />
              </svg>
            </span>
            <span className="account-row-body">
              <span className="account-row-name">{s.name}</span>
              <span className="account-row-desc">{s.desc}</span>
            </span>
            <span className="account-row-chevron">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
