'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import Icon from '@/components/Icon';
import NoticeBar from '@/components/NoticeBar';
import AdCard from '@/components/AdCard';
import { useToast } from '@/components/ToastProvider';

const PAGE_SIZE = 10;

export default function HomePage() {
  const toast = useToast();
  const router = useRouter();

  const [dateStr, setDateStr] = useState('');
  const [notice, setNotice] = useState('');
  const [cats, setCats] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const timerRef = useRef(null);
  const reqId = useRef(0);

  useEffect(() => {
    const now = new Date();
    const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()];
    setDateStr(`${now.getMonth() + 1}月${now.getDate()}日 ${week}`);
    (async () => {
      try {
        const settings = await API.settings();
        setNotice(settings.notice || '');
        setCats(await API.categories());
      } catch (e) {
        /* 分类加载失败不阻断列表 */
      }
    })();
  }, []);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    API.apps({ keyword, category_id: categoryId, page, page_size: PAGE_SIZE })
      .then((data) => {
        if (id !== reqId.current) return;
        setList((prev) => (page === 1 ? data.list : [...prev, ...data.list]));
        setTotal(data.total);
        setError(false);
      })
      .catch((e) => {
        if (id !== reqId.current) return;
        setError(true);
        toast(e.message, 'error');
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [keyword, categoryId, page]);

  function onSearchInput(v) {
    setSearch(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setKeyword(v.trim());
      setPage(1);
    }, 450);
  }

  function clearSearch() {
    setSearch('');
    setKeyword('');
    setPage(1);
  }

  function applyCategory(cid) {
    setCategoryId(String(cid || ''));
    setPage(1);
  }

  const headTitle = keyword ? `搜索：${keyword}` : categoryId ? '分类应用' : '全部应用';

  return (
    <div className="today-wrap">
      <div className="today-date">{dateStr}</div>
      <h1 className="today-big">Today</h1>

      <div className="today-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          className="search-input"
          value={search}
          onChange={(e) => onSearchInput(e.target.value)}
          placeholder="搜索应用名称…"
          autoComplete="off"
        />
        <button className="search-clear" hidden={!search} onClick={clearSearch} aria-label="清除">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="today-chips" id="chips">
        <button
          className={'chip' + (categoryId === '' ? ' active' : '')}
          onClick={() => applyCategory('')}
        >
          全部
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            className={'chip' + (categoryId === String(c.id) ? ' active' : '')}
            onClick={() => applyCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <NoticeBar text={notice} />
      <AdCard />

      {error ? (
        <div className="today-empty">
          <div>无法连接数据接口</div>
          <div style={{ marginTop: 8, fontSize: 13 }}>请稍后重试或检查后端服务</div>
        </div>
      ) : list.length === 0 ? (
        <div className="today-empty">
          {loading ? (
            <div>加载中…</div>
          ) : (
            <>
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <div style={{ marginTop: 10 }}>{keyword ? '没有找到相关应用' : '暂无应用，请到后台添加'}</div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="feed-head">
            <h3>{headTitle}</h3>
            <span className="feed-count">共 {total} 款</span>
          </div>
          <div className="today-card list-card">
            {list.map((a) => (
              <div key={a.id} className="feed-row" onClick={() => router.push(`/app?id=${a.id}`)}>
                <Icon app={a} className="feed-icon" />
                <div className="feed-meta">
                  <h4>{a.name}</h4>
                  <div className="feed-desc">
                    {a.short_desc || a.category_name || ''}
                  </div>
                </div>
                <span className="feed-view">获取</span>
              </div>
            ))}
          </div>

          {list.length < total && (
            <div className="today-more">
              <button className="more-btn" disabled={loading} onClick={() => setPage((p) => p + 1)}>
                {loading ? '加载中…' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
