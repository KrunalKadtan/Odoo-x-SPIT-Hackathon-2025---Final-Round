import os
import psycopg2
from decouple import config

# Load environment variables
DB_NAME = config('DB_NAME', default='appareldesk_db')
DB_USER = config('DB_USER', default='postgres')
DB_PASSWORD = config('DB_PASSWORD', default='')
DB_HOST = config('DB_HOST', default='localhost')
DB_PORT = config('DB_PORT', default='5432')

print("🔍 Testing PostgreSQL connection...")
print(f"Database: {DB_NAME}")
print(f"User: {DB_USER}")
print(f"Host: {DB_HOST}")
print(f"Port: {DB_PORT}")

try:
    # Try to connect to PostgreSQL
    conn = psycopg2.connect(
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"✅ Connected to PostgreSQL: {version[0]}")
    
    cursor.close()
    conn.close()
    print("✅ Database connection successful!")
    
except psycopg2.OperationalError as e:
    print(f"❌ Database connection failed: {e}")
    print("\n💡 Possible solutions:")
    print("1. Check if PostgreSQL service is running")
    print("2. Verify database credentials in .env file")
    print("3. Create the database if it doesn't exist")
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")