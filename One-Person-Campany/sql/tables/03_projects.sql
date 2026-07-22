-- 表：projects — 项目
-- 依赖：users
-- 对应页面：发现、发布、项目、详情

DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id`             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `owner_id`       BIGINT       NOT NULL                COMMENT '发布人 ID',
  `title`          VARCHAR(128) NOT NULL                COMMENT '项目名',
  `description`    TEXT         DEFAULT NULL            COMMENT '项目介绍',
  `cover`          VARCHAR(512) DEFAULT NULL            COMMENT '封面图 URL',
  `tags`           VARCHAR(255) DEFAULT NULL            COMMENT '标签，逗号分隔',
  `status`         VARCHAR(20)  NOT NULL DEFAULT 'recruiting' COMMENT '状态: recruiting/pending/ongoing/done/archived',
  `is_draft`       TINYINT      NOT NULL DEFAULT 1      COMMENT '是否草稿: 0已发布 1草稿',
  `work_mode`      VARCHAR(20)  DEFAULT 'remote'        COMMENT '协作方式: remote/onsite',
  `duration_weeks` INT          DEFAULT NULL            COMMENT '周期（周）',
  `deadline`       DATE         DEFAULT NULL            COMMENT '截止日期',
  `team_max`       INT          NOT NULL DEFAULT 5      COMMENT '最大人数',
  `team_current`   INT          NOT NULL DEFAULT 1      COMMENT '当前人数',
  `progress`       TINYINT      NOT NULL DEFAULT 0      COMMENT '进度 0-100',
  `roles_json`     TEXT         DEFAULT NULL            COMMENT '招募角色 JSON',
  `phases_json`    TEXT         DEFAULT NULL            COMMENT '项目阶段 JSON',
  `ai_summary`     TEXT         DEFAULT NULL            COMMENT 'AI 摘要',
  `raw_input`      TEXT         DEFAULT NULL            COMMENT '发布页原始输入',
  `view_count`     INT          NOT NULL DEFAULT 0      COMMENT '浏览次数',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_projects_owner_id` (`owner_id`),
  KEY `idx_projects_status_draft` (`status`, `is_draft`),
  KEY `idx_projects_created_at` (`created_at`),
  CONSTRAINT `fk_projects_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';
