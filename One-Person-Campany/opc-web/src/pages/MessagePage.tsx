import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, DotLoading, Empty, ErrorBlock, List } from 'antd-mobile';
import {
  fetchConversations,
  type ConversationItem,
} from '../api/conversations';
import { getApiErrorMessage } from '../api/errors';

function formatTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

export default function MessagePage() {
  const navigate = useNavigate();
  const [list, setList] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchConversations();
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="page discover-loading">
        <DotLoading color="primary" />
      </div>
    );
  }

  return (
    <div className="page message-page">
      <h1>消息</h1>
      <p className="publish-hint">项目群聊与私信会显示在这里</p>

      {error ? (
        <ErrorBlock status="default" title="加载失败" description={error} />
      ) : list.length === 0 ? (
        <Empty description="暂无会话，通过申请加入项目后会出现项目群" />
      ) : (
        <List className="message-list">
          {list.map((item) => (
            <List.Item
              key={item.id}
              description={item.lastMessage || '暂无消息'}
              extra={
                <div className="message-list-extra">
                  <span className="message-list-time">
                    {formatTime(item.lastMessageAt)}
                  </span>
                  {item.unreadCount > 0 ? (
                    <Badge content={item.unreadCount > 99 ? '99+' : item.unreadCount} />
                  ) : null}
                </div>
              }
              onClick={() =>
                navigate(`/message/${item.id}`, {
                  state: { name: item.name },
                })
              }
              arrow
            >
              <div className="draft-item-title">
                {item.name || (item.type === 'private' ? '私聊' : '会话')}
              </div>
            </List.Item>
          ))}
        </List>
      )}
    </div>
  );
}
