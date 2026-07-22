import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  Selector,
  Space,
  TextArea,
  Toast,
} from 'antd-mobile';
import {
  createProject,
  fetchProjectDetail,
  updateProject,
  type ProjectDetail,
} from '../api/projects';
import { getApiErrorMessage } from '../api/errors';

type FormValues = {
  title: string;
  idea: string;
  tags: string;
  teamMax: string;
  durationWeeks: string;
  deadline: string;
  workMode: string[];
  rolesText: string;
  phasesText: string;
};

function textToRoles(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name, count: 1, filled: 0 }));
}

function textToPhases(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name, status: 'pending' }));
}

function rolesToText(roles: ProjectDetail['roles']) {
  return roles.map((r) => r.name).join('\n');
}

function phasesToText(phases: ProjectDetail['phases']) {
  return phases.map((p) => p.name).join('\n');
}

function buildPayload(values: FormValues, isDraft: boolean) {
  const title = values.title?.trim();
  const idea = values.idea?.trim() ?? '';
  return {
    title: title || undefined,
    description: idea || undefined,
    rawInput: idea || undefined,
    tags: values.tags?.trim() || undefined,
    teamMax: values.teamMax ? Number(values.teamMax) : undefined,
    durationWeeks: values.durationWeeks
      ? Number(values.durationWeeks)
      : undefined,
    deadline: values.deadline || undefined,
    workMode: values.workMode?.[0] ?? 'remote',
    roles: textToRoles(values.rolesText ?? ''),
    phases: textToPhases(values.phasesText ?? ''),
    isDraft,
  };
}

export default function PublishPage() {
  const navigate = useNavigate();
  const { projectId: projectIdParam } = useParams();
  const editId = projectIdParam ? Number(projectIdParam) : null;
  const isEdit = editId != null && Number.isFinite(editId) && editId > 0;

  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState<'draft' | 'publish' | null>(null);
  const [ready, setReady] = useState(!isEdit);

  useEffect(() => {
    if (!isEdit || !editId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchProjectDetail(editId);
        if (cancelled) return;
        if (res.code !== 0 || !res.data) {
          Toast.show({ icon: 'fail', content: res.message || '草稿不存在' });
          navigate('/drafts', { replace: true });
          return;
        }
        if (!res.data.isDraft) {
          Toast.show({ icon: 'fail', content: '已发布项目请从详情查看' });
          navigate(`/projects/${editId}`, { replace: true });
          return;
        }
        const d = res.data;
        form.setFieldsValue({
          title: d.title === '未命名草稿' ? '' : d.title,
          idea: d.description ?? '',
          tags: d.tags.join('，'),
          teamMax: String(d.teamMax),
          durationWeeks: d.durationWeeks ? String(d.durationWeeks) : '',
          deadline: d.deadline ?? '',
          workMode: [d.workMode ?? 'remote'],
          rolesText: rolesToText(d.roles),
          phasesText: phasesToText(d.phases),
        });
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          Toast.show({
            icon: 'fail',
            content: getApiErrorMessage(err, '加载失败'),
          });
          navigate('/drafts', { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editId, form, isEdit, navigate]);

  async function submit(isDraft: boolean) {
    try {
      const values = isDraft
        ? form.getFieldsValue()
        : await form.validateFields();
      const title = values.title?.trim();
      if (!isDraft && !title) {
        Toast.show({ icon: 'fail', content: '发布请填写项目标题' });
        return;
      }

      setLoading(isDraft ? 'draft' : 'publish');
      const payload = buildPayload(values, isDraft);

      const res =
        isEdit && editId
          ? await updateProject(editId, payload)
          : await createProject(payload);

      if (res.code !== 0 || !res.data) {
        Toast.show({ icon: 'fail', content: res.message || '提交失败' });
        return;
      }

      if (isDraft) {
        Toast.show({ icon: 'success', content: '草稿已保存' });
        if (!isEdit) {
          const newId =
            'projectId' in res.data && typeof res.data.projectId === 'number'
              ? res.data.projectId
              : res.data.id;
          if (newId) navigate(`/publish/${newId}`, { replace: true });
        }
        return;
      }

      Toast.show({ icon: 'success', content: '发布成功' });
      const id =
        'projectId' in res.data && res.data.projectId
          ? res.data.projectId
          : res.data.id;
      navigate(id ? `/projects/${id}` : '/discover', { replace: true });
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        Toast.show({ icon: 'fail', content: '请完善表单' });
        return;
      }
      Toast.show({
        icon: 'fail',
        content: getApiErrorMessage(err, '网络错误，请稍后重试'),
      });
    } finally {
      setLoading(null);
    }
  }

  if (!ready) {
    return <div className="page discover-loading">加载草稿…</div>;
  }

  return (
    <div className="page publish-page">
      <div className="publish-top-row">
        <h1>{isEdit ? '编辑草稿' : '发布项目'}</h1>
        <Button fill="none" size="small" onClick={() => navigate('/drafts')}>
          草稿箱
        </Button>
      </div>
      <p className="publish-hint">
        填写想法并发布；草稿不会出现在发现页，可从草稿箱继续编辑
      </p>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          teamMax: '5',
          workMode: ['remote'],
        }}
      >
        <Form.Item name="title" label="项目标题">
          <Input placeholder="如：智能校园助手（发布必填）" clearable />
        </Form.Item>

        <Form.Item name="idea" label="项目想法 / 简介">
          <TextArea
            placeholder="描述你想做什么、需要什么人…"
            rows={4}
            showCount
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item name="tags" label="标签">
          <Input placeholder="逗号分隔，如：AI工具, 产品设计" clearable />
        </Form.Item>

        <Form.Item name="rolesText" label="招募角色（每行一个）">
          <TextArea placeholder={'产品经理\n前端开发'} rows={3} />
        </Form.Item>

        <Form.Item name="phasesText" label="项目阶段（每行一个）">
          <TextArea placeholder={'需求调研\n原型设计\n开发上线'} rows={3} />
        </Form.Item>

        <Form.Item name="workMode" label="协作方式">
          <Selector
            options={[
              { label: '远程', value: 'remote' },
              { label: '线下', value: 'onsite' },
              { label: '混合', value: 'hybrid' },
            ]}
          />
        </Form.Item>

        <Form.Item name="teamMax" label="团队人数上限">
          <Input type="number" placeholder="5" />
        </Form.Item>

        <Form.Item name="durationWeeks" label="预计周期（周）">
          <Input type="number" placeholder="可选" />
        </Form.Item>

        <Form.Item name="deadline" label="截止日期">
          <Input type="date" />
        </Form.Item>
      </Form>

      <Space block direction="vertical" className="publish-actions">
        <Button
          block
          color="primary"
          loading={loading === 'publish'}
          disabled={loading !== null}
          onClick={() => submit(false)}
        >
          {isEdit ? '发布项目' : '发布项目'}
        </Button>
        <Button
          block
          fill="outline"
          loading={loading === 'draft'}
          disabled={loading !== null}
          onClick={() => submit(true)}
        >
          保存草稿
        </Button>
      </Space>
    </div>
  );
}
