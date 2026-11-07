/* ============================================================
 * 禁止移动端自动放大 / 手势缩放
 * iOS 10+ Safari 会忽略 viewport 的 user-scalable=no，需 JS 拦截
 * ============================================================ */
(function preventZoom() {
  const stop = (e) => e.preventDefault();
  // 双指捏合缩放
  document.addEventListener('gesturestart', stop);
  document.addEventListener('gesturechange', stop);
  document.addEventListener('gestureend', stop);
  // 多指触摸移动
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  // 双击放大
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  // 外接键盘 / 触控板的 ctrl+滚轮缩放
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });
})();

/* 前台用户登录态管理 */
const U_TOKEN_KEY = 'user_token';
const U_NAME_KEY = 'user_name';

function getUserToken() {
  return localStorage.getItem(U_TOKEN_KEY);
}
function getUserName() {
  return localStorage.getItem(U_NAME_KEY) || '';
}
function isLoggedIn() {
  return !!getUserToken();
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

async function doLogin(body) {
  const d = await API.login(body);
  localStorage.setItem(U_TOKEN_KEY, d.token);
  localStorage.setItem(U_NAME_KEY, d.username);
  return d;
}

async function doRegister(body) {
  const d = await API.register(body);
  localStorage.setItem(U_TOKEN_KEY, d.token);
  localStorage.setItem(U_NAME_KEY, d.username);
  return d;
}

function userLogout() {
  localStorage.removeItem(U_TOKEN_KEY);
  localStorage.removeItem(U_NAME_KEY);
  location.href = 'index.html';
}

// 自动渲染导航栏用户入口
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('userEntry');
  if (el) {
    if (isLoggedIn()) {
      el.href = 'user.html';
      el.textContent = getUserName();
    } else {
      el.href = 'login.html';
      el.textContent = '登录';
    }
  }
  // 底部“我的”Tab：未登录时跳登录页
  const tabMe = document.getElementById('tabMe');
  if (tabMe && !isLoggedIn()) {
    tabMe.href = 'login.html?redirect=user.html';
  }
});
