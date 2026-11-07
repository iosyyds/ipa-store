/* 公共下载/安装交互，首页与详情页共用（需登录） */
function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

if (typeof toast !== 'function') {
  window.toast = function (msg, type) {
    const el = document.createElement('div');
    el.className = `toast ${type || ''}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  };
}

/* 入口：点击获取按钮 */
async function startDownload(app) {
  if (!isLoggedIn()) {
    const back = location.pathname.split('/').pop() + location.search;
    location.href = `login.html?redirect=${encodeURIComponent(back || 'index.html')}`;
    return;
  }
  try {
    const data = await API.user.appToken(app.id);
    handleToken(data);
  } catch (e) {
    toast(e.message, 'error');
  }
}

/* 拿到令牌后的处理 */
function handleToken(data) {
  if (isWeChat()) {
    return toast('请点击右上角「···」选择在 Safari 中打开后再安装', 'error');
  }
  if (isIOS()) {
    const mask = document.createElement('div');
    mask.className = 'mask';
    mask.innerHTML = `
      <div class="sheet" onclick="event.stopPropagation()">
        <div class="sheet-head"><h3>选择方式</h3><p>建议使用「直接安装」</p></div>
        <div class="sheet-foot" style="flex-direction:column">
          <button class="primary" style="border:none;border-bottom:1px solid var(--line)" id="actInstall">直接安装（企业签名）</button>
          <button class="primary" style="border:none" id="actFile">下载 IPA 文件</button>
          <button style="border:none;border-top:1px solid var(--line);color:var(--text-2)" id="actCancel">取消</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const close = () => mask.remove();
    mask.addEventListener('click', close);
    mask.querySelector('#actCancel').addEventListener('click', close);
    mask.querySelector('#actInstall').addEventListener('click', () => {
      close();
      window.location.href = `itms-services://?action=download-manifest&url=${encodeURIComponent(data.manifest_url)}`;
    });
    mask.querySelector('#actFile').addEventListener('click', () => {
      close();
      window.location.href = data.download_url;
    });
  } else {
    window.location.href = data.download_url;
  }
}
