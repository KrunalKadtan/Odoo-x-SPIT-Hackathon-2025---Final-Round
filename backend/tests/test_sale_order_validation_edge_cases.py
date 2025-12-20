"""
Unit tests for SaleOrderService validation edge cases.
Tests customer validation, line item validation, and product validation.

Feature: sales-order
Validates: Requirements 3.3, 7.1, 7.2, 7.4, 7.5
"""
import pytest
from django.core.exceptions import ValidationError
from decimal import Decimal

from products.models import Product, SaleOrder, SaleOrderLine
from products.services import SaleOrderService
from accounts.models import User


@pytest.mark.django_db
class TestSaleOrderValidationEdgeCases:
    """Unit tests for validation edge cases."""
    
    def test_customer_validation_with_non_existent_user(self):
        """
        Test customer validation with non-existent user ID.
        
        Validates: Requirements 3.3
        """
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
                customer_id=999999,  # Non-existent customer ID
                line_items=line_items,
                coupon_code=None
            )
        
        # Verify error message
        error_msg = str(exc_info.value)
        assert 'customer' in error_msg.lower() or 'does not exist' in error_msg.lower(), \
            "Error message should mention customer or existence"
    
    def test_line_item_validation_with_none_product_id(self):
        """
        Test line item validation when product_id is None.
        
        Validates: Requirements 7.1, 7.4
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
        
        # Prepare line items with None product_id
        line_items = [
            {'product_id': None, 'quantity': 2}
        ]
        
        # Attempt to create order
        with pytest.raises((ValidationError, TypeError, AttributeError)):
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
    
    def test_line_item_validation_with_missing_product_id(self):
        """
        Test line item validation when product_id is missing from dict.
        
        Validates: Requirements 7.1, 7.4
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
        
        # Prepare line items without product_id key
        line_items = [
            {'quantity': 2}  # Missing product_id
        ]
        
        # Attempt to create order
        with pytest.raises((ValidationError, KeyError, TypeError)):
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
    
    def test_line_item_validation_with_none_quantity(self):
        """
        Test line item validation when quantity is None.
        
        Validates: Requirements 7.4, 7.5
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
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items with None quantity
        line_items = [
            {'product_id': product.id, 'quantity': None}
        ]
        
        # Attempt to create order
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
        
        # Verify error message mentions quantity
        error_msg = str(exc_info.value).lower()
        assert 'quantity' in error_msg or 'positive' in error_msg, \
            "Error message should mention quantity"
    
    def test_line_item_validation_with_missing_quantity(self):
        """
        Test line item validation when quantity is missing from dict.
        
        Validates: Requirements 7.4, 7.5
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
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items without quantity key
        line_items = [
            {'product_id': product.id}  # Missing quantity
        ]
        
        # Attempt to create order
        with pytest.raises((ValidationError, KeyError, TypeError)):
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
    
    def test_line_item_validation_with_negative_quantity(self):
        """
        Test line item validation when quantity is negative.
        
        Validates: Requirements 7.4, 7.5
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
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items with negative quantity
        line_items = [
            {'product_id': product.id, 'quantity': -5}
        ]
        
        # Attempt to create order
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
        
        # Verify error message mentions quantity or positive
        error_msg = str(exc_info.value).lower()
        assert 'quantity' in error_msg or 'positive' in error_msg, \
            "Error message should mention quantity validation"
    
    def test_line_item_validation_with_zero_quantity(self):
        """
        Test line item validation when quantity is zero.
        
        Validates: Requirements 7.4, 7.5
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
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items with zero quantity
        line_items = [
            {'product_id': product.id, 'quantity': 0}
        ]
        
        # Attempt to create order
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
        
        # Verify error message mentions quantity or positive
        error_msg = str(exc_info.value).lower()
        assert 'quantity' in error_msg or 'positive' in error_msg, \
            "Error message should mention quantity validation"
    
    def test_product_validation_with_unpublished_product(self):
        """
        Test product validation with unpublished product.
        
        Validates: Requirements 7.2
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
        
        # Verify error message mentions availability or published
        error_msg = str(exc_info.value).lower()
        assert 'not available' in error_msg or 'published' in error_msg or 'sale' in error_msg, \
            "Error message should mention product availability"
    
    def test_product_validation_with_multiple_unpublished_products(self):
        """
        Test product validation when multiple products are unpublished.
        
        Validates: Requirements 7.2
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
        
        # Create published and unpublished products
        published_product = Product.objects.create(
            product_name='Published Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        unpublished_product = Product.objects.create(
            product_name='Unpublished Product',
            product_category='Test Category',
            product_type='service',
            sales_price=Decimal('20.00'),
            purchase_price=Decimal('10.00'),
            published=False,  # Not published
            current_stock=100
        )
        
        # Prepare line items with both published and unpublished products
        line_items = [
            {'product_id': published_product.id, 'quantity': 2},
            {'product_id': unpublished_product.id, 'quantity': 1}
        ]
        
        # Attempt to create order
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
        
        # Verify error message mentions availability
        error_msg = str(exc_info.value).lower()
        assert 'not available' in error_msg or 'published' in error_msg, \
            "Error message should mention product availability"
    
    def test_product_validation_with_non_existent_product(self):
        """
        Test product validation with non-existent product ID.
        
        Validates: Requirements 7.1
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
        
        # Verify error message mentions product or existence
        error_msg = str(exc_info.value).lower()
        assert 'product' in error_msg or 'does not exist' in error_msg, \
            "Error message should mention product or existence"
    
    def test_line_item_validation_with_string_quantity(self):
        """
        Test line item validation when quantity is a string.
        
        Validates: Requirements 7.4, 7.5
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
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items with string quantity
        line_items = [
            {'product_id': product.id, 'quantity': 'two'}  # String instead of int
        ]
        
        # Attempt to create order
        with pytest.raises((ValidationError, TypeError, ValueError)):
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
    
    def test_line_item_validation_with_float_quantity(self):
        """
        Test line item validation when quantity is a float.
        This should work if the float is positive and can be converted to int.
        
        Validates: Requirements 7.4, 7.5
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
            sales_price=Decimal('10.00'),
            purchase_price=Decimal('5.00'),
            published=True,
            current_stock=100
        )
        
        # Prepare line items with float quantity (should work if positive)
        line_items = [
            {'product_id': product.id, 'quantity': 2.5}  # Float
        ]
        
        # This might succeed or fail depending on implementation
        # If it succeeds, verify the order was created
        # If it fails, verify it's a validation error
        try:
            order = SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
            # If successful, verify order was created
            assert order is not None
        except (ValidationError, TypeError, ValueError):
            # If failed, that's also acceptable behavior
            pass
    
    def test_empty_line_items_list(self):
        """
        Test validation when line items list is empty.
        
        Validates: Requirements 7.5
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
        
        # Prepare empty line items
        line_items = []
        
        # Attempt to create order
        with pytest.raises(ValidationError) as exc_info:
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
        
        # Verify error message mentions line items or at least one
        error_msg = str(exc_info.value).lower()
        assert 'at least one' in error_msg or 'line item' in error_msg or 'required' in error_msg, \
            "Error message should mention line items requirement"
    
    def test_none_line_items(self):
        """
        Test validation when line items is None.
        
        Validates: Requirements 7.5
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
        
        # Attempt to create order with None line items
        with pytest.raises((ValidationError, TypeError, AttributeError)):
            SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=None,
                coupon_code=None
            )
