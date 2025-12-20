from django.db import transaction
from django.db.models import F
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import datetime
from datetime import timedelta
import razorpay
import hmac
import hashlib
from .models import Product, Coupon, SaleOrder, SaleOrderLine, CustomerInvoice, Payment
from accounts.models import User

class CouponValidationService:
    """
    Service layer for validating coupon usage.
    Enforces business rules without database triggers.
    """
    
    @staticmethod
    def validate_coupon(code, contact=None, check_date=None):
        """
        Validate a coupon code for usage.
        
        Args:
            code: Coupon code to validate
            contact: Optional User instance for contact-specific coupons
            check_date: Optional date to check (defaults to today)
        
        Returns:
            tuple: (is_valid, error_message, coupon_instance)
        """
        if check_date is None:
            check_date = datetime.date.today()
        
        # Check 1: Coupon exists
        try:
            coupon = Coupon.objects.select_related('discount_offer').get(code=code)
        except Coupon.DoesNotExist:
            return False, "Coupon code does not exist.", None
        
        # Check 2: Coupon status is active
        if coupon.status != 'active':
            return False, f"Coupon is {coupon.status}.", coupon
        
        # Check 3: Coupon has not expired
        if coupon.is_expired():
            return False, "Coupon has expired.", coupon
        
        # Check 4: Discount offer date range
        offer = coupon.discount_offer
        if not offer.is_active_on_date(check_date):
            return False, f"Discount offer is not active on {check_date}.", coupon
        
        # Check 5: Day of week availability
        day_name = check_date.strftime('%A')  # e.g., "Monday"
        if not offer.is_available_on_day(day_name):
            return False, f"Discount is not available on {day_name}.", coupon
        
        # Check 6: Contact assignment (if applicable)
        if coupon.contact is not None:
            if contact is None:
                return False, "This coupon requires authentication.", coupon
            if coupon.contact.id != contact.id:
                return False, "This coupon is not assigned to you.", coupon
        
        # All checks passed
        return True, "Coupon is valid.", coupon


class StockUpdateService:
    @staticmethod
    def update_stock(product_id: int, quantity_change: int, transaction_type: str):
        """
        Updates the stock of a product safely using SELECT ... FOR UPDATE.
        
        Args:
            product_id: ID of the product to update.
            quantity_change: Amount to change stock by (must be positive).
            transaction_type: 'increase' (e.g. VendorBill) or 'decrease' (e.g. CustomerInvoice).
        """
        if quantity_change <= 0:
            raise ValidationError("Quantity change must be positive.")

        with transaction.atomic():
            # Lock the row for update to prevent race conditions
            try:
                product = Product.objects.select_for_update().get(id=product_id)
            except Product.DoesNotExist:
                raise ValidationError(f"Product with id {product_id} does not exist.")

            if transaction_type == 'increase':
                # VendorBill confirmation
                product.current_stock += quantity_change
            elif transaction_type == 'decrease':
                # CustomerInvoice confirmation
                # Check for sufficient stock is implied by the DB constraint, 
                # but good to check in app logic too for better error message.
                if product.current_stock < quantity_change:
                     raise ValidationError(f"Insufficient stock for product {product.product_name}. Current: {product.current_stock}, Requested: {quantity_change}")
                product.current_stock -= quantity_change
            else:
                raise ValidationError("Invalid transaction type. Must be 'increase' or 'decrease'.")

            product.save()
            return product.current_stock


class SaleOrderService:
    """
    Service for creating and managing sale orders with transactional integrity.
    All monetary calculations are performed server-side.
    """
    
    @staticmethod
    @transaction.atomic
    def create_order(customer_id, line_items, coupon_code=None):
        """
        Create a sale order with line items and optional coupon.
        
        Args:
            customer_id: ID of the customer (User with role='portal')
            line_items: List of dicts with 'product_id' and 'quantity'
                       Example: [{'product_id': 1, 'quantity': 2}, ...]
            coupon_code: Optional coupon code to apply
        
        Returns:
            SaleOrder: Created order instance
        
        Raises:
            ValidationError: If validation fails
        """
        # Validate customer
        try:
            customer = User.objects.get(id=customer_id)
        except User.DoesNotExist:
            raise ValidationError(f"Customer with id {customer_id} does not exist.")
        
        if customer.role != 'portal':
            raise ValidationError("Only portal users can be customers.")
        
        # Validate line items
        if not line_items or len(line_items) == 0:
            raise ValidationError("At least one line item is required.")
        
        validated_lines = SaleOrderService._validate_line_items(line_items)
        
        # Calculate subtotal
        subtotal = sum(line['line_total'] for line in validated_lines)
        
        # Apply coupon if provided
        discount_amount = Decimal('0.00')
        applied_coupon = None
        
        if coupon_code:
            applied_coupon, discount_amount = SaleOrderService._apply_coupon(
                coupon_code, customer, subtotal
            )
        
        # Calculate total
        total_amount = subtotal - discount_amount
        
        # Create sale order
        order = SaleOrder.objects.create(
            customer=customer,
            subtotal=subtotal,
            discount_amount=discount_amount,
            total_amount=total_amount,
            applied_coupon=applied_coupon,
            status='draft'
        )
        
        # Create order lines
        for line_data in validated_lines:
            SaleOrderLine.objects.create(
                order=order,
                product_id=line_data['product_id'],
                quantity=line_data['quantity'],
                unit_price=line_data['unit_price'],
                line_total=line_data['line_total']
            )
        
        # Assign coupon to customer if not already assigned
        if applied_coupon and not applied_coupon.contact:
            applied_coupon.contact = customer
            applied_coupon.save()
        
        return order
    
    @staticmethod
    def _validate_line_items(line_items):
        """
        Validate line items and fetch product prices.
        
        Args:
            line_items: List of dicts with 'product_id' and 'quantity'
        
        Returns:
            List of validated line items with unit_price and line_total
        
        Raises:
            ValidationError: If any line item is invalid
        """
        validated = []
        
        for item in line_items:
            product_id = item.get('product_id')
            quantity = item.get('quantity')
            
            # Validate quantity
            if not quantity or quantity <= 0:
                raise ValidationError(f"Quantity must be positive for product {product_id}")
            
            # Fetch product
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise ValidationError(f"Product with id {product_id} does not exist.")
            
            # Validate product is published
            if not product.published:
                raise ValidationError(f"Product {product.product_name} is not available for sale.")
            
            # Get unit price from product (server-side)
            unit_price = product.sales_price
            
            # Calculate line total
            line_total = Decimal(str(quantity)) * unit_price
            
            validated.append({
                'product_id': product_id,
                'quantity': quantity,
                'unit_price': unit_price,
                'line_total': line_total
            })
        
        return validated
    
    @staticmethod
    def _apply_coupon(coupon_code, customer, subtotal):
        """
        Validate and apply coupon to order.
        
        Args:
            coupon_code: Coupon code string
            customer: User instance
            subtotal: Order subtotal
        
        Returns:
            Tuple of (Coupon instance, discount_amount)
        
        Raises:
            ValidationError: If coupon is invalid
        """
        # Validate coupon
        is_valid, message, coupon = CouponValidationService.validate_coupon(
            coupon_code, customer
        )
        
        if not is_valid:
            raise ValidationError(f"Invalid coupon: {message}")
        
        # Calculate discount
        discount_percentage = coupon.discount_offer.discount_percentage
        discount_amount = (subtotal * discount_percentage) / Decimal('100.00')
        
        # Round to 2 decimal places
        discount_amount = discount_amount.quantize(Decimal('0.01'))
        
        return coupon, discount_amount



class InvoiceService:
    """
    Service for generating and confirming customer invoices.
    Handles invoice generation from confirmed orders and stock deduction with row-level locking.
    """
    
    @staticmethod
    @transaction.atomic
    def generate_invoice(order_id, payment_terms_days=30):
        """
        Generate an invoice from a confirmed sale order.
        
        Args:
            order_id: ID of the sale order
            payment_terms_days: Number of days until payment is due (default 30)
        
        Returns:
            CustomerInvoice: Created invoice instance
        
        Raises:
            ValidationError: If order is not confirmed or doesn't exist
        """
        # Fetch order
        try:
            order = SaleOrder.objects.get(id=order_id)
        except SaleOrder.DoesNotExist:
            raise ValidationError(f"Sale order with id {order_id} does not exist.")
        
        # Validate order is confirmed
        if order.status != 'confirmed':
            raise ValidationError(
                f"Cannot generate invoice for order in '{order.status}' status. "
                "Order must be confirmed."
            )
        
        # Calculate due date
        invoice_date = timezone.now().date()
        due_date = invoice_date + timedelta(days=payment_terms_days)
        
        # Create invoice
        invoice = CustomerInvoice.objects.create(
            order=order,
            due_date=due_date,
            total_amount=order.total_amount,
            status='draft'
        )
        
        return invoice
    
    @staticmethod
    @transaction.atomic
    def confirm_invoice(invoice_id):
        """
        Confirm an invoice and deduct stock.
        Uses SELECT FOR UPDATE to prevent duplicate confirmations.
        
        Args:
            invoice_id: ID of the invoice to confirm
        
        Returns:
            CustomerInvoice: Confirmed invoice instance
        
        Raises:
            ValidationError: If invoice cannot be confirmed
        """
        # Lock invoice row (SELECT FOR UPDATE)
        try:
            invoice = CustomerInvoice.objects.select_for_update().get(id=invoice_id)
        except CustomerInvoice.DoesNotExist:
            raise ValidationError(f"Invoice with id {invoice_id} does not exist.")
        
        # Check status after acquiring lock
        if invoice.status != 'draft':
            raise ValidationError(
                f"Cannot confirm invoice in '{invoice.status}' status. "
                "Invoice must be in draft status."
            )
        
        # Deduct stock for all order lines
        InvoiceService._deduct_stock(invoice.order)
        
        # Update invoice status
        invoice.status = 'confirmed'
        invoice.save()
        
        return invoice
    
    @staticmethod
    def _deduct_stock(order):
        """
        Deduct stock for all products in the order.
        
        Args:
            order: SaleOrder instance
        
        Raises:
            ValidationError: If insufficient stock
        """
        for line in order.lines.all():
            product = line.product
            
            # Check sufficient stock
            if product.current_stock < line.quantity:
                raise ValidationError(
                    f"Insufficient stock for product '{product.product_name}'. "
                    f"Available: {product.current_stock}, Required: {line.quantity}"
                )
            
            # Deduct stock
            product.current_stock -= line.quantity
            product.save()



class PaymentService:
    """
    Service for creating and managing payments with Razorpay integration.
    """
    
    @staticmethod
    def _get_razorpay_client():
        """
        Get configured Razorpay client.
        
        Returns:
            razorpay.Client: Configured Razorpay client
        
        Raises:
            ValidationError: If credentials are not configured
        """
        api_key = settings.RAZORPAY_API_KEY
        api_secret = settings.RAZORPAY_API_SECRET
        
        if not api_key or not api_secret:
            raise ValidationError(
                "Razorpay credentials are not configured. "
                "Please set RAZORPAY_API_KEY and RAZORPAY_API_SECRET."
            )
        
        return razorpay.Client(auth=(api_key, api_secret))
    
    @staticmethod
    @transaction.atomic
    def create_razorpay_order(invoice_id=None, bill_id=None, amount=None):
        """
        Create a Razorpay order and payment record.
        
        Args:
            invoice_id: ID of customer invoice (optional)
            bill_id: ID of vendor bill (optional)
            amount: Payment amount in INR (optional, defaults to invoice/bill amount)
        
        Returns:
            tuple: (Payment instance, razorpay_order_data)
        
        Raises:
            ValidationError: If validation fails or Razorpay API call fails
        """
        # Validate exactly one target
        if not invoice_id and not bill_id:
            raise ValidationError("Must provide either invoice_id or bill_id.")
        
        if invoice_id and bill_id:
            raise ValidationError("Cannot provide both invoice_id and bill_id.")
        
        # Fetch target
        if invoice_id:
            try:
                target = CustomerInvoice.objects.get(id=invoice_id)
                target_amount = target.total_amount
            except CustomerInvoice.DoesNotExist:
                raise ValidationError(f"Customer invoice with id {invoice_id} does not exist.")
        else:
            # For now, we'll handle VendorBill when it's implemented
            # Placeholder for vendor bill logic
            raise ValidationError("Vendor bill support not yet implemented.")
        
        # Use provided amount or target amount
        payment_amount = amount if amount is not None else target_amount
        
        # Validate amount
        if payment_amount <= 0:
            raise ValidationError("Payment amount must be greater than 0.")
        
        # Convert to paise (smallest currency unit)
        amount_paise = int(payment_amount * 100)
        
        # Create Razorpay order
        try:
            client = PaymentService._get_razorpay_client()
            razorpay_order = client.order.create({
                'amount': amount_paise,
                'currency': 'INR',
                'payment_capture': 1  # Auto-capture
            })
        except Exception as e:
            raise ValidationError(f"Failed to create Razorpay order: {str(e)}")
        
        # Create payment record
        payment = Payment.objects.create(
            amount=payment_amount,
            payment_date=timezone.now(),
            method='razorpay',
            customer_invoice=target if invoice_id else None,
            vendor_bill=None,  # Will be set when vendor bill support is added
            razorpay_order_id=razorpay_order['id']
        )
        
        return payment, razorpay_order
    
    @staticmethod
    @transaction.atomic
    def verify_razorpay_payment(payment_id, razorpay_payment_id, razorpay_signature):
        """
        Verify Razorpay payment signature and update payment record.
        
        Args:
            payment_id: ID of Payment record
            razorpay_payment_id: Razorpay payment ID from callback
            razorpay_signature: Razorpay signature from callback
        
        Returns:
            Payment: Updated payment instance
        
        Raises:
            ValidationError: If verification fails
        """
        # Fetch payment
        try:
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            raise ValidationError(f"Payment with id {payment_id} does not exist.")
        
        # Load Razorpay secret key from settings
        api_secret = settings.RAZORPAY_API_SECRET
        
        if not api_secret:
            raise ValidationError(
                "Razorpay secret key is not configured. "
                "Please set RAZORPAY_API_SECRET."
            )
        
        # Create verification string: "order_id|payment_id"
        verification_string = f"{payment.razorpay_order_id}|{razorpay_payment_id}"
        
        # Generate expected signature using HMAC SHA256
        expected_signature = hmac.new(
            api_secret.encode('utf-8'),
            verification_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures using hmac.compare_digest()
        if not hmac.compare_digest(expected_signature, razorpay_signature):
            raise ValidationError("Invalid Razorpay signature. Payment verification failed.")
        
        # Update payment record with razorpay_payment_id and razorpay_signature
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.save()
        
        return payment
    
    @staticmethod
    @transaction.atomic
    def create_manual_payment(invoice_id=None, bill_id=None, amount=None, 
                             method='cash', payment_date=None):
        """
        Create a manual payment record (non-Razorpay).
        
        Args:
            invoice_id: ID of customer invoice (optional)
            bill_id: ID of vendor bill (optional)
            amount: Payment amount
            method: Payment method (default: 'cash')
            payment_date: Payment date (default: now)
        
        Returns:
            Payment: Created payment instance
        
        Raises:
            ValidationError: If validation fails
        """
        # Validate exactly one target
        if not invoice_id and not bill_id:
            raise ValidationError("Must provide either invoice_id or bill_id.")
        
        if invoice_id and bill_id:
            raise ValidationError("Cannot provide both invoice_id and bill_id.")
        
        # Fetch target
        if invoice_id:
            try:
                target = CustomerInvoice.objects.get(id=invoice_id)
            except CustomerInvoice.DoesNotExist:
                raise ValidationError(f"Customer invoice with id {invoice_id} does not exist.")
        else:
            # For now, we'll handle VendorBill when it's implemented
            # Placeholder for vendor bill logic
            raise ValidationError("Vendor bill support not yet implemented.")
        
        # Validate amount
        if amount is None or amount <= 0:
            raise ValidationError("Payment amount must be greater than 0.")
        
        # Validate method
        valid_methods = ['cash', 'bank_transfer', 'cheque']
        if method not in valid_methods:
            raise ValidationError(f"Invalid payment method. Must be one of: {valid_methods}")
        
        # Use provided date or current time
        if payment_date is None:
            payment_date = timezone.now()
        
        # Create payment record
        payment = Payment.objects.create(
            amount=amount,
            payment_date=payment_date,
            method=method,
            customer_invoice=target if invoice_id else None
        )
        
        return payment
