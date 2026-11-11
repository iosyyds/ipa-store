import { API_BASE, API_URL } from './config';

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('ipa_token');
}

async function request(path, options = {}) {
  const headers = { Accept: 'application/json' };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch(API_URL + path, { ...options, headers });
  } catch (e) {
    throw new Error('网络连接失败，请检查网络后重试');
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); }
    catch (e) { throw new Error('服务器返回数据格式错误'); }
  }
  if (!res.ok || (data && data.code !== 0)) {
    throw new Error((data && data.message) || '请求失败（' + res.status + '）');
  }
  return data ? data.data : null;
}

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  const s = p.toString();
  return s ? '?' + s : '';
}

export const API = {
  settings: () => request('/settings'),
  categories: () => request('/categories'),
  apps: (params) => request('/apps' + qs(params)),
  app: (id) => request('/apps/' + encodeURIComponent(id)),
  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  fileUrl: (path) =>
    path ? (path.startsWith('http') ? path : API_BASE + '/' + path.replace(/^\/+/, '')) : '',
  user: {
    profile: () => request('/user/profile'),
    licenses: () => request('/user/licenses'),
    logs: () => request('/user/logs'),
    redeem: (code) =>
      request('/user/redeem', { method: 'POST', body: JSON.stringify({ code }) }),
    password: (data) =>
      request('/user/password', { method: 'POST', body: JSON.stringify(data) }),
    appToken: (appId) =>
      request('/user/app-token', { method: 'POST', body: JSON.stringify({ app_id: appId }) }),
  },
};
