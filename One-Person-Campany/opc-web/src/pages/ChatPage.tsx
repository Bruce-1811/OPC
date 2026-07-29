import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  DotLoading,
  Empty,
  ErrorBlock,
  Input,
  Toast,
} from 'antd-mobile';
import { fetchMe } from '../api/auth';
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  sendMessage,
  type ChatMessage,
} from '../api/conversations';
import { getApiErrorMessage } from '../api/errors';

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId: rawId } = useParams();
  const conversationId = Number(rawId);

  const stateName =
    typeof (location.state as { name?: unknown } | null)?.name === 'string'
      ? (location.state as { name: string }).name
      : null;

  const [title, setTitle] = useState(stateName || '聊天');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const load = useCallback(async () => {
    if (!Number.isFinite(conversationId) || conversationId < 1) {
      setError('无效的会话');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [meRes, msgRes, listRes] = await Promise.all([
        fetchMe(),
        fetchMessages(conversationId, 1, 50),
        stateName
          ? Promise.resolve(null)
          : fetchConversations().catch(() => null),
        markConversationRead(conversationId).catch(() => null),
      ]);

      if (meRes.code === 0 && meRes.data) {
        setMyUserId(meRes.data.id);
      }

      if (msgRes.code !== 0 || !msgRes.data) {
        setError(msgRes.message || '加载消息失败');
        return;
      }

      // 接口按时间倒序，展示时翻成正序（旧 → 新）
      setMessages([...msgRes.data.list].reverse());

      if (!stateName && listRes && listRes.code === 0 && listRes.data) {
        const found = listRes.data.list.find((c) => c.id === conversationId);
        if (found?.name) setTitle(found.name);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, '网络错误'));
    } finally {
      setLoading(false);
    }
  }, [conversationId, stateName]);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages, scrollToBottom]);

  async function onSend() {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await sendMessage(conversationId, content);
      if (res.code !== 0 || !res.data) {
        Toast.show({ icon: 'fail', content: res.message || '发送失败' });
        return;
      }

      setText('');
      const optimistic: ChatMessage = {
        id: res.data.id,
        senderId: myUserId ?? 0,
        senderNickname: '我',
        senderAvatar: null,
        content: res.data.content,
        aiTag: null,
        createdAt: res.data.createdAt,
      };
      setMessages((prev) => [...prev, optimistic]);
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: getApiErrorMessage(err, '发送失败'),
      });
    } finally {
      setSending(false);
    }
  }

  if (!Number.isFinite(conversationId) || conversationId < 1) {
    return (
      <div className="page">
        <ErrorBlock status="default" title="无效会话" />
        <Button fill="none" onClick={() => navigate('/message')}>
          ← 返回消息
        </Button>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <Button fill="none" size="small" onClick={() => navigate('/message')}>
          ← 返回
        </Button>
        <h1>{title}</h1>
        <span className="chat-header-spacer" />
      </div>

      <div className="chat-body">
        {loading ? (
          <div className="discover-loading">
            <DotLoading color="primary" />
          </div>
        ) : error ? (
          <ErrorBlock status="default" title="加载失败" description={error} />
        ) : messages.length === 0 ? (
          <Empty description="还没有消息，打个招呼吧" />
        ) : (
          <div className="chat-messages">
            {messages.map((m) => {
              const mine = myUserId != null && m.senderId === myUserId;
              return (
                <div
                  key={m.id}
                  className={`chat-bubble-row ${mine ? 'is-mine' : 'is-other'}`}
                >
                  {!mine ? (
                    <div className="chat-avatar">
                      {(m.senderNickname || '?').slice(0, 1)}
                    </div>
                  ) : null}
                  <div className="chat-bubble-wrap">
                    {!mine ? (
                      <div className="chat-sender">{m.senderNickname}</div>
                    ) : null}
                    <div className={`chat-bubble ${mine ? 'mine' : ''}`}>
                      {m.content}
                    </div>
                    <div className="chat-time">{formatMsgTime(m.createdAt)}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="chat-composer">
        <Input
          placeholder="输入消息…"
          value={text}
          onChange={setText}
          onEnterPress={onSend}
          clearable
        />
        <Button
          color="primary"
          size="small"
          loading={sending}
          disabled={!text.trim()}
          onClick={onSend}
        >
          发送
        </Button>
      </div>
    </div>
  );
}
