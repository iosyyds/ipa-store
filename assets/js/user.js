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
          <img class="profile-avatar" style="object-fit:cover" alt="头像"
            src="${esc(profile.avatar ? API.fileUrl(profile.avatar) : 'assets/default-avatar.svg')}">
          <div style="flex:1;min-width:0">
            <h3 style="font-size:18px">${esc(profile.nickname || profile.username)}</h3>
            <div class="muted" style="font-size:13px">UID ${esc(profile.uid)} · ${esc(profile.username)}</div>
            <div class="muted" style="font-size:13px">${esc(profile.email)}</div>
            <div class="muted" style="font-size:12px;margin-top:2px">注册于 ${esc(profile.created_at)}</div>
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
        <div class="table-wrap"><table>
          <thead><tr><th>授权码</th><th>状态</th><th>适用</th><th>到期</th></tr></thead>
          <tbody>
            ${licenses.length ? licenses.map((l) => `
              <tr><td class="lic-code">${esc(l.code)}</td>
              <td>${licStatus(l)}</td>
              <td>${l.scope === 1 ? esc(l.app_name || '指定应用') : '通用'}</td>
              <td class="muted">${esc(l.expires_at || '永久')}</td></tr>`).join('')
              : '<tr><td colspan="4"><div class="empty">暂无授权码</div></td></tr>'}
          </tbody>
        </table></div>
      </div>
    </div>

    <!-- 下载记录 -->
    <div class="card" style="padding:0;margin-top:16px">
      <div style="padding:16px 18px"><h3 style="font-size:16px">我的下载记录（${logs.length}）</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>时间</th><th>应用</th><th>方式</th><th>IP</th></tr></thead>
        <tbody>
          ${logs.length ? logs.map((l) => `
            <tr><td class="muted">${esc(l.created_at)}</td>
            <td>${esc(l.app_name || '—')}</td>
            <td>${l.license_id ? '<span class="tag tag-orange">授权</span>' : '<span class="tag tag-green">免费</span>'}</td>
            <td class="muted">${esc(l.ip)}</td></tr>`).join('')
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
