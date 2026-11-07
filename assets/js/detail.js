const id = new URLSearchParams(location.search).get('id');
const root = document.getElementById('detailRoot');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatSize(bytes) {
  if (!bytes) return '—';
  const mb = bytes / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

async function render() {
  if (!id) {
    root.innerHTML = '<div class="container" style="padding-top:90px"><div class="empty">缺少应用参数</div></div>';
    return;
  }
  let app;
  try {
    app = await API.app(id);
  } catch (e) {
    root.innerHTML = `<div class="container" style="padding-top:90px"><div class="empty">${esc(e.message)}</div></div>`;
    return;
  }

  document.title = `${app.name} · 下载`;
  const icon = app.icon
    ? `<img class="app-icon" src="${esc(API.fileUrl(app.icon))}" alt="">`
    : '<div class="app-icon ph">App</div>';

  root.innerHTML = `
    <div class="container">
      <header class="detail-head" style="padding-top:calc(var(--nav-h) + 18px)">
        <div class="detail-title">
          ${icon}
          <div>
            <h1>${esc(app.name)}</h1>
            <div class="dev">${esc(app.category_name || 'iOS 应用')}</div>
            <div class="bundle">${esc(app.bundle_id || '')}</div>
          </div>
        </div>
      </header>

      <div class="info-bar">
        <div class="info-cell"><div class="v">${esc(app.version)}</div><div class="l">版本</div></div>
        <div class="info-cell"><div class="v">${formatSize(app.size)}</div><div class="l">大小</div></div>
        <div class="info-cell"><div class="v">${app.downloads}</div><div class="l">下载量</div></div>
        <div class="info-cell"><div class="v" style="font-size:12px">${esc(app.updated_at || '—')}</div><div class="l">更新时间</div></div>
      </div>

      ${app.screenshots && app.screenshots.length ? `
        <div class="section-head"><h2 style="font-size:18px">预览</h2></div>
        <div class="shots" style="padding:0 0 8px">
          ${app.screenshots.map((u) => `<img src="${esc(API.fileUrl(u))}" alt="截图">`).join('')}
        </div>` : ''}

      ${app.whatsnew ? `
        <div class="text-block" style="margin-top:18px">
          <h3>更新内容（${esc(app.version)}）</h3>
          <p>${esc(app.whatsnew)}</p>
        </div>` : ''}

      ${app.description ? `
        <div class="text-block">
          <h3>应用介绍</h3>
          <p>${esc(app.description)}</p>
        </div>` : ''}
    </div>`;

  // 底部下载栏
  const dock = document.getElementById('dock');
  dock.hidden = false;
  document.getElementById('dockSpace').hidden = false;
  document.getElementById('dockName').textContent = app.name;
  document.getElementById('dockMeta').textContent =
    `${app.category_name || ''} · ${formatSize(app.size)}`;
  const dockBtn = document.getElementById('dockBtn');
  dockBtn.textContent = app.require_license ? '授权获取' : '获取';
  dockBtn.classList.toggle('lock', !!app.require_license);
  dockBtn.addEventListener('click', () => startDownload(app));
}

render();
