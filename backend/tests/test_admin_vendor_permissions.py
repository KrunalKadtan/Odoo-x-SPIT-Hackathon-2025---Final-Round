"""
Unit tests for admin and vendor permission classes.
"""
import pytest
from rest_framework.test import APIRequestFactory
from accounts.models import User, Contact
from products.models import PurchaseOrder, VendorBill
from products.admin_vendor_permissions import (
    IsAdminUserRole,
    IsVendorUserRole,
    IsVendorObjectOwner
)


@pytest.mark.django_db
class TestIsAdminUserRole:
    """Test IsAdminUserRole permission class."""
    
    def test_admin_user_has_permission(self):
        """Admin user (role='internal') should have permission."""
        # Create admin user
        user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='internal'
        )
        
        # Create request with admin user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        # Check permission
        permission = IsAdminUserRole()
        assert permission.has_permission(request, None) is True
    
    def test_portal_user_no_permission(self):
        """Portal user should not have admin permission."""
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
        permission = IsAdminUserRole()
        assert permission.has_permission(request, None) is False
    
    def test_vendor_user_no_permission(self):
        """Vendor user should not have admin permission."""
        # Create vendor user
        user = User.objects.create_user(
            email='vendor@test.com',
            password='testpass123',
            role='vendor'
        )
        
        # Create request with vendor user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        # Check permission
        permission = IsAdminUserRole()
        assert permission.has_permission(request, None) is False
    
    def test_unauthenticated_user_no_permission(self):
        """Unauthenticated user should not have admin permission."""
        from django.contrib.auth.models import AnonymousUser
        
        # Create request with anonymous user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = AnonymousUser()
        
        # Check permission
        permission = IsAdminUserRole()
        assert permission.has_permission(request, None) is False


@pytest.mark.django_db
class TestIsVendorUserRole:
    """Test IsVendorUserRole permission class."""
    
    def test_vendor_user_has_permission(self):
        """Vendor user should have permission."""
        # Create vendor user
        user = User.objects.create_user(
            email='vendor@test.com',
            password='testpass123',
            role='vendor'
        )
        
        # Create request with vendor user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        # Check permission
        permission = IsVendorUserRole()
        assert permission.has_permission(request, None) is True
    
    def test_portal_user_no_permission(self):
        """Portal user should not have vendor permission."""
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
        permission = IsVendorUserRole()
        assert permission.has_permission(request, None) is False
    
    def test_admin_user_no_permission(self):
        """Admin user should not have vendor permission (they use admin endpoints)."""
        # Create admin user
        user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='internal'
        )
        
        # Create request with admin user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        
        # Check permission
        permission = IsVendorUserRole()
        assert permission.has_permission(request, None) is False


@pytest.mark.django_db
class TestIsVendorObjectOwner:
    """Test IsVendorObjectOwner permission class."""
    
    def test_admin_user_has_object_permission(self):
        """Admin user should have permission for any vendor object."""
        # Create admin user
        admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='internal'
        )
        
        # Create vendor contact and purchase order
        vendor_contact = Contact.objects.create(
            name='Test Vendor',
            email='vendor@test.com',
            type='vendor'
        )
        purchase_order = PurchaseOrder.objects.create(
            vendor=vendor_contact,
            status='draft'
        )
        
        # Create request with admin user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = admin_user
        
        # Check permission
        permission = IsVendorObjectOwner()
        assert permission.has_object_permission(request, None, purchase_order) is True
    
    def test_vendor_owner_has_object_permission(self):
        """Vendor user should have permission for their own objects."""
        # Create vendor user and contact
        vendor_user = User.objects.create_user(
            email='vendor@test.com',
            password='testpass123',
            role='vendor'
        )
        vendor_contact = Contact.objects.create(
            name='Test Vendor',
            email='vendor@test.com',
            type='vendor',
            user=vendor_user
        )
        
        # Create purchase order for this vendor
        purchase_order = PurchaseOrder.objects.create(
            vendor=vendor_contact,
            status='draft'
        )
        
        # Create request with vendor user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = vendor_user
        
        # Check permission
        permission = IsVendorObjectOwner()
        assert permission.has_object_permission(request, None, purchase_order) is True
    
    def test_vendor_non_owner_no_object_permission(self):
        """Vendor user should not have permission for other vendor's objects."""
        # Create two vendor users and contacts
        vendor1_user = User.objects.create_user(
            email='vendor1@test.com',
            password='testpass123',
            role='vendor'
        )
        vendor1_contact = Contact.objects.create(
            name='Vendor 1',
            email='vendor1@test.com',
            type='vendor',
            user=vendor1_user
        )
        
        vendor2_user = User.objects.create_user(
            email='vendor2@test.com',
            password='testpass123',
            role='vendor'
        )
        vendor2_contact = Contact.objects.create(
            name='Vendor 2',
            email='vendor2@test.com',
            type='vendor',
            user=vendor2_user
        )
        
        # Create purchase order for vendor1
        purchase_order = PurchaseOrder.objects.create(
            vendor=vendor1_contact,
            status='draft'
        )
        
        # Create request with vendor2 user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = vendor2_user
        
        # Check permission
        permission = IsVendorObjectOwner()
        assert permission.has_object_permission(request, None, purchase_order) is False
    
    def test_vendor_without_contact_no_permission(self):
        """Vendor user without linked contact should not have permission."""
        # Create vendor user without contact
        vendor_user = User.objects.create_user(
            email='vendor@test.com',
            password='testpass123',
            role='vendor'
        )
        
        # Create vendor contact and purchase order (not linked to user)
        vendor_contact = Contact.objects.create(
            name='Test Vendor',
            email='other@test.com',
            type='vendor'
        )
        purchase_order = PurchaseOrder.objects.create(
            vendor=vendor_contact,
            status='draft'
        )
        
        # Create request with vendor user
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = vendor_user
        
        # Check permission
        permission = IsVendorObjectOwner()
        assert permission.has_object_permission(request, None, purchase_order) is False
