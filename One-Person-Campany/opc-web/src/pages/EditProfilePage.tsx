import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, TextArea, Toast } from 'antd-mobile';
import { fetchMe, updateProfile, updateSkills } from '../api/auth';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchMe();
        if (res.code !== 0 || !res.data) {
          Toast.show({ icon: 'fail', content: res.message || '加载失败' });
          navigate('/profile', { replace: true });
          return;
        }
        const u = res.data;
        form.setFieldsValue({
          nickname: u.nickname,
          avatar: u.avatar ?? '',
          bio: u.bio ?? '',
          skillsText: u.skills.join('，'),
        });
        setReady(true);
      } catch {
        Toast.show({ icon: 'fail', content: '网络错误' });
        navigate('/profile', { replace: true });
      }
    })();
  }, [form, navigate]);

  async function onFinish(values: {
    nickname: string;
    avatar?: string;
    bio?: string;
    skillsText?: string;
  }) {
    setLoading(true);
    try {
      const skills = (values.skillsText ?? '')
        .split(/[,，、\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const profileRes = await updateProfile({
        nickname: values.nickname.trim(),
        avatar: values.avatar?.trim() || null,
        bio: values.bio?.trim() || null,
      });
      if (profileRes.code !== 0) {
        Toast.show({ icon: 'fail', content: profileRes.message || '保存失败' });
        return;
      }

      const skillsRes = await updateSkills(skills);
      if (skillsRes.code !== 0) {
        Toast.show({ icon: 'fail', content: skillsRes.message || '技能保存失败' });
        return;
      }

      Toast.show({ icon: 'success', content: '已保存' });
      navigate('/profile', { replace: true });
    } catch {
      Toast.show({ icon: 'fail', content: '网络错误' });
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <div className="page">加载中...</div>;
  }

  return (
    <div className="page">
      <h1>编辑资料</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        footer={
          <Button block type="submit" color="primary" loading={loading}>
            保存
          </Button>
        }
      >
        <Form.Item
          name="nickname"
          label="昵称"
          rules={[{ required: true, message: '请输入昵称' }]}
        >
          <Input clearable />
        </Form.Item>
        <Form.Item name="avatar" label="头像 URL">
          <Input placeholder="可选，图片链接" clearable />
        </Form.Item>
        <Form.Item name="bio" label="简介">
          <TextArea placeholder="一句话介绍自己" maxLength={500} showCount rows={3} />
        </Form.Item>
        <Form.Item name="skillsText" label="技能标签">
          <Input placeholder="用逗号分隔，如：React, Node.js" clearable />
        </Form.Item>
      </Form>
    </div>
  );
}
