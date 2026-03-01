import type { AppProps } from 'next/app';
/* 关键：Pages 路由不会走 app/layout，必须在这里引入设计系统样式 */
import '../app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
