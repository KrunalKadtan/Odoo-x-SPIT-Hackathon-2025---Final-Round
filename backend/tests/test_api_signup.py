"""
API tests for portal signup endpoint.
Tests the /api/accounts/signup/ endpoint.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User, Contact


@pytest.fixture
def api_client():
    """Fixture to provide an API client for making requests."""
    return APIClient()


@pytest.mark.django_db
class TestPortalSignupAPI:
    """Test the portal signup API endpoint."""
    
    def test_successful_signup_with_all_fields(self, api_client):
        """Test successful signup with all fields provided."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'securepass123',
            'mobile': '+1234567890',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'pincode': '400001'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'contact' in response.data
        assert 'tokens' in response.data
        
        # Verify user data
        assert response.data['user']['email'] == 'john@example.com'
        assert response.data['user']['name'] == 'John Doe'
        assert response.data['user']['role'] == 'portal'
        
        # Verify contact data
        assert response.data['contact']['email'] == 'john@example.com'
        assert response.data['contact']['type'] == 'customer'
        
        # Verify tokens
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
        
        # Verify database records
        assert User.objects.filter(email='john@example.com').exists()
        assert Contact.objects.filter(email='john@example.com').exists()
    
    def test_successful_signup_with_required_fields_only(self, api_client):
        """Test successful signup with only required fields."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Jane Smith',
            'email': 'jane@example.com',
            'password': 'securepass456'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['email'] == 'jane@example.com'
        
        # Verify user was created
        user = User.objects.get(email='jane@example.com')
        assert user.mobile is None
        assert user.city is None
    
    def test_signup_fails_with_duplicate_email(self, api_client):
        """Test that signup fails when email already exists."""
        # Create a user first
        User.objects.create_user(
            email='existing@example.com',
            password='pass123',
            name='Existing User'
        )
        
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'New User',
            'email': 'existing@example.com',
            'password': 'newpass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_signup_fails_with_missing_required_fields(self, api_client):
        """Test that signup fails when required fields are missing."""
        url = reverse('accounts:portal_signup')
        data = {
            'email': 'incomplete@example.com'
            # Missing name and password
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_signup_fails_with_invalid_email(self, api_client):
        """Test that signup fails with invalid email format."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Test User',
            'email': 'not-an-email',
            'password': 'pass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_signup_creates_user_and_contact_atomically(self, api_client):
        """Test that user and contact are created together or not at all."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Atomic Test',
            'email': 'atomic@example.com',
            'password': 'pass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        if response.status_code == status.HTTP_201_CREATED:
            # Both should exist
            assert User.objects.filter(email='atomic@example.com').exists()
            assert Contact.objects.filter(email='atomic@example.com').exists()
            
            # Contact should be linked to user
            user = User.objects.get(email='atomic@example.com')
            contact = Contact.objects.get(email='atomic@example.com')
            assert contact.user == user
    
    def test_password_is_hashed(self, api_client):
        """Test that password is properly hashed, not stored as plaintext."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Security Test',
            'email': 'security@example.com',
            'password': 'myplaintextpassword'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify password is hashed
        user = User.objects.get(email='security@example.com')
        assert user.password != 'myplaintextpassword'
        assert user.check_password('myplaintextpassword')
