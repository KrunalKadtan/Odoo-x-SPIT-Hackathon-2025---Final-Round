"""
Unit tests for custom permission classes.
"""
import pytest
from django.test import RequestFactory
from rest_framework.test import APIRequestFactory
from accounts.models import User
from products.models import SaleOrder, CustomerInvoice, Payment
from products.permissions import IsInternalUser, IsOwnerOrInternal


@pytest.mark.django_db
class TestIsInternalUser:
    """Test IsInternalUser permission class."""
    
    def test_internal_user_has_permission(self):
        """Internal user should have permission."""
        # Create internal user
        user = User.objects.create_user(
            email='internal@test.com',
            password='testpass123',
            role='internal'
        )
        
        # Create request with internal user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        # Check permission
        permission = IsInternalUser()
        assert permission.has_permission(request, None) is True
    
    def test_portal_user_no_permission(self):
        """Portal user should not have permission."""
        # Create portal user
        user = User.objects.create_user(
            email='portal@test.com',
            password='testpass123',
            role='portal'
        )
        
        # Create request with portal user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        # Check permission
        permission = IsInternalUser()
        assert permission.has_permission(request, None) is False
    
    def test_unauthenticated_user_no_permission(self):
        """Unauthenticated user should not have permission."""
        from django.contrib.auth.models import AnonymousUser
        
        # Create request with anonymous user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = AnonymousUser()
        
        # Check permission
        permission = IsInternalUser()
        assert permission.has_permission(request, None) is False


@pytest.mark.django_db
class TestIsOwnerOrInternal:
    """Test IsOwnerOrInternal permission class."""
    
    def test_internal_user_has_object_permission(self):
        """Internal user should have permission for any object."""
        # Create internal user
        internal_user = User.objects.create_user(
            email='internal@test.com',
            password='testpass123',
            role='internal'
        )
        
        # Create portal user and order
        portal_user = User.objects.create_user(
            email='portal@test.com',
            password='testpass123',
            role='portal'
        )
        order = SaleOrder.objects.create(customer=portal_user)
        
        # Create request with internal user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = internal_user
        
        # Check permission
        permission = IsOwnerOrInternal()
        assert permission.has_object_permission(request, None, order) is True
    
    def test_owner_has_object_permission(self):
        """Owner should have permission for their own object."""
        # Create portal user and order
        user = User.objects.create_user(
            email='portal@test.com',
            password='testpass123',
            role='portal'
        )
        order = SaleOrder.objects.create(customer=user)
        
        # Create request with owner
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        # Check permission
        permission = IsOwnerOrInternal()
        assert permission.has_object_permission(request, None, order) is True
    
    def test_non_owner_no_object_permission(self):
        """Non-owner should not have permission for other's object."""
        # Create two portal users
        user1 = User.objects.create_user(
            email='portal1@test.com',
            password='testpass123',
            role='portal'
        )
        user2 = User.objects.create_user(
            email='portal2@test.com',
            password='testpass123',
            role='portal'
        )
        
        # Create order for user1
        order = SaleOrder.objects.create(customer=user1)
        
        # Create request with user2
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user2
        
        # Check permission
        permission = IsOwnerOrInternal()
        assert permission.has_object_permission(request, None, order) is False
    
    def test_invoice_owner_has_permission(self):
        """Owner should have permission for invoice through order.customer."""
        from datetime import date, timedelta
        from decimal import Decimal
        
        # Create portal user, order, and invoice
        user = User.objects.create_user(
            email='portal@test.com',
            password='testpass123',
            role='portal'
        )
        order = SaleOrder.objects.create(customer=user)
        invoice = CustomerInvoice.objects.create(
            order=order,
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal('100.00')
        )
        
        # Create request with owner
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        # Check permission
        permission = IsOwnerOrInternal()
        assert permission.has_object_permission(request, None, invoice) is True
