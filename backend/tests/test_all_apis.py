"""
Complete API test suite for ApparelDesk backend.
Tests all available API endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User, Contact


@pytest.fixture
def api_client():
    """Create an API client for making requests."""
    return APIClient()


@pytest.fixture
def test_user(db):
    """Create a test user for authentication tests."""
    return User.objects.create_user(
        email='testuser@example.com',
        password='testpass123',
        name='Test User',
        role='portal'
    )


@pytest.mark.django_db
class TestPortalSignupAPI:
    """Test the portal signup endpoint."""
    
    def test_successful_signup(self, api_client):
        """Test successful user registration."""
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
        
        # Check response status
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check response structure
        assert 'user' in response.data
        assert 'contact' in response.data
        assert 'tokens' in response.data
        
        # Check user data
        assert response.data['user']['email'] == 'john@example.com'
        assert response.data['user']['name'] == 'John Doe'
        assert response.data['user']['role'] == 'portal'
        
        # Check contact data
        assert response.data['contact']['email'] == 'john@example.com'
        assert response.data['contact']['type'] == 'customer'
        
        # Check tokens
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
        
        # Verify database records
        assert User.objects.filter(email='john@example.com').exists()
        assert Contact.objects.filter(email='john@example.com').exists()
    
    def test_signup_with_minimal_data(self, api_client):
        """Test signup with only required fields."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Jane Doe',
            'email': 'jane@example.com',
            'password': 'securepass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['email'] == 'jane@example.com'
    
    def test_signup_duplicate_email(self, api_client, test_user):
        """Test that duplicate email is rejected."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Another User',
            'email': 'testuser@example.com',  # Already exists
            'password': 'newpass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_signup_missing_required_fields(self, api_client):
        """Test validation for missing required fields."""
        url = reverse('accounts:portal_signup')
        
        # Missing name
        response = api_client.post(url, {
            'email': 'test@example.com',
            'password': 'pass123'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Missing email
        response = api_client.post(url, {
            'name': 'Test User',
            'password': 'pass123'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Missing password
        response = api_client.post(url, {
            'name': 'Test User',
            'email': 'test@example.com'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_signup_invalid_email(self, api_client):
        """Test validation for invalid email format."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Test User',
            'email': 'not-an-email',
            'password': 'pass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestJWTTokenAPI:
    """Test JWT token authentication endpoints."""
    
    def test_obtain_token_success(self, api_client, test_user):
        """Test successful token generation."""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'testuser@example.com',
            'password': 'testpass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_obtain_token_wrong_password(self, api_client, test_user):
        """Test token generation with wrong password."""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'testuser@example.com',
            'password': 'wrongpassword'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_obtain_token_nonexistent_user(self, api_client):
        """Test token generation for non-existent user."""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'nonexistent@example.com',
            'password': 'somepassword'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_refresh_token_success(self, api_client, test_user):
        """Test successful token refresh."""
        # First, get tokens
        obtain_url = reverse('token_obtain_pair')
        obtain_data = {
            'email': 'testuser@example.com',
            'password': 'testpass123'
        }
        obtain_response = api_client.post(obtain_url, obtain_data, format='json')
        refresh_token = obtain_response.data['refresh']
        
        # Now refresh the token
        refresh_url = reverse('token_refresh')
        refresh_data = {
            'refresh': refresh_token
        }
        
        response = api_client.post(refresh_url, refresh_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
    
    def test_refresh_token_invalid(self, api_client):
        """Test token refresh with invalid token."""
        url = reverse('token_refresh')
        data = {
            'refresh': 'invalid-token-string'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestAuthenticationFlow:
    """Test complete authentication flow."""
    
    def test_signup_and_login_flow(self, api_client):
        """Test complete flow: signup -> login -> use token."""
        # Step 1: Signup
        signup_url = reverse('accounts:portal_signup')
        signup_data = {
            'name': 'Flow Test User',
            'email': 'flowtest@example.com',
            'password': 'flowpass123'
        }
        
        signup_response = api_client.post(signup_url, signup_data, format='json')
        assert signup_response.status_code == status.HTTP_201_CREATED
        
        # Tokens are returned immediately after signup
        access_token = signup_response.data['tokens']['access']
        refresh_token = signup_response.data['tokens']['refresh']
        
        assert access_token is not None
        assert refresh_token is not None
        
        # Step 2: Login again (optional, but testing it)
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'flowtest@example.com',
            'password': 'flowpass123'
        }
        
        login_response = api_client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK
        assert 'access' in login_response.data
        
        # Step 3: Refresh token
        refresh_url = reverse('token_refresh')
        refresh_data = {
            'refresh': refresh_token
        }
        
        refresh_response = api_client.post(refresh_url, refresh_data, format='json')
        assert refresh_response.status_code == status.HTTP_200_OK
        assert 'access' in refresh_response.data
    
    def test_signup_creates_both_user_and_contact(self, api_client):
        """Test that signup creates both User and Contact atomically."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Atomic Test',
            'email': 'atomic@example.com',
            'password': 'atomicpass123'
        }
        
        # Before signup
        assert not User.objects.filter(email='atomic@example.com').exists()
        assert not Contact.objects.filter(email='atomic@example.com').exists()
        
        # Signup
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # After signup - both should exist
        assert User.objects.filter(email='atomic@example.com').exists()
        assert Contact.objects.filter(email='atomic@example.com').exists()
        
        # Verify they're linked
        user = User.objects.get(email='atomic@example.com')
        contact = Contact.objects.get(email='atomic@example.com')
        assert contact.user == user
