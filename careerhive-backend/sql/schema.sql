-- CareerHive — database schema (MySQL 8.0+ / MariaDB 10.4+).
--
-- Table and column names follow the original careerhive_db, extended with what the redesigned UI needs:
-- two-way chat, stored notifications, course content, presence and review audit columns.
-- Every statement is idempotent (CREATE ... IF NOT EXISTS), so re-running this file is safe.
-- `npm run db:setup` creates the database and runs this file; in phpMyAdmin, select the database first.
--
-- Conventions: DATETIME columns hold UTC (the API sets the session time zone to +00:00);
-- role 'student' is an employee (the UI labels it "Employee").

-- ---------------------------------------------------------------- people

CREATE TABLE IF NOT EXISTS users (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name         VARCHAR(100) NOT NULL,
  last_name          VARCHAR(100) NOT NULL DEFAULT '',
  email              VARCHAR(255) NOT NULL,
  email_verified_at  DATETIME NULL COMMENT 'set when the emailed link is opened (or by social sign-in); required to sign in',
  password_hash      VARCHAR(255) NULL COMMENT 'bcrypt; NULL for social-only accounts',
  role               ENUM('student', 'manager', 'hr', 'admin') NOT NULL DEFAULT 'student',
  position           VARCHAR(150) NULL,
  department         VARCHAR(150) NULL,
  education          VARCHAR(255) NULL,
  bio                TEXT NULL,
  location           VARCHAR(150) NULL,
  phone              VARCHAR(50) NULL,
  profile_photo      LONGTEXT NULL COMMENT 'data: URL (base64) or https URL',
  cover_photo        LONGTEXT NULL COMMENT 'data: URL (base64) or https URL',
  experience         VARCHAR(50) NULL,
  current_salary     DECIMAL(10, 2) NOT NULL DEFAULT 0,
  performance_rating DECIMAL(2, 1) NULL,
  oauth_provider     VARCHAR(20) NULL,
  oauth_id           VARCHAR(255) NULL,
  last_seen_at       DATETIME NULL COMMENT 'drives the online / away / off presence dots',
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_oauth (oauth_provider, oauth_id),
  KEY ix_users_role (role)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- single-use links sent by email; only a SHA-256 of the token is stored, the token itself lives in the email
CREATE TABLE IF NOT EXISTS auth_tokens (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  purpose    ENUM('verify_email', 'reset_password') NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  KEY ix_auth_tokens_user (user_id, purpose),
  CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skills (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  skill_name VARCHAR(150) NOT NULL,
  category   VARCHAR(100) NULL,
  level      TINYINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skills_user_name (user_id, skill_name),
  CONSTRAINT fk_skills_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificates (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED NOT NULL,
  certificate_name VARCHAR(255) NOT NULL,
  issued_date      DATE NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_certificates_user (user_id),
  CONSTRAINT fk_certificates_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- learning

CREATE TABLE IF NOT EXISTS formations (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(255) NOT NULL,
  description TEXT NULL,
  duration    VARCHAR(50) NULL COMMENT 'free text, e.g. 14h',
  instructor  VARCHAR(150) NULL,
  level       ENUM('Débutant', 'Intermédiaire', 'Avancé') NOT NULL DEFAULT 'Intermédiaire',
  category    VARCHAR(100) NULL,
  available   TINYINT(1) NOT NULL DEFAULT 1,
  icon_url    VARCHAR(500) NULL COMMENT 'https://cdn.simpleicons.org/<slug>, any image URL, or mark:<name>',
  created_by  INT UNSIGNED NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_formations_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS formation_skills (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  formation_id INT UNSIGNED NOT NULL,
  skill_name   VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_formation_skills (formation_id, skill_name),
  CONSTRAINT fk_formation_skills_formation FOREIGN KEY (formation_id) REFERENCES formations (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- one row per enrollment
CREATE TABLE IF NOT EXISTS user_formation_progress (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  formation_id INT UNSIGNED NOT NULL,
  status       ENUM('En cours', 'Terminée') NOT NULL DEFAULT 'En cours',
  progress     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  started_at   DATE NOT NULL,
  completed_at DATETIME NULL,
  assigned_by  INT UNSIGNED NULL COMMENT 'staff member who assigned it; NULL when enrolled through a request',
  PRIMARY KEY (id),
  UNIQUE KEY uq_progress_user_formation (user_id, formation_id),
  KEY ix_progress_formation (formation_id),
  CONSTRAINT ck_progress_range CHECK (progress <= 100),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_formation FOREIGN KEY (formation_id) REFERENCES formations (id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_assigner FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- enrollment requests: pending (HR) -> on-hold (manager) -> approved | rejected
CREATE TABLE IF NOT EXISTS formation_requests (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  formation_id   INT UNSIGNED NOT NULL,
  user_id        INT UNSIGNED NOT NULL,
  motivation     TEXT NOT NULL,
  status         ENUM('pending', 'on-hold', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  requested_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  hr_reviewed_by INT UNSIGNED NULL,
  hr_reviewed_at DATETIME NULL,
  decided_by     INT UNSIGNED NULL,
  decided_at     DATETIME NULL,
  PRIMARY KEY (id),
  KEY ix_formation_requests_status (status),
  KEY ix_formation_requests_user (user_id),
  CONSTRAINT fk_formation_requests_formation FOREIGN KEY (formation_id) REFERENCES formations (id) ON DELETE CASCADE,
  CONSTRAINT fk_formation_requests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_formation_requests_hr FOREIGN KEY (hr_reviewed_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_formation_requests_decider FOREIGN KEY (decided_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- course content: uploaded videos / files, and links
CREATE TABLE IF NOT EXISTS formation_resources (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  formation_id INT UNSIGNED NOT NULL,
  kind         ENUM('video', 'file', 'link') NOT NULL,
  title        VARCHAR(255) NOT NULL,
  url          VARCHAR(1000) NOT NULL COMMENT '/uploads/... for stored files, http(s) for links',
  file_name    VARCHAR(255) NULL,
  mime         VARCHAR(150) NULL,
  size         BIGINT UNSIGNED NULL,
  storage_path VARCHAR(500) NULL COMMENT 'path inside UPLOAD_DIR, deleted with the row',
  created_by   INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_resources_formation (formation_id),
  CONSTRAINT fk_resources_formation FOREIGN KEY (formation_id) REFERENCES formations (id) ON DELETE CASCADE,
  CONSTRAINT fk_resources_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- which resources each learner finished; progress = finished / total
CREATE TABLE IF NOT EXISTS resource_completions (
  user_id      INT UNSIGNED NOT NULL,
  resource_id  INT UNSIGNED NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, resource_id),
  KEY ix_completions_resource (resource_id),
  CONSTRAINT fk_completions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_completions_resource FOREIGN KEY (resource_id) REFERENCES formation_resources (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- promotions

-- pending (HR reviews) -> on-hold (manager decides) -> approved | rejected
CREATE TABLE IF NOT EXISTS promotion_requests (
  id                        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id                   INT UNSIGNED NOT NULL,
  current_position          VARCHAR(150) NOT NULL DEFAULT '',
  requested_position        VARCHAR(150) NOT NULL,
  department                VARCHAR(100) NULL,
  current_salary            DECIMAL(10, 2) NOT NULL DEFAULT 0,
  requested_salary          DECIMAL(10, 2) NOT NULL DEFAULT 0,
  justification             TEXT NOT NULL,
  achievements              TEXT NULL COMMENT 'one per line',
  timeline                  VARCHAR(150) NULL,
  status                    ENUM('pending', 'on-hold', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  submitted_date            DATE NOT NULL,
  hr_approved               TINYINT(1) NULL COMMENT 'NULL = not reviewed yet',
  hr_reviewer_id            INT UNSIGNED NULL,
  hr_approved_by            VARCHAR(150) NULL,
  hr_approved_date          DATE NULL,
  hr_comments               TEXT NULL,
  manager_approved          TINYINT(1) NULL COMMENT 'NULL = not decided yet',
  manager_reviewer_id       INT UNSIGNED NULL,
  manager_approved_by       VARCHAR(150) NULL,
  manager_approved_date     DATE NULL,
  manager_approved_position VARCHAR(150) NULL,
  manager_approved_salary   DECIMAL(10, 2) NULL,
  manager_rating            DECIMAL(2, 1) NULL,
  manager_comments          TEXT NULL,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_promotions_user (user_id),
  KEY ix_promotions_status (status),
  CONSTRAINT fk_promotions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_promotions_hr FOREIGN KEY (hr_reviewer_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_promotions_manager FOREIGN KEY (manager_reviewer_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotion_request_skills (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  promotion_request_id INT UNSIGNED NOT NULL,
  skill_name           VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_promotion_skills_request (promotion_request_id),
  CONSTRAINT fk_promotion_skills_request FOREIGN KEY (promotion_request_id) REFERENCES promotion_requests (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- snapshot of the employee's certificates at submission time
CREATE TABLE IF NOT EXISTS promotion_request_certificates (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  promotion_request_id INT UNSIGNED NOT NULL,
  certificate_name     VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_promotion_certificates_request (promotion_request_id),
  CONSTRAINT fk_promotion_certificates_request FOREIGN KEY (promotion_request_id) REFERENCES promotion_requests (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- teams & communication

CREATE TABLE IF NOT EXISTS teams (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(255) NOT NULL,
  manager_user_id INT UNSIGNED NULL,
  manager_name    VARCHAR(150) NULL,
  manager_role    VARCHAR(100) NULL,
  manager_avatar  LONGTEXT NULL,
  created_by      INT UNSIGNED NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_teams_manager FOREIGN KEY (manager_user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_teams_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- a member is linked to an account (user_id) or added by name only
CREATE TABLE IF NOT EXISTS team_members (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_id             INT UNSIGNED NOT NULL,
  user_id             INT UNSIGNED NULL,
  member_name         VARCHAR(150) NOT NULL,
  member_avatar       LONGTEXT NULL,
  member_role         VARCHAR(150) NULL,
  rating              DECIMAL(2, 1) NULL,
  feedback            TEXT NULL,
  completed_trainings INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'used for members without an account',
  tag                 VARCHAR(60) NULL COMMENT 'short status label, e.g. In meeting',
  joined_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_team_members_user (team_id, user_id),
  KEY ix_team_members_user (user_id),
  CONSTRAINT ck_team_members_rating CHECK (rating IS NULL OR rating BETWEEN 0 AND 5),
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_member_skills (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_member_id INT UNSIGNED NOT NULL,
  skill_name     VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_team_member_skills (team_member_id, skill_name),
  CONSTRAINT fk_team_member_skills_member FOREIGN KEY (team_member_id) REFERENCES team_members (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- The UI addresses chats by team-member id. contact_member_id is the member the sender wrote to;
-- recipient_id is that member's account, so the other side sees the message too (NULL = name-only member).
CREATE TABLE IF NOT EXISTS chat_messages (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id         INT UNSIGNED NOT NULL,
  recipient_id      INT UNSIGNED NULL,
  contact_member_id INT UNSIGNED NULL,
  text              TEXT NOT NULL,
  sent_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  read_at           DATETIME NULL,
  PRIMARY KEY (id),
  KEY ix_chat_sender (sender_id, sent_at),
  KEY ix_chat_recipient (recipient_id, read_at),
  CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_member FOREIGN KEY (contact_member_id) REFERENCES team_members (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  type       ENUM('message', 'promotion', 'promoted', 'rejected', 'formation', 'review', 'info', 'social') NOT NULL DEFAULT 'info',
  title      VARCHAR(255) NOT NULL,
  body       TEXT NULL,
  link       VARCHAR(255) NULL COMMENT 'in-app route, e.g. /reviews',
  contact_id INT UNSIGNED NULL COMMENT 'team-member id of the sender, for message notifications',
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_notifications_user (user_id, is_read, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Social: everyone can post (text and an optional image), like, comment and follow people; a feed shows the posts of
-- the people you follow. Post images are files under UPLOAD_DIR/posts with random names, served at /uploads/….
CREATE TABLE IF NOT EXISTS posts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  body       TEXT NULL,
  image_path VARCHAR(255) NULL COMMENT 'relative to UPLOAD_DIR, e.g. posts/3f9a….jpg',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_posts_user (user_id, id),
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_likes (
  post_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  KEY ix_post_likes_user (user_id),
  CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_comments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  body       TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_post_comments_post (post_id, id),
  CONSTRAINT fk_post_comments_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT fk_post_comments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS follows (
  follower_id INT UNSIGNED NOT NULL,
  followee_id INT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followee_id),
  KEY ix_follows_followee (followee_id),
  CONSTRAINT ck_follows_self CHECK (follower_id <> followee_id),
  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_follows_followee FOREIGN KEY (followee_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- CV coach: the latest analysis per person (skills, experience, score, recommendations). The CV file and its text
-- are never stored.
CREATE TABLE IF NOT EXISTS cv_analyses (
  user_id    INT UNSIGNED NOT NULL,
  file_name  VARCHAR(255) NOT NULL,
  result     LONGTEXT NOT NULL COMMENT 'JSON produced by src/cv/analyze.js',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_cv_analyses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
