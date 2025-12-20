import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def setup_database():
    print("Setting up PostgreSQL database for ApparelDesk...")
    
    # First, connect to PostgreSQL as default user to create database and user
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            database="postgres",
            user="postgres", 
            password="",  # Default postgres password (often empty on Windows)
            host="localhost",
            port="5432"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='appareldesk_db'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE appareldesk_db")
            print("✅ Created database: appareldesk_db")
        else:
            print("✅ Database already exists: appareldesk_db")
        
        # Create user if it doesn't exist
        cursor.execute("SELECT 1 FROM pg_roles WHERE rolname='appareldesk_admin'")
        if not cursor.fetchone():
            cursor.execute("CREATE USER appareldesk_admin WITH PASSWORD 'admin@123'")
            cursor.execute("GRANT ALL PRIVILEGES ON DATABASE appareldesk_db TO appareldesk_admin")
            cursor.execute("ALTER USER appareldesk_admin CREATEDB")
            print("✅ Created user: appareldesk_admin")
        else:
            print("✅ User already exists: appareldesk_admin")
        
        cursor.close()
        conn.close()
        print("✅ PostgreSQL setup complete!")
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        print("💡 Try connecting with a password or check PostgreSQL installation")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    setup_database()