"""
Unit tests for PaymentService.
Tests the Razorpay order creation logic.
"""
import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.conf import settings
from unittest.mock import patch, MagicMock
from products.services import PaymentService
from products.models import Payment, CustomerInvoice, SaleOrder
from accounts.models import User


@pytest.mark.django_db
class TestPaymentServiceGetRazorpayClient:
    """Test _get_razorpay_client method."""
    
    def test_get_client_with_valid_credentials(self):
        """Test that client is created when credentials are configured."""
        # Set credentials
        with patch.object(settings, 'RAZORPAY_API_KEY', 'test_key'):
            with patch.object(settings, 'RAZORPAY_API_SECRET', 'test_secret'):
                with patch('products.services.razorpay.Client') as mock_client:
                    client = PaymentService._get_razorpay_client()
                    mock_client.assert_called_once_with(auth=('test_key', 'test_secret'))
    
    def test_get_client_missing_api_key(self):
        """Test that ValidationError is raised when API key is missing."""
        with patch.object(settings, 'RAZORPAY_API_KEY', ''):
            with patch.object(settings, 'RAZORPAY_API_SECRET', 'test_secret'):
                with pytest.raises(ValidationError) as exc_info:
                    PaymentService._get_razorpay_client()
                assert "Razorpay credentials are not configured" in str(exc_info.value)
    
    def test_get_client_missing_api_secret(self):
        """Test that ValidationError is raised when API secret is missing."""
        with patch.object(settings, 'RAZORPAY_API_KEY', 'test_key'):
            with patch.object(settings, 'RAZORPAY_API_SECRET', ''):
                with pytest.raises(ValidationError) as exc_info:
                    PaymentService._get_razorpay_client()
                assert "Razorpay credentials are not configured" in str(exc_info.value)


@pytest.mark.django_db
class TestPaymentServiceCreateRazorpayOrder:
    """Test create_razorpay_order method."""
    
    @pytest.fixture
    def customer(self):
        """Create a test customer."""
        return User.objects.create(
            email='customer@test.com',
            name='Test Customer',
            role='portal'
        )
    
    @pytest.fixture
    def sale_order(self, customer):
        """Create a test sale order."""
        return SaleOrder.objects.create(
            customer=customer,
            subtotal=Decimal('1000.00'),
            discount_amount=Decimal('0.00'),
            total_amount=Decimal('1000.00'),
            status='confirmed'
        )
    
    @pytest.fixture
    def invoice(self, sale_order):
        """Create a test invoice."""
        from datetime import date, timedelta
        return CustomerInvoice.objects.create(
            order=sale_order,
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal('1000.00'),
            status='draft'
        )
    
    def test_create_order_with_invoice(self, invoice):
        """Test creating Razorpay order with valid invoice."""
        mock_razorpay_order = {
            'id': 'order_test123',
            'amount': 100000,
            'currency': 'INR'
        }
        
        with patch.object(PaymentService, '_get_razorpay_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.order.create.return_value = mock_razorpay_order
            mock_get_client.return_value = mock_client
            
            payment, razorpay_order = PaymentService.create_razorpay_order(
                invoice_id=invoice.id
            )
            
            # Verify Razorpay API was called correctly
            mock_client.order.create.assert_called_once_with({
                'amount': 100000,  # 1000.00 * 100
                'currency': 'INR',
                'payment_capture': 1
            })
            
            # Verify payment record was created
            assert payment.amount == Decimal('1000.00')
            assert payment.method == 'razorpay'
            assert payment.customer_invoice == invoice
            assert payment.vendor_bill is None
            assert payment.razorpay_order_id == 'order_test123'
            
            # Verify return value
            assert razorpay_order == mock_razorpay_order
    
    def test_create_order_with_custom_amount(self, invoice):
        """Test creating Razorpay order with custom amount."""
        mock_razorpay_order = {
            'id': 'order_test456',
            'amount': 50000,
            'currency': 'INR'
        }
        
        with patch.object(PaymentService, '_get_razorpay_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.order.create.return_value = mock_razorpay_order
            mock_get_client.return_value = mock_client
            
            payment, razorpay_order = PaymentService.create_razorpay_order(
                invoice_id=invoice.id,
                amount=Decimal('500.00')
            )
            
            # Verify custom amount was used
            mock_client.order.create.assert_called_once_with({
                'amount': 50000,  # 500.00 * 100
                'currency': 'INR',
                'payment_capture': 1
            })
            
            assert payment.amount == Decimal('500.00')
    
    def test_create_order_missing_both_ids(self):
        """Test that ValidationError is raised when both IDs are missing."""
        with pytest.raises(ValidationError) as exc_info:
            PaymentService.create_razorpay_order()
        assert "Must provide either invoice_id or bill_id" in str(exc_info.value)
    
    def test_create_order_both_ids_provided(self, invoice):
        """Test that ValidationError is raised when both IDs are provided."""
        with pytest.raises(ValidationError) as exc_info:
            PaymentService.create_razorpay_order(invoice_id=invoice.id, bill_id=999)
        assert "Cannot provide both invoice_id and bill_id" in str(exc_info.value)
    
    def test_create_order_invalid_invoice_id(self):
        """Test that ValidationError is raised for non-existent invoice."""
        with pytest.raises(ValidationError) as exc_info:
            PaymentService.create_razorpay_order(invoice_id=99999)
        assert "Customer invoice with id 99999 does not exist" in str(exc_info.value)
    
    def test_create_order_negative_amount(self, invoice):
        """Test that ValidationError is raised for negative amount."""
        with pytest.raises(ValidationError) as exc_info:
            PaymentService.create_razorpay_order(
                invoice_id=invoice.id,
                amount=Decimal('-100.00')
            )
        assert "Payment amount must be greater than 0" in str(exc_info.value)
    
    def test_create_order_zero_amount(self, invoice):
        """Test that ValidationError is raised for zero amount."""
        with pytest.raises(ValidationError) as exc_info:
            PaymentService.create_razorpay_order(
                invoice_id=invoice.id,
                amount=Decimal('0.00')
            )
        assert "Payment amount must be greater than 0" in str(exc_info.value)
    
    def test_create_order_razorpay_api_failure(self, invoice):
        """Test that ValidationError is raised when Razorpay API fails."""
        # Get initial count
        initial_count = Payment.objects.count()
        
        with patch.object(PaymentService, '_get_razorpay_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.order.create.side_effect = Exception("API Error")
            mock_get_client.return_value = mock_client
            
            with pytest.raises(ValidationError) as exc_info:
                PaymentService.create_razorpay_order(invoice_id=invoice.id)
            
            assert "Failed to create Razorpay order: API Error" in str(exc_info.value)
            
            # Verify no new payment record was created (transaction rollback)
            assert Payment.objects.count() == initial_count
    
    def test_create_order_amount_conversion_to_paise(self, invoice):
        """Test that amount is correctly converted to paise."""
        test_cases = [
            (Decimal('100.00'), 10000),
            (Decimal('1.50'), 150),
            (Decimal('999.99'), 99999),
            (Decimal('0.01'), 1),
        ]
        
        for amount_inr, expected_paise in test_cases:
            mock_razorpay_order = {
                'id': f'order_test_{expected_paise}',
                'amount': expected_paise,
                'currency': 'INR'
            }
            
            with patch.object(PaymentService, '_get_razorpay_client') as mock_get_client:
                mock_client = MagicMock()
                mock_client.order.create.return_value = mock_razorpay_order
                mock_get_client.return_value = mock_client
                
                PaymentService.create_razorpay_order(
                    invoice_id=invoice.id,
                    amount=amount_inr
                )
                
                # Verify correct paise conversion
                call_args = mock_client.order.create.call_args[0][0]
                assert call_args['amount'] == expected_paise
            
            # Clean up for next iteration
            Payment.objects.all().delete()
