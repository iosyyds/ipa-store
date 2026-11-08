/* ============================================================
   分类内页：展示某一分类下的全部应用
   ============================================================ */
const PAGE_SIZE = 24;
const feedEl = document.getElementById('catFeed');
const catId = new URLSearchParams(location.search).get('id') || '';
const st = { page: 1, list: [], total: 0, loading: false };

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

function iconHtml(a) {
  return a.icon
    ? `<img class="feed-icon" src="${esc(API.fileUrl(a.icon))}" alt="${esc(a.name)} 图标">`
    : `<div class="feed-icon ph">App</div>`;
}

function feedRow(a) {
  return `
  <div class="feed-row" data-app="${a.id}">
    ${iconHtml(a)}
    <div class="feed-meta">
      <h4>${esc(a.name)}</h4>
      <div class="feed-desc">${esc(a.short_desc || a.version || '')}${a.size ? ` · ${formatSize(a.size)}` : ''}</div>
    </div>
    <span class="feed-view">查看</span>
  </div>`;
}

function render() {
  if (!st.list.length) {
    feedEl.innerHTML = `<div class="today-empty">该分类下暂无应用</div>`;
    return;
  }
  let html = `<div class="today-card list-card">
    <div class="list-kicker">分类应用</div>
    <h3>全部（${st.total}）</h3>
    ${st.list.map(feedRow).join('')}
  </div>`;
  if (st.list.length < st.total) {
    html += `<div class="today-more"><button class="feed-view" id="moreBtn" style="padding:11px 28px">加载更多</button></div>`;
  }
  feedEl.innerHTML = html;
  const more = document.getElementById('moreBtn');
  if (more) more.addEventListener('click', loadMore);
}

async function loadPage() {
  const data = await API.apps({
    category_id: catId, page: st.page, page_size: PAGE_SIZE,
  });
  if (st.page === 1) st.list = data.list;
  else st.list.push(...data.list);
  st.total = data.total;
}

async function loadMore() {
  if (st.loading) return;
  st.loading = true;
  st.page++;
  try {
    await loadPage();
    render();
  } catch (e) {
    st.page--;
  } finally {
    st.loading = false;
  }
}

/* 点击进详情 */
feedEl.addEventListener('click', (e) => {
  const row = e.target.closest('[data-app]');
  if (row) location.href = `app.html?id=${encodeURIComponent(row.dataset.app)}`;
});

/* 返回 */
document.getElementById('backFab').addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.href = 'categories.html';
});

(async function init() {
  try {
    const cats = await API.categories();
    const cur = cats.find((c) => String(c.id) === String(catId));
    const name = cur ? cur.name : '全部应用';
    document.getElementById('catTitle').textContent = name;
    document.getElementById('catSub').textContent = cur ? `${cur.app_count} 款应用` : '';
    document.title = `${name} - 甜甜-IPA应用库`;
    await loadPage();
    render();
  } catch (e) {
    feedEl.innerHTML = `<div class="today-empty">
      <div>无法连接数据接口</div>
      <div style="margin-top:8px;font-size:13px">请检查 assets/js/config.js 中的 API_BASE</div>
    </div>`;
  }
})();
