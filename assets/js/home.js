const PAGE_SIZE = 24;
const state = { keyword: '', category_id: '', page: 1, list: [], total: 0, loading: false };

const appListEl = document.getElementById('appList');
const loadMoreSlot = document.getElementById('loadMoreSlot');
const countText = document.getElementById('countText');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

function rowHtml(a) {
  const icon = a.icon
    ? `<img class="app-icon" src="${esc(API.fileUrl(a.icon))}" alt="">`
    : '<div class="app-icon ph">App</div>';
  return `
    <div class="app-row" data-id="${a.id}">
      ${icon}
      <div class="app-info">
        <h3>${esc(a.name)}</h3>
        <div class="sub">${esc(a.short_desc || a.category_name || '')}</div>
        <div class="meta">
          <span>${esc(a.category_name || '')}</span>
          ${a.size ? `<span>· ${formatSize(a.size)}</span>` : ''}
          ${a.downloads ? `<span>· ${a.downloads} 次下载</span>` : ''}
        </div>
      </div>
      <button class="get-btn ${a.require_license ? 'lock' : ''}" data-get="${a.id}">
        ${a.require_license ? '授权获取' : '获取'}
      </button>
    </div>`;
}

function render() {
  if (!state.list.length) {
    appListEl.innerHTML = `
      <div class="empty">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <div>没有找到相关应用</div>
      </div>`;
    loadMoreSlot.innerHTML = '';
    return;
  }
  appListEl.innerHTML = state.list.map(rowHtml).join('');
  countText.textContent = `共 ${state.total} 款`;
  if (state.list.length < state.total) {
    loadMoreSlot.innerHTML = '<button class="get-btn" id="moreBtn" style="padding:10px 26px">加载更多</button>';
    document.getElementById('moreBtn').addEventListener('click', loadMore);
  } else {
    loadMoreSlot.innerHTML = '';
  }
}

async function loadMore() {
  if (state.loading) return;
  state.loading = true;
  loadMoreSlot.innerHTML = '<span class="countText muted">加载中…</span>';
  try {
    const data = await API.apps({
      keyword: state.keyword,
      category_id: state.category_id,
      page: state.page,
      page_size: PAGE_SIZE,
    });
    state.list.push(...data.list);
    state.total = data.total;
    state.page++;
    render();
  } catch (e) {
    appListEl.innerHTML = `<div class="empty">加载失败：${esc(e.message)}<br>请检查 config.js 中的 API 地址</div>`;
  } finally {
    state.loading = false;
  }
}

async function reset() {
  state.page = 1;
  state.list = [];
  document.getElementById('listTitle').textContent =
    state.keyword ? `搜索：${state.keyword}` : '全部应用';
  await loadMore();
}

/* 事件委托：获取按钮 & 行点击 */
appListEl.addEventListener('click', (e) => {
  const getBtn = e.target.closest('[data-get]');
  if (getBtn) {
    e.stopPropagation();
    const id = Number(getBtn.dataset.get);
    // SQLite 返回的 id 为字符串，需显式转数字再比较，否则严格相等会失配
    const app = state.list.find((a) => Number(a.id) === id);
    if (app) startDownload(app);
    return;
  }
  const row = e.target.closest('.app-row');
  if (row) location.href = `app.html?id=${row.dataset.id}`;
});

/* 搜索防抖 */
let timer;
document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.keyword = e.target.value.trim();
    reset();
  }, 450);
});

/* 分类 chips */
async function initChips() {
  const cats = await API.categories();
  const chipsEl = document.getElementById('chips');
  chipsEl.innerHTML =
    `<button class="chip active" data-cat="">全部</button>` +
    cats.map((c) => `<button class="chip" data-cat="${c.id}">${esc(c.name)}</button>`).join('');
  chipsEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chipsEl.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.category_id = chip.dataset.cat;
    reset();
  });
}

/* 初始化 */
(async function init() {
  try {
    const settings = await API.settings();
    const siteName = settings.site_name || '甜甜-IPA应用库';
    document.getElementById('navName').textContent = siteName;
    // Hero 大标题保持营销语“发现优质 iOS 应用”，不与导航栏品牌名重复
    document.getElementById('heroSlogan').textContent = settings.site_slogan || '';
    document.title = `${siteName} - iOS 应用下载`;
    if (settings.notice) {
      document.getElementById('noticeSlot').innerHTML =
        `<div class="notice-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b25f00" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
          <span>${esc(settings.notice)}</span></div>`;
    }
    await initChips();
    await reset();
  } catch (e) {
    appListEl.innerHTML = `
      <div class="empty">
        <div>无法连接数据接口</div>
        <div style="margin-top:8px;font-size:13px">请修改 assets/js/config.js 中的 API_BASE 为你的后端地址</div>
      </div>`;
  }
})();
