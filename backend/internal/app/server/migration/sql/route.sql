truncate table route restart identity;


INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (100, NULL, NULL, NULL, '/api/accounts/me', 3, 'Profile', 'GET');

INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (110, NULL, NULL, NULL, '/api/menus', 12, 'Role setting', 'GET');

INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (114, NULL, NULL, NULL, '/api/roles', 12, 'Role setting', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (115, NULL, NULL, NULL, '/api/roles', 12, 'Role setting', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (116, NULL, NULL, NULL, '/api/roles/:id', 12, 'Role setting', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (117, NULL, NULL, NULL, '/api/roles/:id', 12, 'Role setting', 'PUT');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (118, NULL, NULL, NULL, '/api/roles/:id', 12, 'Role setting', 'DELETE');

INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (120, NULL, NULL, NULL, '/api/accounts/:id/password', 13, 'User setting', 'PUT');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (121, NULL, NULL, NULL, '/api/accounts', 13, 'User setting', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (122, NULL, NULL, NULL, '/api/accounts', 13, 'User setting', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (123, NULL, NULL, NULL, '/api/accounts/:id', 13, 'User setting', 'DELETE');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (124, NULL, NULL, NULL, '/api/accounts/:id', 13, 'User setting', 'PUT');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (125, NULL, NULL, NULL, '/api/accounts/:id', 13, 'User setting', 'GET');

INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (130, NULL, NULL, NULL, '/api/profiles', 3, 'Profile', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (131, NULL, NULL, NULL, '/api/profiles/matchingInfo', 3, 'Profile', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (132, NULL, NULL, NULL, '/api/profiles/invitation', 3, 'Profile', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (133, NULL, NULL, NULL, '/api/profiles/invitation/consent', 3, 'Profile', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (134, NULL, NULL, NULL, '/api/profiles/invitation', 3, 'Profile', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (135, NULL, NULL, NULL, '/api/profiles/invitation/me', 3, 'Profile', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (136, NULL, NULL, NULL, '/api/profiles/ready', 3, 'Profile', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (137, NULL, NULL, NULL, '/api/profiles/ready', 3, 'Profile', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (138, NULL, NULL, NULL, '/api/accounts/search', 3, 'Profile', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (139, NULL, NULL, NULL, '/api/profiles/matchingInfo', 3, 'Profile', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (140, NULL, NULL, NULL, '/api/profiles', 3, 'Profile', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (141, NULL, NULL, NULL, '/api/accounts/:id/password', 3, 'Profile', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (142, NULL, NULL, NULL, '/api/tasks', 3, 'Profile', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (143, NULL, NULL, NULL, '/api/profiles/invitation/:id', 3, 'Profile', 'DELETE');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (144, NULL, NULL, NULL, '/api/tasks/current', 3, 'Profile', 'GET');


INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (145, NULL, NULL, NULL, '/api/groups/me', 2, 'Team management', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (146, NULL, NULL, NULL, '/api/groups/me', 2, 'Team management', 'POST');

INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (150, NULL, NULL, NULL, '/api/universities', 14, 'Dictionary management', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (151, NULL, NULL, NULL, '/api/universities/:id', 14, 'Dictionary management', 'DELETE');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (152, NULL, NULL, NULL, '/api/universities', 14, 'Dictionary management', 'GET');

INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (160, NULL, NULL, NULL, '/api/tasks', 15, 'Competition management', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (161, NULL, NULL, NULL, '/api/tasks', 15, 'Competition management', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (162, NULL, NULL, NULL, '/api/tasks/:id', 15, 'Competition management', 'DELETE');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (163, NULL, NULL, NULL, '/api/tasks/:id', 15, 'Competition management', 'PUT');

INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (170, NULL, NULL, NULL, '/api/groups/:id', 16, 'Group management', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (171, NULL, NULL, NULL, '/api/groups', 16, 'Group management', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (172, NULL, NULL, NULL, '/api/groups/unmatched', 16, 'Group management', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (173, NULL, NULL, NULL, '/api/groups', 16, 'Group management', 'POST');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (174, NULL, NULL, NULL, '/api/groups/:id', 16, 'Group management', 'DELETE');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (176, NULL, NULL, NULL, '/api/groups/release', 16, 'Group management', 'POST');

INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (180, NULL, NULL, NULL, '/api/logistics', 17, 'Logistics management', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (181, NULL, NULL, NULL, '/api/logistics/file', 17, 'Logistics management', 'GET');
INSERT INTO "public"."route" ("id", "created_at", "updated_at", "deleted_at", "name", "menu_id", "menu_name", "method") VALUES (182, NULL, NULL, NULL, '/api/logistics/site', 17, 'Logistics management', 'GET');

select setval('route_id_seq', max(id)) FROM route;