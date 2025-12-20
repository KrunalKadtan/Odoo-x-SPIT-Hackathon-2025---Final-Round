"""
Property-based tests for invoice transaction atomicity and stock validation.
Feature: customer-invoices
"""
import pytest
from decimal import Decimal
from hypothesis import given, strategies as st, assume
from hypothesis.extra.django import from_model
from django.core.exceptions import ValidationError
from django.db import transaction

from products.models import CustomerInvoice, Product, SaleOrder, SaleOrderLine
from products.services import InvoiceService
from tests.factories import (
    CustomerInvoiceFactory, SaleOrderFactory, SaleOrderLineFactory,
    ProductFactory, UserFactory
)


@pytest.mark.django_db(transaction=True)
class TestInvoiceAtomicityProperties:
    """
    Property-based tests for transaction atomicity and stock validation.
    """
    
    @given(
        insufficient_stock=st.integers(min_value=0, max_value=5),
        required_quantity=st.integers(min_value=6, max_value=20)
    )
    def test_property_9_transaction_atomicity_on_failure(
        self, insufficient_stock, required_quantity
    ):
        """
        Feature: customer-invoices, Property 9: Transaction Atomicity on Failure
        
        For any invoice confirmation that fails (due to insufficient stock or other errors),
        no changes should persist in the database—the invoice status should remain 'draft'
        and stock quantities should be unchanged.
        
        **Validates: Requirements 3.6, 10.2, 10.3**
        """
        # Ensure insufficient stock
        assume(insufficient_stock < required_quantity)
        
        # Create a product with insufficient stock
        product = ProductFactory(current_stock=insufficient_stock, published=True)
        initial_stock = product.current_stock
        
        # Create a confirmed order with a line requiring more stock than available
        customer = UserFactory(role='portal')
        order = SaleOrderFactory(
            customer=customer,
            status='confirmed',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        line = SaleOrderLineFactory(
            order=order,
            product=product,
            quantity=required_quantity,
            unit_price=Decimal('10.00'),
            line_total=Decimal(str(required_quantity)) * Decimal('10.00')
        )
        
        # Generate invoice
        invoice = InvoiceService.generate_invoice(order.id)
        initial_invoice_status = invoice.status
        
        # Attempt to confirm invoice (should fail due to insufficient stock)
        with pytest.raises(ValidationError) as exc_info:
            InvoiceService.confirm_invoice(invoice.id)
        
        # Verify error message mentions insufficient stock
        assert 'Insufficient stock' in str(exc_info.value)
        
        # Refresh from database
        invoice.refresh_from_db()
        product.refresh_from_db()
        
        # Property: Invoice status should remain 'draft'
        assert invoice.status == initial_invoice_status == 'draft', \
            "Invoice status should remain 'draft' after failed confirmation"
        
        # Property: Stock quantity should be unchanged
        assert product.current_stock == initial_stock, \
            f"Stock should remain {initial_stock}, but is {product.current_stock}"
    
    @given(
        stock_quantity=st.integers(min_value=1, max_value=100),
        required_quantity=st.integers(min_value=1, max_value=100)
    )
    def test_property_10_insufficient_stock_validation(
        self, stock_quantity, required_quantity
    ):
        """
        Feature: customer-invoices, Property 10: Insufficient Stock Validation
        
        For any invoice confirmation where at least one product has insufficient stock,
        the confirmation should fail with a validation error before any stock is deducted.
        
        **Validates: Requirements 5.3, 5.4**
        """
        # Only test cases where stock is insufficient
        assume(stock_quantity < required_quantity)
        
        # Create a product with specific stock
        product = ProductFactory(current_stock=stock_quantity, published=True)
        initial_stock = product.current_stock
        
        # Create a confirmed order
        customer = UserFactory(role='portal')
        order = SaleOrderFactory(
            customer=customer,
            status='confirmed',
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00')
        )
        
        line = SaleOrderLineFactory(
            order=order,
            product=product,
            quantity=required_quantity,
            unit_price=Decimal('10.00'),
            line_total=Decimal(str(required_quantity)) * Decimal('10.00')
        )
        
        # Generate invoice
        invoice = InvoiceService.generate_invoice(order.id)
        
        # Attempt to confirm invoice
        with pytest.raises(ValidationError) as exc_info:
            InvoiceService.confirm_invoice(invoice.id)
        
        # Verify error message
        error_message = str(exc_info.value)
        assert 'Insufficient stock' in error_message, \
            f"Expected 'Insufficient stock' in error, got: {error_message}"
        assert product.product_name in error_message, \
            f"Expected product name in error message"
        
        # Refresh from database
        product.refresh_from_db()
        
        # Property: No stock should be deducted
        assert product.current_stock == initial_stock, \
            f"No stock should be deducted on validation failure. " \
            f"Expected {initial_stock}, got {product.current_stock}"
