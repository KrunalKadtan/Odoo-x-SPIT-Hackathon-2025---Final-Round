"""
Integration tests for Customer Invoice API endpoints.
Tests the CustomerInvoiceViewSet implementation.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal
from datetime import date, timedelta

from accounts.models import User
from products.models import CustomerInvoice, SaleOrder, Product
from tests.factories import (
    UserFactory,
    ProductFactory,
    SaleOrderFactory,
    CustomerInvoiceFactory
)


@pytest.mark.django_db
class TestCustomerInvoiceAPI:
    """Test suite for Customer Invoice API endpoints."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client = APIClient()
        
        # Create users
        self.portal_user = UserFactory(role='portal')
        self.internal_user = UserFactory(role='internal')
        self.other_portal_user = UserFactory(role='portal')
        
        # Create products
        self.product = ProductFactory(published=True, current_stock=100)
        
        # Create orders
        self.portal_order = SaleOrderFactory(
            customer=self.portal_user,
            status='confirmed'
        )
        self.other_order = SaleOrderFactory(
            customer=self.other_portal_user,
            status='confirmed'
        )
        
        # Create invoices
        self.portal_invoice = CustomerInvoiceFactory(
            order=self.portal_order,
            status='draft'
        )
        self.other_invoice = CustomerInvoiceFactory(
            order=self.other_order,
            status='draft'
        )
    
    def test_list_invoices_as_portal_user(self):
        """Portal users should only see their own invoices."""
        self.client.force_authenticate(user=self.portal_user)
        
        url = reverse('products:invoice-list')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['id'] == self.portal_invoice.id
    
    def test_list_invoices_as_internal_user(self):
        """Internal users should see all invoices."""
        self.client.force_authenticate(user=self.internal_user)
        
        url = reverse('products:invoice-list')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2
    
    def test_create_invoice_from_confirmed_order(self):
        """Test creating an invoice from a confirmed order."""
        self.client.force_authenticate(user=self.internal_user)
        
        # Create a new confirmed order
        new_order = SaleOrderFactory(
            customer=self.portal_user,
            status='confirmed'
        )
        
        url = reverse('products:invoice-list')
        data = {
            'order_id': new_order.id,
            'payment_terms_days': 30
        }
        response = self.client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['order_id'] == new_order.id
        assert response.data['status'] == 'draft'
        assert 'customer_email' in response.data
    
    def test_create_invoice_from_draft_order_fails(self):
        """Test that creating an invoice from a draft order fails."""
        self.client.force_authenticate(user=self.internal_user)
        
        # Create a draft order
        draft_order = SaleOrderFactory(
            customer=self.portal_user,
            status='draft'
        )
        
        url = reverse('products:invoice-list')
        data = {
            'order_id': draft_order.id
        }
        response = self.client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    def test_confirm_invoice_success(self):
        """Test confirming an invoice successfully deducts stock."""
        self.client.force_authenticate(user=self.internal_user)
        
        # Get initial stock
        initial_stock = self.product.current_stock
        
        # Add line item to order
        from products.models import SaleOrderLine
        SaleOrderLine.objects.create(
            order=self.portal_order,
            product=self.product,
            quantity=5,
            unit_price=self.product.sales_price,
            line_total=Decimal('5') * self.product.sales_price
        )
        
        url = reverse('products:invoice-confirm', kwargs={'pk': self.portal_invoice.id})
        response = self.client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['invoice']['status'] == 'confirmed'
        
        # Verify stock was deducted
        self.product.refresh_from_db()
        assert self.product.current_stock == initial_stock - 5
    
    def test_confirm_invoice_insufficient_stock(self):
        """Test that confirming an invoice with insufficient stock fails."""
        self.client.force_authenticate(user=self.internal_user)
        
        # Create product with low stock
        low_stock_product = ProductFactory(published=True, current_stock=2)
        
        # Create order with line item requiring more stock than available
        from products.models import SaleOrderLine
        SaleOrderLine.objects.create(
            order=self.portal_order,
            product=low_stock_product,
            quantity=10,
            unit_price=low_stock_product.sales_price,
            line_total=Decimal('10') * low_stock_product.sales_price
        )
        
        url = reverse('products:invoice-confirm', kwargs={'pk': self.portal_invoice.id})
        response = self.client.post(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Insufficient stock' in response.data['error']
        
        # Verify invoice is still in draft status
        self.portal_invoice.refresh_from_db()
        assert self.portal_invoice.status == 'draft'
    
    def test_confirm_already_confirmed_invoice_fails(self):
        """Test that confirming an already confirmed invoice fails."""
        self.client.force_authenticate(user=self.internal_user)
        
        # Create a confirmed invoice
        confirmed_invoice = CustomerInvoiceFactory(
            order=self.portal_order,
            status='confirmed'
        )
        
        url = reverse('products:invoice-confirm', kwargs={'pk': confirmed_invoice.id})
        response = self.client.post(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Cannot confirm invoice' in response.data['error']
    
    def test_portal_user_cannot_access_other_invoice(self):
        """Test that portal users cannot access invoices from other users."""
        self.client.force_authenticate(user=self.portal_user)
        
        url = reverse('products:invoice-detail', kwargs={'pk': self.other_invoice.id})
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access invoice endpoints."""
        url = reverse('products:invoice-list')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_filter_invoices_by_status(self):
        """Test filtering invoices by status."""
        self.client.force_authenticate(user=self.internal_user)
        
        # Create invoices with different statuses
        CustomerInvoiceFactory(
            order=self.portal_order,
            status='confirmed'
        )
        
        url = reverse('products:invoice-list')
        response = self.client.get(url, {'status': 'draft'})
        
        assert response.status_code == status.HTTP_200_OK
        for invoice in response.data['results']:
            assert invoice['status'] == 'draft'
    
    def test_invoice_serializer_includes_required_fields(self):
        """Test that invoice serializer includes all required fields."""
        self.client.force_authenticate(user=self.portal_user)
        
        url = reverse('products:invoice-detail', kwargs={'pk': self.portal_invoice.id})
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify required fields are present
        required_fields = [
            'id', 'order', 'order_id', 'customer_email',
            'invoice_date', 'due_date', 'total_amount',
            'status', 'created_at', 'updated_at'
        ]
        for field in required_fields:
            assert field in response.data, f"Field '{field}' missing from response"
