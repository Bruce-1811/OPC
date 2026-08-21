import { useState } from 'react';
import { NavBar, TextArea, Button, Space, Card, Tag, Toast } from 'antd-mobile';
// 如果有封装好的 API，可以在此引入
// import { generateDraft, publishProject } from '../api/projects';

export default function PublishPage() {
  // 控制当前所处步骤：1 = 输入想法， 2 = 草稿预览
  const [step, setStep] = useState<1 | 2>(1);
  const [ideaText, setIdeaText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 模拟调用 AI 生成草稿的动作
  const handleGenerate = () => {
    if (!ideaText.trim()) {
      Toast.show('请先描述您的项目想法');
      return;
    }
    setIsGenerating(true);
    // 模拟网络请求延迟
    setTimeout(() => {
      setIsGenerating(false);
      setStep(2); // 生成完毕，进入步骤2：草稿页
    }, 1500);
  };

  // 模拟最终发布动作
  const handlePublish = () => {
    Toast.show({
      icon: 'success',
      content: '项目发布成功！',
    });
    // 发布成功后的逻辑，例如跳转回项目列表
    // navigate('/projects');
  };

  return (
    <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh', paddingBottom: '32px' }}>
      
      {/* =============== 步骤 1：发布项目 (输入区) =============== */}
      {step === 1 && (
        <>
          <NavBar 
            right={<span style={{ fontSize: '14px', color: '#666' }}>草稿</span>}
            onBack={() => Toast.show('返回')}
            style={{ backgroundColor: '#fff' }}
          >
            发布项目
          </NavBar>

          <div style={{ padding: '16px' }}>
            {/* 顶部插图与标语 (占位) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 8px' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>把想法变成项目</div>
                <div style={{ fontSize: '12px', color: '#666' }}>简单描述，AI 帮你生成项目草稿</div>
              </div>
              <div style={{ fontSize: '48px' }}>🤖</div> {/* 替换为真实的 3D 机器人插图 */}
            </div>

            {/* 输入卡片 */}
            <Card style={{ borderRadius: '16px', marginBottom: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#1677FF', marginRight: '8px' }}>📝</span> 描述项目想法
              </div>
              <div style={{ backgroundColor: '#F7F8FA', borderRadius: '12px', padding: '12px' }}>
                <div style={{ color: '#ccc', fontSize: '24px', lineHeight: '1', marginBottom: '-8px' }}>“</div>
                <TextArea
                  placeholder="做一个 AI 学习规划助手，帮助大学生管理学习任务..."
                  value={ideaText}
                  onChange={val => setIdeaText(val)}
                  autoSize={{ minRows: 4, maxRows: 6 }}
                  maxLength={500}
                  showCount
                  style={{ backgroundColor: 'transparent', '--font-size': '15px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#1677FF', display: 'flex', alignItems: 'center' }}>
                    <span className="spinner" style={{ marginRight: '4px', display: ideaText ? 'inline-block' : 'none' }}>⚙️</span>
                    {ideaText ? '正在整理...' : ''}
                  </div>
                  <div style={{ backgroundColor: '#fff', borderRadius: '50%', padding: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    🎤
                  </div>
                </div>
              </div>
            </Card>

            {/* 实时草稿预览卡片 */}
            <Card style={{ borderRadius: '16px', marginBottom: '24px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#1677FF', marginRight: '8px' }}>🌀</span> 实时草稿
                </div>
                <Tag color="success" fill="outline" style={{ borderRadius: '4px' }}>自动生成</Tag>
              </div>
              
              <Space direction="vertical" style={{ width: '100%', '--gap': '12px' }}>
                <div style={{ display: 'flex', backgroundColor: '#F7F8FA', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#666', width: '40px', fontSize: '14px' }}>方向</span>
                  <span style={{ color: '#333', fontSize: '14px', flex: 1 }}>{ideaText ? 'AI 学习规划工具' : '等待输入...'}</span>
                </div>
                <div style={{ display: 'flex', backgroundColor: '#F7F8FA', padding: '10px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#666', width: '40px', fontSize: '14px' }}>用户</span>
                  <span style={{ color: '#333', fontSize: '14px', flex: 1 }}>{ideaText ? '大学生' : '等待输入...'}</span>
                </div>
                
                {/* 待补充提示 */}
                <div style={{ border: '1px dashed #D9D9D9', borderRadius: '8px', padding: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#1677FF', marginBottom: '12px' }}>
                    <span>ℹ️ 待补充</span>
                    <span>去补充 {'>'}</span>
                  </div>
                  <Space style={{ width: '100%', justifyContent: 'space-around', color: '#666', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>📅 项目周期</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>👥 招募角色</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>🧩 核心角色</div>
                  </Space>
                </div>
              </Space>
            </Card>

            {/* 底部操作区 */}
            <Button 
              block 
              color="primary" 
              size="large" 
              loading={isGenerating}
              onClick={handleGenerate}
              style={{ borderRadius: '24px', fontWeight: 'bold', marginBottom: '16px', boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)' }}
            >
              生成草稿
            </Button>
            <div style={{ textAlign: 'center', color: '#1677FF', fontSize: '14px' }}>
              保存草稿
            </div>
          </div>
        </>
      )}

      {/* =============== 步骤 2：项目草稿 (预览与确认区) =============== */}
      {step === 2 && (
        <>
          <NavBar 
            right={<span style={{ fontSize: '14px', color: '#1677FF' }}>保存</span>}
            onBack={() => setStep(1)}
            style={{ backgroundColor: '#fff' }}
          >
            项目草稿
          </NavBar>

          <div style={{ padding: '16px' }}>
            {/* 项目信息模块 */}
            <Card style={{ borderRadius: '16px', marginBottom: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>项目信息</div>
                <span style={{ fontSize: '14px', color: '#1677FF' }}>编辑</span>
              </div>
              
              <Space direction="vertical" style={{ width: '100%', '--gap': '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#1677FF', marginBottom: '4px' }}>项目名称</div>
                  <div style={{ fontSize: '15px', color: '#333' }}>AI学习规划工具</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#1677FF', marginBottom: '4px' }}>项目方向</div>
                  <div style={{ fontSize: '15px', color: '#333' }}>效率工具 · AI应用</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#1677FF', marginBottom: '4px' }}>目标用户</div>
                  <div style={{ fontSize: '15px', color: '#333' }}>大学生</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#1677FF', marginBottom: '4px' }}>项目简介</div>
                  <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.5' }}>帮助大学生拆解学习任务，生成学习计划</div>
                </div>
              </Space>
            </Card>

            {/* 招募设置模块 */}
            <Card style={{ borderRadius: '16px', marginBottom: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>招募设置</div>
                <span style={{ fontSize: '14px', color: '#1677FF' }}>编辑角色</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                <div style={{ flex: '0 0 auto', backgroundColor: '#F6FFED', border: '1px solid #B7EB8F', borderRadius: '8px', padding: '12px', minWidth: '80px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>👤</div>
                  <div style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>产品经理</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>1人</div>
                </div>
                <div style={{ flex: '0 0 auto', backgroundColor: '#E6F4FF', border: '1px solid #91CAFF', borderRadius: '8px', padding: '12px', minWidth: '80px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>💻</div>
                  <div style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>前端开发</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>1人</div>
                </div>
                <div style={{ flex: '0 0 auto', backgroundColor: '#F9F0FF', border: '1px solid #D3ADF7', borderRadius: '8px', padding: '12px', minWidth: '80px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎨</div>
                  <div style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>UI设计</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>1人</div>
                </div>
              </div>
            </Card>

            {/* 其他条件模块 */}
            <Card style={{ borderRadius: '16px', marginBottom: '24px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>其他条件</div>
                <span style={{ fontSize: '14px', color: '#1677FF' }}>编辑</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', color: '#333' }}>
                <div>
                  <div style={{ fontSize: '18px', color: '#1677FF', marginBottom: '4px' }}>📅</div>
                  <div style={{ fontSize: '12px' }}>4周周期</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', color: '#1677FF', marginBottom: '4px' }}>📶</div>
                  <div style={{ fontSize: '12px' }}>远程协作</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', color: '#1677FF', marginBottom: '4px' }}>⏳</div>
                  <div style={{ fontSize: '12px' }}>6月15日截止</div>
                </div>
              </div>
            </Card>

            {/* AI 建议条与底部按钮 */}
            <div style={{ backgroundColor: '#F0F7FF', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#1677FF', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ marginRight: '6px' }}>🤖</span> AI 建议：发布前可在确认招募角色以及薪资
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button style={{ flex: 1, borderRadius: '24px', color: '#1677FF', borderColor: '#1677FF' }}>
                重新生成
              </Button>
              <Button color="primary" style={{ flex: 1, borderRadius: '24px', boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)' }} onClick={handlePublish}>
                发布项目
              </Button>
            </div>
            
            {/* 悬浮 AI 按钮 (问AI) */}
            <div style={{ position: 'fixed', right: '16px', bottom: '100px', backgroundColor: '#fff', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '24px' }}>🤖</div>
              <div style={{ fontSize: '10px', color: '#1677FF', fontWeight: 'bold' }}>问AI</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}