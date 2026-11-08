/* ============================================================
   类别页：App Store 风格分类网格
   ============================================================ */
const gridEl = document.getElementById('catGrid');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* 默认分类图标（SF Symbol 风格网格） */
const GRID_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></svg>';

function catIcon(c) {
  if (c.icon) {
    return /^https?:\/\//i.test(c.icon)
      ? `<img src="${esc(c.icon)}" alt="">`
      : `<img src="${esc(API.fileUrl(c.icon))}" alt="">`;
  }
  return GRID_ICON;
}

/* 单个分类卡片 */
function card(c, idx) {
  const grad = c.grad;
  const count = c.app_count != null ? `${c.app_count} 款应用` : '';
  return `
  <a class="cat-card ${grad}" href="category.html?id=${encodeURIComponent(c.id)}">
    <div class="cat-card-icon">${catIcon(c)}</div>
    <div class="cat-card-name">${esc(c.name)}</div>
    <div class="cat-card-count">${count}</div>
  </a>`;
}

async function render() {
  try {
    const cats = await API.categories();
    const total = cats.reduce((s, c) => s + Number(c.app_count || 0), 0);
    const all = [{ id: '', name: '全部应用', app_count: total, grad: 'cat-grad-0' }];
    cats.forEach((c, i) => {
      all.push(Object.assign({}, c, { grad: `cat-grad-${(i + 1) % 12}` }));
    });
    if (!cats.length) {
      gridEl.innerHTML = `<div class="today-empty">暂无分类，请到后台添加应用并设置分类</div>`;
      return;
    }
    gridEl.innerHTML = all.map(card).join('');
  } catch (e) {
    gridEl.innerHTML = `<div class="today-empty">
      <div>无法连接数据接口</div>
      <div style="margin-top:8px;font-size:13px">请检查 assets/js/config.js 中的 API_BASE</div>
    </div>`;
  }
}

/* 站点名称同步 */
(async function () {
  try {
    const s = await API.settings();
    const navName = document.getElementById('navName');
    if (navName && s.site_name) navName.textContent = s.site_name;
    document.title = `${s.site_name || '甜甜-IPA应用库'} - 类别`;
  } catch (e) { /* 忽略 */ }
  render();
})();
