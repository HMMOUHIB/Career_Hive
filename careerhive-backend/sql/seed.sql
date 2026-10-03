-- CareerHive — demo data (the same people, formations and requests as the UI's demo mode).
-- Every account's password is: demo1234
--   amine@careerhive.tn (employee) · hr@careerhive.tn (HR) · manager@careerhive.tn (manager) · admin@careerhive.tn (admin)
-- Dates are relative to NOW(), so dashboards always show recent activity.
-- Optional: `npm run db:demo` loads this into an empty database (`npm run db:setup` alone starts with 0 users).

SET NAMES utf8mb4;
SET @pw = '$2b$10$.sdRwNenVyVk0wrsIYSM5e1QuNVFjjCgXaQ2pVEAl8yQaQvYzzc3K'; -- bcrypt('demo1234')

INSERT INTO users (id, first_name, last_name, email, password_hash, role, position, department, education, bio, location, phone, experience, current_salary, performance_rating, created_at) VALUES
  (1,  'Admin',   'CareerHive',  'admin@careerhive.tn',   @pw, 'admin',   'Platform Administrator', 'IT',             NULL, NULL, 'Tunis', NULL, NULL, 0, NULL, NOW() - INTERVAL 400 DAY),
  (2,  'Leila',   'Mansour',     'hr@careerhive.tn',      @pw, 'hr',      'HR Director',            'People',         'Master in HR management — IHEC', 'Keeps careers moving.', 'Tunis', '+216 20 111 222', '9 years', 0, NULL, NOW() - INTERVAL 390 DAY),
  (3,  'Sarra',   'Ben Youssef', 'manager@careerhive.tn', @pw, 'manager', 'Engineering Manager',    'Infrastructure', 'Engineering degree — INSAT', 'Runs the infra squad.', 'Tunis', '+216 20 333 444', '11 years', 0, NULL, NOW() - INTERVAL 385 DAY),
  (4,  'Karim',   'Haddad',      'karim@careerhive.tn',   @pw, 'manager', 'Product Lead',           'Product',        NULL, NULL, 'Sfax',  NULL, '8 years', 0, NULL, NOW() - INTERVAL 380 DAY),
  (7,  'Amine',   'Trabelsi',    'amine@careerhive.tn',   @pw, 'student', 'Cloud Engineer II',      'Infrastructure', 'Engineering degree — TEK-UP', 'Cloud engineer who likes boring, reliable infrastructure.', 'Tunis', '+216 20 000 000', '4 years', 2800, 4.5, NOW() - INTERVAL 370 DAY),
  (11, 'Yassine', 'Mejri',       'yassine@careerhive.tn', @pw, 'student', 'Senior SRE',             'Infrastructure', NULL, NULL, 'Tunis', NULL, '6 years', 3400, 4.8, NOW() - INTERVAL 360 DAY),
  (12, 'Hela',    'Zouari',      'hela@careerhive.tn',    @pw, 'student', 'Data Analyst',           'Data',           NULL, NULL, 'Tunis', NULL, '3 years', 2200, 4.2, NOW() - INTERVAL 300 DAY),
  (13, 'Nour',    'Gharbi',      'nour@careerhive.tn',    @pw, 'student', 'Cloud Engineer I',       'Infrastructure', NULL, NULL, 'Sousse', NULL, '1 year', 2100, 3.9, NOW() - INTERVAL 52 DAY),
  (14, 'Omar',    'Jlassi',      'omar@careerhive.tn',    @pw, 'student', 'Platform Engineer',      'Infrastructure', NULL, NULL, 'Tunis', NULL, '4 years', 2900, 4.2, NOW() - INTERVAL 280 DAY),
  (15, 'Firas',   'Ayari',       'firas@careerhive.tn',   @pw, 'student', 'Frontend Developer',     'Product',        NULL, NULL, 'Tunis', NULL, '3 years', 2300, 4.4, NOW() - INTERVAL 260 DAY),
  (16, 'Ines',    'Kallel',      'ines@careerhive.tn',    @pw, 'student', 'Security Engineer',      'Security',       NULL, NULL, 'Tunis', NULL, '5 years', 3100, 4.6, NOW() - INTERVAL 240 DAY),
  (17, 'Walid',   'Saidi',       'walid@careerhive.tn',   @pw, 'student', 'DevOps Engineer',        'Platform',       NULL, NULL, 'Monastir', NULL, '2 years', 2400, 4.0, NOW() - INTERVAL 30 DAY),
  (18, 'Rania',   'Belhadj',     'rania@careerhive.tn',   @pw, 'student', 'DevOps Engineer',        'Platform',       NULL, NULL, 'Tunis', NULL, '2 years', 2500, 4.3, NOW() - INTERVAL 23 DAY),
  (19, 'Mehdi',   'Chaabane',    'mehdi@careerhive.tn',   @pw, 'student', 'Backend Developer',      'Product',        NULL, NULL, 'Tunis', NULL, '2 years', 2400, 4.0, NOW() - INTERVAL 12 DAY),
  (20, 'Syrine',  'Dridi',       'syrine@careerhive.tn',  @pw, 'student', 'QA Engineer',            'Product',        NULL, NULL, 'Bizerte', NULL, '1 year', 2000, 4.1, NOW() - INTERVAL 4 DAY);
UPDATE users SET email_verified_at = created_at; -- demo accounts skip email confirmation

INSERT INTO formations (id, title, description, duration, instructor, level, category, available, icon_url, created_by, created_at) VALUES
  (1, 'Kubernetes in Production',   'Clusters, workloads, autoscaling and day-2 operations on real traffic.', '14h', 'Yassine Mejri',     'Avancé',        'Containers', 1, 'https://cdn.simpleicons.org/kubernetes',    3, NOW() - INTERVAL 350 DAY),
  (2, 'AWS Solutions Architecture', 'Design resilient, cost-aware systems on AWS.',                            '18h', 'Karim Haddad',      'Intermédiaire', 'Cloud',      1, NULL,                                       3, NOW() - INTERVAL 340 DAY),
  (3, 'Terraform & IaC Patterns',   'Modules, state, workspaces and safe rollouts.',                           '10h', 'Omar Jlassi',       'Intermédiaire', 'Automation', 1, 'https://cdn.simpleicons.org/terraform',     3, NOW() - INTERVAL 330 DAY),
  (4, 'Observability with Grafana', 'Metrics, logs and traces that actually answer questions.',               '8h',  'Yassine Mejri',     'Intermédiaire', 'SRE',        1, 'https://cdn.simpleicons.org/grafana',       3, NOW() - INTERVAL 300 DAY),
  (5, 'Leadership for Tech Leads',  'Run design reviews, mentor juniors and own delivery.',                    '6h',  'Sarra Ben Youssef', 'Débutant',      'Leadership', 1, NULL,                                       2, NOW() - INTERVAL 200 DAY),
  (6, 'Secure Cloud Networking',    'Zero-trust, private connectivity and edge protection.',                   '12h', 'Ines Kallel',       'Avancé',        'Security',   1, NULL,                                       3, NOW() - INTERVAL 150 DAY),
  (7, 'CI/CD with GitHub Actions',  'Fast, cached, secure pipelines from commit to prod.',                     '5h',  'Walid Saidi',       'Débutant',      'Automation', 1, 'https://cdn.simpleicons.org/githubactions', 4, NOW() - INTERVAL 120 DAY),
  (8, 'Google Cloud Foundations',   'Core GCP services for multi-cloud engineers.',                            '9h',  'Karim Haddad',      'Débutant',      'Cloud',      1, 'https://cdn.simpleicons.org/googlecloud',   4, NOW() - INTERVAL 60 DAY);

INSERT INTO formation_skills (formation_id, skill_name) VALUES
  (1, 'Kubernetes'), (1, 'Docker'), (1, 'Helm'),
  (2, 'AWS'), (2, 'Architecture'),
  (3, 'Terraform'), (3, 'IaC'),
  (4, 'Observability'), (4, 'Prometheus'),
  (5, 'Leadership'), (5, 'Mentoring'),
  (6, 'Networking'), (6, 'Security'),
  (7, 'CI/CD'), (7, 'GitHub Actions'),
  (8, 'GCP');

INSERT INTO user_formation_progress (id, user_id, formation_id, status, progress, started_at, completed_at, assigned_by) VALUES
  (101, 7,  1, 'En cours', 67,  CURDATE() - INTERVAL 88 DAY,  NULL, 3),
  (102, 7,  2, 'Terminée', 100, CURDATE() - INTERVAL 320 DAY, NOW() - INTERVAL 290 DAY, 3),
  (103, 7,  3, 'Terminée', 100, CURDATE() - INTERVAL 208 DAY, NOW() - INTERVAL 180 DAY, NULL),
  (104, 7,  4, 'En cours', 50,  CURDATE() - INTERVAL 41 DAY,  NULL, 3),
  (105, 7,  7, 'En cours', 20,  CURDATE() - INTERVAL 13 DAY,  NULL, 3),
  (106, 11, 1, 'Terminée', 100, CURDATE() - INTERVAL 120 DAY, NOW() - INTERVAL 90 DAY, NULL),
  (107, 11, 4, 'Terminée', 100, CURDATE() - INTERVAL 60 DAY,  NOW() - INTERVAL 30 DAY, NULL),
  (108, 13, 3, 'En cours', 30,  CURDATE() - INTERVAL 20 DAY,  NULL, 3),
  (109, 14, 3, 'Terminée', 100, CURDATE() - INTERVAL 90 DAY,  NOW() - INTERVAL 60 DAY, NULL),
  (110, 14, 1, 'En cours', 33,  CURDATE() - INTERVAL 35 DAY,  NULL, 3),
  (111, 15, 7, 'Terminée', 100, CURDATE() - INTERVAL 50 DAY,  NOW() - INTERVAL 35 DAY, 4),
  (112, 15, 5, 'En cours', 30,  CURDATE() - INTERVAL 10 DAY,  NULL, NULL),
  (113, 16, 6, 'Terminée', 100, CURDATE() - INTERVAL 70 DAY,  NOW() - INTERVAL 45 DAY, NULL),
  (114, 17, 7, 'En cours', 60,  CURDATE() - INTERVAL 25 DAY,  NULL, 4),
  (115, 17, 4, 'En cours', 0,   CURDATE() - INTERVAL 20 DAY,  NULL, NULL),
  (116, 12, 2, 'En cours', 50,  CURDATE() - INTERVAL 30 DAY,  NULL, 3),
  (117, 18, 3, 'En cours', 60,  CURDATE() - INTERVAL 18 DAY,  NULL, 3),
  (118, 18, 7, 'Terminée', 100, CURDATE() - INTERVAL 40 DAY,  NOW() - INTERVAL 22 DAY, 4),
  (119, 19, 7, 'En cours', 40,  CURDATE() - INTERVAL 6 DAY,   NULL, 4),
  (120, 19, 2, 'En cours', 20,  CURDATE() - INTERVAL 3 DAY,   NULL, 4),
  (121, 20, 5, 'En cours', 0,   CURDATE() - INTERVAL 2 DAY,   NULL, 2);

-- course content (links; uploads land in UPLOAD_DIR); progress on 1 and 4 follows these
INSERT INTO formation_resources (id, formation_id, kind, title, url, created_by, created_at) VALUES
  (1, 1, 'link', 'Official Kubernetes docs',   'https://kubernetes.io/docs/',                                                    3, NOW() - INTERVAL 100 DAY),
  (2, 1, 'link', 'kubectl quick reference',    'https://kubernetes.io/docs/reference/kubectl/quick-reference/',                  3, NOW() - INTERVAL 100 DAY),
  (3, 1, 'link', 'Horizontal Pod Autoscaling', 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/',     3, NOW() - INTERVAL 99 DAY),
  (4, 4, 'link', 'Grafana documentation',      'https://grafana.com/docs/grafana/latest/',                                       3, NOW() - INTERVAL 70 DAY),
  (5, 4, 'link', 'PromQL basics',              'https://prometheus.io/docs/prometheus/latest/querying/basics/',                  3, NOW() - INTERVAL 70 DAY);

INSERT INTO resource_completions (user_id, resource_id, completed_at) VALUES
  (7, 1, NOW() - INTERVAL 80 DAY), (7, 2, NOW() - INTERVAL 60 DAY), (7, 4, NOW() - INTERVAL 30 DAY),
  (11, 1, NOW() - INTERVAL 110 DAY), (11, 2, NOW() - INTERVAL 100 DAY), (11, 3, NOW() - INTERVAL 90 DAY),
  (11, 4, NOW() - INTERVAL 45 DAY), (11, 5, NOW() - INTERVAL 30 DAY),
  (14, 1, NOW() - INTERVAL 20 DAY);

INSERT INTO skills (user_id, skill_name, category, level, created_at) VALUES
  (7, 'AWS', 'Cloud', 4, NOW() - INTERVAL 300 DAY), (7, 'Kubernetes', 'Containers', 3, NOW() - INTERVAL 200 DAY),
  (7, 'Terraform', 'Automation', 4, NOW() - INTERVAL 180 DAY), (7, 'Linux', 'Systems', 4, NOW() - INTERVAL 360 DAY),
  (7, 'Python', 'Programming', 3, NOW() - INTERVAL 360 DAY), (7, 'CI/CD', 'Automation', 3, NOW() - INTERVAL 10 DAY),
  (11, 'Kubernetes', 'Containers', 5, NOW() - INTERVAL 300 DAY), (11, 'Prometheus', 'SRE', 5, NOW() - INTERVAL 300 DAY), (11, 'Go', 'Programming', 3, NOW() - INTERVAL 200 DAY),
  (12, 'SQL', 'Data', 5, NOW() - INTERVAL 280 DAY), (12, 'Python', 'Programming', 4, NOW() - INTERVAL 280 DAY), (12, 'Power BI', 'Data', 4, NOW() - INTERVAL 100 DAY),
  (13, 'Linux', 'Systems', 3, NOW() - INTERVAL 50 DAY), (13, 'AWS', 'Cloud', 2, NOW() - INTERVAL 40 DAY),
  (14, 'Terraform', 'Automation', 5, NOW() - INTERVAL 260 DAY), (14, 'Go', 'Programming', 4, NOW() - INTERVAL 260 DAY), (14, 'Kubernetes', 'Containers', 3, NOW() - INTERVAL 30 DAY),
  (15, 'React', 'Frontend', 5, NOW() - INTERVAL 250 DAY), (15, 'TypeScript', 'Frontend', 4, NOW() - INTERVAL 250 DAY), (15, 'CSS', 'Frontend', 4, NOW() - INTERVAL 250 DAY),
  (16, 'Security', 'Security', 5, NOW() - INTERVAL 230 DAY), (16, 'Networking', 'Security', 4, NOW() - INTERVAL 230 DAY),
  (17, 'CI/CD', 'Automation', 4, NOW() - INTERVAL 28 DAY), (17, 'Docker', 'Containers', 4, NOW() - INTERVAL 28 DAY),
  (18, 'Terraform', 'Automation', 3, NOW() - INTERVAL 20 DAY), (18, 'CI/CD', 'Automation', 4, NOW() - INTERVAL 20 DAY), (18, 'AWS', 'Cloud', 3, NOW() - INTERVAL 15 DAY),
  (19, 'Node.js', 'Backend', 4, NOW() - INTERVAL 10 DAY), (19, 'SQL', 'Data', 3, NOW() - INTERVAL 10 DAY), (19, 'Python', 'Programming', 3, NOW() - INTERVAL 9 DAY),
  (20, 'Testing', 'Quality', 3, NOW() - INTERVAL 3 DAY), (20, 'Python', 'Programming', 2, NOW() - INTERVAL 3 DAY);

INSERT INTO certificates (user_id, certificate_name, issued_date, created_at) VALUES
  (7,  'AWS Solutions Architect – Associate',      CURDATE() - INTERVAL 243 DAY, NOW() - INTERVAL 243 DAY),
  (7,  'HashiCorp Terraform Associate',            CURDATE() - INTERVAL 131 DAY, NOW() - INTERVAL 131 DAY),
  (11, 'Certified Kubernetes Administrator (CKA)', CURDATE() - INTERVAL 40 DAY,  NOW() - INTERVAL 40 DAY),
  (15, 'Meta Front-End Developer',                 CURDATE() - INTERVAL 55 DAY,  NOW() - INTERVAL 55 DAY),
  (16, 'CompTIA Security+',                        CURDATE() - INTERVAL 20 DAY,  NOW() - INTERVAL 20 DAY),
  (18, 'HashiCorp Terraform Associate',            CURDATE() - INTERVAL 9 DAY,   NOW() - INTERVAL 9 DAY);

INSERT INTO promotion_requests (id, user_id, current_position, requested_position, department, current_salary, requested_salary, justification, achievements, timeline, status, submitted_date,
  hr_approved, hr_reviewer_id, hr_approved_by, hr_approved_date, hr_comments,
  manager_approved, manager_reviewer_id, manager_approved_by, manager_approved_date, manager_approved_position, manager_approved_salary, manager_rating, manager_comments) VALUES
  (4, 7, 'Cloud Engineer I', 'Cloud Engineer II', 'Infrastructure', 2400, 2900, 'Led the managed Kubernetes migration.', 'Cluster migration\nCut infra cost 18%', 'Next review cycle', 'approved', CURDATE() - INTERVAL 495 DAY,
    1, 2, 'Leila Mansour', CURDATE() - INTERVAL 491 DAY, 'Solid file.',
    1, 3, 'Sarra Ben Youssef', CURDATE() - INTERVAL 485 DAY, 'Cloud Engineer II', 2800, 4.5, 'Well deserved.'),
  (9, 12, 'Data Analyst', 'Senior Data Analyst', 'Data', 2200, 2700, 'Owns the churn model and weekly exec reporting.', 'Churn model\nExec dashboard', 'Next review cycle', 'pending', CURDATE() - INTERVAL 10 DAY,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (10, 15, 'Frontend Developer', 'Senior Frontend Developer', 'Product', 2300, 2900, 'Rebuilt the design system and mentors two juniors.', 'Design system v2', 'Within 3 months', 'on-hold', CURDATE() - INTERVAL 18 DAY,
    1, 2, 'Leila Mansour', CURDATE() - INTERVAL 14 DAY, 'Good for manager review.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO promotion_request_skills (promotion_request_id, skill_name) VALUES
  (4, 'Kubernetes'), (4, 'AWS'), (9, 'SQL'), (9, 'Python'), (10, 'React'), (10, 'TypeScript');
INSERT INTO promotion_request_certificates (promotion_request_id, certificate_name) VALUES
  (4, 'AWS Solutions Architect – Associate'), (10, 'Meta Front-End Developer');

INSERT INTO formation_requests (id, formation_id, user_id, motivation, status, requested_at, hr_reviewed_by, hr_reviewed_at, decided_by, decided_at) VALUES
  (31, 6, 7,  'Needed for the zero-trust rollout next quarter.', 'on-hold',  NOW() - INTERVAL 7 DAY,  2, NOW() - INTERVAL 5 DAY,  NULL, NULL),
  (33, 1, 13, 'I am joining the platform on-call rotation.',     'pending',  NOW() - INTERVAL 1 DAY,  NULL, NULL, NULL, NULL),
  (34, 4, 17, 'Our alerts are noisy; I want to fix them.',       'approved', NOW() - INTERVAL 24 DAY, 2, NOW() - INTERVAL 23 DAY, 3, NOW() - INTERVAL 20 DAY),
  (35, 6, 20, 'Curious about network security.',                 'rejected', NOW() - INTERVAL 16 DAY, NULL, NULL, 2, NOW() - INTERVAL 15 DAY);

INSERT INTO teams (id, name, manager_user_id, manager_name, manager_role, created_by, created_at) VALUES
  (1, 'Infra Squad',     3, 'Sarra Ben Youssef', 'Engineering Manager', 3, NOW() - INTERVAL 380 DAY),
  (2, 'Product Web',     4, 'Karim Haddad',      'Product Lead',        4, NOW() - INTERVAL 370 DAY),
  (3, 'Data & Platform', 3, 'Sarra Ben Youssef', 'Engineering Manager', 2, NOW() - INTERVAL 90 DAY);

INSERT INTO team_members (id, team_id, user_id, member_name, member_role, rating, feedback, completed_trainings, tag, joined_at) VALUES
  (11, 1, 11,   'Yassine Mejri',   'Senior SRE',                 4.8, 'Go-to person for incidents.',               0, NULL,         NOW() - INTERVAL 360 DAY),
  (12, 1, 7,    'Amine Trabelsi',  'Cloud Engineer II',          4.4, 'Strong ownership on the cluster migration.', 0, NULL,         NOW() - INTERVAL 360 DAY),
  (13, 1, 13,   'Nour Gharbi',     'Cloud Engineer I',           3.9, 'Learning fast.',                            0, NULL,         NOW() - INTERVAL 50 DAY),
  (14, 1, 14,   'Omar Jlassi',     'Platform Engineer',          4.2, NULL,                                        0, NULL,         NOW() - INTERVAL 280 DAY),
  (15, 1, 16,   'Ines Kallel',     'Security Engineer',          4.6, 'Great WAF work.',                           0, 'In meeting', NOW() - INTERVAL 240 DAY),
  (21, 2, 15,   'Firas Ayari',     'Frontend Developer',         4.4, NULL,                                        0, NULL,         NOW() - INTERVAL 260 DAY),
  (22, 2, 17,   'Walid Saidi',     'DevOps Engineer',            4.0, NULL,                                        0, NULL,         NOW() - INTERVAL 30 DAY),
  (23, 2, 19,   'Mehdi Chaabane',  'Backend Developer',          4.0, NULL,                                        0, NULL,         NOW() - INTERVAL 12 DAY),
  (24, 2, 20,   'Syrine Dridi',    'QA Engineer',                4.1, NULL,                                        0, NULL,         NOW() - INTERVAL 4 DAY),
  (31, 3, 12,   'Hela Zouari',     'Data Analyst',               4.2, NULL,                                        0, NULL,         NOW() - INTERVAL 90 DAY),
  (32, 3, 18,   'Rania Belhadj',   'DevOps Engineer',            4.3, NULL,                                        0, NULL,         NOW() - INTERVAL 23 DAY),
  (33, 3, NULL, 'Sami Ferchichi',  'Data Engineer (contractor)', NULL, NULL,                                       2, NULL,         NOW() - INTERVAL 60 DAY);

INSERT INTO team_member_skills (team_member_id, skill_name) VALUES (33, 'Spark'), (33, 'Airflow');

-- contact_member_id = the member the sender wrote to (see schema.sql)
INSERT INTO chat_messages (sender_id, recipient_id, contact_member_id, text, sent_at, read_at) VALUES
  (11, 7,  12, 'Saw you are on the Kubernetes track — want a mock exam session Thursday?', NOW() - INTERVAL 125 MINUTE, NOW() - INTERVAL 120 MINUTE),
  (7,  11, 11, 'Yes please! After stand-up works for me.',                                 NOW() - INTERVAL 118 MINUTE, NOW() - INTERVAL 100 MINUTE),
  (13, 7,  12, 'Thanks for the Terraform module review 🙏',                                NOW() - INTERVAL 3 DAY,      NOW() - INTERVAL 3 DAY),
  (16, 7,  12, 'The networking formation is worth it, happy to share my notes.',          NOW() - INTERVAL 5 HOUR,     NULL),
  (15, 17, 22, 'Pipeline is green again 🎉',                                              NOW() - INTERVAL 1 DAY,      NULL);

INSERT INTO notifications (user_id, type, title, body, link, contact_id, is_read, created_at) VALUES
  (7,  'message',   'Ines Kallel',                                  'The networking formation is worth it, happy to share my notes.', NULL, 16, 0, NOW() - INTERVAL 5 HOUR),
  (7,  'formation', 'HR approved “Secure Cloud Networking”',        'Waiting for your manager to confirm the enrollment.', '/formations?tab=requests', NULL, 0, NOW() - INTERVAL 5 DAY),
  (7,  'formation', 'New formation assigned',                       'CI/CD with GitHub Actions', '/formations?open=7', NULL, 1, NOW() - INTERVAL 13 DAY),
  (17, 'message',   'Firas Ayari',                                  'Pipeline is green again 🎉', NULL, 15, 0, NOW() - INTERVAL 1 DAY),
  (2,  'review',    'Hela Zouari asks for a promotion',             'Data Analyst → Senior Data Analyst', '/reviews', NULL, 0, NOW() - INTERVAL 10 DAY),
  (2,  'review',    'Nour Gharbi wants to join a formation',        'Kubernetes in Production', '/reviews', NULL, 0, NOW() - INTERVAL 1 DAY),
  (3,  'review',    'Firas Ayari’s promotion is ready for you',     'Frontend Developer → Senior Frontend Developer', '/reviews', NULL, 0, NOW() - INTERVAL 14 DAY),
  (3,  'review',    'Amine Trabelsi wants to join a formation',     'Secure Cloud Networking — approved by HR', '/reviews', NULL, 0, NOW() - INTERVAL 5 DAY),
  (20, 'rejected',  '“Secure Cloud Networking” request declined',   'Talk to your manager about alternatives.', '/formations?tab=requests', NULL, 1, NOW() - INTERVAL 15 DAY),
  (20, 'formation', 'New formation assigned',                       'Leadership for Tech Leads', '/formations?open=5', NULL, 0, NOW() - INTERVAL 2 DAY);
