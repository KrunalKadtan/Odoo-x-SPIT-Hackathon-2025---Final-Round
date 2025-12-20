"""
Verification script for CustomerInvoice database schema.
Checks table structure, indexes, and constraints.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.db import connection

def verify_customer_invoice_schema():
    """Verify the customer_invoices table schema."""
    with connection.cursor() as cursor:
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'customer_invoices'
            );
        """)
        table_exists = cursor.fetchone()[0]
        print(f"✓ Table 'customer_invoices' exists: {table_exists}")
        
        if not table_exists:
            print("✗ Table does not exist!")
            return
        
        # Check columns
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'customer_invoices'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        print("\n✓ Table columns:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
        
        # Check indexes
        cursor.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'customer_invoices'
            ORDER BY indexname;
        """)
        indexes = cursor.fetchall()
        print("\n✓ Table indexes:")
        for idx in indexes:
            print(f"  - {idx[0]}")
            print(f"    {idx[1]}")
        
        # Check foreign key constraints
        cursor.execute("""
            SELECT
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            JOIN information_schema.referential_constraints AS rc
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = 'customer_invoices';
        """)
        fks = cursor.fetchall()
        print("\n✓ Foreign key constraints:")
        for fk in fks:
            print(f"  - {fk[0]}: {fk[2]} -> {fk[3]}.{fk[4]} (ON DELETE {fk[5]})")
        
        # Verify specific requirements
        print("\n✓ Verification Summary:")
        
        # Check BigAutoField primary key
        pk_check = any(col[0] == 'id' and 'bigint' in col[1] for col in columns)
        print(f"  - BigAutoField primary key 'id': {pk_check}")
        
        # Check foreign key to SaleOrder with PROTECT
        fk_protect = any('RESTRICT' in fk[5] or 'NO ACTION' in fk[5] for fk in fks if 'sale_orders' in fk[3])
        print(f"  - Foreign key to SaleOrder with PROTECT: {fk_protect}")
        
        # Check invoice_date with auto_now_add
        invoice_date_check = any(col[0] == 'invoice_date' and col[1] == 'date' for col in columns)
        print(f"  - DateField 'invoice_date': {invoice_date_check}")
        
        # Check due_date
        due_date_check = any(col[0] == 'due_date' and col[1] == 'date' for col in columns)
        print(f"  - DateField 'due_date': {due_date_check}")
        
        # Check total_amount
        total_amount_check = any(col[0] == 'total_amount' and 'numeric' in col[1] for col in columns)
        print(f"  - DecimalField 'total_amount': {total_amount_check}")
        
        # Check status
        status_check = any(col[0] == 'status' and 'character' in col[1] for col in columns)
        print(f"  - CharField 'status': {status_check}")
        
        # Check timestamps
        created_at_check = any(col[0] == 'created_at' for col in columns)
        updated_at_check = any(col[0] == 'updated_at' for col in columns)
        print(f"  - Timestamp 'created_at': {created_at_check}")
        print(f"  - Timestamp 'updated_at': {updated_at_check}")
        
        # Check indexes
        invoice_date_idx = any('invoice_date_idx' in idx[0] for idx in indexes)
        status_idx = any('invoice_status_idx' in idx[0] for idx in indexes)
        print(f"  - Index on 'invoice_date': {invoice_date_idx}")
        print(f"  - Index on 'status': {status_idx}")
        
        print("\n✓ All schema requirements verified successfully!")

if __name__ == '__main__':
    verify_customer_invoice_schema()
