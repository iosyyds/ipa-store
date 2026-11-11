import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="login-wrap">
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, margin: '0 auto 18px' }}>
          <img src="/favicon.svg" alt="甜甜-IPA应用库" />
        </div>
        <h1 style={{ fontSize: 22 }}>页面不存在</h1>
        <p className="muted" style={{ margin: '8px 0 24px', fontSize: 14 }}>
          你访问的页面可能已被移除或地址有误
        </p>
        <Link className="btn btn-primary" href="/" style={{ padding: '12px 34px' }}>
          返回首页
        </Link>
      </div>
    </div>
  );
}
