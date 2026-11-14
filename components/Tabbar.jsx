'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HomeSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);
const GridSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const RocketSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);
const SignSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
const MeSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </svg>
);

// 5 项：分类 / 小火箭 / 首页(凸起) / 签名 / 我的
const ITEMS = [
  { href: '/categories', label: '分类', icon: GridSvg },
  { href: '/accounts', label: '小火箭', icon: RocketSvg },
  { href: '/', label: '首页', icon: HomeSvg, home: true },
  { href: '/sign', label: '签名', icon: SignSvg },
  { href: '/user', label: '我的', icon: MeSvg },
];

export default function Tabbar() {
  const pathname = usePathname();
  // 详情页使用自带下载栏，不显示全局 Tab
  if (pathname.startsWith('/app')) return null;
  const norm = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const isActive = (href) => {
    if (href === '/') return norm === '/';
    if (href === '/categories') return norm === '/categories' || norm.startsWith('/category');
    if (href === '/accounts') return norm === '/accounts';
    if (href === '/sign') return norm === '/sign';
    if (href === '/user') return norm === '/user' || norm === '/login';
    return norm === href;
  };
  return (
    <nav className="tabbar">
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          className={'tab-item' + (it.home ? ' tab-item-home' : '') + (isActive(it.href) ? ' active' : '')}
          href={it.href}
        >
          {it.icon}
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
