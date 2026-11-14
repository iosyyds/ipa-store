'use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { acceptWxSession } from '@/lib/auth';

// 微信小程序扫码登录：建票 → 展示小程序码 → 轮询 → 确认后建立会话
export default function WxScanLogin({ redirect = '/' }) {
  const router = useRouter();
  const [qr, setQr] = useState('');
  const [phase, setPhase] = useState('loading'); // loading / waiting / expired / error
  const [err, setErr] = useState('');

  const timerRef = useRef(null);
  const stoppedRef = useRef(false);
  const redirectRef = useRef(redirect);
  redirectRef.current = redirect;

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }
  function stop() { stoppedRef.current = true; clearTimer(); }

  function schedule(tk, delay) {
    timerRef.current = setTimeout(() => poll(tk), delay);
  }

  async function poll(tk) {
    if (stoppedRef.current) return;
    try {
      const r = await API.wxCheck(tk);
      if (stoppedRef.current) return;
      if (r.status === 'confirmed') {
        stop();
        acceptWxSession(r);
        router.push(redirectRef.current);
        return;
      }
      if (r.status === 'expired') { stop(); setPhase('expired'); return; }
      if (r.status === 'invalid') { stop(); setPhase('error'); setErr('登录已失效，请重试'); return; }
      schedule(tk, 1500); // pending，继续轮询
    } catch (e) {
      if (stoppedRef.current) return;
      schedule(tk, 2000);   // 网络抖动，稍后重试，不打断扫码
    }
  }

  async function start() {
    stop();
    stoppedRef.current = false;
    setPhase('loading'); setErr(''); setQr('');
    try {
      const t = await API.wxTicket();
      if (stoppedRef.current) return;
      setQr(API.wxQrUrl(t.qr));
      setPhase('waiting');
      schedule(t.ticket, 1500);
    } catch (e) {
      if (stoppedRef.current) return;
      setPhase('error'); setErr(e.message);
    }
  }

  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wxscan">
      <div className="wxscan-divider"><span>微信扫码登录</span></div>
      <div className="wxscan-box">
        {phase === 'loading' && <div className="wxscan-loading">正在生成二维码…</div>}
        {phase === 'waiting' && qr &&
          <img className="wxscan-qr" src={qr} width={200} height={200} alt="微信扫码登录" />}
        {(phase === 'expired' || phase === 'error') && (
          <button type="button" className="btn btn-ghost wxscan-refresh" onClick={start}>
            {phase === 'expired' ? '二维码已过期，点击刷新' : (err || '点击重试')}
          </button>
        )}
      </div>
      <p className="wxscan-tip">打开微信「扫一扫」，在小程序内确认登录</p>
    </div>
  );
}
