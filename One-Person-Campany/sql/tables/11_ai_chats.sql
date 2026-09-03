-- 表：ai_chats — 问培风对话
-- 依赖：users
-- 对应页面：问培风

DROP TABLE IF EXISTS `ai_chats`;
CREATE TABLE `ai_chats` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`    BIGINT      NOT NULL                COMMENT '用户 ID',
  `role`       VARCHAR(10) NOT NULL                COMMENT '角色: user/assistant',
  `content`    TEXT        NOT NULL                COMMENT '对话内容',
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_ai_chats_user_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_ai_chats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问培风 AI 对话';
