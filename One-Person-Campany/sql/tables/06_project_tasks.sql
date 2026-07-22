-- 表：project_tasks — 任务/待办
-- 依赖：projects, users
-- 对应页面：项目页待处理、问培风

DROP TABLE IF EXISTS `project_tasks`;
CREATE TABLE `project_tasks` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `project_id`   BIGINT       NOT NULL                COMMENT '项目 ID',
  `title`        VARCHAR(255) NOT NULL                COMMENT '任务标题',
  `assignee_id`  BIGINT       DEFAULT NULL            COMMENT '负责人 ID',
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'todo' COMMENT '状态: todo/done',
  `priority`     VARCHAR(10)  NOT NULL DEFAULT 'medium' COMMENT '优先级: high/medium/low',
  `due_date`     DATE         DEFAULT NULL            COMMENT '截止日期',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_tasks_project_id` (`project_id`),
  KEY `idx_tasks_assignee_status` (`assignee_id`, `status`),
  CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目任务';
