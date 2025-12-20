"""
Serializers for the products app.
"""
from rest_framework import serializers
from .models import (
    PaymentTerm, Product, ProductColor, CustomerInvoice, Payment, 
    SaleOrder, SaleOrderLine, Cart, CartItem
)
from accounts.models import User


class ProductColorSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductColor model.
    """
    class Meta:
        model = ProductColor
        fields = ['color']


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model - list view.
    """
    colors = ProductColorSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id',
            'product_name',
            'product_category',
            'product_type',
            'material',
            'sales_price',
            'current_stock',
            'colors',
            'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model - detail view with full information.
    """
    colors = ProductColorSerializer(many=True, read_only=True)
    available_colors = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id',
            'product_name',
            'product_category',
            'product_type',
            'material',
            'sales_price',
            'purchase_price',
            'sales_tax_percentage',
            'current_stock',
            'colors',
            'available_colors',
            'created_at'
        ]
    
    def get_available_colors(self, obj):
        """
        Get list of available colors for the product.
        """
        return [color.color for color in obj.colors.all()]


class PaymentTermSerializer(serializers.ModelSerializer):
    """
    Serializer for PaymentTerm model with validation for early payment discount logic.
    """
    discount_description = serializers.CharField(
        source='get_discount_description',
        read_only=True
    )
    
    class Meta:
        model = PaymentTerm
        fields = [
            'id',
            'name',
            'early_payment_discount',
            'discount_percentage',
            'discount_days',
            'early_pay_discount_computation',
            'example_preview',
            'is_default',
            'discount_description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'discount_description']
    
    def validate(self, data):
        """
        Validate early payment discount logic.
        
        Requirements: 5.1, 5.2, 5.3
        """
        early_discount = data.get('early_payment_discount', False)
        
        if early_discount:
            if data.get('discount_percentage', 0) <= 0:
                raise serializers.ValidationError({
                    'discount_percentage': 'Must be greater than 0 when early payment discount is enabled.'
                })
            if data.get('discount_days') is None or data.get('discount_days', -1) < 0:
                raise serializers.ValidationError({
                    'discount_days': 'Must be specified when early payment discount is enabled.'
                })
            if not data.get('early_pay_discount_computation'):
                raise serializers.ValidationError({
                    'early_pay_discount_computation': 'Must be specified when early payment discount is enabled.'
                })
        
        return data
    
    def validate_is_default(self, value):
        """
        Prevent removing default flag from the default payment term.
        
        Requirements: 6.5
        """
        if self.instance and self.instance.is_default and not value:
            raise serializers.ValidationError(
                "Cannot remove default flag from the default payment term."
            )
        return value


class SaleOrderSerializer(serializers.ModelSerializer):
    """
    Serializer for SaleOrder model.
    """
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = SaleOrder
        fields = [
            'id',
            'customer',
            'customer_name',
            'order_date',
            'total_amount',
            'status',
            'created_at'
        ]


class CustomerInvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomerInvoice model.
    """
    order_details = SaleOrderSerializer(source='order', read_only=True)
    customer_name = serializers.CharField(source='order.customer.name', read_only=True)
    customer_email = serializers.CharField(source='order.customer.email', read_only=True)
    customer_address = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    amount_paid = serializers.SerializerMethodField()
    amount_due = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerInvoice
        fields = [
            'id',
            'order',
            'order_details',
            'customer_name',
            'customer_email',
            'customer_address',
            'invoice_date',
            'due_date',
            'total_amount',
            'status',
            'payment_status',
            'amount_paid',
            'amount_due',
            'created_at',
            'updated_at'
        ]
    
    def get_customer_address(self, obj):
        """Get customer address information."""
        customer = obj.order.customer
        return {
            'name': customer.name,
            'email': customer.email,
            'mobile': customer.mobile or '',
            'address': customer.address or '',
            'city': customer.city or '',
            'state': customer.state or '',
            'pincode': customer.pincode or ''
        }
    
    def get_payment_status(self, obj):
        """Determine payment status based on payments."""
        total_paid = sum(payment.amount for payment in obj.payments.all())
        if total_paid >= obj.total_amount:
            return 'paid'
        elif total_paid > 0:
            return 'partially_paid'
        else:
            return 'waiting_for_payment'
    
    def get_amount_paid(self, obj):
        """Calculate total amount paid."""
        return sum(payment.amount for payment in obj.payments.all())
    
    def get_amount_due(self, obj):
        """Calculate amount due."""
        amount_paid = self.get_amount_paid(obj)
        return max(0, obj.total_amount - amount_paid)


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model.
    """
    invoice_details = CustomerInvoiceSerializer(source='customer_invoice', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id',
            'amount',
            'payment_date',
            'method',
            'customer_invoice',
            'invoice_details',
            'razorpay_order_id',
            'razorpay_payment_id',
            'razorpay_signature',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreatePaymentOrderSerializer(serializers.Serializer):
    """
    Serializer for creating Razorpay payment order.
    """
    invoice_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        required=False,
        help_text="Optional custom amount, defaults to invoice amount"
    )
    
    def validate_invoice_id(self, value):
        """Validate that invoice exists and belongs to current user."""
        try:
            invoice = CustomerInvoice.objects.get(id=value)
            # Check if invoice belongs to current user
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                if invoice.order.customer != request.user:
                    raise serializers.ValidationError("Invoice does not belong to current user.")
            return value
        except CustomerInvoice.DoesNotExist:
            raise serializers.ValidationError("Invoice does not exist.")


class VerifyPaymentSerializer(serializers.Serializer):
    """
    Serializer for verifying Razorpay payment.
    """
    payment_id = serializers.IntegerField(required=True)
    razorpay_payment_id = serializers.CharField(max_length=255, required=True)
    razorpay_signature = serializers.CharField(max_length=512, required=True)
    
    def validate_payment_id(self, value):
        """Validate that payment exists and belongs to current user."""
        try:
            payment = Payment.objects.get(id=value)
            # Check if payment belongs to current user
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                if payment.customer_invoice.order.customer != request.user:
                    raise serializers.ValidationError("Payment does not belong to current user.")
            return value
        except Payment.DoesNotExist:
            raise serializers.ValidationError("Payment does not exist.")


class InvoiceListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for invoice list view.
    """
    invoice_number = serializers.SerializerMethodField()
    sale_order = serializers.CharField(source='order.id', read_only=True)
    payment_status = serializers.SerializerMethodField()
    amount_due = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerInvoice
        fields = [
            'id',
            'invoice_number',
            'sale_order',
            'invoice_date',
            'due_date',
            'total_amount',
            'payment_status',
            'amount_due',
            'status'
        ]
    
    def get_invoice_number(self, obj):
        """Generate invoice number in format INV/XXXX."""
        return f"INV/{str(obj.id).zfill(4)}"
    
    def get_payment_status(self, obj):
        """Determine payment status."""
        total_paid = sum(payment.amount for payment in obj.payments.all())
        if total_paid >= obj.total_amount:
            return 'paid'
        elif total_paid > 0:
            return 'partially_paid'
        else:
            return 'waiting_for_payment'
    
    def get_amount_due(self, obj):
        """Calculate amount due."""
        total_paid = sum(payment.amount for payment in obj.payments.all())
        return max(0, obj.total_amount - total_paid)

# Cart Serializers
class CartItemSerializer(serializers.ModelSerializer):
    """
    Serializer for CartItem model.
    """
    product = ProductSerializer(read_only=True)
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'total', 'added_at']
    
    def get_total(self, obj):
        return obj.get_total()


class CartSerializer(serializers.ModelSerializer):
    """
    Serializer for Cart model.
    """
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'item_count', 'created_at', 'updated_at']
    
    def get_total(self, obj):
        return obj.get_total()
    
    def get_item_count(self, obj):
        return obj.get_item_count()


# Order Serializers
class SaleOrderLineSerializer(serializers.ModelSerializer):
    """
    Serializer for SaleOrderLine model.
    """
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = SaleOrderLine
        fields = ['id', 'product', 'quantity', 'unit_price', 'line_total']


class SaleOrderSerializer(serializers.ModelSerializer):
    """
    Serializer for SaleOrder model.
    """
    lines = SaleOrderLineSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    payment_term_name = serializers.CharField(source='payment_term.name', read_only=True)
    coupon_code = serializers.CharField(source='applied_coupon.code', read_only=True)
    invoice_info = serializers.SerializerMethodField()
    
    class Meta:
        model = SaleOrder
        fields = [
            'id', 'customer_name', 'customer_email', 'order_date', 'status',
            'subtotal', 'discount_amount', 'total_amount', 'payment_term_name',
            'coupon_code', 'lines', 'invoice_info', 'created_at', 'updated_at'
        ]
    
    def get_invoice_info(self, obj):
        """Get invoice information for this order."""
        invoice = obj.invoices.first()
        if invoice:
            # Calculate payment status
            total_payments = sum(payment.amount for payment in invoice.payments.all())
            amount_due = invoice.total_amount - total_payments
            
            if amount_due <= 0:
                payment_status = 'paid'
            elif total_payments > 0:
                payment_status = 'partially_paid'
            else:
                payment_status = 'waiting_for_payment'
            
            return {
                'id': invoice.id,
                'invoice_number': f'INV/{str(invoice.id).zfill(4)}',
                'invoice_date': invoice.invoice_date,
                'due_date': invoice.due_date,
                'total_amount': invoice.total_amount,
                'amount_due': amount_due,
                'payment_status': payment_status,
                'status': invoice.status
            }
        return None