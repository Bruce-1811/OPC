import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, DotLoading, List, Tag } from 'antd-mobile';
import { fetchMe, type UserProfile } from '../api/auth';
import { clearToken } from '../api/client';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchMe();
        if (cancelled) return;
        if (res.code !== 0 || !res.data) {
          setError(res.message || '加载失败');
          return;
        }
        setUser(res.data);
      } catch {
        if (!cancelled) setError('网络错误');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function logout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  if (loading) {
    return (
      <div className="page profile-page">
        <DotLoading color="primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="page profile-page">
        <p>{error || '未找到用户'}</p>
        <Button onClick={() => navigate('/login')}>去登录</Button>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <div className="profile-hero">
        <Avatar
          src={user.avatar ?? ''}
          fallback={user.nickname.slice(0, 1)}
          style={{ '--size': '72px' }}
          className="profile-avatar"
        />
        <h1>{user.nickname}</h1>
        <p className="profile-phone">{user.phone}</p>
        {user.bio ? <p className="profile-bio">{user.bio}</p> : null}
      </div>

      {user.skills.length > 0 ? (
        <div className="profile-skills">
          {user.skills.map((skill) => (
            <Tag key={skill} color="primary" fill="outline">
              {skill}
            </Tag>
          ))}
        </div>
      ) : null}

      <List header="数据概览">
        <List.Item extra={user.stats.projectsJoined}>参与项目</List.Item>
        <List.Item
          extra={user.stats.applicationsPending}
          onClick={() => navigate('/applications')}
          arrow
        >
          我发出的申请
        </List.Item>
        <List.Item
          extra={user.stats.applicationsToReview ?? 0}
          onClick={() => navigate('/applications?tab=received')}
          arrow
        >
          待我审核
        </List.Item>
      </List>

      <List header="项目">
        <List.Item onClick={() => navigate('/favorites')} arrow>
          收藏项目
        </List.Item>
        <List.Item onClick={() => navigate('/applications')} arrow>
          项目申请
        </List.Item>
        <List.Item onClick={() => navigate('/drafts')} arrow>
          草稿箱
        </List.Item>
        <List.Item onClick={() => navigate('/assistant')} arrow>
          问培风
        </List.Item>
      </List>

      <div className="profile-actions">
        <Button block color="primary" onClick={() => navigate('/profile/edit')}>
          编辑资料
        </Button>
        <Button block fill="outline" onClick={logout}>
          退出登录
        </Button>
      </div>
    </div>
  );
}
