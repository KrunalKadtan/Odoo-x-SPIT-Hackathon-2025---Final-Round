"""
Unit tests for SaleOrder model.
Tests specific examples, edge cases, and model behaviors.
"""
import pytest
from django.core.exceptions import ValidationError
from decimal import Decimal
from products.models import SaleOrder
from accounts.models import User


@pytest.mark.django_db
class TestSaleOrderModel:
    """Unit tests for SaleOrder model creation and validation."""
    
    def test_sale_order_creation_with_valid_data(self):
        """Test creating a sale order with all valid data."""
        # Create a portal user
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        # Create a sale order
        order = SaleOrder.objects.create(
            customer=customer,
            subtotal=Decimal('100.00'),
            discount_amount=Decimal('10.00'),
            total_amount=Decimal('90.00')
        )
        
        assert order.customer == customer
        assert order.status == 'draft'  # Default status
        assert order.subtotal == Decimal('100.00')
        assert order.discount_amount == Decimal('10.00')
        assert order.total_amount == Decimal('90.00')
        assert order.applied_coupon is None
        assert order.order_date is not None
        assert order.created_at is not None
        assert order.updated_at is not None
    
    def test_sale_order_customer_role_validation_portal(self):
        """Test that portal users can be customers."""
        # Create a portal user
        customer = User.objects.create_user(
            email="portal@example.com",
            password="testpass123",
            name="Portal User",
            role='portal'
        )
        
        # Should succeed
        order = SaleOrder.objects.create(
            customer=customer,
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        assert order.customer == customer
    
    def test_sale_order_customer_role_validation_internal(self):
        """Test that internal users cannot be customers."""
        # Create an internal user
        internal_user = User.objects.create_user(
            email="internal@example.com",
            password="testpass123",
            name="Internal User",
            role='internal'
        )
        
        # Should fail validation
        with pytest.raises(ValidationError) as exc_info:
            SaleOrder.objects.create(
                customer=internal_user,
                subtotal=Decimal('100.00'),
                total_amount=Decimal('100.00')
            )
        
        assert 'customer' in exc_info.value.message_dict
        assert 'portal user' in str(exc_info.value.message_dict['customer'][0]).lower()
    
    def test_sale_order_status_choices_draft(self):
        """Test that 'draft' is a valid status."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='draft',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        assert order.status == 'draft'
    
    def test_sale_order_status_choices_confirmed(self):
        """Test that 'confirmed' is a valid status."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='confirmed',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        assert order.status == 'confirmed'
    
    def test_sale_order_status_choices_cancelled(self):
        """Test that 'cancelled' is a valid status."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='cancelled',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        assert order.status == 'cancelled'
    
    def test_sale_order_status_default_value(self):
        """Test that status defaults to 'draft'."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        assert order.status == 'draft'
    
    def test_sale_order_can_transition_to_draft_to_confirmed(self):
        """Test that draft orders can transition to confirmed."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='draft',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        assert order.can_transition_to('confirmed') is True
    
    def test_sale_order_can_transition_to_draft_to_cancelled(self):
        """Test that draft orders can transition to cancelled."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='draft',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        assert order.can_transition_to('cancelled') is True
    
    def test_sale_order_can_transition_to_confirmed_to_cancelled(self):
        """Test that confirmed orders can transition to cancelled."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='confirmed',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        assert order.can_transition_to('cancelled') is True
    
    def test_sale_order_can_transition_to_confirmed_to_draft_invalid(self):
        """Test that confirmed orders cannot transition back to draft."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='confirmed',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        assert order.can_transition_to('draft') is False
    
    def test_sale_order_can_transition_to_cancelled_terminal(self):
        """Test that cancelled orders cannot transition to any status."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='cancelled',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        assert order.can_transition_to('draft') is False
        assert order.can_transition_to('confirmed') is False
        assert order.can_transition_to('cancelled') is False
    
    def test_sale_order_confirm_method_from_draft(self):
        """Test confirm() method transitions draft to confirmed."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='draft',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        order.confirm()
        order.refresh_from_db()
        assert order.status == 'confirmed'
    
    def test_sale_order_confirm_method_from_confirmed_fails(self):
        """Test confirm() method fails from confirmed status."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='confirmed',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        with pytest.raises(ValidationError):
            order.confirm()
    
    def test_sale_order_confirm_method_from_cancelled_fails(self):
        """Test confirm() method fails from cancelled status."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='cancelled',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        with pytest.raises(ValidationError):
            order.confirm()
    
    def test_sale_order_cancel_method_from_draft(self):
        """Test cancel() method transitions draft to cancelled."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='draft',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        order.cancel()
        order.refresh_from_db()
        assert order.status == 'cancelled'
    
    def test_sale_order_cancel_method_from_confirmed(self):
        """Test cancel() method transitions confirmed to cancelled."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='confirmed',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        order.cancel()
        order.refresh_from_db()
        assert order.status == 'cancelled'
    
    def test_sale_order_cancel_method_from_cancelled_fails(self):
        """Test cancel() method fails from cancelled status."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            status='cancelled',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        with pytest.raises(ValidationError):
            order.cancel()
    
    def test_sale_order_str_method(self):
        """Test __str__ method returns order ID and customer email."""
        customer = User.objects.create_user(
            email="customer@example.com",
            password="testpass123",
            name="Test Customer",
            role='portal'
        )
        
        order = SaleOrder.objects.create(
            customer=customer,
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        expected = f"Order #{order.id} - customer@example.com"
        assert str(order) == expected
