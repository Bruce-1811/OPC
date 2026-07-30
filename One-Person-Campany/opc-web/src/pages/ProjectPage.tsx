import { useState, useEffect } from 'react';
import { Tabs, ProgressBar, Checkbox, Toast, Avatar, Space, Tag, Badge } from 'antd-mobile';
import { fetchMyProjects, type MyProjectItem } from '../api/projects';
import { updateTask } from '../api/tasks';

export default function ProjectPage() {
  const [projects, setProjects] = useState<MyProjectItem[]>([]);
  const [activeTab, setActiveTab] = useState('ongoing'); 
  const [loading, setLoading] = useState(false);

  const loadData = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetchMyProjects(status);
      if (res.data && res.data.list) {
        setProjects(res.data.list);
      }
    } catch (error) {
      Toast.show({ content: '获取项目列表失败' });
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
      await updateTask(taskId, { status: newStatus });
      Toast.show({ content: '状态已更新', position: 'bottom' });
      loadData(activeTab); 
    } catch (error) {
      Toast.show({ content: '更新任务失败' });
    }
  };

  return (
    <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh', paddingBottom: '24px', fontFamily: 'sans-serif' }}>
      
      {/* 1. 顶部 Header (对齐原型) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>项目</h2>
        <Space style={{ fontSize: '20px', color: '#333' }}>
          <span>🔔</span> {/* 占位：替换为 notification 图标 */}
          <span style={{ color: '#1677FF' }}>➕</span> {/* 占位：替换为 add 图标 */}
        </Space>
      </div>

      {/* 2. 状态标签页 (4个状态，带红点) */}
      <div style={{ backgroundColor: '#fff', paddingBottom: '8px' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ '--active-line-color': '#1677FF' }}>
          <Tabs.Tab title="进行中" key="ongoing" />
          <Tabs.Tab title={<Badge content="4">待确认</Badge>} key="pending" />
          <Tabs.Tab title="已完成" key="completed" />
          <Tabs.Tab title="已归档" key="archived" />
        </Tabs>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* 3. 顶部统计面板 (仅进行中展示，对齐原型) */}
        {activeTab === 'ongoing' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-around', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#1677FF', fontSize: '20px', fontWeight: 'bold' }}>3</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>项目</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#00B578', fontSize: '20px', fontWeight: 'bold' }}>5</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>待办</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#FF8F1F', fontSize: '20px', fontWeight: 'bold' }}>1</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>临期</div>
            </div>
          </div>
        )}

        {/* 缺省态 */}
        {projects.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>暂无相关项目</div>
        )}

        {/* 4. 项目卡片列表 */}
        {projects.map((project) => (
          <div key={project.id} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            
            {/* 上半部分：左图右文 */}
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              {/* 左侧封面 (默认底色占位) */}
              <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#E4F2FF', flexShrink: 0, marginRight: '12px', backgroundImage: `url(${project.cover || ''})`, backgroundSize: 'cover' }} />
              
              {/* 右侧信息 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                    {project.title}
                  </span>
                  <Tag color="primary" fill="outline" style={{ borderRadius: '4px', padding: '0 4px' }}>进行中</Tag>
                </div>
                
                {/* 进度条与文字融合 */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                  <span style={{ width: '40px' }}>进度</span>
                  <span style={{ fontWeight: 'bold', color: '#333', marginRight: '8px' }}>{project.progress}%</span>
                  <ProgressBar percent={project.progress} style={{ flex: 1, '--track-width': '6px' }} />
                </div>
                
                <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  当前发布者: {project.owner?.nickname}
                </div>
              </div>
            </div>

            {/* AI 建议占位 (对齐原型中的浅色底纹提示) */}
            <div style={{ backgroundColor: '#F0F7FF', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#1677FF', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ marginRight: '6px' }}>🤖</span> AI 建议：确认当前阶段需求
            </div>

            {/* 核心互动区：待办任务打卡 */}
            {project.tasks && project.tasks.length > 0 && (
              <div style={{ backgroundColor: '#FAFAFA', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>待处理任务</div>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {project.tasks.map((task) => (
                    <Checkbox
                      key={task.id}
                      checked={task.status === 'done'}
                      onChange={() => handleTaskToggle(task.id, task.status)}
                      style={{ '--icon-size': '16px', '--font-size': '14px', textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? '#999' : '#333' }}
                    >
                      {task.title}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )}

            {/* 底部区：团队头像与时间 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={project.owner?.avatar || ''} style={{ '--size': '24px', borderRadius: '50%', border: '1px solid #fff' }} />
                {/* 叠放效果占位 */}
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#CCC', border: '1px solid #fff', marginLeft: '-8px' }} />
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '6px' }}>团队·{project.teamCurrent}人</span>
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                详情 {'>'}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}