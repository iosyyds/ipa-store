'use client';
import { useSyncExternalStore } from 'react';
import { API } from './api';

const TOKEN_KEY = 'ipa_token';
const NAME_KEY = 'ipa_name';
const AUTH_EVENT = 'ipa-auth-change';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function getUserName() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(NAME_KEY) || '';
}
export function isLoggedIn() {
  return !!getToken();
}

function setSession(token, name) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(NAME_KEY, name || '');
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(NAME_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export async function doLogin(payload) {
  const data = await API.login(payload);
  if (!data || !data.token) throw new Error('登录失败：未返回令牌');
  setSession(data.token, data.name || data.username || '');
  return data;
}

export async function doRegister(payload) {
  const data = await API.register(payload);
  if (!data || !data.token) throw new Error('注册失败：未返回令牌');
  setSession(data.token, data.name || data.username || '');
  return data;
}

// 微信扫码登录成功后，用后端返回的令牌直接建立会话
export function acceptWxSession(data) {
  if (!data || !data.token) throw new Error('登录失败：未返回令牌');
  setSession(data.token, data.username || data.name || '');
  return data;
}

export function userLogout() {
  clearSession();
}

function subscribe(callback) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useAuth() {
  const loggedIn = useSyncExternalStore(
    subscribe,
    () => !!getToken(),
    () => false
  );
  const name = useSyncExternalStore(subscribe, getUserName, () => '');
  return { loggedIn, name };
}

// 禁止 iOS 双指/双击缩放
export function usePreventZoom() {
  if (typeof window === 'undefined') return;
  const block = (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  };
  const wheel = (e) => {
    if (e.ctrlKey) e.preventDefault();
  };
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', block, { passive: false });
  document.addEventListener('wheel', wheel, { passive: false });
  let last = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - last <= 300) e.preventDefault();
    last = now;
  }, { passive: false });
}
