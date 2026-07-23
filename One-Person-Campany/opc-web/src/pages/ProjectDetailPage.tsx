import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  DotLoading,
  ErrorBlock,
  Form,
  Popup,
  Selector,
  Tag,
  TextArea,
  Toast,
} from 'antd-mobile';
import { fetchMe } from '../api/auth';
import { submitApplication } from '../api/applications';
import { addFavorite, removeFavorite } from '../api/favorites';
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [applyVisible, setApplyVisible] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string[]>([]);

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId < 1) {
      setError('无效的项目 ID');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [detailRes, meRes] = await Promise.all([
          fetchProjectDetail(projectId),
          fetchMe(),
        ]);
        if (cancelled) return;

        if (meRes.code === 0 && meRes.data) {
          setCurrentUserId(meRes.data.id);
        }

        if (detailRes.code !== 0 || !detailRes.data) {
          setError(detailRes.message || '加载失败');
          return;
        }
        if (detailRes.data.isDraft) {
          navigate(`/publish/${projectId}`, { replace: true });
          return;
        }
        setDetail(detailRes.data);
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

  const isOwner = useMemo(
    () =>
      currentUserId != null &&
      detail != null &&
      detail.owner.id === currentUserId,
    [currentUserId, detail],
  );

  const isMember = useMemo(
    () =>
      currentUserId != null &&
      detail != null &&
      detail.members.some((m) => m.userId === currentUserId),
    [currentUserId, detail],
  );

  const roleOptions = useMemo(() => {
    if (!detail) return [];
    if (detail.roles.length === 0) {
      return [{ label: '成员', value: '成员' }];
    }
    return detail.roles.map((role) => ({
      label: role.name,
      value: role.name,
    }));
  }, [detail]);

  async function onToggleFavorite() {
    if (!detail || favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (detail.isFavorite) {
        const res = await removeFavorite(detail.id);
        if (res.code !== 0) {
          Toast.show({ icon: 'fail', content: res.message || '取消失败' });
          return;
        }
        setDetail({ ...detail, isFavorite: false });
        Toast.show({ content: '已取消收藏' });
      } else {
        const res = await addFavorite(detail.id);
        if (res.code !== 0) {
          Toast.show({ icon: 'fail', content: res.message || '收藏失败' });
          return;
        }
        setDetail({ ...detail, isFavorite: true });
        Toast.show({ icon: 'success', content: '已收藏' });
      }
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: getApiErrorMessage(err, '操作失败'),
      });
    } finally {
      setFavoriteLoading(false);
    }
  }

  function onContact() {
    Toast.show({
      content: '联系发布人（消息功能将在阶段 5 开放）',
    });
  }

  function openApply() {
    if (!detail) return;
    if (isOwner) {
      navigate(`/projects/${detail.id}/applications`);
      return;
    }
    if (isMember) {
      Toast.show({ content: '您已是项目成员' });
      return;
    }
    if (detail.hasApplied) {
      Toast.show({ content: '您已提交过申请' });
      return;
    }
    setSelectedRole(roleOptions[0] ? [roleOptions[0].value] : []);
    setApplyVisible(true);
  }

  async function onSubmitApply(values: { message?: string }) {
    if (!detail) return;
    const roleName = selectedRole[0];
    if (!roleName) {
      Toast.show({ content: '请选择想担任的角色' });
      return;
    }

    setApplyLoading(true);
    try {
      const res = await submitApplication(detail.id, {
        roleName,
        message: values.message?.trim() || undefined,
      });
      if (res.code !== 0) {
        Toast.show({ icon: 'fail', content: res.message || '申请失败' });
        return;
      }
      setDetail({ ...detail, hasApplied: true });
      setApplyVisible(false);
      Toast.show({ icon: 'success', content: '申请已提交' });
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: getApiErrorMessage(err, '申请失败'),
      });
    } finally {
      setApplyLoading(false);
    }
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

  const primaryLabel = isOwner
    ? '审核申请'
    : isMember
      ? '已加入'
      : detail.hasApplied
        ? '已申请'
        : '申请加入';

  const primaryDisabled = !isOwner && (isMember || detail.hasApplied);

  return (
    <div className="project-detail-wrap">
      <div className="page project-detail-page">
        <div className="project-detail-top">
          <Button fill="none" size="small" onClick={() => navigate(-1)}>
            ← 返回
          </Button>
          <Button
            fill="none"
            size="small"
            loading={favoriteLoading}
            onClick={onToggleFavorite}
          >
            {detail.isFavorite ? '★ 已收藏' : '☆ 收藏'}
          </Button>
        </div>

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
        {!isOwner ? (
          <Button fill="outline" onClick={onContact}>
            联系发布人
          </Button>
        ) : (
          <Button fill="outline" onClick={onToggleFavorite} loading={favoriteLoading}>
            {detail.isFavorite ? '已收藏' : '收藏'}
          </Button>
        )}
        <Button
          color="primary"
          disabled={primaryDisabled}
          onClick={openApply}
        >
          {primaryLabel}
        </Button>
      </div>

      <Popup
        visible={applyVisible}
        onMaskClick={() => setApplyVisible(false)}
        bodyStyle={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      >
        <div className="apply-popup">
          <h2>申请加入</h2>
          <p className="apply-popup-hint">选择角色并简单介绍自己</p>
          <Form
            layout="vertical"
            onFinish={onSubmitApply}
            footer={
              <Button
                block
                type="submit"
                color="primary"
                loading={applyLoading}
              >
                提交申请
              </Button>
            }
          >
            <Form.Item label="想担任的角色" required>
              <Selector
                options={roleOptions}
                value={selectedRole}
                onChange={(val) => {
                  if (val.length) setSelectedRole(val as string[]);
                }}
              />
            </Form.Item>
            <Form.Item name="message" label="申请留言">
              <TextArea
                placeholder="例如：相关经验、可投入时间…"
                rows={3}
                maxLength={200}
                showCount
              />
            </Form.Item>
          </Form>
        </div>
      </Popup>
    </div>
  );
}
