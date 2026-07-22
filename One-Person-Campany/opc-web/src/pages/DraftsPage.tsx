import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DotLoading, Empty, ErrorBlock, List, Tag } from 'antd-mobile';
import { fetchDrafts, type DraftListItem } from '../api/projects';
import { getApiErrorMessage } from '../api/errors';

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

export default function DraftsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<DraftListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchDrafts();
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
    })();
  }, []);

  if (loading) {
    return (
      <div className="page discover-loading">
        <DotLoading color="primary" />
      </div>
    );
  }

  return (
    <div className="page">
      <Button fill="none" size="small" onClick={() => navigate('/publish')}>
        ← 新建发布
      </Button>
      <h1>草稿箱</h1>
      <p className="publish-hint">仅自己可见，编辑后可正式发布到发现页</p>

      {error ? (
        <ErrorBlock status="default" title="加载失败" description={error} />
      ) : list.length === 0 ? (
        <Empty description="暂无草稿" />
      ) : (
        <List>
          {list.map((item) => (
            <List.Item
              key={item.id}
              description={`更新于 ${formatTime(item.updatedAt)}`}
              onClick={() => navigate(`/publish/${item.id}`)}
              arrow
            >
              <div className="draft-item-title">{item.title}</div>
              {item.tags.length > 0 ? (
                <div className="discover-tags draft-item-tags">
                  {item.tags.slice(0, 3).map((tag) => (
                    <Tag key={tag} fill="outline">
                      {tag}
                    </Tag>
                  ))}
                </div>
              ) : null}
            </List.Item>
          ))}
        </List>
      )}
    </div>
  );
}
