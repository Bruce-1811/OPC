import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DotLoading, Empty, ErrorBlock, List, Tag, Toast } from 'antd-mobile';
import { fetchFavorites, removeFavorite, type FavoriteItem } from '../api/favorites';
import { getApiErrorMessage } from '../api/errors';

function parseTags(tags: string | null) {
  if (!tags?.trim()) return [];
  return tags
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchFavorites();
      if (res.code !== 0 || !res.data) {
        setError(res.message || '加载失败');
        return;
      }
      setList(res.data.list);
    } catch (err) {
      setError(getApiErrorMessage(err, '网络错误'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onUnfavorite(item: FavoriteItem, e: MouseEvent) {
    e.stopPropagation();
    try {
      const res = await removeFavorite(item.projectId);
      if (res.code !== 0) {
        Toast.show({ icon: 'fail', content: res.message || '取消失败' });
        return;
      }
      setList((prev) => prev.filter((f) => f.id !== item.id));
      Toast.show({ content: '已取消收藏' });
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: getApiErrorMessage(err, '取消失败'),
      });
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
      <Button fill="none" size="small" onClick={() => navigate('/profile')}>
        ← 返回
      </Button>
      <h1>收藏项目</h1>
      <p className="publish-hint">你感兴趣的项目会集中在这里</p>

      {error ? (
        <ErrorBlock status="default" title="加载失败" description={error} />
      ) : list.length === 0 ? (
        <Empty description="暂无收藏" />
      ) : (
        <List>
          {list.map((item) => {
            const tags = parseTags(item.project.tags);
            return (
              <List.Item
                key={item.id}
                description={`${item.project.teamCurrent}/${item.project.teamMax} 人`}
                extra={
                  <Button
                    size="mini"
                    fill="outline"
                    onClick={(e) => onUnfavorite(item, e)}
                  >
                    取消
                  </Button>
                }
                onClick={() => navigate(`/projects/${item.projectId}`)}
                arrow
              >
                <div className="draft-item-title">{item.project.title}</div>
                {tags.length > 0 ? (
                  <div className="discover-tags draft-item-tags">
                    {tags.slice(0, 3).map((tag) => (
                      <Tag key={tag} fill="outline">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                ) : null}
              </List.Item>
            );
          })}
        </List>
      )}
    </div>
  );
}
