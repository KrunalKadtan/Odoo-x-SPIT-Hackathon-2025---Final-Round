"""
Quick test script to verify Admin and Vendor APIs are accessible.

This script tests:
1. Admin API endpoints are accessible
2. Vendor API endpoints are accessible
3. Permissions are enforced correctly
"""

import pytest
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, Contact
from products.models import Product, PurchaseOrder, VendorBill
from decimal import Decimal


@pytest.mark.django_db
class TestAdminVendorAPIs:
    """Test Admin and Vendor API accessibility."""
    
    def setup_method(self):
        """Set up test data."""
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            name='Admin User',
            role='internal'
        )
        
        # Create vendor contact
        self.vendor_contact = Contact.objects.create(
            name='Test Vendor',
            type='vendor',
            email='vendor@test.com',
            mobile='+1234567890'
        )
        
        # Create vendor user linked to contact
        self.vendor_user = User.objects.create_user(
            email='vendoruser@test.com',
            password='testpass123',
            name='Vendor User',
            role='vendor'
        )
        self.vendor_contact.user = self.vendor_user
        self.vendor_contact.save()
        
        # Create a product
        self.product = Product.objects.create(
            product_name='Test Product',
            product_category='Category A',
            product_type='storable',
            sales_price=Decimal('100.00'),
            purchase_price=Decimal('50.00'),
            current_stock=10
        )
        
        self.client = APIClient()
    
    def test_admin_can_access_admin_product_endpoint(self):
        """Test that admin user can access admin product endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/products/')
        
        assert response.status_code == status.HTTP_200_OK
        print("✓ Admin can access /api/admin/products/")
    
    def test_admin_can_access_admin_vendor_endpoint(self):
        """Test that admin user can access admin vendor endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/vendors/')
        
        assert response.status_code == status.HTTP_200_OK
        print("✓ Admin can access /api/admin/vendors/")
    
    def test_admin_can_access_admin_purchase_order_endpoint(self):
        """Test that admin user can access admin purchase order endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/purchase-orders/')
        
        assert response.status_code == status.HTTP_200_OK
        print("✓ Admin can access /api/admin/purchase-orders/")
    
    def test_vendor_cannot_access_admin_endpoints(self):
        """Test that vendor user cannot access admin endpoints."""
        self.client.force_authenticate(user=self.vendor_user)
        response = self.client.get('/api/admin/products/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        print("✓ Vendor cannot access /api/admin/products/ (403 Forbidden)")
    
    def test_vendor_can_access_vendor_product_endpoint(self):
        """Test that vendor user can access vendor product endpoint."""
        self.client.force_authenticate(user=self.vendor_user)
        response = self.client.get('/api/vendor/products/')
        
        assert response.status_code == status.HTTP_200_OK
        print("✓ Vendor can access /api/vendor/products/")
    
    def test_vendor_can_access_vendor_purchase_order_endpoint(self):
        """Test that vendor user can access vendor purchase order endpoint."""
        self.client.force_authenticate(user=self.vendor_user)
        response = self.client.get('/api/vendor/purchase-orders/')
        
        assert response.status_code == status.HTTP_200_OK
        print("✓ Vendor can access /api/vendor/purchase-orders/")
    
    def test_vendor_can_access_vendor_me_endpoint(self):
        """Test that vendor user can access vendor me endpoint."""
        self.client.force_authenticate(user=self.vendor_user)
        response = self.client.get('/api/vendor/me/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Test Vendor'
        print("✓ Vendor can access /api/vendor/me/")
    
    def test_admin_cannot_access_vendor_endpoints(self):
        """Test that admin user cannot access vendor-only endpoints."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/vendor/me/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        print("✓ Admin cannot access /api/vendor/me/ (403 Forbidden)")
    
    def test_unauthenticated_cannot_access_admin_endpoints(self):
        """Test that unauthenticated users cannot access admin endpoints."""
        response = self.client.get('/api/admin/products/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        print("✓ Unauthenticated user cannot access /api/admin/products/ (401 Unauthorized)")
    
    def test_unauthenticated_cannot_access_vendor_endpoints(self):
        """Test that unauthenticated users cannot access vendor endpoints."""
        response = self.client.get('/api/vendor/products/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        print("✓ Unauthenticated user cannot access /api/vendor/products/ (401 Unauthorized)")
    
    def test_admin_can_create_product(self):
        """Test that admin can create a product."""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'product_name': 'New Product',
            'product_category': 'Category B',
            'product_type': 'storable',
            'sales_price': '150.00',
            'purchase_price': '75.00'
        }
        
        response = self.client.post('/api/admin/products/', data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['product_name'] == 'New Product'
        print("✓ Admin can create product via POST /api/admin/products/")
    
    def test_admin_can_publish_product(self):
        """Test that admin can publish a product."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.patch(
            f'/api/admin/products/{self.product.id}/publish/',
            {'published': True},
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['published'] is True
        print("✓ Admin can publish product via PATCH /api/admin/products/{id}/publish/")
    
    def test_admin_can_view_stock(self):
        """Test that admin can view product stock."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(f'/api/admin/products/{self.product.id}/stock/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['current_stock'] == 10
        print("✓ Admin can view stock via GET /api/admin/products/{id}/stock/")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
