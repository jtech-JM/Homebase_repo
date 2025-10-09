# PostgreSQL credentials for local development
CREATE USER homebase_user WITH PASSWORD 'homebase_pass';
CREATE DATABASE homebase_db OWNER homebase_user;
GRANT ALL PRIVILEGES ON DATABASE homebase_db TO homebase_user;
