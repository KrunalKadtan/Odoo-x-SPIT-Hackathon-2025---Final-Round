"""
End-to-end test for sales order creation.
This test verifies the complete order creation workflow.
"""
import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from products.models import Product, SaleOrder, SaleOrderLine, DiscountOffer, Coupon
from products.services import SaleOrderService


@pytest.mark.django_db
class TestEndToEndOrderCreation:
    """End-to-end tests for order creation workflow."""
    
    def test_complete_order_creation_without_coupon(self):
        """Test complete order creation workflow without coupon."""
        # Create a portal user (customer)
        customer = User.objects.create(
            email='customer@example.com',
            role='portal',
            name='John Doe'
        )
        
        # Create products
        product1 = Product.objects.create(
            product_name='T-Shirt',
            purchase_price=Decimal('15.00'),
            sales_price=Decimal('29.99'),
            current_stock=100,
            published=True
        )
        
        product2 = Product.objects.create(
            product_name='Jeans',
            purchase_price=Decimal('30.00'),
            sales_price=Decimal('59.99'),
            current_stock=50,
            published=True
        )
        
        # Create order with line items
        line_items = [
            {'product_id': product1.id, 'quantity': 2},
            {'product_id': product2.id, 'quantity': 1}
        ]
        
        # Create order through service
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items
        )
        
        # Verify order was created
        assert order is not None
        assert order.customer == customer
        assert order.status == 'draft'
        assert order.subtotal == Decimal('119.97')  # (29.99 * 2) + (59.99 * 1)
        assert order.discount_amount == Decimal('0.00')
        assert order.total_amount == Decimal('119.97')
        assert order.applied_coupon is None
        
        # Verify order lines were created
        assert order.lines.count() == 2
        
        line1 = order.lines.get(product=product1)
        assert line1.quantity == 2
        assert line1.unit_price == Decimal('29.99')
        assert line1.line_total == Decimal('59.98')
        
        line2 = order.lines.get(product=product2)
        assert line2.quantity == 1
        assert line2.unit_price == Decimal('59.99')
        assert line2.line_total == Decimal('59.99')
        
        print("✓ Order creation without coupon works correctly")
    
    def test_complete_order_creation_with_coupon(self):
        """Test complete order creation workflow with coupon."""
        # Create a portal user (customer)
        customer = User.objects.create(
            email='customer2@example.com',
            role='portal',
            name='Jane Smith'
        )
        
        # Create product
        product = Product.objects.create(
            product_name='Hoodie',
            purchase_price=Decimal('40.00'),
            sales_price=Decimal('79.99'),
            current_stock=30,
            published=True
        )
        
        # Create discount offer
        offer = DiscountOffer.objects.create(
            name='Winter Sale',
            discount_percentage=Decimal('20.00'),
            start_date=timezone.now().date(),
            end_date=(timezone.now() + timedelta(days=30)).date()
        )
        
        # Create coupon
        coupon = Coupon.objects.create(
            code='WINTER20',
            discount_offer=offer,
            expiration_date=(timezone.now() + timedelta(days=30)).date(),
            status='active'
        )
        
        # Create order with coupon
        line_items = [
            {'product_id': product.id, 'quantity': 2}
        ]
        
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code='WINTER20'
        )
        
        # Verify order was created with coupon
        assert order is not None
        assert order.customer == customer
        assert order.status == 'draft'
        assert order.subtotal == Decimal('159.98')  # 79.99 * 2
        assert order.discount_amount == Decimal('32.00')  # 159.98 * 0.20, rounded
        assert order.total_amount == Decimal('127.98')  # 159.98 - 32.00
        assert order.applied_coupon == coupon
        
        # Verify coupon was assigned to customer
        coupon.refresh_from_db()
        assert coupon.contact == customer
        
        print("✓ Order creation with coupon works correctly")
    
    def test_order_status_transitions(self):
        """Test order status transitions work correctly."""
        # Create a portal user (customer)
        customer = User.objects.create(
            email='customer3@example.com',
            role='portal',
            name='Bob Johnson'
        )
        
        # Create product
        product = Product.objects.create(
            product_name='Jacket',
            purchase_price=Decimal('50.00'),
            sales_price=Decimal('99.99'),
            current_stock=20,
            published=True
        )
        
        # Create order
        line_items = [{'product_id': product.id, 'quantity': 1}]
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items
        )
        
        # Verify initial status
        assert order.status == 'draft'
        
        # Confirm order
        order.confirm()
        assert order.status == 'confirmed'
        
        # Cancel order
        order.cancel()
        assert order.status == 'cancelled'
        
        print("✓ Order status transitions work correctly")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
