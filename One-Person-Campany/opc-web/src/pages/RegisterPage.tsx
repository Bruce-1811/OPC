import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Toast } from 'antd-mobile';
import { register } from '../api/auth';
import { setToken } from '../api/client';
import { getApiErrorMessage } from '../api/errors';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onFinish(values: {
    phone: string;
    password: string;
    nickname: string;
  }) {
    setLoading(true);
    try {
      const res = await register(values);
      if (res.code !== 0 || !res.data) {
        Toast.show({ icon: 'fail', content: res.message || '注册失败' });
        return;
      }
      setToken(res.data.token);
      Toast.show({ icon: 'success', content: '注册成功' });
      navigate('/discover', { replace: true });
    } catch (err) {
      Toast.show({
        icon: 'fail',
        content: getApiErrorMessage(err, '网络错误，请稍后重试'),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>注册账号</h1>
        <p className="auth-sub">创建你的 OPC 身份</p>
        <Form
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" loading={loading}>
              注册并登录
            </Button>
          }
        >
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="11 位手机号" clearable />
          </Form.Item>
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="展示给其他成员" clearable />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '至少 6 位' },
            ]}
          >
            <Input type="password" placeholder="至少 6 位" clearable />
          </Form.Item>
        </Form>
        <p className="auth-footer">
          已有账号？<Link to="/login">登录</Link>
        </p>
      </div>
    </div>
  );
}
