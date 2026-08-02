-- ============================================================
-- 个人博客数据库建表脚本（MySQL 5.7+ / 8.x，utf8mb4）
-- 执行方式：mysql -u root -p < sql/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS blog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blog;

-- 1. 管理员表
CREATE TABLE IF NOT EXISTS admin (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '管理员ID',
  username   VARCHAR(50)  NOT NULL UNIQUE              COMMENT '登录账号',
  password   VARCHAR(100) NOT NULL                     COMMENT '加密后的密码（bcrypt）',
  nickname   VARCHAR(50)  NOT NULL DEFAULT ''          COMMENT '昵称',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE = InnoDB COMMENT = '管理员表';

-- 1b. 用户表（注册用户，用于评论/留言）
CREATE TABLE IF NOT EXISTS user (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  email      VARCHAR(100) NOT NULL UNIQUE              COMMENT '邮箱（登录账号）',
  password   VARCHAR(100) NOT NULL                     COMMENT '加密后的密码（bcrypt）',
  nickname   VARCHAR(50)  NOT NULL                     COMMENT '昵称',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间'
) ENGINE = InnoDB COMMENT = '用户表';

-- 2. 文章分类表
CREATE TABLE IF NOT EXISTS category (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
  name       VARCHAR(50) NOT NULL UNIQUE             COMMENT '分类名称',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE = InnoDB COMMENT = '文章分类表';

-- 3. 标签表
CREATE TABLE IF NOT EXISTS tag (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '标签ID',
  name       VARCHAR(50) NOT NULL UNIQUE             COMMENT '标签名称',
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE = InnoDB COMMENT = '标签表';

-- 4. 文章表
CREATE TABLE IF NOT EXISTS article (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '文章ID',
  title       VARCHAR(200) NOT NULL                   COMMENT '文章标题',
  cover       VARCHAR(500) NOT NULL DEFAULT ''        COMMENT '封面图URL',
  summary     VARCHAR(500) NOT NULL DEFAULT ''        COMMENT '文章简介',
  content     MEDIUMTEXT   NOT NULL                   COMMENT 'Markdown正文',
  video_url   VARCHAR(500) NOT NULL DEFAULT ''        COMMENT '视频链接（YouTube/Bilibili/MP4）',
  category_id INT UNSIGNED DEFAULT NULL               COMMENT '分类ID（分类删除后置NULL）',
  status      TINYINT      NOT NULL DEFAULT 0         COMMENT '发布状态：0=草稿 1=已发布',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_category (category_id),
  INDEX idx_status_created (status, created_at),
  CONSTRAINT fk_article_category FOREIGN KEY (category_id)
    REFERENCES category (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB COMMENT = '文章表';

-- 5. 文章-标签 多对多关联表
CREATE TABLE IF NOT EXISTS article_tag (
  article_id INT UNSIGNED NOT NULL COMMENT '文章ID',
  tag_id     INT UNSIGNED NOT NULL COMMENT '标签ID',
  PRIMARY KEY (article_id, tag_id),
  INDEX idx_tag (tag_id),
  CONSTRAINT fk_at_article FOREIGN KEY (article_id)
    REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_at_tag FOREIGN KEY (tag_id)
    REFERENCES tag (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB COMMENT = '文章-标签关联表';

-- 6. 留言表（留言板，访客公开提交，无需登录；支持楼中楼回复）
CREATE TABLE IF NOT EXISTS message (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '留言ID',
  nickname   VARCHAR(20)  NOT NULL                   COMMENT '访客昵称',
  content    VARCHAR(500) NOT NULL                   COMMENT '留言内容',
  email      VARCHAR(100) NOT NULL DEFAULT ''        COMMENT '邮箱（选填）',
  website    VARCHAR(200) NOT NULL DEFAULT ''        COMMENT '个人网站（选填）',
  parent_id  INT UNSIGNED DEFAULT NULL               COMMENT '父留言ID（楼中楼回复）',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '留言时间',
  INDEX idx_created (created_at),
  INDEX idx_parent (parent_id)
) ENGINE = InnoDB COMMENT = '留言表';

-- 7. 文章评论表（访客对单篇文章评论，支持回复）
CREATE TABLE IF NOT EXISTS comment (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
  article_id    INT UNSIGNED NOT NULL                   COMMENT '文章ID',
  nickname      VARCHAR(20)  NOT NULL                   COMMENT '访客昵称',
  content       VARCHAR(500) NOT NULL                   COMMENT '评论内容',
  parent_id     INT UNSIGNED DEFAULT NULL               COMMENT '父评论ID（回复）',
  reply_nickname VARCHAR(20) DEFAULT ''                 COMMENT '被回复者昵称',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
  INDEX idx_article (article_id),
  INDEX idx_parent (parent_id),
  CONSTRAINT fk_comment_article FOREIGN KEY (article_id)
    REFERENCES article (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB COMMENT = '文章评论表';

-- 8. 附件表（后台上传的图片等文件）
CREATE TABLE IF NOT EXISTS attachment (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '附件ID',
  filename      VARCHAR(100) NOT NULL                   COMMENT '存储文件名',
  original_name VARCHAR(255) NOT NULL                   COMMENT '原始文件名',
  url           VARCHAR(255) NOT NULL                   COMMENT '访问URL',
  size          INT UNSIGNED NOT NULL DEFAULT 0         COMMENT '文件大小（字节）',
  mime          VARCHAR(50)  NOT NULL DEFAULT ''        COMMENT 'MIME类型',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间'
) ENGINE = InnoDB COMMENT = '附件表';

-- 9. 站点配置表（键值对：站点设置 / AI 配置）
CREATE TABLE IF NOT EXISTS setting (
  k VARCHAR(50) PRIMARY KEY COMMENT '配置键',
  v TEXT                  COMMENT '配置值'
) ENGINE = InnoDB COMMENT = '站点配置表';

-- 初始化管理员：不在 SQL 中写死 bcrypt 哈希，建表后执行以下命令生成：
--   npm run seed:admin            （默认创建 admin / 123456 / 博主）
--   npm run seed:admin -- 账号 密码 昵称
