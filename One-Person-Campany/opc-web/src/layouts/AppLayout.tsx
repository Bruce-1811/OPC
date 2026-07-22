import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import {
  AppOutline,
  MessageOutline,
  UnorderedListOutline,
  UserOutline,
} from 'antd-mobile-icons';
import { getHealth } from '../api/client';

const tabs = [
  { key: '/discover', title: '发现', icon: <AppOutline /> },
  { key: '/project', title: '项目', icon: <UnorderedListOutline /> },
  { key: '/publish', title: '发布', icon: <AppOutline /> },
  { key: '/message', title: '消息', icon: <MessageOutline /> },
  { key: '/profile', title: '我的', icon: <UserOutline /> },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState('检测中...');

  useEffect(() => {
    getHealth()
      .then((res) => {
        setHealthStatus(res.data?.status === 'ok' ? '后端已连接' : '后端异常');
      })
      .catch(() => {
        setHealthStatus('后端未连接');
      });
  }, []);

  const activeKey = (() => {
    if (
      location.pathname.startsWith('/projects') &&
      !location.pathname.startsWith('/projects/drafts')
    ) {
      return '/discover';
    }
    if (
      location.pathname.startsWith('/publish') ||
      location.pathname.startsWith('/drafts')
    ) {
      return '/publish';
    }
    return (
      tabs.find((tab) => location.pathname.startsWith(tab.key))?.key ??
      '/discover'
    );
  })();

  return (
    <div className="app-shell">
      <header className="app-header">
        <strong>OPC</strong>
        <span className="health-badge">{healthStatus}</span>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <TabBar activeKey={activeKey} onChange={(key) => navigate(key)}>
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  );
}
