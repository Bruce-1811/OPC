-- ============================================================
-- OPC 一键建库建表（按依赖顺序执行所有分表脚本）
-- 用法：在代码根目录 One-Person-Campany 下执行
--   mysql -u root -p < sql/init_all.sql
-- ============================================================

SOURCE sql/00_init.sql;
SOURCE sql/tables/01_users.sql;
SOURCE sql/tables/02_user_skills.sql;
SOURCE sql/tables/03_projects.sql;
SOURCE sql/tables/04_project_members.sql;
SOURCE sql/tables/05_project_applications.sql;
SOURCE sql/tables/06_project_tasks.sql;
SOURCE sql/tables/07_conversations.sql;
SOURCE sql/tables/08_conversation_users.sql;
SOURCE sql/tables/09_messages.sql;
SOURCE sql/tables/10_user_favorites.sql;
SOURCE sql/tables/11_ai_chats.sql;
SOURCE sql/99_finish.sql;
