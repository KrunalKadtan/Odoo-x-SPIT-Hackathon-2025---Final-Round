"""
Unit tests for DiscountOffer API endpoints.
Tests CRUD operations and active_offers action.
"""
import pytest
import datetime
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from products.models import DiscountOffer
from accounts.models import User


@pytest.fixture
def api_client():
    """Create API client."""
    return APIClient()


@pytest.fixture
def internal_user(db):
    """Create internal user for testing."""
    return User.objects.create_user(
        email='internal@test.com',
        password='testpass123',
        role='internal',
        first_name='Internal',
        last_name='User'
    )


@pytest.fixture
def portal_user(db):
    """Create portal user for testing."""
    return User.objects.create_user(
        email='portal@test.com',
        password='testpass123',
        role='portal',
        first_name='Portal',
        last_name='User'
    )


@pytest.fixture
def discount_offer(db):
    """Create a discount offer for testing."""
    return DiscountOffer.objects.create(
        name='Test Offer',
        discount_percentage=Decimal('10.00'),
        start_date=datetime.date.today(),
        end_date=datetime.date.today() + datetime.timedelta(days=30)
    )


@pytest.mark.django_db
class TestDiscountOfferCRUD:
    """Test CRUD operations for DiscountOffer API."""
    
    def test_list_offers_as_internal_user(self, api_client, internal_user, discount_offer):
        """Test listing discount offers as internal user."""
        api_client.force_authenticate(user=internal_user)
        url = reverse('products:offer-list')
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) >= 1
    
    def test_list_offers_as_portal_user_forbidden(self, api_client, portal_user, discount_offer):
        """Test that portal users cannot list offers."""
        api_client.force_authenticate(user=portal_user)
        url = reverse('products:offer-list')
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_offer_as_internal_user(self, api_client, internal_user):
        """Test creating a discount offer as internal user."""
        api_client.force_authenticate(user=internal_user)
        url = reverse('products:offer-list')
        
        data = {
            'name': 'New Year Sale',
            'discount_percentage': '15.00',
            'start_date': str(datetime.date.today()),
            'end_date': str(datetime.date.today() + datetime.timedelta(days=60))
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Year Sale'
        assert response.data['discount_percentage'] == '15.00'
    
    def test_create_offer_as_portal_user_forbidden(self, api_client, portal_user):
        """Test that portal users cannot create offers."""
        api_client.force_authenticate(user=portal_user)
        url = reverse('products:offer-list')
        
        data = {
            'name': 'Unauthorized Offer',
            'discount_percentage': '10.00',
            'start_date': str(datetime.date.today()),
            'end_date': str(datetime.date.today() + datetime.timedelta(days=30))
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_retrieve_offer_as_internal_user(self, api_client, internal_user, discount_offer):
        """Test retrieving a specific discount offer."""
        api_client.force_authenticate(user=internal_user)
        url = reverse('products:offer-detail', kwargs={'pk': discount_offer.id})
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == discount_offer.name
        assert response.data['discount_percentage'] == str(discount_offer.discount_percentage)
    
    def test_update_offer_as_internal_user(self, api_client, internal_user, discount_offer):
        """Test updating a discount offer."""
        api_client.force_authenticate(user=internal_user)
        url = reverse('products:offer-detail', kwargs={'pk': discount_offer.id})
        
        data = {
            'name': 'Updated Offer',
            'discount_percentage': '20.00',
            'start_date': str(discount_offer.start_date),
            'end_date': str(discount_offer.end_date)
        }
        
        response = api_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Offer'
        assert response.data['discount_percentage'] == '20.00'
    
    def test_delete_offer_without_coupons(self, api_client, internal_user, discount_offer):
        """Test deleting a discount offer that has no coupons."""
        api_client.force_authenticate(user=internal_user)
        url = reverse('products:offer-detail', kwargs={'pk': discount_offer.id})
        
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not DiscountOffer.objects.filter(id=discount_offer.id).exists()


@pytest.mark.django_db
class TestActiveOffersAction:
    """Test active_offers action for DiscountOffer API."""
    
    def test_active_offers_unauthenticated(self, api_client):
        """Test that active_offers is accessible without authentication."""
        # Create active offer
        DiscountOffer.objects.create(
            name='Active Offer',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today() - datetime.timedelta(days=5),
            end_date=datetime.date.today() + datetime.timedelta(days=5)
        )
        
        url = reverse('products:offer-active-offers')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) >= 1
    
    def test_active_offers_filters_by_date(self, api_client):
        """Test that active_offers only returns offers active today."""
        # Create active offer
        active_offer = DiscountOffer.objects.create(
            name='Active Offer',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today() - datetime.timedelta(days=5),
            end_date=datetime.date.today() + datetime.timedelta(days=5)
        )
        
        # Create expired offer
        DiscountOffer.objects.create(
            name='Expired Offer',
            discount_percentage=Decimal('15.00'),
            start_date=datetime.date.today() - datetime.timedelta(days=60),
            end_date=datetime.date.today() - datetime.timedelta(days=30)
        )
        
        # Create future offer
        DiscountOffer.objects.create(
            name='Future Offer',
            discount_percentage=Decimal('20.00'),
            start_date=datetime.date.today() + datetime.timedelta(days=30),
            end_date=datetime.date.today() + datetime.timedelta(days=60)
        )
        
        url = reverse('products:offer-active-offers')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        
        # Should only return the active offer
        offer_names = [offer['name'] for offer in response.data['results']]
        assert 'Active Offer' in offer_names
        assert 'Expired Offer' not in offer_names
        assert 'Future Offer' not in offer_names
    
    def test_active_offers_as_authenticated_user(self, api_client, portal_user):
        """Test that active_offers works for authenticated users too."""
        api_client.force_authenticate(user=portal_user)
        
        # Create active offer
        DiscountOffer.objects.create(
            name='Active Offer',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        url = reverse('products:offer-active-offers')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) >= 1
