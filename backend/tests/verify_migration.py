#!/usr/bin/env python
"""
Script to verify database state after migration.
Checks constraints, indexes, and field types.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.db import connection
from accounts.models import User

def verify_database_state():
    """Verify database constraints, indexes, and schema."""
    
    print("=" * 80)
    print("DATABASE MIGRATION VERIFICATION")
    print("=" * 80)
    
    with connection.cursor() as cursor:
        # Get table name
        table_name = User._meta.db_table
        print(f"\nTable Name: {table_name}")
        
        # 1. Verify table structure
        print("\n" + "=" * 80)
        print("1. TABLE COLUMNS")
        print("=" * 80)
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position;
        """, [table_name])
        
        columns = cursor.fetchall()
        print(f"\n{'Column Name':<20} {'Data Type':<20} {'Nullable':<10} {'Max Length':<12} {'Default'}")
        print("-" * 100)
        for col in columns:
            col_name, data_type, nullable, default, max_len = col
            default_str = str(default)[:30] if default else 'None'
            max_len_str = str(max_len) if max_len else 'N/A'
            print(f"{col_name:<20} {data_type:<20} {nullable:<10} {max_len_str:<12} {default_str}")
        
        # 2. Verify constraints
        print("\n" + "=" * 80)
        print("2. TABLE CONSTRAINTS")
        print("=" * 80)
        cursor.execute("""
            SELECT 
                con.conname AS constraint_name,
                con.contype AS constraint_type,
                pg_get_constraintdef(con.oid) AS constraint_definition
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE rel.relname = %s
            ORDER BY con.contype, con.conname;
        """, [table_name])
        
        constraints = cursor.fetchall()
        print(f"\n{'Constraint Name':<30} {'Type':<10} {'Definition'}")
        print("-" * 120)
        for constraint in constraints:
            name, ctype, definition = constraint
            type_map = {
                'p': 'PRIMARY',
                'u': 'UNIQUE',
                'c': 'CHECK',
                'f': 'FOREIGN',
            }
            type_str = type_map.get(ctype, ctype)
            # Truncate long definitions
            def_str = definition[:80] + '...' if len(definition) > 80 else definition
            print(f"{name:<30} {type_str:<10} {def_str}")
        
        # 3. Verify indexes
        print("\n" + "=" * 80)
        print("3. TABLE INDEXES")
        print("=" * 80)
        cursor.execute("""
            SELECT
                i.relname AS index_name,
                a.attname AS column_name,
                ix.indisunique AS is_unique,
                ix.indisprimary AS is_primary
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE t.relname = %s
            ORDER BY i.relname, a.attnum;
        """, [table_name])
        
        indexes = cursor.fetchall()
        print(f"\n{'Index Name':<40} {'Column':<20} {'Unique':<10} {'Primary'}")
        print("-" * 90)
        for idx in indexes:
            idx_name, col_name, is_unique, is_primary = idx
            print(f"{idx_name:<40} {col_name:<20} {str(is_unique):<10} {str(is_primary)}")
        
        # 4. Verify specific requirements
        print("\n" + "=" * 80)
        print("4. REQUIREMENT VERIFICATION")
        print("=" * 80)
        
        # Check for email uniqueness constraint
        email_unique = any(
            'email' in str(c[2]).lower() and c[1] == 'u' 
            for c in constraints
        )
        print(f"\n✓ Email UNIQUE constraint: {'FOUND' if email_unique else 'MISSING'}")
        
        # Check for role CHECK constraint
        role_check = any(
            'role' in str(c[2]).lower() and c[1] == 'c' 
            for c in constraints
        )
        print(f"✓ Role CHECK constraint: {'FOUND' if role_check else 'MISSING'}")
        
        # Check for email index
        email_index = any(
            'email' in idx[0].lower() or 'email' in idx[1].lower()
            for idx in indexes
        )
        print(f"✓ Email index: {'FOUND' if email_index else 'MISSING'}")
        
        # Check for role index
        role_index = any(
            'role' in idx[0].lower() or 'role' in idx[1].lower()
            for idx in indexes
        )
        print(f"✓ Role index: {'FOUND' if role_index else 'MISSING'}")
        
        # Check primary key type
        pk_column = next((c for c in columns if c[0] == 'id'), None)
        if pk_column:
            is_bigint = pk_column[1] == 'bigint'
            print(f"✓ Primary key type (bigint): {'CORRECT' if is_bigint else 'INCORRECT (' + pk_column[1] + ')'}")
        
        # 5. Test data integrity
        print("\n" + "=" * 80)
        print("5. DATA INTEGRITY CHECK")
        print("=" * 80)
        
        user_count = User.objects.count()
        print(f"\nTotal users in database: {user_count}")
        
        if user_count > 0:
            # Check if all users have required fields
            users_with_name = User.objects.exclude(name='').count()
            users_with_email = User.objects.exclude(email='').count()
            users_with_role = User.objects.exclude(role='').count()
            
            print(f"Users with name: {users_with_name}/{user_count}")
            print(f"Users with email: {users_with_email}/{user_count}")
            print(f"Users with role: {users_with_role}/{user_count}")
            
            # Check role distribution
            internal_count = User.objects.filter(role='internal').count()
            portal_count = User.objects.filter(role='portal').count()
            print(f"\nRole distribution:")
            print(f"  - Internal: {internal_count}")
            print(f"  - Portal: {portal_count}")
        
        print("\n" + "=" * 80)
        print("VERIFICATION COMPLETE")
        print("=" * 80)

if __name__ == '__main__':
    try:
        verify_database_state()
    except Exception as e:
        print(f"\nError during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
