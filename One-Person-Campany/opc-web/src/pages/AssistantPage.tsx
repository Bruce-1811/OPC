import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  DotLoading,
  ErrorBlock,
  Input,
  Toast,
} from 'antd-mobile';
import {
  fetchAiHistory,
  sendAiChat,
  type AiChatMessage,
  type AiSuggestion,
} from '../api/ai';
import { getApiErrorMessage } from '../api/errors';

type DisplayMessage = AiChatMessage & {
  suggestions?: AiSuggestion[];
};

const QUICK_ACTIONS: {
  label: string;
  prompt: string;
  tone: 'blue' | 'green' | 'purple' | 'orange';
  icon: string;
}[] = [
  {
    label: '今天要处理什么',
    prompt: '今天要处理什么？',
    tone: 'blue',
    icon: '日',
  },
  {
    label: '帮我找项目',
    prompt: '帮我找适合的项目',
    tone: 'green',
    icon: '项',
  },
  {
    label: '帮我优化表达',
    prompt: '帮我优化一段项目介绍',
    tone: 'purple',
    icon: '改',
  },
  {
    label: '总结未读消息',
    prompt: '总结未读消息',
    tone: 'orange',
    icon: '信',
  },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function suggestionPath(s: AiSuggestion): string | null {
  switch (s.type) {
    case 'task':
      return '/project';
    case 'message':
      return s.refId > 0 ? `/message/${s.refId}` : '/message';
    case 'application':
      return '/applications?tab=received';
    case 'project':
    case 'discover':
      return '/discover';
    case 'publish':
      return '/publish';
    default:
      return null;
  }
}

let mockId = 1000;
let mockHintShown = false;

function mockReply(content: string): {
  userMessage: AiChatMessage;
  assistantMessage: AiChatMessage;
  reply: string;
  suggestions: AiSuggestion[];
} {
  const now = new Date().toISOString();
  let reply: string;
  let suggestions: AiSuggestion[] = [];

  if (content.includes('今天要处理什么')) {
    reply =
      '今天建议优先处理：\n1. 查看项目 Tab 里的待办\n2. 回复消息里的未读会话\n3. 处理待审核的加入申请\n\n（当前为前端 Mock，后端就绪后会基于真实数据生成）';
    suggestions = [
      { type: 'task', refId: 0, title: '去处理待办' },
      { type: 'message', refId: 0, title: '去看消息' },
      { type: 'application', refId: 0, title: '去审核申请' },
    ];
  } else if (content.includes('找适合的项目') || content.includes('找项目')) {
    reply =
      '可以从「发现」页按标签或关键词浏览项目；完善技能后，匹配会更准。\n\n（Mock）';
    suggestions = [{ type: 'discover', refId: 0, title: '去发现页' }];
  } else if (content.includes('未读')) {
    reply =
      '请到「消息」查看带未读角标的会话，优先回复最近活跃的项目群。\n\n（Mock）';
    suggestions = [{ type: 'message', refId: 0, title: '打开消息' }];
  } else if (content.includes('优化') || content.includes('介绍')) {
    reply =
      '可以把草稿介绍发给我。建议写清：要解决什么问题、需要什么角色、预计周期。\n\n（Mock）';
    suggestions = [{ type: 'publish', refId: 0, title: '去发布页' }];
  } else {
    reply = `已收到：「${content}」。你可以点上方快捷能力，或继续追问。\n\n（Mock）`;
  }

  return {
    reply,
    suggestions,
    userMessage: {
      id: ++mockId,
      role: 'user',
      content,
      createdAt: now,
    },
    assistantMessage: {
      id: ++mockId,
      role: 'assistant',
      content: reply,
      createdAt: now,
    },
  };
}

export default function AssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAiHistory(1, 50);
      if (res.code !== 0 || !res.data) {
        setUsingMock(true);
        setMessages([]);
        return;
      }
      setUsingMock(false);
      const list = res.data.list ?? [];
      const ordered =
        list.length >= 2 &&
        new Date(list[0].createdAt).getTime() >
          new Date(list[list.length - 1].createdAt).getTime()
          ? [...list].reverse()
          : list;
      setMessages(ordered);
    } catch {
      setUsingMock(true);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useLayoutEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading, messages, sending, scrollToBottom]);

  const sendContent = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || sending) return;

      const optimisticUser: DisplayMessage = {
        id: Date.now(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser]);
      setText('');
      setSending(true);

      try {
        const res = await sendAiChat(content);
        if (res.code !== 0 || !res.data) {
          throw new Error(res.message || '发送失败');
        }

        setUsingMock(false);
        const assistantMsg: DisplayMessage = {
          ...(res.data.assistantMessage ?? {
            id: Date.now() + 1,
            role: 'assistant' as const,
            content: res.data.reply,
            createdAt: new Date().toISOString(),
          }),
          suggestions: res.data.suggestions?.length
            ? res.data.suggestions
            : undefined,
        };
        // 若后端也回了 userMessage，用服务端 id 替换乐观气泡
        setMessages((prev) => {
          const withoutOptimistic = prev.filter(
            (m) => m.id !== optimisticUser.id,
          );
          const userMsg: DisplayMessage = res.data!.userMessage ?? optimisticUser;
          return [...withoutOptimistic, userMsg, assistantMsg];
        });
      } catch (err) {
        const mocked = mockReply(content);
        setUsingMock(true);
        setMessages((prev) => {
          const withoutOptimistic = prev.filter(
            (m) => m.id !== optimisticUser.id,
          );
          return [
            ...withoutOptimistic,
            mocked.userMessage,
            {
              ...mocked.assistantMessage,
              suggestions: mocked.suggestions,
            },
          ];
        });
        if (!mockHintShown) {
          mockHintShown = true;
          Toast.show({
            content: getApiErrorMessage(
              err,
              '后端未就绪，已使用本地 Mock 演示',
            ),
          });
        }
      } finally {
        setSending(false);
      }
    },
    [sending],
  );

  function onSuggestionClick(s: AiSuggestion) {
    const path = suggestionPath(s);
    if (!path) {
      Toast.show({ content: '暂不支持该跳转' });
      return;
    }
    navigate(path);
  }

  function clearLocalChat() {
    setMessages([]);
    Toast.show({ content: '已清空本页对话（不影响服务端历史）' });
  }

  return (
    <div className="assistant-page">
      <div className="chat-header">
        <Button fill="none" size="small" onClick={() => navigate(-1)}>
          ← 返回
        </Button>
        <h1>问培风</h1>
        <Button fill="none" size="small" onClick={clearLocalChat}>
          清空
        </Button>
      </div>

      {usingMock ? (
        <p className="assistant-mock-hint">
          本地 Mock 演示中 · 后端 /ai 就绪后将自动切换真实接口
        </p>
      ) : null}

      <div className="chat-body assistant-body">
        {loading ? (
          <div className="discover-loading">
            <DotLoading color="primary" />
          </div>
        ) : error ? (
          <ErrorBlock status="default" title="加载失败" description={error} />
        ) : (
          <>
            <div className="assistant-hero">
              <div className="assistant-mascot" aria-hidden>
                培
              </div>
              <p className="assistant-greeting">
                我可以帮你处理项目、发布、申请和消息。有什么需要帮忙的吗？
              </p>
            </div>

            <div className="assistant-quick-grid">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.prompt}
                  type="button"
                  className={`assistant-quick-card tone-${action.tone}`}
                  disabled={sending || loading}
                  onClick={() => void sendContent(action.prompt)}
                >
                  <span className="assistant-quick-icon">{action.icon}</span>
                  <span className="assistant-quick-label">{action.label}</span>
                </button>
              ))}
            </div>

            {messages.length === 0 ? (
              <p className="assistant-empty-tip">
                点上面的能力卡片，或在下方直接提问
              </p>
            ) : (
              <div className="chat-messages">
                {messages.map((m) => {
                  const mine = m.role === 'user';
                  return (
                    <div
                      key={`${m.role}-${m.id}`}
                      className={`chat-bubble-row ${mine ? 'is-mine' : 'is-other'}`}
                    >
                      {!mine ? <div className="chat-avatar">培</div> : null}
                      <div className="chat-bubble-wrap">
                        {!mine ? (
                          <div className="chat-sender">培风</div>
                        ) : null}
                        <div className={`chat-bubble ${mine ? 'mine' : ''}`}>
                          {m.content}
                        </div>
                        {!mine && m.suggestions && m.suggestions.length > 0 ? (
                          <div className="assistant-suggestions">
                            {m.suggestions.map((s) => (
                              <button
                                key={`${s.type}-${s.refId}-${s.title}`}
                                type="button"
                                className="assistant-suggestion-chip"
                                onClick={() => onSuggestionClick(s)}
                              >
                                {s.title}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <div className="chat-time">
                          {formatTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sending ? (
                  <div className="chat-bubble-row is-other">
                    <div className="chat-avatar">培</div>
                    <div className="chat-bubble-wrap">
                      <div className="chat-sender">培风</div>
                      <div className="chat-bubble assistant-typing">
                        <DotLoading color="primary" />
                      </div>
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="chat-composer">
        <Input
          placeholder="问问培风…"
          value={text}
          onChange={setText}
          onEnterPress={() => void sendContent(text)}
          clearable
        />
        <Button
          color="primary"
          size="small"
          loading={sending}
          disabled={!text.trim() || sending}
          onClick={() => void sendContent(text)}
        >
          发送
        </Button>
      </div>
    </div>
  );
}
