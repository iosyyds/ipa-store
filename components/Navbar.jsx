'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const { loggedIn } = useAuth();
  // 详情页自带返回按钮与下载栏，不显示全局导航
  if (pathname.startsWith('/app')) return null;
  return (
    <nav className="navbar">
      <div className="container">
        <Link className="brand" href="/">
          <span className="mark">
            <img src="/favicon.svg" alt="甜甜-IPA应用库" />
          </span>
          <span className="brand-text">
            <span className="brand-name">甜甜-IPA应用库</span>
            <span className="brand-sub">IPA · SIGN · INSTALL</span>
          </span>
        </Link>
        <div className="nav-links">
          <Link href="/">首页</Link>
          <Link href="/categories">分类</Link>
          <Link href="/accounts">小火箭</Link>
          <Link href="/sign">签名</Link>
          <Link href="/user">{loggedIn ? '我的' : '登录'}</Link>
        </div>
      </div>
    </nav>
  );
}
