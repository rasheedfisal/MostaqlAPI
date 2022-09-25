INSERT INTO roles(id,role_name, role_description, createdAt, updatedAt) VALUES(uuid(),'admin', 'System Admin ', now(), now());
INSERT INTO roles(id,role_name, role_description, createdAt, updatedAt) VALUES(uuid(),'basic', 'Basic User ', now(), now());



insert into rolepermissions (id, role_id, perm_id, createdAt, updatedAt) values (uuid(), (select id from roles where role_name='admin'), (select id from permissions where perm_name='role_add') , now(), now());


