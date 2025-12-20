"""
Unit tests for SaleOrderService.
Tests specific examples and edge cases.

Feature: sales-order
"""
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from decimal import Decimal
import datetime

from products.models import Product, SaleOrder, SaleOrderLine, Coupon, DiscountOffer
from products.services import SaleOrderService
from accounts.models import User


@pytest.mark.django_db
class TestSaleOrderServiceTransactionRollback:
    """Unit tests for transaction rollback behavior."""
    
    def test_rollback_on_invalid_customer(self):
        """
        Test that failed order creation leaves no records when customer is invalid.
        
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 2}
        ]
        
        # Attempt to create order with non-existent customer
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=999999,  # Non-existent customer
                line_items=line_items,
                coupon_code=None
            )
        
        assert 'does not exist' in str(exc_info.value)
        
        # Verify no records were created (complete rollback)
        assert SaleOrder.objects.count() == initial_order_count, \
            "Order should not be created after failed transaction"
        assert SaleOrderLine.objects.count() == initial_line_count, \
            "Order lines should not be created after failed transaction"
    
    def test_rollback_on_internal_user_as_customer(self):
        """
        Test that failed order creation leaves no records when internal user is used as customer.
        
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create an internal user (not allowed as customer)
        internal_user = User.objects.create(
            name='Internal Staff',
            email=f'staff_{User.objects.count()}@test.com',
            role='internal',
            is_active=True,
            is_staff=True
        )
        internal_user.set_password('testpass123')
        internal_user.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 2}
        ]
        
        # Attempt to create order with internal user as customer
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=internal_user.id,
                line_items=line_items,
                coupon_code=None
            )
        
        assert 'portal' in str(exc_info.value).lower()
        
        # Verify no records were created (complete rollback)
        assert SaleOrder.objects.count() == initial_order_count, \
            "Order should not be created after failed transaction"
        assert SaleOrderLine.objects.count() == initial_line_count, \
            "Order lines should not be created after failed transaction"
    
    def test_rollback_on_invalid_line_item_product(self):
        """
        Test that failed order creation leaves no records when line item has invalid product.
        
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Prepare line items with non-existent product
        line_items = [
            {'product_id': 999999, 'quantity': 2}  # Non-existent product
        ]
        
        # Attempt to create order
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
        
        assert 'does not exist' in str(exc_info.value)
        
        # Verify no records were created (complete rollback)
        assert SaleOrder.objects.count() == initial_order_count, \
            "Order should not be created after failed transaction"
        assert SaleOrderLine.objects.count() == initial_line_count, \
            "Order lines should not be created after failed transaction"
    
    def test_rollback_on_unpublished_product(self):
        """
        Test that failed order creation leaves no records when product is unpublished.
        
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create an unpublished product
        product = Product.objects.create(
            product_name='Unpublished Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=False,  # Not published
            current_stock=100
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 2}
        ]
        
        # Attempt to create order
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
        
        assert 'not available' in str(exc_info.value).lower()
        
        # Verify no records were created (complete rollback)
        assert SaleOrder.objects.count() == initial_order_count, \
            "Order should not be created after failed transaction"
        assert SaleOrderLine.objects.count() == initial_line_count, \
            "Order lines should not be created after failed transaction"
    
    def test_rollback_on_invalid_coupon(self):
        """
        Test that failed order creation leaves no records when coupon is invalid.
        
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 2}
        ]
        
        # Attempt to create order with invalid coupon
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code='INVALID_COUPON'  # Non-existent coupon
            )
        
        assert 'coupon' in str(exc_info.value).lower()
        
        # Verify no records were created (complete rollback)
        assert SaleOrder.objects.count() == initial_order_count, \
            "Order should not be created after failed transaction"
        assert SaleOrderLine.objects.count() == initial_line_count, \
            "Order lines should not be created after failed transaction"
    
    def test_rollback_on_inactive_offer(self):
        """
        Test that failed order creation leaves no records when coupon's offer is not active.
        
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Create an offer that's not active today (ended yesterday)
        offer = DiscountOffer.objects.create(
            name=f'Inactive Offer {DiscountOffer.objects.count()}',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today() - datetime.timedelta(days=10),
            end_date=datetime.date.today() - datetime.timedelta(days=1)  # Ended yesterday
        )
        
        # Create coupon with future expiration but inactive offer
        coupon = Coupon.objects.create(
            code=f'INACTIVE{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),  # Future date
            status='active',
            discount_offer=offer
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 2}
        ]
        
        # Attempt to create order with coupon whose offer is not active
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=coupon.code
            )
        
        assert 'not active' in str(exc_info.value).lower() or 'invalid' in str(exc_info.value).lower()
        
        # Verify no records were created (complete rollback)
        assert SaleOrder.objects.count() == initial_order_count, \
            "Order should not be created after failed transaction"
        assert SaleOrderLine.objects.count() == initial_line_count, \
            "Order lines should not be created after failed transaction"
    
    def test_rollback_on_database_constraint_violation(self):
        """
        Test that failed order creation leaves no records on database constraint violation.
        
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items with zero quantity (violates CHECK constraint)
        line_items = [
            {'product_id': product.id, 'quantity': 0}  # Zero quantity violates constraint
        ]
        
        # Attempt to create order
        with pytest.raises(ValidationError):
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
        
        # Verify no records were created (complete rollback)
        assert SaleOrder.objects.count() == initial_order_count, \
            "Order should not be created after failed transaction"
        assert SaleOrderLine.objects.count() == initial_line_count, \
            "Order lines should not be created after failed transaction"
    
    def test_rollback_on_empty_line_items(self):
        """
        Test that failed order creation leaves no records when line items are empty.
        
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Prepare empty line items
        line_items = []
        
        # Attempt to create order
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
        
        assert 'at least one' in str(exc_info.value).lower()
        
        # Verify no records were created (complete rollback)
        assert SaleOrder.objects.count() == initial_order_count, \
            "Order should not be created after failed transaction"
        assert SaleOrderLine.objects.count() == initial_line_count, \
            "Order lines should not be created after failed transaction"
    
    def test_successful_order_creates_all_records(self):
        """
        Test that successful order creation creates both order and line records.
        This is a positive test to verify the transaction works correctly.
        
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create valid products
        product1 = Product.objects.create(
            product_name='Product 1',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        product2 = Product.objects.create(
            product_name='Product 2',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('20.00'),
            purchase_price=Decimal('10.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product1.id, 'quantity': 2},
            {'product_id': product2.id, 'quantity': 3}
        ]
        
        # Create order
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=None
        )
        
        # Verify records were created
        assert SaleOrder.objects.count() == initial_order_count + 1, \
            "Order should be created"
        assert SaleOrderLine.objects.count() == initial_line_count + 2, \
            "Two order lines should be created"
        
        # Verify order has correct number of lines
        assert order.lines.count() == 2, \
            "Order should have 2 line items"



@pytest.mark.django_db
class TestSaleOrderServiceCouponApplication:
    """Unit tests for coupon application in order creation."""
    
    def test_coupon_validation_through_service(self):
        """
        Test that coupon validation uses CouponValidationService.
        
        Validates: Requirements 6.1, 6.2, 6.3
        """
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('100.00'),
            purchase_price=Decimal('50.00'),
            published=True,
            current_stock=100
        )
        
        # Create discount offer
        offer = DiscountOffer.objects.create(
            name=f'Test Offer {DiscountOffer.objects.count()}',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create valid coupon
        coupon = Coupon.objects.create(
            code=f'VALID{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),
            status='active',
            discount_offer=offer
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 1}
        ]
        
        # Create order with valid coupon
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=coupon.code
        )
        
        # Verify coupon was applied
        assert order.applied_coupon == coupon, \
            "Valid coupon should be applied to order"
        assert order.discount_amount > Decimal('0.00'), \
            "Discount amount should be greater than zero"
    
    def test_discount_calculation_with_10_percent(self):
        """
        Test discount calculation with 10% coupon.
        
        Validates: Requirements 6.4, 6.5
        """
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('100.00'),
            purchase_price=Decimal('50.00'),
            published=True,
            current_stock=100
        )
        
        # Create discount offer with 10%
        offer = DiscountOffer.objects.create(
            name=f'10% Off {DiscountOffer.objects.count()}',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create coupon
        coupon = Coupon.objects.create(
            code=f'TEN{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),
            status='active',
            discount_offer=offer
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 2}  # 2 * 100 = 200
        ]
        
        # Create order with coupon
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=coupon.code
        )
        
        # Verify calculations
        assert order.subtotal == Decimal('200.00'), \
            "Subtotal should be 200.00"
        assert order.discount_amount == Decimal('20.00'), \
            "Discount should be 10% of 200.00 = 20.00"
        assert order.total_amount == Decimal('180.00'), \
            "Total should be 200.00 - 20.00 = 180.00"
    
    def test_discount_calculation_with_25_percent(self):
        """
        Test discount calculation with 25% coupon.
        
        Validates: Requirements 6.4, 6.5
        """
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('80.00'),
            purchase_price=Decimal('40.00'),
            published=True,
            current_stock=100
        )
        
        # Create discount offer with 25%
        offer = DiscountOffer.objects.create(
            name=f'25% Off {DiscountOffer.objects.count()}',
            discount_percentage=Decimal('25.00'),
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create coupon
        coupon = Coupon.objects.create(
            code=f'QUARTER{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),
            status='active',
            discount_offer=offer
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 5}  # 5 * 80 = 400
        ]
        
        # Create order with coupon
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=coupon.code
        )
        
        # Verify calculations
        assert order.subtotal == Decimal('400.00'), \
            "Subtotal should be 400.00"
        assert order.discount_amount == Decimal('100.00'), \
            "Discount should be 25% of 400.00 = 100.00"
        assert order.total_amount == Decimal('300.00'), \
            "Total should be 400.00 - 100.00 = 300.00"
    
    def test_discount_calculation_with_fractional_percentage(self):
        """
        Test discount calculation with fractional percentage (e.g., 15.50%).
        
        Validates: Requirements 6.4, 6.5
        """
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('50.00'),
            purchase_price=Decimal('25.00'),
            published=True,
            current_stock=100
        )
        
        # Create discount offer with 15.50%
        offer = DiscountOffer.objects.create(
            name=f'15.5% Off {DiscountOffer.objects.count()}',
            discount_percentage=Decimal('15.50'),
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create coupon
        coupon = Coupon.objects.create(
            code=f'FRAC{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),
            status='active',
            discount_offer=offer
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 3}  # 3 * 50 = 150
        ]
        
        # Create order with coupon
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=coupon.code
        )
        
        # Verify calculations
        expected_discount = (Decimal('150.00') * Decimal('15.50')) / Decimal('100.00')
        expected_discount = expected_discount.quantize(Decimal('0.01'))
        
        assert order.subtotal == Decimal('150.00'), \
            "Subtotal should be 150.00"
        assert order.discount_amount == expected_discount, \
            f"Discount should be 15.5% of 150.00 = {expected_discount}"
        assert order.total_amount == Decimal('150.00') - expected_discount, \
            f"Total should be 150.00 - {expected_discount}"
    
    def test_coupon_assignment_to_customer_first_time(self):
        """
        Test that coupon is assigned to customer when not already assigned.
        
        Validates: Requirements 6.6
        """
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('100.00'),
            purchase_price=Decimal('50.00'),
            published=True,
            current_stock=100
        )
        
        # Create discount offer
        offer = DiscountOffer.objects.create(
            name=f'Test Offer {DiscountOffer.objects.count()}',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create coupon without contact assignment
        coupon = Coupon.objects.create(
            code=f'UNASSIGNED{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),
            status='active',
            discount_offer=offer,
            contact=None  # Not assigned to anyone
        )
        
        # Verify coupon is not assigned
        assert coupon.contact is None, \
            "Coupon should not be assigned initially"
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 1}
        ]
        
        # Create order with coupon
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=coupon.code
        )
        
        # Refresh coupon from database
        coupon.refresh_from_db()
        
        # Verify coupon is now assigned to customer
        assert coupon.contact == customer, \
            "Coupon should be assigned to customer after order creation"
    
    def test_coupon_assignment_when_already_assigned(self):
        """
        Test that coupon assignment doesn't change when already assigned to customer.
        
        Validates: Requirements 6.6
        """
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('100.00'),
            purchase_price=Decimal('50.00'),
            published=True,
            current_stock=100
        )
        
        # Create discount offer
        offer = DiscountOffer.objects.create(
            name=f'Test Offer {DiscountOffer.objects.count()}',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create coupon already assigned to customer
        coupon = Coupon.objects.create(
            code=f'ASSIGNED{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),
            status='active',
            discount_offer=offer,
            contact=customer  # Already assigned
        )
        
        # Verify coupon is assigned
        assert coupon.contact == customer, \
            "Coupon should be assigned to customer initially"
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 1}
        ]
        
        # Create order with coupon
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=coupon.code
        )
        
        # Refresh coupon from database
        coupon.refresh_from_db()
        
        # Verify coupon is still assigned to same customer
        assert coupon.contact == customer, \
            "Coupon should remain assigned to customer after order creation"
    
    def test_invalid_coupon_code_raises_error(self):
        """
        Test that invalid coupon code raises ValidationError.
        
        Validates: Requirements 6.1, 6.2, 6.3
        """
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('100.00'),
            purchase_price=Decimal('50.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 1}
        ]
        
        # Attempt to create order with invalid coupon
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code='NONEXISTENT'
            )
        
        # Verify error message mentions coupon
        assert 'coupon' in str(exc_info.value).lower(), \
            "Error message should mention coupon"
    
    def test_expired_coupon_raises_error(self):
        """
        Test that expired coupon raises ValidationError.
        
        Validates: Requirements 6.1, 6.2, 6.3
        """
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('100.00'),
            purchase_price=Decimal('50.00'),
            published=True,
            current_stock=100
        )
        
        # Create discount offer
        offer = DiscountOffer.objects.create(
            name=f'Test Offer {DiscountOffer.objects.count()}',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today() - datetime.timedelta(days=60),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create coupon with future expiration, then manually update to past date
        # (bypassing the clean() validation to simulate an expired coupon)
        coupon = Coupon(
            code=f'EXPIRED{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),  # Future date initially
            status='active',
            discount_offer=offer
        )
        coupon.save()
        
        # Manually update expiration date to past (bypassing validation)
        Coupon.objects.filter(id=coupon.id).update(
            expiration_date=datetime.date.today() - datetime.timedelta(days=1)
        )
        coupon.refresh_from_db()
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 1}
        ]
        
        # Attempt to create order with expired coupon
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=coupon.code
            )
        
        # Verify error message mentions expiration
        error_msg = str(exc_info.value).lower()
        assert 'expired' in error_msg or 'invalid' in error_msg, \
            "Error message should mention expiration or invalid coupon"
    
    def test_inactive_coupon_raises_error(self):
        """
        Test that inactive coupon (status != 'active') raises ValidationError.
        
        Validates: Requirements 6.1, 6.2, 6.3
        """
        # Create a valid customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create a valid product
        product = Product.objects.create(
            product_name='Test Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('100.00'),
            purchase_price=Decimal('50.00'),
            published=True,
            current_stock=100
        )
        
        # Create discount offer
        offer = DiscountOffer.objects.create(
            name=f'Test Offer {DiscountOffer.objects.count()}',
            discount_percentage=Decimal('10.00'),
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create inactive coupon
        coupon = Coupon.objects.create(
            code=f'USED{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),
            status='used',  # Not active
            discount_offer=offer
        )
        
        # Prepare line items
        line_items = [
            {'product_id': product.id, 'quantity': 1}
        ]
        
        # Attempt to create order with inactive coupon
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=coupon.code
            )
        
        # Verify error message mentions status or invalid
        error_msg = str(exc_info.value).lower()
        assert 'used' in error_msg or 'invalid' in error_msg, \
            "Error message should mention coupon status or invalid"
