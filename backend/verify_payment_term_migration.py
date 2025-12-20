#!/usr/bin/env python
"""
Verification script for PaymentTerm migration.
Checks database constraints, indexes, and default term.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.db import connection
from products.models import PaymentTerm


def verify_default_term():
    """Verify the default 'Immediate Payment' term exists."""
    print("\n" + "=" * 80)
    print("VERIFYING DEFAULT PAYMENT TERM")
    print("=" * 80)
    
    try:
        pt = PaymentTerm.objects.get(name='Immediate Payment')
        print("✓ Default term 'Immediate Payment' exists")
        print(f"  - Name: {pt.name}")
        print(f"  - Is default: {pt.is_default}")
        print(f"  - Early payment discount: {pt.early_payment_discount}")
        print(f"  - Discount percentage: {pt.discount_percentage}")
        print(f"  - Discount days: {pt.discount_days}")
        print(f"  - Example preview: {pt.example_preview}")
        
        if not pt.is_default:
            print("✗ ERROR: Default term should have is_default=True")
            return False
        
        return True
    except PaymentTerm.DoesNotExist:
        print("✗ ERROR: Default term 'Immediate Payment' does not exist")
        return False


def verify_constraints():
    """Verify database CHECK constraints."""
    print("\n" + "=" * 80)
    print("VERIFYING DATABASE CONSTRAINTS")
    print("=" * 80)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT conname, pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conrelid = 'payment_terms'::regclass 
            ORDER BY conname
        """)
        constraints = cursor.fetchall()
        
        expected_constraints = {
            'valid_discount_percentage': 'discount_percentage',
            'valid_discount_days': 'discount_days',
            'payment_terms_name_key': 'UNIQUE',
            'payment_terms_pkey': 'PRIMARY KEY',
        }
        
        found_constraints = {}
        for name, definition in constraints:
            found_constraints[name] = definition
            print(f"✓ {name}")
            print(f"  Definition: {definition}")
        
        # Check for expected constraints
        all_found = True
        for expected_name, expected_keyword in expected_constraints.items():
            if expected_name not in found_constraints:
                print(f"✗ ERROR: Missing constraint '{expected_name}'")
                all_found = False
            elif expected_keyword not in found_constraints[expected_name]:
                print(f"✗ WARNING: Constraint '{expected_name}' may not match expected definition")
        
        return all_found


def verify_indexes():
    """Verify database indexes."""
    print("\n" + "=" * 80)
    print("VERIFYING DATABASE INDEXES")
    print("=" * 80)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'payment_terms' 
            ORDER BY indexname
        """)
        indexes = cursor.fetchall()
        
        expected_indexes = {
            'payment_term_name_idx': 'name',
            'payment_term_default_idx': 'is_default',
            'payment_terms_name_key': 'UNIQUE',  # Unique constraint creates index
            'payment_terms_pkey': 'PRIMARY KEY',
        }
        
        found_indexes = {}
        for name, definition in indexes:
            found_indexes[name] = definition
            print(f"✓ {name}")
            print(f"  Definition: {definition}")
        
        # Check for expected indexes
        all_found = True
        for expected_name in ['payment_term_name_idx', 'payment_term_default_idx']:
            if expected_name not in found_indexes:
                print(f"✗ ERROR: Missing index '{expected_name}'")
                all_found = False
        
        return all_found


def verify_field_types():
    """Verify field types and properties."""
    print("\n" + "=" * 80)
    print("VERIFYING FIELD TYPES")
    print("=" * 80)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'payment_terms'
            ORDER BY ordinal_position
        """)
        columns = cursor.fetchall()
        
        print(f"{'Column':<35} {'Type':<20} {'Nullable':<10} {'Default'}")
        print("-" * 80)
        for col_name, data_type, is_nullable, col_default in columns:
            default_str = str(col_default)[:30] if col_default else 'None'
            print(f"{col_name:<35} {data_type:<20} {is_nullable:<10} {default_str}")
        
        # Verify specific requirements
        column_dict = {col[0]: col for col in columns}
        
        checks = []
        
        # Check id is bigint (BigAutoField)
        if 'id' in column_dict:
            if column_dict['id'][1] == 'bigint':
                print("\n✓ id field is BIGINT (BigAutoField)")
                checks.append(True)
            else:
                print(f"\n✗ ERROR: id field is {column_dict['id'][1]}, expected bigint")
                checks.append(False)
        
        # Check name is unique and indexed (verified in constraints/indexes)
        if 'name' in column_dict:
            if column_dict['name'][1] in ['character varying', 'varchar']:
                print("✓ name field is VARCHAR")
                checks.append(True)
            else:
                print(f"✗ ERROR: name field is {column_dict['name'][1]}, expected varchar")
                checks.append(False)
        
        # Check discount_percentage is numeric with precision
        if 'discount_percentage' in column_dict:
            if column_dict['discount_percentage'][1] == 'numeric':
                print("✓ discount_percentage field is NUMERIC (DecimalField)")
                checks.append(True)
            else:
                print(f"✗ ERROR: discount_percentage is {column_dict['discount_percentage'][1]}")
                checks.append(False)
        
        # Check discount_days is integer
        if 'discount_days' in column_dict:
            if column_dict['discount_days'][1] == 'integer':
                print("✓ discount_days field is INTEGER")
                checks.append(True)
            else:
                print(f"✗ ERROR: discount_days is {column_dict['discount_days'][1]}")
                checks.append(False)
        
        # Check timestamps
        for ts_field in ['created_at', 'updated_at']:
            if ts_field in column_dict:
                if 'timestamp' in column_dict[ts_field][1]:
                    print(f"✓ {ts_field} field is TIMESTAMP")
                    checks.append(True)
                else:
                    print(f"✗ ERROR: {ts_field} is {column_dict[ts_field][1]}")
                    checks.append(False)
        
        return all(checks)


def main():
    """Run all verification checks."""
    print("\n" + "=" * 80)
    print("PAYMENT TERM MIGRATION VERIFICATION")
    print("=" * 80)
    
    results = {
        'Default Term': verify_default_term(),
        'Constraints': verify_constraints(),
        'Indexes': verify_indexes(),
        'Field Types': verify_field_types(),
    }
    
    print("\n" + "=" * 80)
    print("VERIFICATION SUMMARY")
    print("=" * 80)
    
    all_passed = True
    for check_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{check_name:<20} {status}")
        if not passed:
            all_passed = False
    
    print("=" * 80)
    
    if all_passed:
        print("\n✓ ALL VERIFICATION CHECKS PASSED")
        return 0
    else:
        print("\n✗ SOME VERIFICATION CHECKS FAILED")
        return 1


if __name__ == '__main__':
    exit(main())
