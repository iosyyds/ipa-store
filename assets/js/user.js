if (!isLoggedIn()) location.href = 'login.html?redirect=user.html';

const root = document.getElementById('root');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function licStatus(l) {
  if (l.status === 2) return '<span class="tag tag-red">已禁用</span>';
  if (l.expires_at && new Date(l.expires_at).getTime() < Date.now())
    return '<span class="tag tag-gray">已过期</span>';
  return '<span class="tag tag-green">有效</span>';
}

async function render() {
  let profile, licenses, logs;
  try {
    [profile, licenses, logs] = await Promise.all([
      API.user.profile(), API.user.licenses(), API.user.logs(),
    ]);
  } catch (e) {
    root.innerHTML = `<div class="empty">加载失败：${esc(e.message)}</div>`;
    return;
  }

  root.innerHTML = `
    <div class="profile-grid">
      <!-- 资料 -->
      <div class="card">
        <div class="profile-head">
          <img class="profile-avatar" alt="头像"
            src="${esc(profile.avatar ? API.fileUrl(profile.avatar) : 'assets/default-avatar.svg')}">
          <div class="profile-id">
            <h3 class="profile-name">${esc(profile.nickname || profile.username)}</h3>
            <div class="profile-badges">
              <span class="uid-pill">ID ${esc(profile.uid)}</span>
              <span class="uname">@${esc(profile.username)}</span>
            </div>
          </div>
        </div>
        <div class="profile-rows">
          <div class="profile-row">
            <svg class="pr-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 1.6 7.6 5.4 7.6-5.4H4.4zM4 8.2V17.4h16V8.2l-8 5.7-8-5.7z"/></svg>
            <span class="pr-text">${esc(profile.email || '未绑定邮箱')}</span>
          </div>
          <div class="profile-row">
            <svg class="pr-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zM5 9v10h14V9H5z"/></svg>
            <span class="pr-text">注册于 ${esc(profile.created_at)}</span>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;gap:10px">
          <button class="btn btn-ghost btn-sm" id="logoutBtn" style="flex:1">退出登录</button>
        </div>
      </div>

      <!-- 兑换授权码 -->
      <div class="card">
        <h3 style="font-size:16px;margin-bottom:4px">兑换授权码</h3>
        <p class="muted" style="font-size:12px;margin-bottom:12px">输入卡密后即可下载对应应用</p>
        <div style="display:flex;gap:8px">
          <input class="input" id="redeemInput" placeholder="请输入授权码" style="flex:1">
          <button class="btn btn-primary" id="redeemBtn">兑换</button>
        </div>
      </div>

      <!-- 修改密码 -->
      <div class="card">
        <h3 style="font-size:16px;margin-bottom:12px">修改密码</h3>
        <div class="field"><label>原密码</label><input class="input" id="oldP" type="password"></div>
        <div class="field"><label>新密码（至少 6 位）</label><input class="input" id="newP" type="password"></div>
        <button class="btn btn-primary btn-sm" id="passBtn">保存新密码</button>
      </div>

      <!-- 我的授权码 -->
      <div class="card" style="padding:0">
        <div style="padding:16px 18px"><h3 style="font-size:16px">我的授权码（${licenses.length}）</h3></div>
        <div class="table-wrap"><table class="resp-table">
          <thead><tr><th>授权码</th><th>状态</th><th>适用</th><th>到期</th></tr></thead>
          <tbody>
            ${licenses.length ? licenses.map((l) => `
              <tr><td class="lic-code" data-label="授权码">${esc(l.code)}</td>
              <td data-label="状态">${licStatus(l)}</td>
              <td data-label="适用">${Number(l.scope) === 1 ? esc(l.app_name || '指定应用') : '通用'}</td>
              <td class="muted" data-label="到期">${esc(l.expires_at || '永久')}</td></tr>`).join('')
              : '<tr><td colspan="4"><div class="empty">暂无授权码</div></td></tr>'}
          </tbody>
        </table></div>
      </div>
    </div>

    <!-- 下载记录 -->
    <div class="card" style="padding:0;margin-top:16px">
      <div style="padding:16px 18px"><h3 style="font-size:16px">我的下载记录（${logs.length}）</h3></div>
      <div class="table-wrap"><table class="resp-table">
        <thead><tr><th>时间</th><th>应用</th><th>方式</th><th>IP</th></tr></thead>
        <tbody>
          ${logs.length ? logs.map((l) => `
            <tr><td class="muted" data-label="时间">${esc(l.created_at)}</td>
            <td data-label="应用">${esc(l.app_name || '—')}</td>
            <td data-label="方式">${l.license_id ? '<span class="tag tag-orange">授权</span>' : '<span class="tag tag-green">免费</span>'}</td>
            <td class="muted" data-label="IP">${esc(l.ip)}</td></tr>`).join('')
            : '<tr><td colspan="4"><div class="empty">暂无下载记录</div></td></tr>'}
        </tbody>
      </table></div>
    </div>`;

  document.getElementById('logoutBtn').addEventListener('click', userLogout);

  // 兑换
  const redeem = async () => {
    const input = document.getElementById('redeemInput');
    const code = input.value.trim();
    if (!code) return toast('请输入授权码', 'error');
    try {
      await API.user.redeem({ code });
      toast('兑换成功', 'success');
      render();
    } catch (e) { toast(e.message, 'error'); }
  };
  document.getElementById('redeemBtn').addEventListener('click', redeem);
  document.getElementById('redeemInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') redeem();
  });

  // 改密
  document.getElementById('passBtn').addEventListener('click', async () => {
    try {
      await API.user.password({
        old_password: document.getElementById('oldP').value,
        new_password: document.getElementById('newP').value,
      });
      toast('密码修改成功', 'success');
      document.getElementById('oldP').value = '';
      document.getElementById('newP').value = '';
    } catch (e) { toast(e.message, 'error'); }
  });
}

render();
