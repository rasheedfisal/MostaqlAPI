
insert into projstatuses (id, stat_name, createdAt, updatedAt) values (uuid(), 'Open' , now(), now());
insert into projstatuses (id, stat_name, createdAt, updatedAt) values (uuid(), 'In-Progress' , now(), now());
insert into projstatuses (id, stat_name, createdAt, updatedAt) values (uuid(), 'Completed' , now(), now());
insert into projstatuses (id, stat_name, createdAt, updatedAt) values (uuid(), 'Re-Open' , now(), now());
insert into projstatuses (id, stat_name, createdAt, updatedAt) values (uuid(), 'Closed' , now(), now());



insert into priceranges (id, range_name, range_from, range_to, createdAt, updatedAt) values (uuid(), '25 - 50', 25, 50, now(), now());
insert into priceranges (id, range_name, range_from, range_to, createdAt, updatedAt) values (uuid(), '50 - 100', 50, 100, now(), now());
insert into priceranges (id, range_name, range_from, range_to, createdAt, updatedAt) values (uuid(), '100 - 250', 100, 250, now(), now());
insert into priceranges (id, range_name, range_from, range_to, createdAt, updatedAt) values (uuid(), '250 - 500', 250, 500, now(), now());
insert into priceranges (id, range_name, range_from, range_to, createdAt, updatedAt) values (uuid(), '500 - 1000', 500, 1000, now(), now());
insert into priceranges (id, range_name, range_from, range_to, createdAt, updatedAt) values (uuid(), '1000 - 2500', 1000, 2500, now(), now());
insert into priceranges (id, range_name, range_from, range_to, createdAt, updatedAt) values (uuid(), '2500 - 5000', 2500, 5000, now(), now());
insert into priceranges (id, range_name, range_from, range_to, createdAt, updatedAt) values (uuid(), '5000 - 10000', 5000, 10000, now(), now());


DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `projectoffers`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `projstatuses`;
DROP TABLE IF EXISTS `userprofiles`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `priceranges`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `rolepermissions`;
DROP TABLE IF EXISTS `sequelizemeta`;

