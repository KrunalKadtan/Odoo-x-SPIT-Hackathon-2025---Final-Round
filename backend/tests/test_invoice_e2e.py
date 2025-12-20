"""
End-to-end test for customer invoice generation and confirmation.
This test verifies the complete workflow from order creation to invoice confirmation.
"""
import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError

from products.models import CustomerInvoice, SaleOrder, Product
from products.services import InvoiceService
from tests.factories import (
    UserFactory,
    ProductFactory,
    SaleOrderFactory,
    SaleOrderLineFactory,
)


@pytest.mark.django_db
class TestInvoiceEndToEnd:
    """End-to-end tests for invoice generation and confirmation."""
    
    def test_complete_invoice_workflow(self):
        """
        Test the complete invoice workflow:
        1. Create a confirmed order with products
        2. Generate an invoice from the order
        3. Confirm the invoice and verify stock deduction
        """
        # Setup: Create products with stock
        product1 = ProductFactory(
            product_name="Product 1",
            sales_price=Decimal("100.00"),
            current_stock=50
        )
        product2 = ProductFactory(
            product_name="Product 2",
            sales_price=Decimal("200.00"),
            current_stock=30
        )
        
        # Create a confirmed order
        order = SaleOrderFactory(status='confirmed')
        line1 = SaleOrderLineFactory(
            order=order,
            product=product1,
            quantity=5,
            unit_price=product1.sales_price
        )
        line2 = SaleOrderLineFactory(
            order=order,
            product=product2,
            quantity=3,
            unit_price=product2.sales_price
        )
        
        # Calculate expected total
        expected_total = (line1.quantity * line1.unit_price) + (line2.quantity * line2.unit_price)
        order.total_amount = expected_total
        order.save()
        
        # Record initial stock levels
        initial_stock_product1 = product1.current_stock
        initial_stock_product2 = product2.current_stock
        
        # Step 1: Generate invoice
        invoice = InvoiceService.generate_invoice(
            order_id=order.id,
            payment_terms_days=30
        )
        
        # Verify invoice was created correctly
        assert invoice is not None
        assert invoice.order == order
        assert invoice.status == 'draft'
        assert invoice.total_amount == expected_total
        assert invoice.due_date > invoice.invoice_date
        
        # Verify stock has NOT been deducted yet (invoice is still draft)
        product1.refresh_from_db()
        product2.refresh_from_db()
        assert product1.current_stock == initial_stock_product1
        assert product2.current_stock == initial_stock_product2
        
        # Step 2: Confirm invoice
        confirmed_invoice = InvoiceService.confirm_invoice(invoice.id)
        
        # Verify invoice status changed to confirmed
        assert confirmed_invoice.status == 'confirmed'
        
        # Verify stock was deducted correctly
        product1.refresh_from_db()
        product2.refresh_from_db()
        assert product1.current_stock == initial_stock_product1 - line1.quantity
        assert product2.current_stock == initial_stock_product2 - line2.quantity
        
        # Verify we cannot confirm the invoice again
        with pytest.raises(ValidationError) as exc_info:
            InvoiceService.confirm_invoice(invoice.id)
        assert 'draft' in str(exc_info.value).lower()
    
    def test_invoice_generation_requires_confirmed_order(self):
        """Test that invoice generation fails for non-confirmed orders."""
        # Create a draft order
        order = SaleOrderFactory(status='draft')
        SaleOrderLineFactory(order=order)
        
        # Attempt to generate invoice should fail
        with pytest.raises(ValidationError) as exc_info:
            InvoiceService.generate_invoice(order_id=order.id)
        
        assert 'confirmed' in str(exc_info.value).lower()
    
    def test_invoice_confirmation_fails_with_insufficient_stock(self):
        """Test that invoice confirmation fails when stock is insufficient."""
        # Create product with limited stock
        product = ProductFactory(
            product_name="Limited Stock Product",
            sales_price=Decimal("100.00"),
            current_stock=5  # Only 5 in stock
        )
        
        # Create order requesting more than available
        order = SaleOrderFactory(status='confirmed')
        line = SaleOrderLineFactory(
            order=order,
            product=product,
            quantity=10,  # Requesting 10, but only 5 available
            unit_price=product.sales_price
        )
        order.total_amount = line.quantity * line.unit_price
        order.save()
        
        # Generate invoice
        invoice = InvoiceService.generate_invoice(order_id=order.id)
        
        # Record initial stock
        initial_stock = product.current_stock
        
        # Attempt to confirm should fail
        with pytest.raises(ValidationError) as exc_info:
            InvoiceService.confirm_invoice(invoice.id)
        
        assert 'insufficient stock' in str(exc_info.value).lower()
        
        # Verify invoice status remains draft
        invoice.refresh_from_db()
        assert invoice.status == 'draft'
        
        # Verify stock was NOT deducted (transaction rolled back)
        product.refresh_from_db()
        assert product.current_stock == initial_stock


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
