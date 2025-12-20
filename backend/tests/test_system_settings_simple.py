"""
Simple pytest test for SystemSettings API endpoints.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from products.models import SystemSettings

User = get_user_model()


@pytest.fixture
def api_client():
    """Provide an API client for making requests."""
    return APIClient()


@pytest.fixture
def internal_user(db):
    """Create an internal user for testing."""
    return User.objects.create_user(
        email='internal_settings@test.com',
        name='Internal User',
        password='testpass123',
        role='internal'
    )


@pytest.fixture
def portal_user(db):
    """Create a portal user for testing."""
    return User.objects.create_user(
        email='portal_settings@test.com',
        name='Portal User',
        password='testpass123',
        role='portal'
    )


@pytest.mark.django_db
class TestSystemSettingsAPI:
    """Test SystemSettings API endpoints."""
    
    def test_unauthenticated_access_denied(self, api_client):
        """Test that unauthenticated users cannot access settings."""
        response = api_client.get('/api/settings/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_portal_user_access_denied(self, api_client, portal_user):
        """Test that portal users cannot access settings."""
        api_client.force_authenticate(user=portal_user)
        response = api_client.get('/api/settings/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_internal_user_can_get_settings(self, api_client, internal_user):
        """Test that internal users can retrieve settings."""
        api_client.force_authenticate(user=internal_user)
        response = api_client.get('/api/settings/')
        assert response.status_code == status.HTTP_200_OK
        assert 'automatic_invoicing' in response.data
        assert 'id' in response.data
        assert response.data['id'] == 1
    
    def test_internal_user_can_update_settings(self, api_client, internal_user):
        """Test that internal users can update settings."""
        api_client.force_authenticate(user=internal_user)
        
        # Update settings
        response = api_client.patch('/api/settings/1/', {'automatic_invoicing': True})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['automatic_invoicing'] == True
        
        # Verify persistence
        settings = SystemSettings.load()
        assert settings.automatic_invoicing == True
        
        # Update back
        response = api_client.put('/api/settings/1/', {'automatic_invoicing': False})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['automatic_invoicing'] == False
    
    def test_retrieve_with_id(self, api_client, internal_user):
        """Test that retrieve endpoint works with ID."""
        api_client.force_authenticate(user=internal_user)
        response = api_client.get('/api/settings/1/')
        assert response.status_code == status.HTTP_200_OK
        assert 'automatic_invoicing' in response.data
