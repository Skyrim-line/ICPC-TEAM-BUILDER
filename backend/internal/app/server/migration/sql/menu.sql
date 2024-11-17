truncate table menu restart identity;

INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (1, NULL, NULL, NULL, 'User navigation', -1, '', 10);
INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (2, NULL, NULL, NULL, 'Team management', 1, 'User navigation', 20);
INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (3, NULL, NULL, NULL, 'Profile', 1, 'User navigation', 25);

INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (10, NULL, NULL, NULL, 'System management', -1, '', 100);
INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (11, NULL, NULL, NULL, 'User management', 10, 'System management', 110);
INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (12, NULL, NULL, NULL, 'Role setting', 11, 'User management', 120);
INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (13, NULL, NULL, NULL, 'User setting', 11, 'User management', 130);
INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (14, NULL, NULL, NULL, 'Dictionary management', 10, 'System management', 115);
INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (15, NULL, NULL, NULL, 'Competition management', 10, 'System management', 116);
INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (16, NULL, NULL, NULL, 'Group management', 10, 'System management', 117);
INSERT INTO "public"."menu" ("id", "created_at", "updated_at", "deleted_at", "name", "parent_id", "parent_name", "order_index") VALUES (17, NULL, NULL, NULL, 'Logistics management', 10, 'System management', 118);

select setval('menu_id_seq', max(id)) FROM menu;