-- 表：project_members — 项目成员
-- 依赖：projects, users
-- 对应页面：详情页人数、项目卡片团队

DROP TABLE IF EXISTS `project_members`;
CREATE TABLE `project_members` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  `project_id` BIGINT      NOT NULL                COMMENT '项目 ID',
  `user_id`    BIGINT      NOT NULL                COMMENT '用户 ID',
  `role_name`  VARCHAR(64) NOT NULL DEFAULT '成员' COMMENT '担任角色',
  `joined_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_members` (`project_id`, `user_id`),
  KEY `idx_project_members_user_id` (`user_id`),
  CONSTRAINT `fk_project_members_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目成员';
