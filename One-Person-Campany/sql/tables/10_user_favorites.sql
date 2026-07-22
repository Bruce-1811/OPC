-- 表：user_favorites — 收藏
-- 依赖：users, projects
-- 对应页面：我的 → 收藏项目

DROP TABLE IF EXISTS `user_favorites`;
CREATE TABLE `user_favorites` (
  `id`         BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`    BIGINT   NOT NULL                COMMENT '用户 ID',
  `project_id` BIGINT   NOT NULL                COMMENT '项目 ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_favorites` (`user_id`, `project_id`),
  KEY `idx_user_favorites_project_id` (`project_id`),
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏';
