-- 表：users — 用户
-- 依赖：无（最先创建）
-- 对应页面：我的、登录

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `phone`      VARCHAR(20)  NOT NULL                COMMENT '手机号（登录）',
  `password`   VARCHAR(255) NOT NULL                COMMENT '密码（加密存储）',
  `nickname`   VARCHAR(64)  NOT NULL                COMMENT '昵称',
  `avatar`     VARCHAR(512) DEFAULT NULL            COMMENT '头像 URL',
  `bio`        VARCHAR(500) DEFAULT NULL            COMMENT '个人简介',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
