"""
Verification script for SaleOrder and SaleOrderLine database schema.
Checks tables, columns, indexes, and constraints.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.db import connection

def verify_schema():
    """Verify the database schema for SaleOrder and SaleOrderLine."""
    
    with connection.cursor() as cursor:
        print("=" * 80)
        print("SALE ORDER SCHEMA VERIFICATION")
        print("=" * 80)
        
        # Check if sale_orders table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'sale_orders'
            );
        """)
        sale_orders_exists = cursor.fetchone()[0]
        print(f"\n✓ sale_orders table exists: {sale_orders_exists}")
        
        if sale_orders_exists:
            # Get columns for sale_orders
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'sale_orders'
                ORDER BY ordinal_position;
            """)
            print("\nSaleOrder Columns:")
            print("-" * 80)
            for row in cursor.fetchall():
                print(f"  {row[0]:<20} {row[1]:<20} NULL: {row[2]:<5} Default: {row[3]}")
            
            # Get indexes for sale_orders
            cursor.execute("""
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = 'sale_orders'
                ORDER BY indexname;
            """)
            print("\nSaleOrder Indexes:")
            print("-" * 80)
            for row in cursor.fetchall():
                print(f"  {row[0]}")
            
            # Get foreign keys for sale_orders
            cursor.execute("""
                SELECT
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name,
                    rc.delete_rule
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                JOIN information_schema.referential_constraints AS rc
                    ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'sale_orders'
                    AND tc.constraint_type = 'FOREIGN KEY';
            """)
            print("\nSaleOrder Foreign Keys:")
            print("-" * 80)
            for row in cursor.fetchall():
                print(f"  {row[0]}: {row[1]} -> {row[2]}.{row[3]} (ON DELETE {row[4]})")
        
        print("\n" + "=" * 80)
        print("SALE ORDER LINE SCHEMA VERIFICATION")
        print("=" * 80)
        
        # Check if sale_order_lines table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'sale_order_lines'
            );
        """)
        sale_order_lines_exists = cursor.fetchone()[0]
        print(f"\n✓ sale_order_lines table exists: {sale_order_lines_exists}")
        
        if sale_order_lines_exists:
            # Get columns for sale_order_lines
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'sale_order_lines'
                ORDER BY ordinal_position;
            """)
            print("\nSaleOrderLine Columns:")
            print("-" * 80)
            for row in cursor.fetchall():
                print(f"  {row[0]:<20} {row[1]:<20} NULL: {row[2]:<5} Default: {row[3]}")
            
            # Get indexes for sale_order_lines
            cursor.execute("""
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = 'sale_order_lines'
                ORDER BY indexname;
            """)
            print("\nSaleOrderLine Indexes:")
            print("-" * 80)
            for row in cursor.fetchall():
                print(f"  {row[0]}")
            
            # Get foreign keys for sale_order_lines
            cursor.execute("""
                SELECT
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name,
                    rc.delete_rule
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                JOIN information_schema.referential_constraints AS rc
                    ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'sale_order_lines'
                    AND tc.constraint_type = 'FOREIGN KEY';
            """)
            print("\nSaleOrderLine Foreign Keys:")
            print("-" * 80)
            for row in cursor.fetchall():
                print(f"  {row[0]}: {row[1]} -> {row[2]}.{row[3]} (ON DELETE {row[4]})")
            
            # Get check constraints for sale_order_lines
            cursor.execute("""
                SELECT
                    con.conname AS constraint_name,
                    pg_get_constraintdef(con.oid) AS constraint_definition
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                WHERE rel.relname = 'sale_order_lines'
                    AND con.contype = 'c';
            """)
            print("\nSaleOrderLine Check Constraints:")
            print("-" * 80)
            for row in cursor.fetchall():
                print(f"  {row[0]}: {row[1]}")
        
        print("\n" + "=" * 80)
        print("VERIFICATION COMPLETE")
        print("=" * 80)

if __name__ == '__main__':
    verify_schema()
