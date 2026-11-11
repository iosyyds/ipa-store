'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { formatSize } from '@/lib/utils';
import Icon from '@/components/Icon';
import { useToast } from '@/components/ToastProvider';

const PAGE_SIZE = 24;

function CategoryInner() {
  const catId = useSearchParams().get('id') || '';
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState('全部应用');
  const [sub, setSub] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    API.apps({ category_id: catId, page, page_size: PAGE_SIZE })
      .then((data) => {
        if (id !== reqId.current) return;
        setList((prev) => (page === 1 ? data.list : [...prev, ...data.list]));
        setTotal(data.total);
        setError(false);
      })
      .catch((e) => {
        if (id === reqId.current) { setError(true); toast(e.message, 'error'); }
      })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [catId, page]);

  useEffect(() => {
    (async () => {
      try {
        const cats = await API.categories();
        const cur = cats.find((c) => String(c.id) === String(catId));
        if (cur) {
          setTitle(cur.name);
          setSub(cur.app_count != null ? `${cur.app_count} 款应用` : '');
        }
      } catch (e) { /* 用默认标题 */ }
    })();
  }, [catId]);

  function back() {
    if (window.history.length > 1) router.back();
    else router.push('/categories');
  }

  return (
    <main className="cat-detail">
      <div className="cat-nav">
        <button className="back-btn" onClick={back} aria-label="返回">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      </div>
      <div className="cat-detail-head">
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>

      {error ? (
        <div className="today-empty">
          <div>无法连接数据接口</div>
          <div style={{ marginTop: 8, fontSize: 13 }}>请稍后重试或检查后端服务</div>
        </div>
      ) : loading && list.length === 0 ? (
        <div className="today-empty">加载中…</div>
      ) : list.length === 0 ? (
        <div className="today-empty">该分类下暂无应用</div>
      ) : (
        <>
          <div className="today-card list-card">
            {list.map((a) => (
              <div key={a.id} className="feed-row" onClick={() => router.push(`/app?id=${a.id}`)}>
                <Icon app={a} className="feed-icon" />
                <div className="feed-meta">
                  <h4>{a.name}</h4>
                  <div className="feed-desc">
                    {a.short_desc || a.version || ''}
                    {a.size ? ` · ${formatSize(a.size)}` : ''}
                  </div>
                </div>
                <span className="feed-view">获取</span>
              </div>
            ))}
          </div>
          {list.length < total && (
            <div className="today-more">
              <button className="feed-view" style={{ padding: '11px 28px' }} disabled={loading} onClick={() => setPage((p) => p + 1)}>
                {loading ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="today-empty">加载中…</div>}>
      <CategoryInner />
    </Suspense>
  );
}
