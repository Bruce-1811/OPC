import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  DotLoading,
  Empty,
  ErrorBlock,
  Toast,
} from 'antd-mobile';
import {
  fetchProjectApplications,
  reviewApplication,
  type ProjectApplicationItem,
} from '../api/applications';
import { fetchProjectDetail } from '../api/projects';
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

export default function ProjectApplicationsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);

  const [title, setTitle] = useState('');
  const [list, setList] = useState<ProjectApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(projectId) || projectId < 1) {
      setError('无效的项目 ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [detailRes, appsRes] = await Promise.all([
        fetchProjectDetail(projectId),
        fetchProjectApplications(projectId),
      ]);

      if (detailRes.code === 0 && detailRes.data) {
        setTitle(detailRes.data.title);
      }

      if (appsRes.code !== 0 || !appsRes.data) {
        setError(appsRes.message || '加载失败');
        return;
      }
      setList(appsRes.data.list);
    } catch (err) {
      setError(getApiErrorMessage(err, '网络错误或无权限'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

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
      setList((prev) =>
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

  return (
    <div className="page">
      <Button
        fill="none"
        size="small"
        onClick={() => navigate(`/projects/${projectId}`)}
      >
        ← 返回详情
      </Button>
      <h1>申请审核</h1>
      <p className="publish-hint">{title || `项目 #${projectId}`}</p>
      <Button
        fill="none"
        size="mini"
        onClick={() => navigate('/applications?tab=received')}
      >
        查看全部收到的申请 →
      </Button>

      {error ? (
        <ErrorBlock status="default" title="无法加载申请" description={error} />
      ) : list.length === 0 ? (
        <Empty description="暂无人申请" />
      ) : (
        <div className="app-card-list">
          {list.map((item) => (
            <div key={item.id} className="app-card">
              <div className="app-card-head">
                <strong>{item.user.nickname}</strong>
                <span className={statusClass(item.status)}>
                  {statusLabel(item.status)}
                </span>
              </div>
              <div className="app-item-desc">
                <span>角色：{item.roleName || '未指定'}</span>
                {item.message ? <span>{item.message}</span> : null}
              </div>
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
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
