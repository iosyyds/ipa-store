'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const { loggedIn } = useAuth();
  return (
    <nav className="navbar">
      <div className="container">
        <Link className="brand" href="/">
          <span className="mark">
            <img src="/favicon.svg" alt="甜甜-IPA应用库" />
          </span>
          <span>甜甜-IPA应用库</span>
        </Link>
        <div className="nav-links">
          <Link href="/">首页</Link>
          <Link href="/categories">分类</Link>
          <Link href="/user">{loggedIn ? '我的' : '登录'}</Link>
        </div>
      </div>
    </nav>
  );
}
