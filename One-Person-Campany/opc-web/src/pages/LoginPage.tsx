import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Toast } from 'antd-mobile';
import { login } from '../api/auth';
import { setToken } from '../api/client';
import { getApiErrorMessage } from '../api/errors';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onFinish(values: { phone: string; password: string }) {
    setLoading(true);
    try {
      const res = await login(values);
      if (res.code !== 0 || !res.data) {
        Toast.show({ icon: 'fail', content: res.message || '登录失败' });
        return;
      }
      setToken(res.data.token);
      Toast.show({ icon: 'success', content: '登录成功' });
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
        <h1>登录 OPC</h1>
        <p className="auth-sub">一人公司 · 项目协作</p>
        <Form
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button block type="submit" color="primary" loading={loading}>
              登录
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
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input type="password" placeholder="至少 6 位" clearable />
          </Form.Item>
        </Form>
        <p className="auth-footer">
          还没有账号？<Link to="/register">注册</Link>
        </p>
      </div>
    </div>
  );
}
