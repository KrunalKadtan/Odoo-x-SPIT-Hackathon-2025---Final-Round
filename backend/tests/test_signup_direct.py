#!/usr/bin/env python
"""
Direct test of portal signup logic (bypassing HTTP layer).
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.db import transaction
from accounts.models import User, Contact
from accounts.serializers import PortalSignupSerializer


def test_signup_logic():
    """Test the portal signup logic directly."""
    
    print("=" * 80)
    print("PORTAL SIGNUP LOGIC TEST (Direct)")
    print("=" * 80)
    
    # Test 1: Valid signup data
    print("\n1. Testing valid signup data...")
    signup_data = {
        'name': 'Direct Test User',
        'email': 'directtest@example.com',
        'password': 'securepass123',
        'mobile': '+1234567890',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pincode': '400001'
    }
    
    serializer = PortalSignupSerializer(data=signup_data)
    if serializer.is_valid():
        print("   ✓ Data validation passed")
        
        try:
            with transaction.atomic():
                # Create User
                user = User.objects.create_user(
                    email=serializer.validated_data['email'],
                    password=serializer.validated_data['password'],
                    name=serializer.validated_data['name'],
                    role='portal',
                    mobile=serializer.validated_data.get('mobile') or None,
                    city=serializer.validated_data.get('city') or None,
                    state=serializer.validated_data.get('state') or None,
                    pincode=serializer.validated_data.get('pincode') or None
                )
                print(f"   ✓ User created: {user.email}")
                print(f"   ✓ User role: {user.role}")
                
                # Create Contact
                contact = Contact.objects.create(
                    name=serializer.validated_data['name'],
                    type='customer',
                    email=serializer.validated_data['email'],
                    mobile=serializer.validated_data.get('mobile') or None,
                    city=serializer.validated_data.get('city') or None,
                    state=serializer.validated_data.get('state') or None,
                    pincode=serializer.validated_data.get('pincode') or None,
                    user=user
                )
                print(f"   ✓ Contact created: {contact.name}")
                print(f"   ✓ Contact type: {contact.type}")
                print(f"   ✓ Contact linked to user: {contact.user == user}")
                
        except Exception as e:
            print(f"   ✗ Error during signup: {e}")
            return False
    else:
        print(f"   ✗ Validation failed: {serializer.errors}")
        return False
    
    # Test 2: Duplicate email
    print("\n2. Testing duplicate email validation...")
    duplicate_data = {
        'name': 'Duplicate User',
        'email': 'directtest@example.com',  # Same email
        'password': 'securepass123'
    }
    
    serializer = PortalSignupSerializer(data=duplicate_data)
    if not serializer.is_valid():
        if 'email' in serializer.errors:
            print("   ✓ Duplicate email correctly rejected")
            print(f"   ✓ Error message: {serializer.errors['email'][0]}")
        else:
            print("   ✗ Wrong error type")
            return False
    else:
        print("   ✗ Duplicate email was not rejected!")
        return False
    
    # Test 3: Short password
    print("\n3. Testing short password validation...")
    short_pass_data = {
        'name': 'Short Pass User',
        'email': 'shortpass@example.com',
        'password': 'short'
    }
    
    serializer = PortalSignupSerializer(data=short_pass_data)
    if not serializer.is_valid():
        if 'password' in serializer.errors:
            print("   ✓ Short password correctly rejected")
            print(f"   ✓ Error message: {serializer.errors['password'][0]}")
        else:
            print("   ✗ Wrong error type")
            return False
    else:
        print("   ✗ Short password was not rejected!")
        return False
    
    # Test 4: Invalid pincode
    print("\n4. Testing invalid pincode validation...")
    invalid_pincode_data = {
        'name': 'Invalid Pincode User',
        'email': 'invalidpin@example.com',
        'password': 'securepass123',
        'pincode': 'ABC123'  # Invalid pincode
    }
    
    serializer = PortalSignupSerializer(data=invalid_pincode_data)
    if not serializer.is_valid():
        if 'pincode' in serializer.errors:
            print("   ✓ Invalid pincode correctly rejected")
            print(f"   ✓ Error message: {serializer.errors['pincode'][0]}")
        else:
            print("   ✗ Wrong error type")
            return False
    else:
        print("   ✗ Invalid pincode was not rejected!")
        return False
    
    # Test 5: Verify database state
    print("\n5. Verifying database state...")
    user_check = User.objects.get(email='directtest@example.com')
    contact_check = Contact.objects.get(email='directtest@example.com')
    
    if user_check.role == 'portal':
        print("   ✓ User has role='portal'")
    else:
        print(f"   ✗ User has wrong role: {user_check.role}")
        return False
    
    if contact_check.type == 'customer':
        print("   ✓ Contact has type='customer'")
    else:
        print(f"   ✗ Contact has wrong type: {contact_check.type}")
        return False
    
    if contact_check.user == user_check:
        print("   ✓ Contact is linked to user")
    else:
        print("   ✗ Contact is not linked to user!")
        return False
    
    if user_check.contact == contact_check:
        print("   ✓ User is linked to contact (reverse)")
    else:
        print("   ✗ User is not linked to contact!")
        return False
    
    # Cleanup
    print("\n6. Cleaning up test data...")
    Contact.objects.filter(email='directtest@example.com').delete()
    User.objects.filter(email='directtest@example.com').delete()
    print("   ✓ Test data cleaned up")
    
    print("\n" + "=" * 80)
    print("✓ ALL SIGNUP LOGIC TESTS PASSED")
    print("=" * 80)
    
    return True


if __name__ == '__main__':
    try:
        success = test_signup_logic()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
