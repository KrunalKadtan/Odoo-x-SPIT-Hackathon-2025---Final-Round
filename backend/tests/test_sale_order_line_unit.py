"""
Unit tests for SaleOrderLine model.
Tests specific examples, edge cases, and model behaviors.
"""
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from decimal import Decimal
from products.models import SaleOrder, SaleOrderLine, Product
from accounts.models import User


@pytest.mark.django_db
class TestSaleOrderLineModel:
    """Unit tests for SaleOrderLine model creation and validation."""
    
    def test_sale_order_line_creation_with_valid_data(self):
        """Test creating a sale order line with all valid data."""
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
            total_amount=Decimal('100.00')
        )
        
        # Create a product
        product = Product.objects.create(
            product_name="Test Product",
            product_category="Test Category",
            product_type="storable",
            sales_price=Decimal('50.00'),
            purchase_price=Decimal('30.00'),
            published=True
        )
        
        # Create a sale order line
        line = SaleOrderLine.objects.create(
            order=order,
            product=product,
            quantity=2,
            unit_price=Decimal('50.00'),
            line_total=Decimal('100.00')
        )
        
        assert line.order == order
        assert line.product == product
        assert line.quantity == 2
        assert line.unit_price == Decimal('50.00')
        assert line.line_total == Decimal('100.00')
    
    def test_sale_order_line_quantity_validation_positive(self):
        """Test that positive quantities are accepted."""
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
        
        product = Product.objects.create(
            product_name="Test Product",
            product_category="Test Category",
            product_type="storable",
            sales_price=Decimal('50.00'),
            purchase_price=Decimal('30.00'),
            published=True
        )
        
        # Positive quantity should succeed
        line = SaleOrderLine.objects.create(
            order=order,
            product=product,
            quantity=5,
            unit_price=Decimal('50.00'),
            line_total=Decimal('250.00')
        )
        assert line.quantity == 5
    
    def test_sale_order_line_quantity_validation_zero(self):
        """Test that zero quantity is rejected."""
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
        
        product = Product.objects.create(
            product_name="Test Product",
            product_category="Test Category",
            product_type="storable",
            sales_price=Decimal('50.00'),
            purchase_price=Decimal('30.00'),
            published=True
        )
        
        # Zero quantity should fail
        with pytest.raises((ValidationError, IntegrityError)):
            SaleOrderLine.objects.create(
                order=order,
                product=product,
                quantity=0,
                unit_price=Decimal('50.00'),
                line_total=Decimal('0.00')
            )
    
    def test_sale_order_line_quantity_validation_negative(self):
        """Test that negative quantity is rejected."""
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
        
        product = Product.objects.create(
            product_name="Test Product",
            product_category="Test Category",
            product_type="storable",
            sales_price=Decimal('50.00'),
            purchase_price=Decimal('30.00'),
            published=True
        )
        
        # Negative quantity should fail
        with pytest.raises((ValidationError, IntegrityError)):
            SaleOrderLine.objects.create(
                order=order,
                product=product,
                quantity=-1,
                unit_price=Decimal('50.00'),
                line_total=Decimal('-50.00')
            )
    
    def test_sale_order_line_calculate_line_total_method(self):
        """Test calculate_line_total() method returns correct value."""
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
        
        product = Product.objects.create(
            product_name="Test Product",
            product_category="Test Category",
            product_type="storable",
            sales_price=Decimal('50.00'),
            purchase_price=Decimal('30.00'),
            published=True
        )
        
        line = SaleOrderLine.objects.create(
            order=order,
            product=product,
            quantity=3,
            unit_price=Decimal('25.50'),
            line_total=Decimal('76.50')
        )
        
        calculated_total = line.calculate_line_total()
        assert calculated_total == Decimal('76.50')
        assert calculated_total == Decimal('3') * Decimal('25.50')
    
    def test_sale_order_line_calculate_line_total_method_different_values(self):
        """Test calculate_line_total() with different quantity and price."""
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
        
        product = Product.objects.create(
            product_name="Test Product",
            product_category="Test Category",
            product_type="storable",
            sales_price=Decimal('50.00'),
            purchase_price=Decimal('30.00'),
            published=True
        )
        
        line = SaleOrderLine.objects.create(
            order=order,
            product=product,
            quantity=10,
            unit_price=Decimal('99.99'),
            line_total=Decimal('999.90')
        )
        
        calculated_total = line.calculate_line_total()
        assert calculated_total == Decimal('999.90')
    
    def test_sale_order_line_str_method(self):
        """Test __str__ method returns order ID, product name, and quantity."""
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
        
        product = Product.objects.create(
            product_name="Test Product",
            product_category="Test Category",
            product_type="storable",
            sales_price=Decimal('50.00'),
            purchase_price=Decimal('30.00'),
            published=True
        )
        
        line = SaleOrderLine.objects.create(
            order=order,
            product=product,
            quantity=2,
            unit_price=Decimal('50.00'),
            line_total=Decimal('100.00')
        )
        
        expected = f"Order #{order.id} - Test Product x 2"
        assert str(line) == expected
    
    def test_sale_order_line_order_foreign_key_required(self):
        """Test that order field is required."""
        product = Product.objects.create(
            product_name="Test Product",
            product_category="Test Category",
            product_type="storable",
            sales_price=Decimal('50.00'),
            purchase_price=Decimal('30.00'),
            published=True
        )
        
        # Attempt to create line without order
        with pytest.raises((IntegrityError, ValidationError)):
            SaleOrderLine.objects.create(
                product=product,
                quantity=2,
                unit_price=Decimal('50.00'),
                line_total=Decimal('100.00')
            )
    
    def test_sale_order_line_product_foreign_key_required(self):
        """Test that product field is required."""
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
        
        # Attempt to create line without product
        with pytest.raises((IntegrityError, ValidationError)):
            SaleOrderLine.objects.create(
                order=order,
                quantity=2,
                unit_price=Decimal('50.00'),
                line_total=Decimal('100.00')
            )
