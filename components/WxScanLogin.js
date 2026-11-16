'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { API } from '@/lib/api';
import { acceptWxSession } from '@/lib/auth';

// 扫码登录（免备案）：建票 → 前端本地生成普通二维码（内容为 ticket）
// → 小程序内「扫码登录」扫一扫 → confirm 绑定微信身份 → 轮询确认后建立会话
const QR_PREFIX = 'TTSCAN:';

export default function WxScanLogin({ redirect = '/' }) {
  const router = useRouter();
  const [ticket, setTicket] = useState('');
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
    setPhase('loading'); setErr(''); setTicket('');
    try {
      const t = await API.wxTicket();
      if (stoppedRef.current) return;
      setTicket(t.ticket);
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
        {phase === 'waiting' && ticket && (
          <div className="wxscan-qr-wrap">
            <QRCodeSVG
              value={QR_PREFIX + ticket}
              size={200}
              level="M"
              bgColor="#ffffff"
              fgColor="#000000"
              includeMargin={false}
            />
          </div>
        )}
        {(phase === 'expired' || phase === 'error') && (
          <button type="button" className="btn btn-ghost wxscan-refresh" onClick={start}>
            {phase === 'expired' ? '二维码已过期，点击刷新' : (err || '点击重试')}
          </button>
        )}
      </div>
      <p className="wxscan-tip">先在微信中打开「甜甜」小程序，点击首页「扫码登录」扫描此二维码</p>
    </div>
  );
}
