'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import Icon from '@/components/Icon';
import { useDownload } from '@/lib/download';
import { useToast } from '@/components/ToastProvider';

function detailSize(bytes) {
  if (!bytes) return '—';
  const mb = bytes / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function updateSeo(app) {
  const pageTitle = `${app.name} ${app.version} 下载 - 甜甜-IPA应用库`;
  const desc = app.short_desc || `下载 ${app.name} ${app.version}，适用于 iPhone、iPad，企业签名一键安装。`;
  document.title = pageTitle;
  setMeta('description', desc);
  setMeta('keywords', `${app.name}下载,${app.name} IPA,iOS ${app.name},${app.bundle_id}`);
  setMeta('og:title', pageTitle, 'property');
  setMeta('og:description', desc, 'property');
  const oldLd = document.getElementById('detail-ld');
  if (oldLd) oldLd.remove();
  const ld = document.createElement('script');
  ld.id = 'detail-ld';
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: app.name,
    softwareVersion: app.version,
    operatingSystem: 'iOS',
    applicationCategory: app.category_name || 'Application',
    description: desc,
    downloadUrl: window.location.href,
    inLanguage: 'zh-CN',
  });
  document.head.appendChild(ld);
}

function DetailInner() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const toast = useToast();
  const { startDownload } = useDownload();

  const [app, setApp] = useState(null);
  const [error, setError] = useState('');
  const [related, setRelated] = useState(null); // null=loading, []=none
  const [descOpen, setDescOpen] = useState(false);
  const [shareDone, setShareDone] = useState(false);

  // 详情页无全局 Tab 栏，去掉 body 为其预留的底部内边距
  useEffect(() => {
    document.body.classList.add('detail-mode');
    return () => document.body.classList.remove('detail-mode');
  }, []);

  useEffect(() => {
    let alive = true;
    setApp(null);
    setRelated(null);
    setError('');
    if (!id) {
      setError('缺少应用参数');
      return;
    }
    (async () => {
      try {
        const a = await API.app(id);
        if (!alive) return;
        setApp(a);
        updateSeo(a);
      } catch (e) {
        if (alive) setError(e.message);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!app) return;
    let alive = true;
    (async () => {
      try {
        const data = await API.apps({ category_id: app.category_id || '', page: 1, page_size: 10 });
        let list = (data.list || []).filter((x) => Number(x.id) !== Number(app.id));
        if (list.length < 5) {
          const more = await API.apps({ page: 1, page_size: 10 });
          const exist = new Set(list.map((x) => Number(x.id)).concat([Number(app.id)]));
          for (const x of more.list || []) {
            if (list.length >= 6) break;
            if (!exist.has(Number(x.id))) { list.push(x); exist.add(Number(x.id)); }
          }
        }
        if (alive) setRelated(list.slice(0, 6));
      } catch (e) {
        if (alive) setRelated([]);
      }
    })();
    return () => { alive = false; };
  }, [app]);

  async function onShare() {
    // 永久直链（/d/ 实时签名、不过期），符合「复制链接」式永久直链需求
    const link = app.ipa_file || window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: app.name, text: app.short_desc || '', url: link }); }
      catch (e) { /* 用户取消 */ }
    } else {
      try {
        await navigator.clipboard.writeText(link);
        setShareDone(true);
        setTimeout(() => setShareDone(false), 1200);
      } catch (e) { /* 忽略 */ }
    }
  }

  function back() {
    if (document.referrer && window.history.length > 1) router.back();
    else router.push('/');
  }

  if (error) {
    return (
      <>
        <button className="back-fab" onClick={back} aria-label="返回">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="empty">{error}</div>
      </>
    );
  }
  if (!app) {
    return <div className="empty">加载中…</div>;
  }

  return (
    <>
      <div id="detailRoot">
        <div className="detail-hero grad-0">
          <button
            type="button"
            className="hero-back"
            onClick={back}
            aria-label="返回"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button
            type="button"
            className={'hero-share' + (shareDone ? ' done' : '')}
            onClick={onShare}
            aria-label="分享"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="M8 7l4-4 4 4" />
              <path d="M5 12v7h14v-7" />
            </svg>
          </button>
          <div className="hero-main">
            <Icon app={app} className="hero-icon" />
            <div className="hero-info">
              <h1>{app.name}</h1>
              <div className="hero-sub">{app.short_desc || app.category_name || 'iOS 应用'}</div>
              <div className="hero-bundle">{app.bundle_id || ''}</div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="detail-metrics">
            <div className="metric"><div className="m-v">{detailSize(app.size)}</div><div className="m-l">大小</div></div>
            <div className="metric"><div className="m-v">{Number(app.downloads || 0)}</div><div className="m-l">下载量</div></div>
            <div className="metric"><div className="m-v">{app.version}</div><div className="m-l">版本</div></div>
            <div className="metric"><div className="m-v m-date">{(app.updated_at || '—').split(' ')[0]}</div><div className="m-l">更新时间</div></div>
          </div>

          {app.screenshots && app.screenshots.length > 0 && (
            <>
              <div className="section-head"><h2 style={{ fontSize: 18 }}>预览</h2></div>
              <div className="shots">
                {app.screenshots.map((u, i) => (
                  <img key={i} src={API.fileUrl(u)} alt={`${app.name} 截图`} loading="lazy" />
                ))}
              </div>
            </>
          )}

          <div className="compat">
            <svg viewBox="0 0 1024 1024" fill="currentColor" stroke="currentColor" strokeWidth="40" strokeLinejoin="round"><path d="M664.9 959.8c35.8 0 65.5-29.3 65.5-65.3v-765c0-35.8-29.3-65.3-65.3-65.3H358.9c-36 0-65.3 29.3-65.3 65.3v765.1c0 36 29.7 65.3 65.5 65.3h305.8zM568.8 92.6c4.6 0 8.3 3.7 8.3 8.3 0 4.6-3.7 8.3-8.3 8.3-4.6 0-8.3-3.7-8.3-8.3 0-4.6 3.7-8.3 8.3-8.3z m-94.4 8c0-0.9 0.2-3.9 4.2-3.9h59.9c3.9 0 4.2 3.1 4.2 3.9v0.7c0 0.9-0.2 3.9-4.2 3.9h-59.9c-3.9 0-4.2-3.1-4.2-3.9v-0.7z m124.5 29.1c15.9 0 21-9.6 22.3-18.1 0.2-1.3 0-17 0-17.7 0.7-5.5 6.3-7.4 9.6-7.9h38.4c21.6 0 39.3 17.7 39.3 39.3v773.4c0 21.6-17.7 39.3-39.3 39.3H354.7c-21.6 0-39.3-17.7-39.3-39.3V125.3c0-21.6 17.7-39.3 39.3-39.3h38.4c3.3 0.4 9 2.4 9.6 7.9 0 0.4-0.2 16.4 0 17.7 1.5 8.5 6.6 18.1 22.3 18.1h173.9z" /></svg>
            <svg viewBox="0 0 1024 1024" fill="currentColor"><path d="M789.333 75C830.571 75 864 108.43 864 149.667v725.666C864 916.571 830.57 950 789.333 950H234.667C193.429 950 160 916.57 160 875.333V149.667C160 108.429 193.43 75 234.667 75z m0 64H234.667c-5.891 0-10.667 4.776-10.667 10.667v725.666c0 5.891 4.776 10.667 10.667 10.667h554.666c5.891 0 10.667-4.776 10.667-10.667V149.667c0-5.891-4.776-10.667-10.667-10.667zM554.667 736.605c17.673 0 32 14.327 32 32 0 17.496-14.042 31.713-31.471 31.996l-0.53 0.004h-85.333c-17.673 0-32-14.327-32-32 0-17.496 14.042-31.713 31.471-31.995l0.53-0.005h85.333z" /></svg>
            <span>兼容 iPhone、iPad</span>
          </div>

          {app.whatsnew && (
            <div className="text-block">
              <h3>更新内容（{app.version}）</h3>
              <p>{app.whatsnew}</p>
            </div>
          )}

          {app.description && (
            <div className="text-block">
              <h3>应用介绍</h3>
              <p className={'desc-clamp' + (descOpen ? ' open' : '')}>{app.description}</p>
              <button type="button" className="desc-more" onClick={() => setDescOpen((v) => !v)}>
                {descOpen ? '收起' : '更多'}
              </button>
            </div>
          )}

          {related && related.length > 0 && (
            <div className="related-wrap">
              <div className="section-head"><h2 style={{ fontSize: 18 }}>相关应用</h2></div>
              <div className="related-scroll">
                {related.map((r) => (
                  <div key={r.id} className="related-card" onClick={() => router.push(`/app?id=${r.id}`)}>
                    <Icon app={r} className="related-icon" />
                    <div className="related-name">{r.name}</div>
                    <div className="related-sub muted">{r.category_name || detailSize(r.size)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dock-space" />
      <div className="dock">
        <div className="container">
          <div className="mini-info">
            <b>{app.name}</b>
            <span>{app.category_name || ''} · {detailSize(app.size)}</span>
          </div>
          <button
            className={'get-btn' + (app.require_license ? ' lock' : '')}
            onClick={() => startDownload(app)}
          >
            {app.require_license ? '授权获取' : '获取'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function AppDetailPage() {
  return (
    <Suspense fallback={<div className="empty">加载中…</div>}>
      <DetailInner />
    </Suspense>
  );
}
