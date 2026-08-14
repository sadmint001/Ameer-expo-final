-- PostgreSQL
alter table registrations add reference_code varchar(255);
alter table registrations add date_of_birth date;
alter table registrations add city varchar(255);
alter table registrations add country varchar(255);
