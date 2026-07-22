-- 表：project_applications — 加入申请
-- 依赖：projects, users
-- 对应页面：详情页申请加入、我的 → 项目申请

DROP TABLE IF EXISTS `project_applications`;
CREATE TABLE `project_applications` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `project_id`   BIGINT       NOT NULL                COMMENT '项目 ID',
  `user_id`      BIGINT       NOT NULL                COMMENT '申请人 ID',
  `role_name`    VARCHAR(64)  DEFAULT NULL            COMMENT '申请角色',
  `message`      TEXT         DEFAULT NULL            COMMENT '申请留言',
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT '状态: pending/approved/rejected',
  `match_score`  INT          DEFAULT NULL            COMMENT 'AI 匹配分 0-100',
  `match_reason` VARCHAR(255) DEFAULT NULL            COMMENT '推荐理由',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
  PRIMARY KEY (`id`),
  KEY `idx_applications_project_status` (`project_id`, `status`),
  KEY `idx_applications_user_id` (`user_id`),
  CONSTRAINT `fk_applications_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_applications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目加入申请';
