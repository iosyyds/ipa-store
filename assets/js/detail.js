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

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function updateSeo(app) {
  const pageTitle = `${app.name} ${app.version} 下载 - 甜甜-IPA应用库`;
  const desc = app.short_desc || `下载 ${app.name} ${app.version}，适用于 iPhone、iPad，企业签名一键安装。`;
  document.title = pageTitle;
  setMeta('description', desc);
  setMeta('keywords', `${app.name}下载,${app.name} IPA,iOS ${app.name},${app.bundle_id}`);
  setMeta('og:title', pageTitle, 'property');
  setMeta('og:description', desc, 'property');
  const canonical = `${location.origin}${location.pathname}?id=${app.id}`;
  let link = document.querySelector('link[rel="canonical"]');
  if (link) link.setAttribute('href', canonical);
  // MobileApplication 结构化数据
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: app.name,
    softwareVersion: app.version,
    operatingSystem: 'iOS',
    applicationCategory: app.category_name || 'Application',
    description: desc,
    downloadUrl: `${location.origin}${location.pathname}?id=${app.id}`,
    inLanguage: 'zh-CN',
  });
  document.head.appendChild(ld);
}

async function render() {
  if (!id) {
    root.innerHTML = '<div class="empty">缺少应用参数</div>';
    return;
  }
  let app;
  try {
    app = await API.app(id);
  } catch (e) {
    root.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
    return;
  }

  updateSeo(app);
  const icon = app.icon
    ? `<img class="app-icon" src="${esc(API.fileUrl(app.icon))}" alt="${esc(app.name)} 图标">`
    : '<div class="app-icon ph">App</div>';

  root.innerHTML = `
    <div class="container">
      <header class="detail-head">
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
        <div class="info-cell"><div class="v" style="font-size:11px">${esc(app.updated_at || '—')}</div><div class="l">更新时间</div></div>
      </div>

      ${app.screenshots && app.screenshots.length ? `
        <div class="section-head"><h2 style="font-size:16px">预览</h2></div>
        <div class="shots">
          ${app.screenshots.map((u) => `<img src="${esc(API.fileUrl(u))}" alt="${esc(app.name)} 截图" loading="lazy">`).join('')}
        </div>` : ''}

      ${app.whatsnew ? `
        <div class="text-block" style="margin-top:16px">
          <h3>更新内容（${esc(app.version)}）</h3>
          <p>${esc(app.whatsnew)}</p>
        </div>` : ''}

      ${app.description ? `
        <div class="text-block">
          <h3>应用介绍</h3>
          <p>${esc(app.description)}</p>
        </div>` : ''}

      <div id="related" class="related-wrap">
        <div class="section-head"><h2 style="font-size:16px">相关应用</h2></div>
        <div class="related-loading muted">加载中…</div>
      </div>
    </div>`;

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

  loadRelated(app);
}

// 相关应用：同分类优先，不足则用最新应用补齐，排除当前应用
async function loadRelated(app) {
  const box = document.getElementById('related');
  if (!box) return;
  try {
    const data = await API.apps({
      category_id: app.category_id || '',
      page: 1,
      page_size: 10,
    });
    let list = (data.list || []).filter((x) => Number(x.id) !== Number(app.id));
    // 同分类不足时，再取一批最新应用补齐
    if (list.length < 5) {
      const more = await API.apps({ page: 1, page_size: 10 });
      const exist = new Set(list.map((x) => Number(x.id)).concat([Number(app.id)]));
      for (const x of more.list || []) {
        if (list.length >= 6) break;
        if (!exist.has(Number(x.id))) { list.push(x); exist.add(Number(x.id)); }
      }
    }
    list = list.slice(0, 6);
    if (!list.length) { box.remove(); return; }
    box.querySelector('.related-loading').outerHTML = `
      <div class="related-scroll">
        ${list.map((r) => `
          <a class="related-card" href="app.html?id=${r.id}">
            ${r.icon
              ? `<img class="related-icon" src="${esc(API.fileUrl(r.icon))}" alt="${esc(r.name)} 图标" loading="lazy">`
              : '<div class="related-icon ph">App</div>'}
            <div class="related-name">${esc(r.name)}</div>
            <div class="related-sub muted">${esc(r.category_name || formatSize(r.size))}</div>
          </a>`).join('')}
      </div>`;
  } catch (e) {
    box.remove();
  }
}

document.getElementById('backFab').addEventListener('click', () => {
  // 有上一页则返回，否则回首页
  if (document.referrer && history.length > 1) history.back();
  else location.href = 'index.html';
});

render();
