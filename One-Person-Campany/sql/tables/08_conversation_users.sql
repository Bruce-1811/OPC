-- 表：conversation_users — 会话参与者
-- 依赖：conversations, users

DROP TABLE IF EXISTS `conversation_users`;
CREATE TABLE `conversation_users` (
  `id`              BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `conversation_id` BIGINT NOT NULL                COMMENT '会话 ID',
  `user_id`         BIGINT NOT NULL                COMMENT '用户 ID',
  `unread_count`    INT    NOT NULL DEFAULT 0      COMMENT '未读消息数',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_users` (`conversation_id`, `user_id`),
  KEY `idx_conversation_users_user_id` (`user_id`),
  CONSTRAINT `fk_conversation_users_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话参与者';
