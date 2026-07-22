-- 表：user_skills — 用户技能标签
-- 依赖：users
-- 对应页面：我的 → 能力标签

DROP TABLE IF EXISTS `user_skills`;
CREATE TABLE `user_skills` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`    BIGINT      NOT NULL                COMMENT '用户 ID',
  `skill_name` VARCHAR(64) NOT NULL                COMMENT '技能名称',
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_skills_user_id` (`user_id`),
  CONSTRAINT `fk_user_skills_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户技能标签';
