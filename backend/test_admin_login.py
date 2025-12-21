#!/usr/bin/env python
"""
Test admin login and check what data is returned.
"""

import requests
import json
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

def test_admin_login():
    print("🔐 Testing Admin Login")
    print("=" * 50)
    
    # Admin credentials
    email = "admin@appareldesk.com"
    password = "admin123"  # You may need to set this password
    base_url = "http://localhost:8000/api"
    
    try:
        # 1. Test admin authentication
        print("1. Testing admin authentication...")
        auth_response = requests.post(f"{base_url}/token/", 
            headers={'Content-Type': 'application/json'},
            json={
                "email": email,
                "password": password
            }
        )
        
        print(f"   Response status: {auth_response.status_code}")
        
        if auth_response.status_code == 200:
            token_data = auth_response.json()
            print("✅ Admin authentication successful")
            print(f"   Response keys: {list(token_data.keys())}")
            
            # Check if profile_data is included
            if 'profile_data' in token_data:
                profile_data = token_data['profile_data']
                print(f"   Profile data: {json.dumps(profile_data, indent=2)}")
                
                if 'role' in profile_data:
                    print(f"   ✅ Role found: {profile_data['role']}")
                else:
                    print("   ❌ No role field in profile_data")
            else:
                print("   ❌ No profile_data in response")
            
            # Test profile API with token
            access_token = token_data['access']
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            print("\n2. Testing profile API...")
            profile_response = requests.get(f"{base_url}/accounts/profile/", headers=headers)
            
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                print("✅ Profile API successful")
                print(f"   Profile data: {json.dumps(profile_data, indent=2)}")
            else:
                print(f"❌ Profile API failed: {profile_response.status_code}")
                print(f"   Response: {profile_response.text}")
                
        else:
            print(f"❌ Admin authentication failed: {auth_response.status_code}")
            print(f"   Response: {auth_response.text}")
            
            # Try to set admin password
            print("\n🔧 Attempting to set admin password...")
            from accounts.models import User
            admin_user = User.objects.get(email=email)
            admin_user.set_password(password)
            admin_user.save()
            print(f"✅ Admin password set to: {password}")
            
            # Retry authentication
            print("\n🔄 Retrying admin authentication...")
            auth_response = requests.post(f"{base_url}/token/", 
                headers={'Content-Type': 'application/json'},
                json={
                    "email": email,
                    "password": password
                }
            )
            
            if auth_response.status_code == 200:
                token_data = auth_response.json()
                print("✅ Admin authentication successful after password reset")
                print(f"   Response: {json.dumps(token_data, indent=2, default=str)}")
            else:
                print(f"❌ Admin authentication still failed: {auth_response.status_code}")
                print(f"   Response: {auth_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - Make sure Django server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_admin_login()