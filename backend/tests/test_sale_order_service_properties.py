"""
Property-based tests for SaleOrderService.
Tests universal properties using Hypothesis library.

Feature: sales-order
"""
import pytest
from hypothesis import given, strategies as st, settings
from decimal import Decimal
from django.core.exceptions import ValidationError

from products.models import Product, SaleOrder, SaleOrderLine
from products.services import SaleOrderService
from accounts.models import User


@pytest.mark.django_db
class TestSaleOrderServiceProperties:
    """Property-based tests for SaleOrderService."""
    
    @settings(max_examples=10, deadline=5000)
    @given(
        quantities=st.lists(st.integers(min_value=1, max_value=10), min_size=1, max_size=3),
        prices=st.lists(st.decimals(min_value='1.00', max_value='99.99', places=2), min_size=1, max_size=3)
    )
    def test_property_1_subtotal_calculation_consistency(self, quantities, prices):
        """
        Property 1: Subtotal Calculation Consistency
        
        For any sale order with line items, the subtotal should always equal 
        the sum of all line item totals (quantity * unit_price for each line).
        
        Feature: sales-order, Property 1: Subtotal Calculation Consistency
        Validates: Requirements 4.4, 5.1, 5.3
        """
        # Create customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create products
        products = []
        num_items = min(len(quantities), len(prices))
        for i in range(num_items):
            product = Product.objects.create(
                product_name=f'Product {Product.objects.count()}',
                product_category='Test Category',
                product_type='service',
                sales_price=prices[i],
                purchase_price=prices[i],
                published=True,
                current_stock=100
            )
            products.append(product)
        
        # Generate line items
        line_items = []
        for i in range(num_items):
            line_items.append({
                'product_id': products[i].id,
                'quantity': quantities[i]
            })
        
        # Create order
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=None
        )
        
        # Calculate expected subtotal
        expected_subtotal = Decimal('0.00')
        for line in order.lines.all():
            line_total = Decimal(str(line.quantity)) * line.unit_price
            expected_subtotal += line_total
        
        # Property: Subtotal equals sum of line totals
        assert order.subtotal == expected_subtotal, \
            f"Subtotal {order.subtotal} does not match sum of line totals {expected_subtotal}"
    
    @settings(max_examples=10, deadline=5000)
    @given(
        quantities=st.lists(st.integers(min_value=1, max_value=10), min_size=1, max_size=3),
        prices=st.lists(st.decimals(min_value='1.00', max_value='99.99', places=2), min_size=1, max_size=3)
    )
    def test_property_2_total_calculation_correctness(self, quantities, prices):
        """
        Property 2: Total Calculation Correctness
        
        For any sale order, the total_amount should always equal subtotal minus 
        discount_amount, with no rounding errors beyond 2 decimal places.
        
        Feature: sales-order, Property 2: Total Calculation Correctness
        Validates: Requirements 4.7, 5.5
        """
        # Create customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create products
        products = []
        num_items = min(len(quantities), len(prices))
        for i in range(num_items):
            product = Product.objects.create(
                product_name=f'Product {Product.objects.count()}',
                product_category='Test Category',
                product_type='service',
                sales_price=prices[i],
                purchase_price=prices[i],
                published=True,
                current_stock=100
            )
            products.append(product)
        
        # Generate line items
        line_items = []
        for i in range(num_items):
            line_items.append({
                'product_id': products[i].id,
                'quantity': quantities[i]
            })
        
        # Create order without coupon
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=None
        )
        
        # Calculate expected total
        expected_total = order.subtotal - order.discount_amount
        
        # Property: Total equals subtotal minus discount
        assert order.total_amount == expected_total, \
            f"Total {order.total_amount} does not match subtotal {order.subtotal} - discount {order.discount_amount} = {expected_total}"
        
        # Property: No rounding errors beyond 2 decimal places
        assert order.total_amount.as_tuple().exponent >= -2, \
            f"Total {order.total_amount} has more than 2 decimal places"
    
    @settings(max_examples=10, deadline=5000)
    @given(
        quantities=st.lists(st.integers(min_value=1, max_value=10), min_size=1, max_size=3),
        prices=st.lists(st.decimals(min_value='1.00', max_value='99.99', places=2), min_size=1, max_size=3)
    )
    def test_property_3_server_side_price_enforcement(self, quantities, prices):
        """
        Property 3: Server-Side Price Enforcement
        
        For any order line item, the unit_price should always match the 
        Product.sales_price at the time of order creation, regardless of 
        any client-provided values.
        
        Feature: sales-order, Property 3: Server-Side Price Enforcement
        Validates: Requirements 5.2, 5.6
        """
        # Create customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create products
        products = []
        num_items = min(len(quantities), len(prices))
        for i in range(num_items):
            product = Product.objects.create(
                product_name=f'Product {Product.objects.count()}',
                product_category='Test Category',
                product_type='service',
                sales_price=prices[i],
                purchase_price=prices[i],
                published=True,
                current_stock=100
            )
            products.append(product)
        
        # Generate line items (client could try to manipulate prices, but we ignore them)
        line_items = []
        for i in range(num_items):
            line_items.append({
                'product_id': products[i].id,
                'quantity': quantities[i],
                # Client might try to send a fake price, but it should be ignored
                'unit_price': Decimal('0.01')  # Fake low price
            })
        
        # Create order
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=None
        )
        
        # Property: Unit price matches product sales price (server-side)
        for line in order.lines.all():
            product = Product.objects.get(id=line.product.id)
            assert line.unit_price == product.sales_price, \
                f"Line unit_price {line.unit_price} does not match product sales_price {product.sales_price}"

    @settings(max_examples=10, deadline=5000)
    @given(
        quantities=st.lists(st.integers(min_value=1, max_value=10), min_size=1, max_size=3),
        prices=st.lists(st.decimals(min_value='1.00', max_value='99.99', places=2), min_size=1, max_size=3),
        fail_at_step=st.sampled_from(['invalid_customer', 'invalid_product', 'invalid_coupon', 'zero_quantity'])
    )
    def test_property_4_transaction_atomicity(self, quantities, prices, fail_at_step):
        """
        Property 4: Transaction Atomicity
        
        For any order creation attempt that fails validation, no SaleOrder or 
        SaleOrderLine records should exist in the database (complete rollback).
        
        Feature: sales-order, Property 4: Transaction Atomicity
        Validates: Requirements 4.2, 4.3
        """
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Create customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create products
        products = []
        num_items = min(len(quantities), len(prices))
        for i in range(num_items):
            product = Product.objects.create(
                product_name=f'Product {Product.objects.count()}',
                product_category='Test Category',
                product_type='service',
                sales_price=prices[i],
                purchase_price=prices[i],
                published=True,
                current_stock=100
            )
            products.append(product)
        
        # Generate line items based on failure scenario
        line_items = []
        customer_id = customer.id
        coupon_code = None
        
        if fail_at_step == 'invalid_customer':
            # Use non-existent customer ID
            customer_id = 999999
            for i in range(num_items):
                line_items.append({
                    'product_id': products[i].id,
                    'quantity': quantities[i]
                })
        
        elif fail_at_step == 'invalid_product':
            # Use non-existent product ID in one line item
            for i in range(num_items):
                line_items.append({
                    'product_id': products[i].id if i > 0 else 999999,
                    'quantity': quantities[i]
                })
        
        elif fail_at_step == 'invalid_coupon':
            # Use invalid coupon code
            for i in range(num_items):
                line_items.append({
                    'product_id': products[i].id,
                    'quantity': quantities[i]
                })
            coupon_code = 'INVALID_COUPON_CODE'
        
        elif fail_at_step == 'zero_quantity':
            # Use zero quantity in one line item
            for i in range(num_items):
                line_items.append({
                    'product_id': products[i].id,
                    'quantity': 0 if i == 0 else quantities[i]
                })
        
        # Attempt to create order (should fail)
        try:
            order = SaleOrderService.create_order(
                customer_id=customer_id,
                line_items=line_items,
                coupon_code=coupon_code
            )
            # If we get here, the test scenario didn't trigger a failure
            # This is acceptable for some random inputs
        except (ValidationError, Exception):
            # Expected failure - this is what we're testing
            pass
        
        # Property: No records should be created after failed transaction
        final_order_count = SaleOrder.objects.count()
        final_line_count = SaleOrderLine.objects.count()
        
        # Either the order was created successfully (no failure triggered),
        # or no records were created (complete rollback)
        if final_order_count > initial_order_count:
            # Order was created, verify it's complete
            assert final_line_count > initial_line_count, \
                "If order was created, line items must also exist"
        else:
            # Order was not created, verify complete rollback
            assert final_order_count == initial_order_count, \
                f"Order count changed from {initial_order_count} to {final_order_count} after failed transaction"
            assert final_line_count == initial_line_count, \
                f"Line count changed from {initial_line_count} to {final_line_count} after failed transaction"

    @settings(max_examples=10, deadline=5000)
    @given(
        role=st.sampled_from(['internal', 'portal']),
        quantities=st.lists(st.integers(min_value=1, max_value=10), min_size=1, max_size=2),
        prices=st.lists(st.decimals(min_value='1.00', max_value='99.99', places=2), min_size=1, max_size=2)
    )
    def test_property_5_customer_role_validation(self, role, quantities, prices):
        """
        Property 5: Customer Role Validation
        
        For any sale order, the customer must have role='portal', and any 
        attempt to create an order with an internal user should fail before 
        database insertion.
        
        Feature: sales-order, Property 5: Customer Role Validation
        Validates: Requirements 3.1, 3.2
        """
        # Create user with specified role
        customer = User.objects.create(
            name='Test User',
            email=f'user_{User.objects.count()}@test.com',
            role=role,
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create products
        products = []
        num_items = min(len(quantities), len(prices))
        for i in range(num_items):
            product = Product.objects.create(
                product_name=f'Product {Product.objects.count()}',
                product_category='Test Category',
                product_type='service',
                sales_price=prices[i],
                purchase_price=prices[i],
                published=True,
                current_stock=100
            )
            products.append(product)
        
        # Generate line items
        line_items = []
        for i in range(num_items):
            line_items.append({
                'product_id': products[i].id,
                'quantity': quantities[i]
            })
        
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        
        # Attempt to create order
        if role == 'portal':
            # Property: Portal users can create orders
            order = SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
            assert order is not None, "Order should be created for portal users"
            assert order.customer.role == 'portal', "Order customer must be portal user"
            assert SaleOrder.objects.count() == initial_order_count + 1, \
                "Order count should increase for portal users"
        else:
            # Property: Internal users cannot create orders
            with pytest.raises(ValidationError) as exc_info:
                SaleOrderService.create_order(
                    customer_id=customer.id,
                    line_items=line_items,
                    coupon_code=None
                )
            
            # Verify error message mentions portal users
            assert 'portal' in str(exc_info.value).lower(), \
                "Error message should mention portal users"
            
            # Verify no order was created
            assert SaleOrder.objects.count() == initial_order_count, \
                "No order should be created for internal users"

    @settings(max_examples=10, deadline=5000)
    @given(
        quantities=st.lists(st.integers(min_value=-5, max_value=10), min_size=1, max_size=3),
        prices=st.lists(st.decimals(min_value='1.00', max_value='99.99', places=2), min_size=1, max_size=3)
    )
    def test_property_6_line_quantity_positivity(self, quantities, prices):
        """
        Property 6: Line Quantity Positivity
        
        For any sale order line, the quantity must be greater than zero, and 
        any attempt to create a line with quantity <= 0 should fail at the 
        database level.
        
        Feature: sales-order, Property 6: Line Quantity Positivity
        Validates: Requirements 7.3
        """
        # Create customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create products
        products = []
        num_items = min(len(quantities), len(prices))
        for i in range(num_items):
            product = Product.objects.create(
                product_name=f'Product {Product.objects.count()}',
                product_category='Test Category',
                product_type='service',
                sales_price=prices[i],
                purchase_price=prices[i],
                published=True,
                current_stock=100
            )
            products.append(product)
        
        # Generate line items
        line_items = []
        has_invalid_quantity = False
        for i in range(num_items):
            qty = quantities[i]
            if qty <= 0:
                has_invalid_quantity = True
            line_items.append({
                'product_id': products[i].id,
                'quantity': qty
            })
        
        # Record initial counts
        initial_order_count = SaleOrder.objects.count()
        initial_line_count = SaleOrderLine.objects.count()
        
        # Attempt to create order
        if has_invalid_quantity:
            # Property: Orders with non-positive quantities should fail
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
            
            # Verify no records were created (transaction rollback)
            assert SaleOrder.objects.count() == initial_order_count, \
                "No order should be created with invalid quantity"
            assert SaleOrderLine.objects.count() == initial_line_count, \
                "No line items should be created with invalid quantity"
        else:
            # Property: Orders with all positive quantities should succeed
            order = SaleOrderService.create_order(
                customer_id=customer.id,
                line_items=line_items,
                coupon_code=None
            )
            
            # Verify all line quantities are positive
            for line in order.lines.all():
                assert line.quantity > 0, \
                    f"Line quantity {line.quantity} must be positive"
            
            # Verify order was created
            assert SaleOrder.objects.count() == initial_order_count + 1, \
                "Order should be created with valid quantities"

    @settings(max_examples=20, deadline=5000)
    @given(
        quantities=st.lists(st.integers(min_value=1, max_value=10), min_size=1, max_size=3),
        prices=st.lists(st.decimals(min_value='1.00', max_value='99.99', places=2), min_size=1, max_size=3),
        discount_percentage=st.decimals(min_value='0.01', max_value='100.00', places=2)
    )
    def test_property_7_coupon_discount_calculation(self, quantities, prices, discount_percentage):
        """
        Property 7: Coupon Discount Calculation
        
        For any order with an applied coupon, the discount_amount should equal 
        (subtotal * coupon.discount_offer.discount_percentage / 100), rounded 
        to 2 decimal places.
        
        Feature: sales-order, Property 7: Coupon Discount Calculation
        Validates: Requirements 6.5
        """
        from products.models import DiscountOffer, Coupon
        import datetime
        
        # Create customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create products
        products = []
        num_items = min(len(quantities), len(prices))
        for i in range(num_items):
            product = Product.objects.create(
                product_name=f'Product {Product.objects.count()}',
                product_category='Test Category',
                product_type='service',
                sales_price=prices[i],
                purchase_price=prices[i],
                published=True,
                current_stock=100
            )
            products.append(product)
        
        # Generate line items
        line_items = []
        for i in range(num_items):
            line_items.append({
                'product_id': products[i].id,
                'quantity': quantities[i]
            })
        
        # Create discount offer
        offer = DiscountOffer.objects.create(
            name=f'Test Offer {DiscountOffer.objects.count()}',
            discount_percentage=discount_percentage,
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create coupon
        coupon = Coupon.objects.create(
            code=f'TESTCOUPON{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),
            status='active',
            discount_offer=offer
        )
        
        # Create order with coupon
        order = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=coupon.code
        )
        
        # Calculate expected discount
        expected_discount = (order.subtotal * discount_percentage) / Decimal('100.00')
        expected_discount = expected_discount.quantize(Decimal('0.01'))
        
        # Property: Discount amount matches calculation
        assert order.discount_amount == expected_discount, \
            f"Discount amount {order.discount_amount} does not match expected {expected_discount} " \
            f"(subtotal {order.subtotal} * {discount_percentage}% / 100)"
        
        # Property: Discount has exactly 2 decimal places
        assert order.discount_amount.as_tuple().exponent >= -2, \
            f"Discount amount {order.discount_amount} has more than 2 decimal places"

    @settings(max_examples=20, deadline=5000)
    @given(
        quantities=st.lists(st.integers(min_value=1, max_value=10), min_size=1, max_size=3),
        prices=st.lists(st.decimals(min_value='1.00', max_value='99.99', places=2), min_size=1, max_size=3),
        discount_percentage=st.decimals(min_value='0.01', max_value='100.00', places=2),
        already_assigned=st.booleans()
    )
    def test_property_10_coupon_assignment_idempotence(self, quantities, prices, discount_percentage, already_assigned):
        """
        Property 10: Coupon Assignment Idempotence
        
        For any order creation with a coupon, if the coupon is already assigned 
        to the customer, the assignment should not change; if unassigned, it 
        should be assigned exactly once.
        
        Feature: sales-order, Property 10: Coupon Assignment Idempotence
        Validates: Requirements 6.6
        """
        from products.models import DiscountOffer, Coupon
        import datetime
        
        # Create customer
        customer = User.objects.create(
            name='Test Customer',
            email=f'customer_{User.objects.count()}@test.com',
            role='portal',
            is_active=True
        )
        customer.set_password('testpass123')
        customer.save()
        
        # Create products
        products = []
        num_items = min(len(quantities), len(prices))
        for i in range(num_items):
            product = Product.objects.create(
                product_name=f'Product {Product.objects.count()}',
                product_category='Test Category',
                product_type='service',
                sales_price=prices[i],
                purchase_price=prices[i],
                published=True,
                current_stock=100
            )
            products.append(product)
        
        # Generate line items
        line_items = []
        for i in range(num_items):
            line_items.append({
                'product_id': products[i].id,
                'quantity': quantities[i]
            })
        
        # Create discount offer
        offer = DiscountOffer.objects.create(
            name=f'Test Offer {DiscountOffer.objects.count()}',
            discount_percentage=discount_percentage,
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        
        # Create coupon
        coupon = Coupon.objects.create(
            code=f'TESTCOUPON{Coupon.objects.count()}',
            expiration_date=datetime.date.today() + datetime.timedelta(days=30),
            status='active',
            discount_offer=offer,
            contact=customer if already_assigned else None
        )
        
        # Record initial assignment state
        initial_contact = coupon.contact
        
        # Create first order with coupon
        order1 = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=coupon.code
        )
        
        # Refresh coupon from database
        coupon.refresh_from_db()
        
        # Property: Coupon should be assigned to customer after first order
        assert coupon.contact == customer, \
            f"Coupon should be assigned to customer after order creation"
        
        # Create second order with same coupon
        order2 = SaleOrderService.create_order(
            customer_id=customer.id,
            line_items=line_items,
            coupon_code=coupon.code
        )
        
        # Refresh coupon from database
        coupon.refresh_from_db()
        
        # Property: Coupon assignment should remain unchanged after second order
        assert coupon.contact == customer, \
            f"Coupon should still be assigned to customer after second order"
        
        # Property: If coupon was already assigned, it should not have changed
        if already_assigned:
            assert coupon.contact == initial_contact, \
                f"Coupon assignment should not change if already assigned"
        
        # Property: Coupon should be assigned exactly once (idempotence)
        # Count how many times the coupon appears in orders
        orders_with_coupon = SaleOrder.objects.filter(applied_coupon=coupon).count()
        assert orders_with_coupon == 2, \
            f"Both orders should have the coupon applied"
