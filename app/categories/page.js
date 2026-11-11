'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';

const GRID_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.6" />
    <rect x="14" y="3" width="7" height="7" rx="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.6" />
    <rect x="14" y="14" width="7" height="7" rx="1.6" />
  </svg>
);

function CatIcon({ c }) {
  if (c.icon) {
    const src = /^https?:\/\//i.test(c.icon) ? c.icon : API.fileUrl(c.icon);
    return <img src={src} alt="" />;
  }
  return GRID_ICON;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cats = await API.categories();
        const total = cats.reduce((s, c) => s + Number(c.app_count || 0), 0);
        const all = [{ id: '', name: '全部应用', app_count: total, grad: 'cat-grad-0' }];
        cats.forEach((c, i) => {
          all.push({ ...c, grad: `cat-grad-${(i + 1) % 12}` });
        });
        setItems(all);
      } catch (e) {
        setError(true);
      }
    })();
  }, []);

  return (
    <main className="cat-page">
      <div className="cat-page-head">
        <h1>类别</h1>
        <p>按分类浏览精选应用</p>
      </div>

      {error ? (
        <div className="today-empty">
          <div>无法连接数据接口</div>
          <div style={{ marginTop: 8, fontSize: 13 }}>请稍后重试或检查后端服务</div>
        </div>
      ) : items === null ? (
        <div className="today-empty">加载中…</div>
      ) : items.length <= 1 ? (
        <div className="today-empty">暂无分类，请到后台添加应用并设置分类</div>
      ) : (
        <div className="cat-grid">
          {items.map((c) => (
            <div
              key={c.id}
              className={'cat-card ' + c.grad}
              onClick={() => router.push(`/category?id=${encodeURIComponent(c.id)}`)}
            >
              <div className="cat-card-icon">
                <CatIcon c={c} />
              </div>
              <div className="cat-card-name">{c.name}</div>
              <div className="cat-card-count">{c.app_count != null ? `${c.app_count} 款应用` : ''}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
