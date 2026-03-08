'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface Health {
  vision: boolean;
  database: boolean;
}

interface Stats {
  storiesTotal: number;
  charactersTotal: number;
  storiesLast7Days: number;
  apiCallsLast7Days: Record<string, number>;
}

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [health, setHealth] = useState<Health | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [restartMessage, setRestartMessage] = useState('');

  const fetchAuth = () => {
    return axios.get('/api/admin/me', { withCredentials: true }).then(
      () => true,
      () => false
    );
  };

  useEffect(() => {
    fetchAuth().then(setAuthenticated);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    Promise.all([
      axios.get<Health>('/api/admin/health', { withCredentials: true }).then((r) => r.data),
      axios.get<Stats>('/api/admin/stats', { withCredentials: true }).then((r) => r.data),
    ]).then(([h, s]) => {
      setHealth(h);
      setStats(s);
    }).catch(() => {
      setHealth({ vision: false, database: false });
      setStats(null);
    });
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await axios.post('/api/admin/login', { password }, { withCredentials: true });
      setAuthenticated(true);
    } catch {
      setLoginError('密码错误');
    }
  };

  const handleRestartVision = async () => {
    setRestarting(true);
    setRestartMessage('');
    try {
      const r = await axios.post('/api/admin/restart-service', { name: 'vision' }, { withCredentials: true });
      setRestartMessage(r.data?.message || (r.data?.ok ? '已发送' : r.data?.error || ''));
    } catch (e: unknown) {
      const err = axios.isAxiosError(e) && e.response?.data?.error ? e.response.data.error : '请求失败';
      setRestartMessage(err);
    }
    setRestarting(false);
  };

  const refreshHealth = () => {
    if (!authenticated) return;
    axios.get<Health>('/api/admin/health', { withCredentials: true })
      .then((r) => setHealth(r.data))
      .catch(() => setHealth({ vision: false, database: false }));
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <p className="text-stone-500">验证中…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-stone-800 mb-6 text-center">管理后台登录</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="w-full px-4 py-3 rounded-xl border border-stone-300 mb-4"
            autoFocus
          />
          {loginError && <p className="text-red-600 text-sm mb-4">{loginError}</p>}
          <button type="submit" className="w-full py-3 rounded-xl bg-stone-800 text-white font-medium">
            登录
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-800 mb-6">管理仪表盘</h1>

        <section className="bg-white rounded-2xl shadow border border-stone-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-700 mb-4">服务状态</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 border-2 ${health?.database ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="font-medium text-stone-800">数据库</p>
              <p className="text-sm mt-1">{health?.database ? '运行中' : '异常'}</p>
            </div>
            <div className={`rounded-xl p-4 border-2 ${health?.vision ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="font-medium text-stone-800">视觉服务</p>
              <p className="text-sm mt-1">{health?.vision ? '运行中' : '未启动或不可达'}</p>
              {!health?.vision && (
                <button
                  type="button"
                  onClick={handleRestartVision}
                  disabled={restarting}
                  className="mt-2 text-sm px-3 py-1.5 rounded-lg bg-[var(--kid-primary)] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {restarting ? '请求中…' : '远程启动'}
                </button>
              )}
              {restartMessage && <p className="text-xs mt-2 text-stone-500">{restartMessage}</p>}
            </div>
          </div>
          <button type="button" onClick={refreshHealth} className="mt-4 text-sm text-stone-500 hover:underline">
            刷新状态
          </button>
        </section>

        <section className="bg-white rounded-2xl shadow border border-stone-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-700 mb-4">使用情况</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-[var(--kid-primary-soft)]/50 border border-[var(--kid-border-light)] p-4">
              <p className="text-2xl font-bold text-[var(--kid-primary-dark)]">{stats?.storiesTotal ?? '–'}</p>
              <p className="text-sm text-stone-600">故事总数</p>
            </div>
            <div className="rounded-xl bg-[var(--kid-mint)]/20 border border-[var(--kid-success)]/40 p-4">
              <p className="text-2xl font-bold text-[var(--kid-success)]">{stats?.charactersTotal ?? '–'}</p>
              <p className="text-sm text-stone-600">角色总数</p>
            </div>
            <div className="rounded-xl bg-[var(--kid-magic-light)]/10 border border-[var(--kid-magic-light)]/40 p-4">
              <p className="text-2xl font-bold text-[var(--kid-magic-dark)]">{stats?.storiesLast7Days ?? '–'}</p>
              <p className="text-sm text-stone-600">近 7 天创作</p>
            </div>
            <div className="rounded-xl bg-stone-100 border border-stone-200 p-4">
              <p className="text-sm font-medium text-stone-700">API 调用 (7 天)</p>
              <div className="mt-2 text-xs space-y-1">
                {stats?.apiCallsLast7Days && Object.entries(stats.apiCallsLast7Days).length > 0
                  ? Object.entries(stats.apiCallsLast7Days).map(([k, v]) => (
                      <p key={k}>{k}: {v}</p>
                    ))
                  : <p className="text-stone-500">暂无记录</p>}
              </div>
            </div>
          </div>
        </section>

        <div className="flex gap-4 text-sm text-stone-500">
          <a href="/" className="hover:underline">返回首页</a>
          <button
            type="button"
            onClick={async () => {
              await axios.post('/api/admin/logout', {}, { withCredentials: true });
              setAuthenticated(false);
            }}
            className="hover:underline"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
