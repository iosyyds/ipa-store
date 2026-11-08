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
  const heroIcon = app.icon
    ? `<img src="${esc(API.fileUrl(app.icon))}" alt="${esc(app.name)} 图标">`
    : '<span>App</span>';

  root.innerHTML = `
    <div class="detail-hero grad-0">
      <button type="button" class="hero-share" id="heroShare" aria-label="分享">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7h14v-7"/></svg>
      </button>
      <div class="hero-main">
        <div class="hero-icon">${heroIcon}</div>
        <div class="hero-info">
          <h1>${esc(app.name)}</h1>
          <div class="hero-sub">${esc(app.short_desc || app.category_name || 'iOS 应用')}</div>
          <div class="hero-bundle">${esc(app.bundle_id || '')}</div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="detail-metrics">
        <div class="metric"><div class="m-v">${formatSize(app.size)}</div><div class="m-l">大小</div></div>
        <div class="metric"><div class="m-v">${Number(app.downloads || 0)}</div><div class="m-l">下载量</div></div>
        <div class="metric"><div class="m-v">${esc(app.version)}</div><div class="m-l">版本</div></div>
        <div class="metric"><div class="m-v m-date">${esc((app.updated_at || '—').split(' ')[0])}</div><div class="m-l">更新时间</div></div>
      </div>

      ${app.screenshots && app.screenshots.length ? `
        <div class="section-head"><h2 style="font-size:18px">预览</h2></div>
        <div class="shots">
          ${app.screenshots.map((u) => `<img src="${esc(API.fileUrl(u))}" alt="${esc(app.name)} 截图" loading="lazy">`).join('')}
        </div>` : ''}

      <div class="compat">
        <svg viewBox="0 0 1024 1024" fill="currentColor"><path d="M664.9 959.8c35.8 0 65.5-29.3 65.5-65.3v-765c0-35.8-29.3-65.3-65.3-65.3H358.9c-36 0-65.3 29.3-65.3 65.3v765.1c0 36 29.7 65.3 65.5 65.3h305.8zM568.8 92.6c4.6 0 8.3 3.7 8.3 8.3 0 4.6-3.7 8.3-8.3 8.3-4.6 0-8.3-3.7-8.3-8.3 0-4.6 3.7-8.3 8.3-8.3z m-94.4 8c0-0.9 0.2-3.9 4.2-3.9h59.9c3.9 0 4.2 3.1 4.2 3.9v0.7c0 0.9-0.2 3.9-4.2 3.9h-59.9c-3.9 0-4.2-3.1-4.2-3.9v-0.7z m124.5 29.1c15.9 0 21-9.6 22.3-18.1 0.2-1.3 0-17 0-17.7 0.7-5.5 6.3-7.4 9.6-7.9h38.4c21.6 0 39.3 17.7 39.3 39.3v773.4c0 21.6-17.7 39.3-39.3 39.3H354.7c-21.6 0-39.3-17.7-39.3-39.3V125.3c0-21.6 17.7-39.3 39.3-39.3h38.4c3.3 0.4 9 2.4 9.6 7.9 0 0.4-0.2 16.4 0 17.7 1.5 8.5 6.6 18.1 22.3 18.1h173.9z"/></svg>
        <svg viewBox="0 0 1024 1024" fill="currentColor"><path d="M789.333 75C830.571 75 864 108.43 864 149.667v725.666C864 916.571 830.57 950 789.333 950H234.667C193.429 950 160 916.57 160 875.333V149.667C160 108.429 193.43 75 234.667 75z m0 64H234.667c-5.891 0-10.667 4.776-10.667 10.667v725.666c0 5.891 4.776 10.667 10.667 10.667h554.666c5.891 0 10.667-4.776 10.667-10.667V149.667c0-5.891-4.776-10.667-10.667-10.667zM554.667 736.605c17.673 0 32 14.327 32 32 0 17.497-14.042 31.713-31.471 31.996l-0.53 0.004h-85.333c-17.673 0-32-14.327-32-32 0-17.496 14.042-31.713 31.471-31.995l0.53-0.005h85.333z"/></svg>
        <span>兼容 iPhone、iPad</span>
      </div>

      ${app.whatsnew ? `
        <div class="text-block">
          <h3>更新内容（${esc(app.version)}）</h3>
          <p>${esc(app.whatsnew)}</p>
        </div>` : ''}

      ${app.description ? `
        <div class="text-block">
          <h3>应用介绍</h3>
          <p class="desc-clamp" id="descText">${esc(app.description)}</p>
          <button type="button" class="desc-more" id="descMore">更多</button>
        </div>` : ''}

      <div id="related" class="related-wrap">
        <div class="section-head"><h2 style="font-size:18px">相关应用</h2></div>
        <div class="related-loading muted">加载中…</div>
      </div>
    </div>`;

  // 分享：优先系统分享，否则复制链接
  const shareBtn = document.getElementById('heroShare');
  shareBtn.addEventListener('click', async () => {
    const link = location.href;
    if (navigator.share) {
      try { await navigator.share({ title: app.name, text: app.short_desc || '', url: link }); }
      catch (e) { /* 用户取消 */ }
    } else {
      try {
        await navigator.clipboard.writeText(link);
        shareBtn.classList.add('done');
        setTimeout(() => shareBtn.classList.remove('done'), 1200);
      } catch (e) { /* 忽略 */ }
    }
  });

  // 描述展开/收起
  const descMore = document.getElementById('descMore');
  if (descMore) {
    descMore.addEventListener('click', () => {
      const t = document.getElementById('descText');
      const open = t.classList.toggle('open');
      descMore.textContent = open ? '收起' : '更多';
    });
  }

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
