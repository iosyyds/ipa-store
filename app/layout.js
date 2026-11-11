import './style.css';
import './feed.css';
import './glass.css';
import Navbar from '@/components/Navbar';
import Tabbar from '@/components/Tabbar';
import Providers from '@/components/Providers';

const CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://ipaht.puaaa.cn; " +
  "object-src 'none'; base-uri 'self'; form-action 'self'";

export const metadata = {
  metadataBase: new URL('https://ipa.puaaa.cn'),
  title: {
    default: '甜甜-IPA应用库 - iOS IPA 应用下载',
    template: '%s - 甜甜-IPA应用库',
  },
  description:
    '甜甜-IPA应用库，精选 iPhone、iPad 上的 iOS IPA 应用，登录后即可下载安装，安全、干净、移动端优先。',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBar: 'default',
    title: '甜甜',
  },
  openGraph: {
    type: 'website',
    siteName: '甜甜-IPA应用库',
    locale: 'zh_CN',
    url: 'https://ipa.puaaa.cn',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a84ff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
      <body>
        <Providers>
          <Navbar />
          {children}
          <Tabbar />
        </Providers>
      </body>
    </html>
  );
}
