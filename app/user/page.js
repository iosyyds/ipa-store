'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { isLoggedIn, userLogout, clearSession } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';

function LicStatusTag({ l }) {
  if (Number(l.status) === 2) return <span className="tag tag-red">已禁用</span>;
  if (l.expires_at && new Date(l.expires_at).getTime() < Date.now())
    return <span className="tag tag-gray">已过期</span>;
  return <span className="tag tag-green">有效</span>;
}

export default function UserPage() {
  const router = useRouter();
  const toast = useToast();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logLimit, setLogLimit] = useState(10); // 下载记录每页 10 条，前端分页

  const [redeemCode, setRedeemCode] = useState('');
  const [oldP, setOldP] = useState('');
  const [newP, setNewP] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login?redirect=' + encodeURIComponent('/user'));
      return;
    }
    setReady(true);
    (async () => {
      try {
        const [p, lic, lg] = await Promise.all([
          API.user.profile(),
          API.user.licenses(),
          API.user.logs(),
        ]);
        setProfile(p);
        setLicenses(lic);
        setLogs(lg);
      } catch (e) {
        // 登录态失效（401）：清掉过期令牌并回到登录页，避免停留在无入口的错误页
        if (e.status === 401 || e.code === 401) {
          clearSession();
          router.replace('/login?redirect=' + encodeURIComponent('/user'));
          return;
        }
        setError(e.message);
      }
    })();
  }, [router]);

  async function onRedeem() {
    const code = redeemCode.trim();
    if (!code) return toast('请输入授权码', 'error');
    try {
      await API.user.redeem(code);
      toast('兑换成功', 'success');
      setRedeemCode('');
      setLicenses(await API.user.licenses());
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  async function onPassword() {
    try {
      await API.user.password({ old_password: oldP, new_password: newP });
      toast('密码修改成功', 'success');
      setOldP('');
      setNewP('');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function onLogout() {
    userLogout();
    router.push('/');
  }

  if (!ready) return <div className="empty">加载中…</div>;
  if (error) return (
    <div className="empty">
      <div>加载失败：{error}</div>
      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={() => {
          clearSession();
          router.replace('/login?redirect=' + encodeURIComponent('/user'));
        }}
      >
        去登录
      </button>
    </div>
  );
  if (!profile) return <div className="empty">加载中…</div>;

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <div className="profile-grid">
        <div className="card">
          <div className="profile-head">
            <img
              className="profile-avatar"
              alt="头像"
              src={profile.avatar ? API.fileUrl(profile.avatar) : '/default-avatar.svg'}
            />
            <div className="profile-id">
              <h3 className="profile-name">{profile.nickname || profile.username}</h3>
              <div className="profile-badges">
                <span className="uid-pill">ID {profile.uid}</span>
                <span className="uname">@{profile.username}</span>
              </div>
            </div>
          </div>
          <div className="profile-rows">
            <div className="profile-row">
              <svg className="pr-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 1.6 7.6 5.4 7.6-5.4H4.4zM4 8.2V17.4h16V8.2l-8 5.7-8-5.7z" /></svg>
              <span className="pr-text">{profile.email || '未绑定邮箱'}</span>
            </div>
            <div className="profile-row">
              <svg className="pr-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zM5 9v10h14V9H5z" /></svg>
              <span className="pr-text">注册于 {profile.created_at}</span>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onLogout}>退出登录</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>兑换授权码</h3>
          <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>输入卡密后即可下载对应应用</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onRedeem()}
              placeholder="请输入授权码"
            />
            <button className="btn btn-primary" onClick={onRedeem}>兑换</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>修改密码</h3>
          <div className="field">
            <label>原密码</label>
            <input className="input" type="password" value={oldP} onChange={(e) => setOldP(e.target.value)} />
          </div>
          <div className="field">
            <label>新密码（至少 6 位）</label>
            <input className="input" type="password" value={newP} onChange={(e) => setNewP(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={onPassword}>保存新密码</button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 18px' }}>
            <h3 style={{ fontSize: 16 }}>我的授权码（{licenses.length}）</h3>
          </div>
          <div className="table-wrap">
            <table className="resp-table">
              <thead>
                <tr><th>授权码</th><th>状态</th><th>适用</th><th>到期</th></tr>
              </thead>
              <tbody>
                {licenses.length ? licenses.map((l, i) => (
                  <tr key={i}>
                    <td className="lic-code" data-label="授权码">{l.code}</td>
                    <td data-label="状态"><LicStatusTag l={l} /></td>
                    <td data-label="适用">{Number(l.scope) === 1 ? (l.app_name || '指定应用') : '通用'}</td>
                    <td className="muted" data-label="到期">{l.expires_at || '永久'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4}><div className="empty">暂无授权码</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, marginTop: 16 }}>
        <div style={{ padding: '16px 18px' }}>
          <h3 style={{ fontSize: 16 }}>我的下载记录（{logs.length}）</h3>
        </div>
        <div className="table-wrap">
          <table className="resp-table">
            <thead>
              <tr><th>时间</th><th>应用</th><th>方式</th><th>IP</th></tr>
            </thead>
            <tbody>
              {logs.length ? logs.slice(0, logLimit).map((l, i) => (
                <tr key={i}>
                  <td className="muted" data-label="时间">{l.created_at}</td>
                  <td data-label="应用">{l.app_name || '—'}</td>
                  <td data-label="方式">
                    {l.license_id
                      ? <span className="tag tag-orange">授权</span>
                      : <span className="tag tag-green">免费</span>}
                  </td>
                  <td className="muted" data-label="IP">{l.ip}</td>
                </tr>
              )) : (
                <tr><td colSpan={4}><div className="empty">暂无下载记录</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {logs.length > logLimit && (
          <div className="table-more">
            <button className="more-btn" onClick={() => setLogLimit((v) => v + 10)}>
              加载更多（剩余 {logs.length - logLimit} 条）
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
