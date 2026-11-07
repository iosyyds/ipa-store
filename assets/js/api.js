/* 前台 API 封装 */
(function () {
  const BASE = window.API_BASE;

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (options.token) headers.Authorization = 'Bearer ' + options.token;
    const opts = { method: options.method || 'GET', headers };
    if (options.body) opts.body = JSON.stringify(options.body);
    const r = await fetch(BASE + path, opts);
    const j = await r.json();
    if (j.code !== 0) {
      const err = new Error(j.message || '请求失败');
      err.status = r.status;
      throw err;
    }
    return j.data;
  }

  window.API = {
    // 公开
    settings: () => request('/settings'),
    categories: () => request('/categories'),
    apps: (params = {}) => {
      const q = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
      return request(`/apps?${q}`);
    },
    app: (id) => request(`/apps/${id}`),
    register: (body) => request('/register', { method: 'POST', body }),
    login: (body) => request('/login', { method: 'POST', body }),
    fileUrl: (p) => BASE + p,

    // 用户（需登录）
    user: {
      token: () => localStorage.getItem('user_token'),
      profile: () => request('/user/profile', { token: localStorage.getItem('user_token') }),
      password: (body) => request('/user/change-password', {
        method: 'POST', token: localStorage.getItem('user_token'), body,
      }),
      redeem: (body) => request('/user/redeem', {
        method: 'POST', token: localStorage.getItem('user_token'), body,
      }),
      licenses: () => request('/user/licenses', { token: localStorage.getItem('user_token') }),
      logs: () => request('/user/logs', { token: localStorage.getItem('user_token') }),
      appToken: (id) => request(`/user/apps/${id}/token`, {
        method: 'POST', token: localStorage.getItem('user_token'),
      }),
    },
  };
})();
