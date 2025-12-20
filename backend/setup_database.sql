-- Create database and user for ApparelDesk
CREATE DATABASE appareldesk_db;
CREATE USER appareldesk_admin WITH PASSWORD 'admin@123';
GRANT ALL PRIVILEGES ON DATABASE appareldesk_db TO appareldesk_admin;
ALTER USER appareldesk_admin CREATEDB;