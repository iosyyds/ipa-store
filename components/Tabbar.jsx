'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HomeSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);
const GridSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const MeSvg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </svg>
);

const ITEMS = [
  { href: '/', label: '首页', icon: HomeSvg },
  { href: '/categories', label: '分类', icon: GridSvg },
  { href: '/user', label: '我的', icon: MeSvg },
];

export default function Tabbar() {
  const pathname = usePathname();
  // 详情页使用自带下载栏，不显示全局 Tab
  if (pathname.startsWith('/app')) return null;
  return (
    <nav className="tabbar">
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          className={'tab-item' + (pathname === it.href ? ' active' : '')}
          href={it.href}
        >
          {it.icon}
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
