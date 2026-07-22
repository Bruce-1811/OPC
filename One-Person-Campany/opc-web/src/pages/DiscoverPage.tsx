import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DotLoading,
  Empty,
  ErrorBlock,
  InfiniteScroll,
  SearchBar,
  Tag,
} from 'antd-mobile';
import { fetchProjects, type ProjectListItem } from '../api/projects';
import { getApiErrorMessage } from '../api/errors';

const PAGE_SIZE = 10;

function statusLabel(status: string) {
  if (status === 'recruiting') return '招募中';
  if (status === 'ongoing') return '进行中';
  return status;
}

function ProjectCard({
  item,
  onClick,
}: {
  item: ProjectListItem;
  onClick: () => void;
}) {
  return (
    <button type="button" className="discover-card" onClick={onClick}>
      <div
        className="discover-card-cover"
        style={
          item.cover
            ? { backgroundImage: `url(${item.cover})` }
            : undefined
        }
      >
        {!item.cover ? <span>{item.title.slice(0, 1)}</span> : null}
      </div>
      <div className="discover-card-body">
        <div className="discover-card-head">
          <h2>{item.title}</h2>
          <span className="discover-status">{statusLabel(item.status)}</span>
        </div>
        {item.tags.length > 0 ? (
          <div className="discover-tags">
            {item.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} color="primary" fill="outline">
                {tag}
              </Tag>
            ))}
          </div>
        ) : null}
        <div className="discover-card-meta">
          <span>
            {item.teamCurrent}/{item.teamMax} 人
          </span>
          {item.deadline ? <span>截止 {item.deadline}</span> : null}
          <span>{item.viewCount} 浏览</span>
        </div>
        {item.matchScore != null ? (
          <p className="discover-match">
            匹配 {item.matchScore}% · {item.matchReason}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<ProjectListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(keywordInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  const loadPage = useCallback(
    async (pageNum: number, kw: string, append: boolean) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError('');

      try {
        const res = await fetchProjects({
          keyword: kw || undefined,
          page: pageNum,
          pageSize: PAGE_SIZE,
          sort: 'latest',
        });

        if (res.code !== 0 || !res.data) {
          setError(res.message || '加载失败');
          if (!append) setList([]);
          return;
        }

        setTotal(res.data.total);
        setPage(pageNum);
        setList((prev) =>
          append ? [...prev, ...res.data!.list] : res.data!.list,
        );
      } catch (err) {
        setError(getApiErrorMessage(err, '网络错误'));
        if (!append) setList([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadPage(1, keyword, false);
  }, [keyword, loadPage]);

  const hasMore = list.length < total;

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    await loadPage(page + 1, keyword, true);
  }

  return (
    <div className="page discover-page">
      <h1 className="discover-title">发现</h1>
      <SearchBar
        placeholder="搜索项目标题或标签"
        value={keywordInput}
        onChange={setKeywordInput}
        onClear={() => setKeywordInput('')}
      />

      {loading ? (
        <div className="discover-loading">
          <DotLoading color="primary" />
        </div>
      ) : error ? (
        <ErrorBlock
          status="default"
          title="加载失败"
          description={error}
        />
      ) : list.length === 0 ? (
        <Empty description="暂无项目，去发布页创建一个吧" />
      ) : (
        <div className="discover-list">
          {list.map((item) => (
            <ProjectCard
              key={item.id}
              item={item}
              onClick={() => navigate(`/projects/${item.id}`)}
            />
          ))}
          <InfiniteScroll loadMore={loadMore} hasMore={hasMore}>
            {loadingMore ? (
              <DotLoading color="primary" />
            ) : hasMore ? (
              <span>上拉加载更多</span>
            ) : (
              <span>没有更多了</span>
            )}
          </InfiniteScroll>
        </div>
      )}
    </div>
  );
}
