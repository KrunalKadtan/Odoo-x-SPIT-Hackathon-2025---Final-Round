# PostgreSQL Setup for ApparelDesk

## Current Configuration

The backend is configured to use PostgreSQL with these settings (from .env):

```
DB_NAME=appareldesk_db
DB_USER=appareldesk_admin  
DB_PASSWORD=admin@123
DB_HOST=localhost
DB_PORT=5432
```

## Setup Steps

### 1. Ensure PostgreSQL is Running
✅ PostgreSQL service is running (postgresql-x64-18)

### 2. Create Database and User

You need to create the database and user manually. Here are the options:

#### Option A: Using pgAdmin (Recommended)
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click "Databases" → Create → Database
4. Name: `appareldesk_db`
5. Right-click "Login/Group Roles" → Create → Login/Group Role
6. Name: `appareldesk_admin`
7. Password: `admin@123`
8. Privileges: Can login, Can create databases

#### Option B: Using Command Line
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE appareldesk_db;
CREATE USER appareldesk_admin WITH PASSWORD 'admin@123';
GRANT ALL PRIVILEGES ON DATABASE appareldesk_db TO appareldesk_admin;
ALTER USER appareldesk_admin CREATEDB;
\q
```

#### Option C: Using Windows Authentication
If PostgreSQL uses Windows authentication, update the .env file:
```
DB_USER=your_windows_username
DB_PASSWORD=
```

### 3. Test Connection

After setting up the database, run:
```bash
cd final-round-personal/backend
python manage.py migrate
python manage.py create_test_users
python manage.py runserver
```

### 4. Verify Setup

Test the API endpoints:
- http://127.0.0.1:8000/api/
- http://127.0.0.1:8000/api/accounts/profile/

## Test Users

Once the database is set up, these test users will be created:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| customer@example.com | customer123 | external | Customer frontend testing |
| admin@appareldesk.com | admin123 | internal | Admin frontend testing |
| vendor@example.com | vendor123 | vendor | Vendor operations |

## Troubleshooting

### Common Issues:

1. **Connection refused**: PostgreSQL service not running
2. **Authentication failed**: Wrong username/password
3. **Database does not exist**: Need to create database first
4. **Permission denied**: User doesn't have proper privileges

### Check PostgreSQL Status:
```powershell
Get-Service -Name "*postgres*"
```

### Check PostgreSQL Logs:
Look in: `C:\Program Files\PostgreSQL\18\data\log\`