import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, TextArea, Button, Space, Card, Tag, Toast, DotLoading } from 'antd-mobile';
import {
  createProject,
  fetchProjectDetail,
  updateProject,
} from '../api/projects';
import { getApiErrorMessage } from '../api/errors';

function buildDraftFromIdea(idea: string) {
  const text = idea.trim();
  const title =
    text.length > 24 ? `${text.slice(0, 24)}…` : text || '未命名项目';
  return {
    title,
    description: text,
    tags: '效率工具,AI应用',
    workMode: 'remote' as const,
    durationWeeks: 4,
    teamMax: 4,
    roles: [
      { name: '产品经理', count: 1 },
      { name: '前端开发', count: 1 },
      { name: 'UI设计', count: 1 },
    ],
    rawInput: text,
  };
}

export default function PublishPage() {
  const navigate = useNavigate();
  const params = useParams();
  const editingId = params.projectId ? Number(params.projectId) : NaN;
  const isEditing = Number.isFinite(editingId) && editingId > 0;

  const [step, setStep] = useState<1 | 2>(1);
  const [ideaText, setIdeaText] = useState('');
  const [title, setTitle] = useState('');
  const [loadingDraft, setLoadingDraft] = useState(isEditing);
  const [isGenerating, setIsGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const draft = useMemo(() => {
    const base = buildDraftFromIdea(ideaText);
    if (title.trim()) {
      return { ...base, title: title.trim() };
    }
    return base;
  }, [ideaText, title]);

  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;
    (async () => {
      setLoadingDraft(true);
      try {
        const res = await fetchProjectDetail(editingId);
        if (cancelled) return;
        if (res.code !== 0 || !res.data) {
          Toast.show({ content: res.message || '草稿加载失败' });
          navigate('/publish', { replace: true });
          return;
        }
        const p = res.data;
        setIdeaText(p.description || p.title || '');
        setTitle(p.title || '');
        setStep(2);
      } catch (err) {
        if (!cancelled) {
          Toast.show({
            content: getApiErrorMessage(err, '草稿加载失败'),
          });
          navigate('/publish', { replace: true });
        }
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editingId, isEditing, navigate]);

  const handleGenerate = () => {
    if (!ideaText.trim()) {
      Toast.show({ content: '请先描述您的项目想法' });
      return;
    }
    setIsGenerating(true);
    setTitle('');
    setTimeout(() => {
      setIsGenerating(false);
      setStep(2);
    }, 400);
  };

  async function saveOrPublish(asDraft: boolean) {
    if (!ideaText.trim() && !title.trim()) {
      Toast.show({ content: '请先填写项目想法' });
      return;
    }

    const payload = {
      ...draft,
      isDraft: asDraft,
    };

    if (asDraft) {
      setSavingDraft(true);
    } else {
      setPublishing(true);
    }

    try {
      const res = isEditing
        ? await updateProject(editingId, payload)
        : await createProject(payload);

      if (res.code !== 0 || !res.data) {
        Toast.show({
          icon: 'fail',
          content: res.message || (asDraft ? '保存失败' : '发布失败'),
        });
        return;
      }

      Toast.show({
        icon: 'success',
        content: asDraft ? '草稿已保存' : '项目发布成功',
      });

      if (asDraft) {
        navigate('/drafts', { replace: true });
        return;
      }

      const projectId =
        'projectId' in res.data
          ? Number((res.data as { projectId?: number }).projectId)
          : res.data.id;
      navigate(projectId ? `/projects/${projectId}` : '/discover', {
        replace: true,
      });
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: getApiErrorMessage(
          err,
          asDraft ? '保存失败，请稍后重试' : '发布失败，请稍后重试',
        ),
      });
    } finally {
      setSavingDraft(false);
      setPublishing(false);
    }
  }

  if (loadingDraft) {
    return (
      <div className="page" style={{ paddingTop: 80, textAlign: 'center' }}>
        <DotLoading color="primary" />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#F4F6F9',
        minHeight: '100vh',
        paddingBottom: '32px',
      }}
    >
      {step === 1 && (
        <>
          <NavBar
            right={
              <span
                style={{ fontSize: '14px', color: '#1677FF' }}
                onClick={() => navigate('/drafts')}
              >
                我的草稿
              </span>
            }
            onBack={() => navigate(-1)}
            style={{ backgroundColor: '#fff' }}
          >
            发布项目
          </NavBar>

          <div style={{ padding: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '0 8px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}
                >
                  把想法变成项目
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  描述想法后生成草稿，可保存或直接发布
                </div>
              </div>
              <div style={{ fontSize: '48px' }}>🤖</div>
            </div>

            <Card
              style={{
                borderRadius: '16px',
                marginBottom: '16px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                }}
              >
                描述项目想法
              </div>
              <div
                style={{
                  backgroundColor: '#F7F8FA',
                  borderRadius: '12px',
                  padding: '12px',
                }}
              >
                <TextArea
                  placeholder="做一个 AI 学习规划助手，帮助大学生管理学习任务..."
                  value={ideaText}
                  onChange={(val) => setIdeaText(val)}
                  autoSize={{ minRows: 4, maxRows: 6 }}
                  maxLength={500}
                  showCount
                  style={{
                    backgroundColor: 'transparent',
                    '--font-size': '15px',
                  }}
                />
              </div>
            </Card>

            <Card
              style={{
                borderRadius: '16px',
                marginBottom: '24px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>实时预览</div>
                <Tag color="primary" fill="outline">
                  本地预览
                </Tag>
              </div>
              <Space direction="vertical" style={{ width: '100%', '--gap': '12px' }}>
                <div
                  style={{
                    backgroundColor: '#F7F8FA',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                >
                  {ideaText.trim() ? draft.title : '等待输入...'}
                </div>
              </Space>
            </Card>

            <Button
              block
              color="primary"
              size="large"
              loading={isGenerating}
              onClick={handleGenerate}
              style={{ borderRadius: '24px', fontWeight: 'bold' }}
            >
              下一步：确认草稿
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <NavBar onBack={() => setStep(1)} style={{ backgroundColor: '#fff' }}>
            {isEditing ? '编辑草稿' : '确认发布'}
          </NavBar>

          <div style={{ padding: '16px' }}>
            <Card
              style={{
                borderRadius: '16px',
                marginBottom: '16px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                }}
              >
                项目信息
              </div>
              <Space direction="vertical" style={{ width: '100%', '--gap': '16px' }}>
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#1677FF',
                      marginBottom: '4px',
                    }}
                  >
                    项目名称
                  </div>
                  <TextArea
                    value={draft.title}
                    onChange={(val) => setTitle(val)}
                    autoSize={{ minRows: 1, maxRows: 2 }}
                    style={{
                      backgroundColor: '#F7F8FA',
                      borderRadius: '8px',
                      padding: '8px',
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#1677FF',
                      marginBottom: '4px',
                    }}
                  >
                    项目简介
                  </div>
                  <div style={{ fontSize: '15px', color: '#333', lineHeight: 1.5 }}>
                    {draft.description || '（无）'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#1677FF',
                      marginBottom: '4px',
                    }}
                  >
                    协作方式
                  </div>
                  <div style={{ fontSize: '15px', color: '#333' }}>
                    远程 · {draft.durationWeeks} 周 · 最多 {draft.teamMax} 人
                  </div>
                </div>
              </Space>
            </Card>

            <Card
              style={{
                borderRadius: '16px',
                marginBottom: '24px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                }}
              >
                招募角色
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {draft.roles.map((role) => (
                  <div
                    key={role.name}
                    style={{
                      flex: '0 0 auto',
                      backgroundColor: '#E6F4FF',
                      border: '1px solid #91CAFF',
                      borderRadius: '8px',
                      padding: '12px',
                      minWidth: '80px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#333',
                        fontWeight: 'bold',
                      }}
                    >
                      {role.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      {role.count}人
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                loading={savingDraft}
                style={{
                  flex: 1,
                  borderRadius: '24px',
                  color: '#1677FF',
                  borderColor: '#1677FF',
                }}
                onClick={() => saveOrPublish(true)}
              >
                保存草稿
              </Button>
              <Button
                color="primary"
                loading={publishing}
                style={{
                  flex: 1,
                  borderRadius: '24px',
                  boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)',
                }}
                onClick={() => saveOrPublish(false)}
              >
                发布项目
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
