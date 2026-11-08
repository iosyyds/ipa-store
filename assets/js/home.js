/* ============================================================
   首页 Today Feed（App Store 今日页风格）
   ============================================================ */
const PAGE_SIZE = 24;
const state = { keyword: '', category_id: '', page: 1, list: [], total: 0, loading: false, notice: '' };

const feedEl = document.getElementById('todayFeed');
const chipsEl = document.getElementById('chips');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

/* 图标：外链/本地兼容；加载失败优雅回退为首字占位 */
function iconHtml(a, cls) {
  const ch = esc((a.name || 'A').trim().charAt(0).toUpperCase());
  if (!a.icon) return `<div class="${cls} ph"><span class="ph-letter">${ch}</span></div>`;
  return `<div class="${cls}">
      <img src="${esc(API.fileUrl(a.icon))}" alt="" loading="lazy"
           onerror="this.parentElement.classList.add('ph');this.remove();">
      <span class="ph-letter">${ch}</span>
    </div>`;
}

/* 列表行 */
function feedRow(a) {
  const desc = esc(a.short_desc || a.category_name || '');
  return `
  <div class="feed-row" data-app="${a.id}">
    ${iconHtml(a, 'feed-icon')}
    <div class="feed-meta">
      <h4>${esc(a.name)}</h4>
      <div class="feed-desc">${desc}${a.size ? ` · ${formatSize(a.size)}` : ''}</div>
    </div>
    <span class="feed-view">获取</span>
  </div>`;
}

/* 渲染整个 feed */
function noticeHtml() {
  if (!state.notice) return '';
  return `<div class="notice-bar">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b25f00" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
    <span>${esc(state.notice)}</span></div>`;
}

function renderFeed() {
  if (!state.list.length) {
    feedEl.innerHTML = noticeHtml() + `<div class="today-empty">
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <div style="margin-top:10px">${state.keyword ? '没有找到相关应用' : '暂无应用，请到后台添加'}</div>
    </div>`;
    return;
  }

  let html = noticeHtml();
  const headTitle = state.keyword ? `搜索：${esc(state.keyword)}`
    : state.category_id ? '分类应用' : '全部应用';
  html += `<div class="feed-head">
    <h3>${headTitle}</h3>
    <span class="feed-count">共 ${state.total} 款</span>
  </div>`;
  html += `<div class="today-card list-card">
    ${state.list.map(feedRow).join('')}
  </div>`;

  // 分页
  if (state.list.length < state.total) {
    html += `<div class="today-more"><button class="more-btn" id="moreBtn">加载更多</button></div>`;
  }
  feedEl.innerHTML = html;
  const more = document.getElementById('moreBtn');
  if (more) more.addEventListener('click', loadMore);
}

/* 加载一页 */
async function loadPage() {
  const data = await API.apps({
    keyword: state.keyword,
    category_id: state.category_id,
    page: state.page,
    page_size: PAGE_SIZE,
  });
  if (state.page === 1) state.list = data.list;
  else state.list.push(...data.list);
  state.total = data.total;
}

async function loadMore() {
  if (state.loading) return;
  state.loading = true;
  state.page++;
  try {
    await loadPage();
    renderFeed();
  } catch (e) {
    state.page--;
    toast(e.message, 'error');
  } finally {
    state.loading = false;
  }
}

/* 重新加载（搜索/分类变化） */
async function reset() {
  state.page = 1;
  state.list = [];
  try {
    await loadPage();
    renderFeed();
  } catch (e) {
    feedEl.innerHTML = `<div class="today-empty">
      <div>无法连接数据接口</div>
      <div style="margin-top:8px;font-size:13px">请检查 assets/js/config.js 中的 API_BASE</div>
    </div>`;
  }
}

/* 事件委托：点击进详情 */
feedEl.addEventListener('click', (e) => {
  const card = e.target.closest('[data-app]');
  if (card) location.href = `app.html?id=${encodeURIComponent(card.dataset.app)}`;
});

/* 搜索防抖 */
let timer;
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
searchInput.addEventListener('input', (e) => {
  searchClear.hidden = !e.target.value;
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.keyword = e.target.value.trim();
    reset();
  }, 450);
});
/* 一键清除搜索 */
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.hidden = true;
  state.keyword = '';
  searchInput.focus();
  reset();
});

/* 分类 chips */
let allCats = [];
async function initChips() {
  allCats = await API.categories();
  chipsEl.innerHTML =
    `<button class="chip active" data-cat="">全部</button>` +
    allCats.map((c) => `<button class="chip" data-cat="${c.id}">${esc(c.name)}</button>`).join('');
  chipsEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    applyCategory(chip.dataset.cat);
  });
}

/* 应用某个分类：同步 chip 高亮并重新加载 */
function applyCategory(catId) {
  state.category_id = String(catId || '');
  chipsEl.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.cat === state.category_id);
  });
  reset();
}

/* 日期 */
function renderDate() {
  const now = new Date();
  const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()];
  const el = document.getElementById('todayDate');
  if (el) el.textContent = `${now.getMonth() + 1}月${now.getDate()}日 ${week}`;
}

/* 初始化 */
(async function init() {
  renderDate();
  try {
    const settings = await API.settings();
    const siteName = settings.site_name || '甜甜-IPA应用库';
    const navName = document.getElementById('navName');
    if (navName) navName.textContent = siteName;
    document.title = `${siteName} - iOS IPA 应用下载`;
    state.notice = settings.notice || '';
    await initChips();
    await reset();
  } catch (e) {
    feedEl.innerHTML = `<div class="today-empty">
      <div>无法连接数据接口</div>
      <div style="margin-top:8px;font-size:13px">请修改 assets/js/config.js 中的 API_BASE 为你的后端地址</div>
    </div>`;
  }
})();
