import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, DotLoading, ErrorBlock, Tag, Toast } from 'antd-mobile';
import { fetchProjectDetail, type ProjectDetail } from '../api/projects';
import { getApiErrorMessage } from '../api/errors';

function workModeLabel(mode: string | null) {
  if (mode === 'remote') return '远程协作';
  if (mode === 'onsite') return '线下协作';
  if (mode === 'hybrid') return '混合协作';
  return '协作方式待定';
}

function phaseStatusLabel(status?: string) {
  if (status === 'done') return '已完成';
  if (status === 'ongoing') return '进行中';
  return '待开始';
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);

  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId < 1) {
      setError('无效的项目 ID');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchProjectDetail(projectId);
        if (cancelled) return;
        if (res.code !== 0 || !res.data) {
          setError(res.message || '加载失败');
          return;
        }
        if (res.data.isDraft) {
          navigate(`/publish/${projectId}`, { replace: true });
          return;
        }
        setDetail(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, '网络错误'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, navigate]);

  function onContact() {
    Toast.show({
      content: '联系发布人（消息功能将在阶段三/四开放）',
    });
  }

  function onApply() {
    Toast.show({
      content: '申请加入（阶段三开放，将对接申请接口）',
    });
  }

  if (loading) {
    return (
      <div className="page discover-loading">
        <DotLoading color="primary" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="page">
        <ErrorBlock status="default" title="无法打开项目" description={error} />
        <Button block onClick={() => navigate('/discover')}>
          返回发现
        </Button>
      </div>
    );
  }

  return (
    <div className="project-detail-wrap">
      <div className="page project-detail-page">
        <Button fill="none" size="small" onClick={() => navigate(-1)}>
          ← 返回
        </Button>

        <div
          className="project-detail-cover"
          style={
            detail.cover
              ? { backgroundImage: `url(${detail.cover})` }
              : undefined
          }
        >
          {!detail.cover ? detail.title.slice(0, 1) : null}
        </div>

        <h1>{detail.title}</h1>
        {detail.tags.length > 0 ? (
          <div className="discover-tags">
            {detail.tags.map((tag) => (
              <Tag key={tag} fill="outline">
                {tag}
              </Tag>
            ))}
          </div>
        ) : null}

        <p className="project-detail-desc">
          {detail.description || '暂无简介'}
        </p>

        <ul className="project-detail-meta">
          <li>{workModeLabel(detail.workMode)}</li>
          <li>
            团队 {detail.teamCurrent}/{detail.teamMax}
          </li>
          {detail.deadline ? <li>截止 {detail.deadline}</li> : null}
          {detail.durationWeeks ? (
            <li>周期 {detail.durationWeeks} 周</li>
          ) : null}
          <li>发布者 {detail.owner.nickname}</li>
        </ul>

        {detail.roles.length > 0 ? (
          <section className="project-detail-section">
            <h2>招募角色</h2>
            <ul className="project-detail-roles">
              {detail.roles.map((role) => (
                <li key={role.name}>
                  <strong>{role.name}</strong>
                  <span>
                    {role.filled ?? 0}/{role.count ?? 1} 人
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {detail.phases.length > 0 ? (
          <section className="project-detail-section">
            <h2>项目安排</h2>
            <ul className="project-detail-phases">
              {detail.phases.map((phase) => (
                <li key={phase.name}>
                  <span>{phase.name}</span>
                  <span className="phase-status">
                    {phaseStatusLabel(phase.status)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="project-detail-footer">
        <Button fill="outline" onClick={onContact}>
          联系发布人
        </Button>
        <Button color="primary" onClick={onApply}>
          申请加入
        </Button>
      </div>
    </div>
  );
}
