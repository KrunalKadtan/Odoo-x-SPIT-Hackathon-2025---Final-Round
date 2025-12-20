"""
Property-based tests for InvoiceService.
Tests universal properties using Hypothesis library.

Feature: customer-invoices
"""
import pytest
from hypothesis import given, strategies as st, settings
from decimal import Decimal
from django.core.exceptions import ValidationError
from datetime import timedelta

from products.models import SaleOrder, CustomerInvoice
from products.services import InvoiceService
from tests.factories import UserFactory, ProductFactory, SaleOrderFactory, SaleOrderLineFactory


@pytest.mark.django_db
class TestInvoiceServiceProperties:
    """Property-based tests for InvoiceService."""
    
    @settings(max_examples=20, deadline=5000)
    @given(
        order_status=st.sampled_from(['draft', 'confirmed', 'cancelled']),
        payment_terms_days=st.integers(min_value=1, max_value=90)
    )
    def test_property_1_order_status_validation_for_invoice_generation(self, order_status, payment_terms_days):
        """
        Property 1: Order Status Validation for Invoice Generation
        
        For any sale order, invoice generation should succeed if and only if 
        the order status is 'confirmed', and should raise a validation error 
        for any other status.
        
        Feature: customer-invoices, Property 1: Order Status Validation for Invoice Generation
        Validates: Requirements 2.1, 2.6
        """
        # Create a sale order with the specified status
        order = SaleOrderFactory(status=order_status)
        
        # Add at least one line item to the order
        SaleOrderLineFactory(order=order)
        
        # Record initial invoice count
        initial_invoice_count = CustomerInvoice.objects.count()
        
        # Attempt to generate invoice
        if order_status == 'confirmed':
            # Property: Invoice generation should succeed for confirmed orders
            invoice = InvoiceService.generate_invoice(
                order_id=order.id,
                payment_terms_days=payment_terms_days
            )
            
            assert invoice is not None, \
                "Invoice should be created for confirmed orders"
            assert invoice.order == order, \
                "Invoice should be linked to the correct order"
            assert invoice.status == 'draft', \
                "Generated invoice should have draft status"
            assert CustomerInvoice.objects.count() == initial_invoice_count + 1, \
                "Invoice count should increase for confirmed orders"
        else:
            # Property: Invoice generation should fail for non-confirmed orders
            with pytest.raises(ValidationError) as exc_info:
                InvoiceService.generate_invoice(
                    order_id=order.id,
                    payment_terms_days=payment_terms_days
                )
            
            # Verify error message mentions order status
            error_msg = str(exc_info.value).lower()
            assert 'confirmed' in error_msg or 'status' in error_msg, \
                f"Error message should mention order status requirement: {exc_info.value}"
            
            # Verify no invoice was created
            assert CustomerInvoice.objects.count() == initial_invoice_count, \
                f"No invoice should be created for orders in '{order_status}' status"
