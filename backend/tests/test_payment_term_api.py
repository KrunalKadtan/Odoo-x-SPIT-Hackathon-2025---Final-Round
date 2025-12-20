"""
Unit tests for PaymentTerm API endpoints.
Tests CRUD operations, permissions, and default term retrieval.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from products.models import PaymentTerm


User = get_user_model()


@pytest.fixture
def api_client():
    """Provide an API client for making requests."""
    return APIClient()


@pytest.fixture
def internal_user(db):
    """Create an internal user for testing."""
    return User.objects.create_user(
        email='internal@test.com',
        name='Internal User',
        password='testpass123',
        role='internal'
    )


@pytest.fixture
def portal_user(db):
    """Create a portal user for testing."""
    return User.objects.create_user(
        email='portal@test.com',
        name='Portal User',
        password='testpass123',
        role='portal'
    )


@pytest.fixture
def default_payment_term(db):
    """Create a default payment term for testing."""
    return PaymentTerm.objects.create(
        name='Immediate Payment',
        early_payment_discount=False,
        discount_percentage=0.00,
        discount_days=0,
        is_default=True,
        example_preview='Payment is due immediately upon invoice receipt.'
    )


@pytest.fixture
def regular_payment_term(db):
    """Create a regular (non-default) payment term for testing."""
    return PaymentTerm.objects.create(
        name='Net 30',
        early_payment_discount=True,
        discount_percentage=2.00,
        discount_days=10,
        early_pay_discount_computation='percentage_of_total',
        is_default=False,
        example_preview='2% discount if paid within 10 days, otherwise net 30.'
    )


@pytest.mark.django_db
class TestPaymentTermListAPI:
    """Test GET /api/payment-terms/ endpoint."""
    
    def test_list_requires_authentication(self, api_client):
        """
        Test that unauthenticated users cannot list payment terms.
        Requirements: 14.1, 16.2
        """
        response = api_client.get('/api/payment-terms/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_requires_internal_user(self, api_client, portal_user):
        """
        Test that portal users cannot list payment terms.
        Requirements: 14.1, 16.3
        """
        api_client.force_authenticate(user=portal_user)
        response = api_client.get('/api/payment-terms/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_list_success_for_internal_user(
        self, 
        api_client, 
        internal_user, 
        default_payment_term,
        regular_payment_term
    ):
        """
        Test that internal users can list payment terms.
        Requirements: 14.2
        """
        api_client.force_authenticate(user=internal_user)
        response = api_client.get('/api/payment-terms/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) == 2


@pytest.mark.django_db
class TestPaymentTermCreateAPI:
    """Test POST /api/payment-terms/ endpoint."""
    
    def test_create_requires_authentication(self, api_client):
        """
        Test that unauthenticated users cannot create payment terms.
        Requirements: 14.1, 16.2
        """
        data = {
            'name': 'Net 60',
            'early_payment_discount': False,
            'is_default': False
        }
        response = api_client.post('/api/payment-terms/', data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_requires_internal_user(self, api_client, portal_user):
        """
        Test that portal users cannot create payment terms.
        Requirements: 14.1, 16.3
        """
        api_client.force_authenticate(user=portal_user)
        data = {
            'name': 'Net 60',
            'early_payment_discount': False,
            'is_default': False
        }
        response = api_client.post('/api/payment-terms/', data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_success_for_internal_user(self, api_client, internal_user):
        """
        Test that internal users can create payment terms.
        Requirements: 14.1
        """
        api_client.force_authenticate(user=internal_user)
        data = {
            'name': 'Net 60',
            'early_payment_discount': False,
            'discount_percentage': 0.00,
            'discount_days': 0,
            'is_default': False
        }
        response = api_client.post('/api/payment-terms/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Net 60'
        assert PaymentTerm.objects.filter(name='Net 60').exists()


@pytest.mark.django_db
class TestPaymentTermRetrieveAPI:
    """Test GET /api/payment-terms/{id}/ endpoint."""
    
    def test_retrieve_requires_authentication(self, api_client, default_payment_term):
        """
        Test that unauthenticated users cannot retrieve payment terms.
        Requirements: 14.2, 16.2
        """
        response = api_client.get(f'/api/payment-terms/{default_payment_term.id}/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_retrieve_requires_internal_user(self, api_client, portal_user, default_payment_term):
        """
        Test that portal users cannot retrieve payment terms.
        Requirements: 14.2, 16.3
        """
        api_client.force_authenticate(user=portal_user)
        response = api_client.get(f'/api/payment-terms/{default_payment_term.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_retrieve_success_for_internal_user(
        self, 
        api_client, 
        internal_user, 
        default_payment_term
    ):
        """
        Test that internal users can retrieve payment terms.
        Requirements: 14.2
        """
        api_client.force_authenticate(user=internal_user)
        response = api_client.get(f'/api/payment-terms/{default_payment_term.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == default_payment_term.name
        assert response.data['is_default'] == True


@pytest.mark.django_db
class TestPaymentTermUpdateAPI:
    """Test PUT /api/payment-terms/{id}/ endpoint."""
    
    def test_update_requires_authentication(self, api_client, regular_payment_term):
        """
        Test that unauthenticated users cannot update payment terms.
        Requirements: 14.4, 16.2
        """
        data = {'name': 'Updated Name'}
        response = api_client.patch(f'/api/payment-terms/{regular_payment_term.id}/', data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_update_requires_internal_user(self, api_client, portal_user, regular_payment_term):
        """
        Test that portal users cannot update payment terms.
        Requirements: 14.4, 16.3
        """
        api_client.force_authenticate(user=portal_user)
        data = {'name': 'Updated Name'}
        response = api_client.patch(f'/api/payment-terms/{regular_payment_term.id}/', data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_success_for_internal_user(
        self, 
        api_client, 
        internal_user, 
        regular_payment_term
    ):
        """
        Test that internal users can update payment terms.
        Requirements: 14.4
        """
        api_client.force_authenticate(user=internal_user)
        data = {
            'name': 'Net 30 Updated',
            'early_payment_discount': True,
            'discount_percentage': 3.00,
            'discount_days': 10,
            'early_pay_discount_computation': 'percentage_of_total',
            'is_default': False
        }
        response = api_client.put(f'/api/payment-terms/{regular_payment_term.id}/', data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Net 30 Updated'
        assert float(response.data['discount_percentage']) == 3.00


@pytest.mark.django_db
class TestPaymentTermDeleteAPI:
    """Test DELETE /api/payment-terms/{id}/ endpoint."""
    
    def test_delete_requires_authentication(self, api_client, regular_payment_term):
        """
        Test that unauthenticated users cannot delete payment terms.
        Requirements: 14.5, 16.2
        """
        response = api_client.delete(f'/api/payment-terms/{regular_payment_term.id}/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_requires_internal_user(self, api_client, portal_user, regular_payment_term):
        """
        Test that portal users cannot delete payment terms.
        Requirements: 14.5, 16.3
        """
        api_client.force_authenticate(user=portal_user)
        response = api_client.delete(f'/api/payment-terms/{regular_payment_term.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_delete_success_for_internal_user(
        self, 
        api_client, 
        internal_user, 
        regular_payment_term
    ):
        """
        Test that internal users can delete non-default payment terms.
        Requirements: 14.5
        """
        api_client.force_authenticate(user=internal_user)
        term_id = regular_payment_term.id
        response = api_client.delete(f'/api/payment-terms/{term_id}/')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not PaymentTerm.objects.filter(id=term_id).exists()


@pytest.mark.django_db
class TestPaymentTermDefaultAPI:
    """Test GET /api/payment-terms/default/ endpoint."""
    
    def test_default_term_no_authentication_required(self, api_client, default_payment_term):
        """
        Test that unauthenticated users can retrieve default payment term.
        Requirements: 14.3, 16.5
        """
        response = api_client.get('/api/payment-terms/default/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == default_payment_term.name
        assert response.data['is_default'] == True
    
    def test_default_term_portal_user_access(
        self, 
        api_client, 
        portal_user, 
        default_payment_term
    ):
        """
        Test that portal users can retrieve default payment term.
        Requirements: 14.3
        """
        api_client.force_authenticate(user=portal_user)
        response = api_client.get('/api/payment-terms/default/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == default_payment_term.name
    
    def test_default_term_internal_user_access(
        self, 
        api_client, 
        internal_user, 
        default_payment_term
    ):
        """
        Test that internal users can retrieve default payment term.
        Requirements: 14.3
        """
        api_client.force_authenticate(user=internal_user)
        response = api_client.get('/api/payment-terms/default/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == default_payment_term.name
    
    def test_default_term_not_found(self, api_client, db):
        """
        Test that 404 is returned when no default payment term exists.
        Requirements: 14.3
        """
        # Ensure no default payment term exists
        PaymentTerm.objects.filter(is_default=True).delete()
        
        response = api_client.get('/api/payment-terms/default/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
