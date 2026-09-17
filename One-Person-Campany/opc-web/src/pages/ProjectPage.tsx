import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tabs,
  ProgressBar,
  Checkbox,
  Toast,
  Avatar,
  Space,
  Tag,
  Button,
} from 'antd-mobile';
import { fetchMyProjects, type MyProjectItem } from '../api/projects';
import { updateTask } from '../api/tasks';
import {
  fetchMyApplications,
  fetchReceivedApplications,
  type MyApplicationItem,
  type ProjectApplicationItem,
} from '../api/applications';
import { getApiErrorMessage } from '../api/errors';

/** 前端 Tab → 后端 projects.status（「待确认」单独拉申请列表） */
const TAB_STATUS: Record<string, string | undefined> = {
  ongoing: 'recruiting',
  completed: 'completed',
  archived: 'archived',
};

function withProgress(item: MyProjectItem): MyProjectItem {
  const tasks = item.tasks ?? [];
  if (typeof item.progress === 'number' && !Number.isNaN(item.progress)) {
    return item;
  }
  if (tasks.length === 0) {
    return { ...item, progress: 0 };
  }
  const done = tasks.filter((t) => t.status === 'done').length;
  return {
    ...item,
    progress: Math.round((done / tasks.length) * 100),
  };
}

export default function ProjectPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<MyProjectItem[]>([]);
  const [myPending, setMyPending] = useState<MyApplicationItem[]>([]);
  const [receivedPending, setReceivedPending] = useState<
    ProjectApplicationItem[]
  >([]);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [loading, setLoading] = useState(false);

  const loadData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'pending') {
        const [mineRes, receivedRes] = await Promise.all([
          fetchMyApplications(),
          fetchReceivedApplications('pending'),
        ]);
        if (mineRes.code !== 0 || !mineRes.data) {
          Toast.show({ content: mineRes.message || '获取申请失败' });
          setMyPending([]);
        } else {
          setMyPending(
            (mineRes.data.list ?? []).filter((a) => a.status === 'pending'),
          );
        }
        if (receivedRes.code !== 0 || !receivedRes.data) {
          setReceivedPending([]);
        } else {
          setReceivedPending(receivedRes.data.list ?? []);
        }
        setProjects([]);
        return;
      }

      const status = TAB_STATUS[tab];
      const res = await fetchMyProjects(status);
      if (res.code !== 0 || !res.data) {
        Toast.show({ content: res.message || '获取项目列表失败' });
        setProjects([]);
        return;
      }
      setProjects((res.data.list ?? []).map(withProgress));
      setMyPending([]);
      setReceivedPending([]);
    } catch (err) {
      Toast.show({
        content: getApiErrorMessage(err, '获取列表失败'),
      });
      setProjects([]);
      setMyPending([]);
      setReceivedPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handleTaskToggle = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'todo' ? 'done' : 'todo';
    try {
      const res = await updateTask(taskId, { status: newStatus });
      if (res.code !== 0) {
        Toast.show({ content: res.message || '更新任务失败' });
        return;
      }
      Toast.show({ content: '状态已更新', position: 'bottom' });
      loadData(activeTab);
    } catch (err) {
      Toast.show({
        content: getApiErrorMessage(err, '更新任务失败'),
      });
    }
  };

  const todoCount = projects.reduce(
    (sum, p) => sum + (p.tasks?.filter((t) => t.status !== 'done').length ?? 0),
    0,
  );
  const inProgressCount = projects.filter(
    (p) => p.progress > 0 && p.progress < 100,
  ).length;

  const statusLabel =
    activeTab === 'completed'
      ? '已完成'
      : activeTab === 'archived'
        ? '已归档'
        : '进行中';

  const pendingEmpty =
    activeTab === 'pending' &&
    !loading &&
    myPending.length === 0 &&
    receivedPending.length === 0;

  return (
    <div
      style={{
        backgroundColor: '#F4F6F9',
        minHeight: '100vh',
        paddingBottom: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          backgroundColor: '#fff',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>项目</h2>
        <span
          style={{ fontSize: '20px', color: '#1677FF', cursor: 'pointer' }}
          onClick={() => navigate('/publish')}
        >
          ➕
        </span>
      </div>

      <div style={{ backgroundColor: '#fff', paddingBottom: '8px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ '--active-line-color': '#1677FF' }}
        >
          <Tabs.Tab title="进行中" key="ongoing" />
          <Tabs.Tab
            title={
              myPending.length + receivedPending.length > 0 &&
              activeTab === 'pending'
                ? `待确认(${myPending.length + receivedPending.length})`
                : '待确认'
            }
            key="pending"
          />
          <Tabs.Tab title="已完成" key="completed" />
          <Tabs.Tab title="已归档" key="archived" />
        </Tabs>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {activeTab === 'ongoing' && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-around',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{ color: '#1677FF', fontSize: '20px', fontWeight: 'bold' }}
              >
                {projects.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                项目
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{ color: '#00B578', fontSize: '20px', fontWeight: 'bold' }}
              >
                {todoCount}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                待办
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{ color: '#FF8F1F', fontSize: '20px', fontWeight: 'bold' }}
              >
                {inProgressCount}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                推进中
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '24px' }}>
            加载中...
          </div>
        )}

        {/* 待确认：我发起的申请 + 我收到的待审申请 */}
        {activeTab === 'pending' && !loading && (
          <>
            {myPending.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '8px',
                  }}
                >
                  我申请的（等待对方审核）
                </div>
                {myPending.map((item) => (
                  <div
                    key={`mine-${item.id}`}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/projects/${item.projectId}`)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {item.project?.title || `项目 #${item.projectId}`}
                      </div>
                      <Tag color="warning" fill="outline">
                        审核中
                      </Tag>
                    </div>
                    <div
                      style={{ fontSize: '12px', color: '#999', marginTop: 8 }}
                    >
                      意向角色：{item.roleName || '成员'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {receivedPending.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '8px',
                  }}
                >
                  待我审核的申请
                </div>
                {receivedPending.map((item) => (
                  <div
                    key={`recv-${item.id}`}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {item.project?.title || `项目 #${item.projectId}`}
                    </div>
                    <div
                      style={{ fontSize: '12px', color: '#666', marginTop: 8 }}
                    >
                      {item.user?.nickname || '用户'} 申请加入
                      {item.roleName ? ` · ${item.roleName}` : ''}
                    </div>
                    <Button
                      size="small"
                      color="primary"
                      style={{ marginTop: 12 }}
                      onClick={() =>
                        navigate(`/projects/${item.projectId}/applications`)
                      }
                    >
                      去审核
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {pendingEmpty && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#999',
                  marginTop: '40px',
                  lineHeight: 1.6,
                  padding: '0 24px',
                }}
              >
                <div>暂无待确认事项</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  申请成功后会显示在这里；对方通过后才会进入「进行中」
                </div>
                <Button
                  size="small"
                  fill="outline"
                  style={{ marginTop: 16 }}
                  onClick={() => navigate('/applications')}
                >
                  查看全部申请
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab !== 'pending' && projects.length === 0 && !loading && (
          <div
            style={{
              textAlign: 'center',
              color: '#999',
              marginTop: '40px',
              lineHeight: 1.6,
              padding: '0 24px',
            }}
          >
            <div>暂无相关项目</div>
            {activeTab === 'ongoing' && (
              <div style={{ fontSize: 12, marginTop: 8 }}>
                仅显示已加入的项目。若刚提交申请，请到「待确认」查看审核进度
              </div>
            )}
          </div>
        )}

        {activeTab !== 'pending' &&
          projects.map((project) => (
            <div
              key={project.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  marginBottom: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    backgroundColor: '#E4F2FF',
                    flexShrink: 0,
                    marginRight: '12px',
                    backgroundImage: `url(${project.cover || ''})`,
                    backgroundSize: 'cover',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginRight: '8px',
                      }}
                    >
                      {project.title}
                    </span>
                    <Tag
                      color="primary"
                      fill="outline"
                      style={{ borderRadius: '4px', padding: '0 4px' }}
                    >
                      {statusLabel}
                    </Tag>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ width: '40px' }}>进度</span>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: '#333',
                        marginRight: '8px',
                      }}
                    >
                      {project.progress}%
                    </span>
                    <ProgressBar
                      percent={project.progress}
                      style={{ flex: 1, '--track-width': '6px' }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    发布者: {project.owner?.nickname}
                  </div>
                </div>
              </div>

              {project.tasks && project.tasks.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#FAFAFA',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginBottom: '8px',
                    }}
                  >
                    待处理任务
                  </div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {project.tasks.map((task) => (
                      <Checkbox
                        key={task.id}
                        checked={task.status === 'done'}
                        onChange={() =>
                          handleTaskToggle(task.id, task.status)
                        }
                        style={{
                          '--icon-size': '16px',
                          '--font-size': '14px',
                          textDecoration:
                            task.status === 'done' ? 'line-through' : 'none',
                          color: task.status === 'done' ? '#999' : '#333',
                        }}
                      >
                        {task.title}
                      </Checkbox>
                    ))}
                  </Space>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #F0F0F0',
                  paddingTop: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={project.owner?.avatar || ''}
                    style={{
                      '--size': '24px',
                      borderRadius: '50%',
                      border: '1px solid #fff',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginLeft: '6px',
                    }}
                  >
                    团队·{project.teamCurrent}人
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>详情 {'>'}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
