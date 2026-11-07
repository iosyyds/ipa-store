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
