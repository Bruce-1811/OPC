-- 表：conversations — 会话
-- 依赖：projects（可选关联）
-- 对应页面：消息列表

DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `type`            VARCHAR(20)  NOT NULL DEFAULT 'project' COMMENT '类型: private/group/project',
  `project_id`      BIGINT       DEFAULT NULL            COMMENT '关联项目（项目群）',
  `name`            VARCHAR(128) DEFAULT NULL            COMMENT '会话名称',
  `last_message`    VARCHAR(255) DEFAULT NULL            COMMENT '最后一条消息摘要',
  `last_message_at` DATETIME     DEFAULT NULL            COMMENT '最后消息时间',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_conversations_project_id` (`project_id`),
  KEY `idx_conversations_last_message_at` (`last_message_at`),
  CONSTRAINT `fk_conversations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话';
