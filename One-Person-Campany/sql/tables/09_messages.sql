-- 表：messages — 消息
-- 依赖：conversations, users
-- 对应页面：聊天窗口

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id`              BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `conversation_id` BIGINT NOT NULL                COMMENT '会话 ID',
  `sender_id`       BIGINT NOT NULL                COMMENT '发送者 ID',
  `content`         TEXT   NOT NULL                COMMENT '消息内容',
  `ai_tag`          VARCHAR(64) DEFAULT NULL        COMMENT 'AI 标记',
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`),
  KEY `idx_messages_conversation_created` (`conversation_id`, `created_at`),
  KEY `idx_messages_sender_id` (`sender_id`),
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息';
