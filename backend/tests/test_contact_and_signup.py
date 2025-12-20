#!/usr/bin/env python
"""
Test script for Contact model and portal signup functionality.
Tests database constraints, one-to-one relationships, and transaction safety.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.db import connection, IntegrityError, transaction
from accounts.models import User, Contact


def test_contact_model():
    """Test Contact model structure and constraints."""
    
    print("=" * 80)
    print("CONTACT MODEL TESTS")
    print("=" * 80)
    
    # Test 1: Verify table structure
    print("\n1. Verifying Contact table structure...")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'contacts'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        required_columns = {
            'id': 'bigint',
            'name': 'character varying',
            'type': 'character varying',
            'email': 'character varying',
            'mobile': 'character varying',
            'city': 'character varying',
            'state': 'character varying',
            'pincode': 'character varying',
            'user_id': 'bigint',
            'created_at': 'timestamp with time zone',
            'updated_at': 'timestamp with time zone',
        }
        
        found_columns = {col[0]: col[1] for col in columns}
        
        for col_name, expected_type in required_columns.items():
            if col_name in found_columns:
                print(f"   ✓ Column '{col_name}' exists with type '{found_columns[col_name]}'")
            else:
                print(f"   ✗ Column '{col_name}' is missing!")
                return False
    
    # Test 2: Verify CHECK constraint on type
    print("\n2. Testing type CHECK constraint...")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT conname, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'contacts'::regclass AND contype = 'c';
        """)
        constraints = cursor.fetchall()
        
        has_type_constraint = any('type' in str(c[1]).lower() for c in constraints)
        if has_type_constraint:
            print("   ✓ CHECK constraint on type field found")
        else:
            print("   ✗ CHECK constraint on type field missing!")
            return False
    
    # Test 3: Test valid contact types
    print("\n3. Testing valid contact types...")
    try:
        contact1 = Contact.objects.create(
            name='Test Customer',
            type='customer',
            email='customer@test.com'
        )
        print(f"   ✓ Created contact with type='customer': {contact1}")
        
        contact2 = Contact.objects.create(
            name='Test Vendor',
            type='vendor',
            email='vendor@test.com'
        )
        print(f"   ✓ Created contact with type='vendor': {contact2}")
        
        contact3 = Contact.objects.create(
            name='Test Both',
            type='both',
            email='both@test.com'
        )
        print(f"   ✓ Created contact with type='both': {contact3}")
    except Exception as e:
        print(f"   ✗ Error creating valid contacts: {e}")
        return False
    
    # Test 4: Test invalid contact type
    print("\n4. Testing invalid contact type rejection...")
    try:
        from django.db import DataError
        contact_invalid = Contact(
            name='Invalid Type',
            type='invalid_type',
            email='invalid@test.com'
        )
        contact_invalid.save()
        print("   ✗ FAILED: Invalid type was allowed!")
        return False
    except (IntegrityError, DataError) as e:
        print(f"   ✓ Correctly rejected invalid type: {type(e).__name__}")
    
    # Test 5: Verify indexes
    print("\n5. Verifying indexes...")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'contacts';
        """)
        indexes = cursor.fetchall()
        
        has_type_index = any('type' in idx[0].lower() for idx in indexes)
        has_email_index = any('email' in idx[0].lower() for idx in indexes)
        
        if has_type_index:
            print("   ✓ Index on type field found")
        else:
            print("   ✗ Index on type field missing!")
        
        if has_email_index:
            print("   ✓ Index on email field found")
        else:
            print("   ✗ Index on email field missing!")
    
    # Test 6: Test one-to-one relationship with User
    print("\n6. Testing one-to-one relationship with User...")
    try:
        # Create a user
        user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            name='Test User'
        )
        
        # Create contact linked to user
        contact_with_user = Contact.objects.create(
            name='Contact With User',
            type='customer',
            email='contactuser@test.com',
            user=user
        )
        print(f"   ✓ Created contact linked to user: {contact_with_user}")
        
        # Verify one-to-one relationship
        if contact_with_user.user == user:
            print("   ✓ Contact.user relationship works")
        
        if user.contact == contact_with_user:
            print("   ✓ User.contact reverse relationship works")
        
        # Try to create another contact with same user (should fail)
        try:
            duplicate_contact = Contact.objects.create(
                name='Duplicate Contact',
                type='vendor',
                email='duplicate@test.com',
                user=user
            )
            print("   ✗ FAILED: Multiple contacts allowed for same user!")
            return False
        except IntegrityError:
            print("   ✓ Correctly prevented duplicate user assignment (one-to-one enforced)")
    
    except Exception as e:
        print(f"   ✗ Error testing one-to-one relationship: {e}")
        return False
    
    # Cleanup
    print("\n7. Cleaning up test data...")
    Contact.objects.filter(email__in=[
        'customer@test.com',
        'vendor@test.com',
        'both@test.com',
        'contactuser@test.com'
    ]).delete()
    User.objects.filter(email='testuser@example.com').delete()
    print("   ✓ Test data cleaned up")
    
    return True


def test_portal_signup():
    """Test portal signup with transaction safety."""
    
    print("\n" + "=" * 80)
    print("PORTAL SIGNUP TESTS")
    print("=" * 80)
    
    # Test 1: Successful signup
    print("\n1. Testing successful portal signup...")
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                email='signup@example.com',
                password='testpass123',
                name='Signup User',
                role='portal',
                mobile='+1234567890',
                city='Mumbai',
                state='Maharashtra',
                pincode='400001'
            )
            
            contact = Contact.objects.create(
                name='Signup User',
                type='customer',
                email='signup@example.com',
                mobile='+1234567890',
                city='Mumbai',
                state='Maharashtra',
                pincode='400001',
                user=user
            )
            
            print(f"   ✓ Created user: {user}")
            print(f"   ✓ Created contact: {contact}")
            print(f"   ✓ User role: {user.role}")
            print(f"   ✓ Contact type: {contact.type}")
            print(f"   ✓ User-Contact link: {contact.user == user}")
    except Exception as e:
        print(f"   ✗ Error during signup: {e}")
        return False
    
    # Test 2: Transaction rollback on error
    print("\n2. Testing transaction rollback (orphan prevention)...")
    initial_user_count = User.objects.count()
    initial_contact_count = Contact.objects.count()
    
    try:
        with transaction.atomic():
            # Create user
            user2 = User.objects.create_user(
                email='rollback@example.com',
                password='testpass123',
                name='Rollback User',
                role='portal'
            )
            print(f"   ✓ User created: {user2}")
            
            # Intentionally cause an error (invalid contact type)
            contact2 = Contact(
                name='Rollback Contact',
                type='invalid_type',  # This will fail
                email='rollback@example.com',
                user=user2
            )
            contact2.save()
            
            print("   ✗ FAILED: Invalid contact was created!")
            return False
    
    except Exception as e:
        print(f"   ✓ Transaction failed as expected: {type(e).__name__}")
        
        # Verify rollback
        final_user_count = User.objects.count()
        final_contact_count = Contact.objects.count()
        
        if final_user_count == initial_user_count:
            print("   ✓ User creation was rolled back (no orphan user)")
        else:
            print("   ✗ FAILED: Orphan user was created!")
            return False
        
        if final_contact_count == initial_contact_count:
            print("   ✓ Contact creation was rolled back")
        else:
            print("   ✗ FAILED: Orphan contact was created!")
            return False
        
        # Verify user doesn't exist
        if not User.objects.filter(email='rollback@example.com').exists():
            print("   ✓ Confirmed: No orphan user in database")
        else:
            print("   ✗ FAILED: Orphan user found in database!")
            return False
    
    # Test 3: Verify data integrity
    print("\n3. Verifying data integrity...")
    user_check = User.objects.get(email='signup@example.com')
    contact_check = Contact.objects.get(email='signup@example.com')
    
    if user_check.role == 'portal':
        print("   ✓ User has correct role: portal")
    else:
        print(f"   ✗ User has wrong role: {user_check.role}")
    
    if contact_check.type == 'customer':
        print("   ✓ Contact has correct type: customer")
    else:
        print(f"   ✗ Contact has wrong type: {contact_check.type}")
    
    if contact_check.user == user_check:
        print("   ✓ Contact is linked to user")
    else:
        print("   ✗ Contact is not linked to user!")
    
    if user_check.contact == contact_check:
        print("   ✓ User is linked to contact (reverse relationship)")
    else:
        print("   ✗ User is not linked to contact!")
    
    # Cleanup
    print("\n4. Cleaning up test data...")
    Contact.objects.filter(email='signup@example.com').delete()
    User.objects.filter(email='signup@example.com').delete()
    print("   ✓ Test data cleaned up")
    
    return True


def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("CONTACT MODEL AND PORTAL SIGNUP TEST SUITE")
    print("=" * 80)
    
    try:
        # Test Contact model
        contact_success = test_contact_model()
        
        # Test portal signup
        signup_success = test_portal_signup()
        
        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Contact Model Tests: {'✓ PASSED' if contact_success else '✗ FAILED'}")
        print(f"Portal Signup Tests: {'✓ PASSED' if signup_success else '✗ FAILED'}")
        
        if contact_success and signup_success:
            print("\n✓ ALL TESTS PASSED")
            print("=" * 80)
            return True
        else:
            print("\n✗ SOME TESTS FAILED")
            print("=" * 80)
            return False
    
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
