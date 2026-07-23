import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  DotLoading,
  Empty,
  ErrorBlock,
  Tabs,
  Toast,
} from 'antd-mobile';
import {
  fetchMyApplications,
  fetchReceivedApplications,
  reviewApplication,
  type MyApplicationItem,
  type ProjectApplicationItem,
} from '../api/applications';
import { getApiErrorMessage } from '../api/errors';

function statusLabel(status: string) {
  if (status === 'pending') return '待审核';
  if (status === 'approved') return '已通过';
  if (status === 'rejected') return '已拒绝';
  return status;
}

function statusClass(status: string) {
  if (status === 'approved') return 'app-status app-status-ok';
  if (status === 'rejected') return 'app-status app-status-no';
  return 'app-status';
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyApplicationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    searchParams.get('tab') === 'received' ? 'received' : 'mine';

  const [tab, setTab] = useState<'mine' | 'received'>(initialTab);
  const [mineList, setMineList] = useState<MyApplicationItem[]>([]);
  const [receivedList, setReceivedList] = useState<ProjectApplicationItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [mineRes, receivedRes] = await Promise.all([
        fetchMyApplications(),
        fetchReceivedApplications(),
      ]);

      if (mineRes.code !== 0 || !mineRes.data) {
        setError(mineRes.message || '加载失败');
        return;
      }
      if (receivedRes.code !== 0 || !receivedRes.data) {
        setError(receivedRes.message || '加载失败');
        return;
      }

      setMineList(mineRes.data.list);
      setReceivedList(receivedRes.data.list);
    } catch (err) {
      setError(getApiErrorMessage(err, '网络错误'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  function onTabChange(key: string) {
    const next = key === 'received' ? 'received' : 'mine';
    setTab(next);
    setSearchParams(next === 'received' ? { tab: 'received' } : {});
  }

  async function onReview(
    item: ProjectApplicationItem,
    status: 'approved' | 'rejected',
  ) {
    if (actingId != null) return;

    setActingId(item.id);
    try {
      const res = await reviewApplication(item.id, status);
      if (res.code !== 0) {
        Toast.show({ icon: 'fail', content: res.message || '操作失败' });
        return;
      }
      setReceivedList((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, status } : a)),
      );
      Toast.show({
        icon: 'success',
        content: status === 'approved' ? '已通过，对方已成为成员' : '已拒绝',
      });
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: getApiErrorMessage(err, '操作失败'),
      });
    } finally {
      setActingId(null);
    }
  }

  if (loading) {
    return (
      <div className="page discover-loading">
        <DotLoading color="primary" />
      </div>
    );
  }

  const pendingReceived = receivedList.filter((a) => a.status === 'pending');

  return (
    <div className="page">
      <Button fill="none" size="small" onClick={() => navigate('/profile')}>
        ← 返回
      </Button>
      <h1>项目申请</h1>
      <p className="publish-hint">查看你发出的申请，或审核别人对你项目的申请</p>

      {error ? (
        <ErrorBlock status="default" title="加载失败" description={error} />
      ) : (
        <Tabs activeKey={tab} onChange={onTabChange}>
          <Tabs.Tab title={`我发出的(${mineList.length})`} key="mine">
            {mineList.length === 0 ? (
              <Empty description="暂无申请记录" />
            ) : (
              <div className="app-card-list">
                {mineList.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="app-card"
                    onClick={() => navigate(`/projects/${item.projectId}`)}
                  >
                    <div className="app-card-head">
                      <strong>{item.project.title}</strong>
                      <span className={statusClass(item.status)}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="app-item-desc">
                      <span>角色：{item.roleName || '未指定'}</span>
                      <span>{formatTime(item.createdAt)}</span>
                    </div>
                    {item.message ? (
                      <div className="app-item-message">{item.message}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </Tabs.Tab>

          <Tabs.Tab
            title={`待我审核(${pendingReceived.length})`}
            key="received"
          >
            {receivedList.length === 0 ? (
              <Empty description="暂无收到的申请" />
            ) : (
              <div className="app-card-list">
                {receivedList.map((item) => (
                  <div key={item.id} className="app-card">
                    <div className="app-card-head">
                      <strong>{item.user.nickname}</strong>
                      <span className={statusClass(item.status)}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="app-item-desc">
                      <span>项目：{item.project?.title ?? `#${item.projectId}`}</span>
                      <span>角色：{item.roleName || '未指定'}</span>
                      <span>{formatTime(item.createdAt)}</span>
                    </div>
                    {item.message ? (
                      <div className="app-item-message">{item.message}</div>
                    ) : null}
                    {item.status === 'pending' ? (
                      <div className="app-card-actions">
                        <Button
                          color="primary"
                          size="small"
                          loading={actingId === item.id}
                          onClick={() => onReview(item, 'approved')}
                        >
                          通过
                        </Button>
                        <Button
                          fill="outline"
                          size="small"
                          loading={actingId === item.id}
                          onClick={() => onReview(item, 'rejected')}
                        >
                          拒绝
                        </Button>
                        <Button
                          fill="none"
                          size="small"
                          onClick={() =>
                            navigate(`/projects/${item.projectId}`)
                          }
                        >
                          看项目
                        </Button>
                      </div>
                    ) : (
                      <div className="app-card-actions">
                        <Button
                          fill="none"
                          size="small"
                          onClick={() =>
                            navigate(`/projects/${item.projectId}`)
                          }
                        >
                          看项目
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Tabs.Tab>
        </Tabs>
      )}
    </div>
  );
}
