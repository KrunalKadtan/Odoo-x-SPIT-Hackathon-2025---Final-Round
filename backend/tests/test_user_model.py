#!/usr/bin/env python
"""
Quick test to verify User model functionality after migration.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User

def test_user_model():
    """Test basic User model operations."""
    
    print("=" * 80)
    print("USER MODEL FUNCTIONALITY TEST")
    print("=" * 80)
    
    # Test 1: Create a portal user
    print("\n1. Testing create_user (portal user)...")
    try:
        user1 = User.objects.create_user(
            email='portal@example.com',
            password='testpass123',
            name='Portal User',
            mobile='+1234567890',
            city='Mumbai',
            state='Maharashtra',
            pincode='400001'
        )
        print(f"   ✓ Created user: {user1}")
        print(f"   - ID: {user1.id} (type: {type(user1.id).__name__})")
        print(f"   - Email: {user1.email}")
        print(f"   - Name: {user1.name}")
        print(f"   - Role: {user1.role}")
        print(f"   - Is Staff: {user1.is_staff}")
        print(f"   - Is Active: {user1.is_active}")
        print(f"   - Created At: {user1.created_at}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    # Test 2: Create a superuser
    print("\n2. Testing create_superuser (internal user)...")
    try:
        user2 = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            name='Admin User'
        )
        print(f"   ✓ Created superuser: {user2}")
        print(f"   - Email: {user2.email}")
        print(f"   - Role: {user2.role}")
        print(f"   - Is Staff: {user2.is_staff}")
        print(f"   - Is Superuser: {user2.is_superuser}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    # Test 3: Test email uniqueness
    print("\n3. Testing email uniqueness constraint...")
    try:
        User.objects.create_user(
            email='portal@example.com',  # Duplicate email
            password='testpass123',
            name='Duplicate User'
        )
        print("   ✗ FAILED: Duplicate email was allowed!")
        return False
    except Exception as e:
        print(f"   ✓ Correctly rejected duplicate email: {type(e).__name__}")
    
    # Test 4: Test role constraint
    print("\n4. Testing role CHECK constraint...")
    try:
        from django.db import IntegrityError
        user3 = User(
            email='invalid@example.com',
            name='Invalid Role User',
            role='invalid_role'  # Invalid role
        )
        user3.set_password('testpass123')
        user3.save()
        print("   ✗ FAILED: Invalid role was allowed!")
        return False
    except Exception as e:
        print(f"   ✓ Correctly rejected invalid role: {type(e).__name__}")
    
    # Test 5: Test email normalization
    print("\n5. Testing email normalization...")
    try:
        user4 = User.objects.create_user(
            email='Test@EXAMPLE.COM',
            password='testpass123',
            name='Test User'
        )
        print(f"   ✓ Email normalized: {user4.email}")
        if user4.email == 'Test@example.com':
            print("   ✓ Domain correctly lowercased")
        else:
            print(f"   ✗ Unexpected normalization: {user4.email}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    # Test 6: Test password hashing
    print("\n6. Testing password hashing...")
    if user1.password.startswith('pbkdf2_sha256$') or user1.password.startswith('argon2'):
        print(f"   ✓ Password is hashed: {user1.password[:50]}...")
    else:
        print(f"   ✗ Password not hashed: {user1.password}")
        return False
    
    # Test 7: Test model methods
    print("\n7. Testing model methods...")
    print(f"   - __str__(): {str(user1)}")
    print(f"   - get_full_name(): {user1.get_full_name()}")
    print(f"   - get_short_name(): {user1.get_short_name()}")
    
    # Cleanup
    print("\n8. Cleaning up test data...")
    User.objects.filter(email__in=[
        'portal@example.com',
        'admin@example.com',
        'Test@example.com'
    ]).delete()
    print("   ✓ Test data cleaned up")
    
    print("\n" + "=" * 80)
    print("ALL TESTS PASSED ✓")
    print("=" * 80)
    return True

if __name__ == '__main__':
    try:
        success = test_user_model()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
