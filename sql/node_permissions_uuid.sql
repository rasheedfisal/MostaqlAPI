------------------- Users-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(), 'user_add', 'Add User', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'user_update', 'Update User', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'user_get', 'Get User', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'user_get_all', 'Get All User', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'user_delete', 'Delete User', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'user_lock_unlock', 'Lock and Unlock User', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'user_get_enginners', 'get list of enginners', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'user_authorize', 'Authorize and unAuthorize user', now(), now());

------------------- Roles-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'role_add', 'Add Role', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'role_update', 'Update Role', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'role_get', 'Get Role', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'role_get_all', 'Get All Role', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'role_delete', 'Delete Role', now(), now());

------------------- Permissions-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'permissions_add', 'Add Permission', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'permissions_update', 'Update Permission', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'permissions_get', 'Get Permission', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'permissions_get_all', 'Get All Permission', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'permissions_delete', 'Delete Permission', now(), now());

------------------- Categories-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'category_add', 'Add Category', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'category_update', 'Update Category', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'category_get', 'Get Category', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'category_get_all', 'Get All Categories', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'category_delete', 'Delete Category', now(), now());

------------------- Profiles-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'profile_add', 'Add Profile', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'profile_update', 'Update Profile', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'profile_get', 'Get Profile', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'profile_get_all', 'Get All Profiles', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'profile_delete', 'Delete Profile', now(), now());

------------------- Projects-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'project_add', 'Add Project', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'project_update', 'Update Project', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'project_get', 'Get Project', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'project_get_all', 'Get All Project', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'project_delete', 'Delete Project', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'user_get_project', 'Get User Project', now(), now());

------------------- Price Range -------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'range_add', 'Add Price Range', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'range_get_all', 'Get All Price Ranges', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'range_get', 'Get Price Range', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'range_update', 'Update Price Range', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'range_delete', 'Delete Price Range', now(), now());

------------------- Commission Rate -------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'commission_rate_add', 'Add Commission Rate', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'commission_rate_get_all', 'Get All Commission Rate', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'commission_rate_get', 'Get Commission Rate', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'commission_rate_update', 'Update Commission Rate', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'commission_rate_delete', 'Delete Commission Rate', now(), now());

------------------- Commission Rate -------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'common_questions_add', 'Add Common Question', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'common_questions_get_all', 'Get All Common Question', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'common_questions_get', 'Get Common Question', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'common_questions_update', 'Update Common Question', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'common_questions_delete', 'Delete Common Question', now(), now());


------------------- Project Offers-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'project_offer_add', 'Add Project Offer', now(), now());
-- INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'project_offer_get_all', 'get Project Offers', now(), now());
-- INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'owner_project_offer_get_all', 'get owner Project Offers', now(), now());

------------------- Conversations-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'conversation_add', 'save message between sender and reciever', now(), now());
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'user_conversation_get_all', 'get all message between sender and reciever', now(), now());


-------------------Can Access Dasboard-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'can_access_dashboard', 'allows the user to access the dashboard', now(), now());
-------------------Is Enginner-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'is_enginner', 'is the user enginner', now(), now());
-------------------Is Project Owner-------------------
INSERT INTO permissions(id,perm_name, perm_description, createdAt, updatedAt) VALUES(uuid(),'is_product_owner', 'is the user project owner', now(), now());


--permission
--f1009a0a-8c11-11ed-836e-0050564873b7

--role
--f1f4a509-3b95-11ed-8686-ecf4bb83b19b
insert into rolepermissions(id, role_id, perm_id, createdAt, updatedAt) values(uuid(), 'f1f4a509-3b95-11ed-8686-ecf4bb83b19b', 'bee5ac0c-3b95-11ed-8686-ecf4bb83b19b', now(), now());
insert into rolepermissions(id, role_id, perm_id, createdAt, updatedAt) values(uuid(), 'f1f4a509-3b95-11ed-8686-ecf4bb83b19b', 'bee773fd-3b95-11ed-8686-ecf4bb83b19b', now(), now());
insert into rolepermissions(id, role_id, perm_id, createdAt, updatedAt) values(uuid(), 'f1f4a509-3b95-11ed-8686-ecf4bb83b19b', 'beea36a3-3b95-11ed-8686-ecf4bb83b19b', now(), now());
insert into rolepermissions(id, role_id, perm_id, createdAt, updatedAt) values(uuid(), 'f1f4a509-3b95-11ed-8686-ecf4bb83b19b', 'bee9c6cb-3b95-11ed-8686-ecf4bb83b19b', now(), now());
insert into rolepermissions(id, role_id, perm_id, createdAt, updatedAt) values(uuid(), 'f1f4a509-3b95-11ed-8686-ecf4bb83b19b', 'f1009a0a-8c11-11ed-836e-0050564873b7', now(), now());
insert into rolepermissions(id, role_id, perm_id, createdAt, updatedAt) values(uuid(), 'f1f4a509-3b95-11ed-8686-ecf4bb83b19b', 'bee3f4d1-3b95-11ed-8686-ecf4bb83b19b', now(), now());
insert into rolepermissions(id, role_id, perm_id, createdAt, updatedAt) values(uuid(), 'f1f4a509-3b95-11ed-8686-ecf4bb83b19b', 'bee6da5b-3b95-11ed-8686-ecf4bb83b19b', now(), now());

                                                                                        "f1f4a509-3b95-11ed-8686-ecf4bb83b19b"
































