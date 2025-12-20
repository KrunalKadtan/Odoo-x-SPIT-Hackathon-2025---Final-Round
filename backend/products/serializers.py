"""
Serializers for the products app.
"""
from rest_framework import serializers
from .models import PaymentTerm, Product, ProductColor, SaleOrder, SaleOrderLine, Coupon, DiscountOffer, CustomerInvoice, Payment, SystemSettings


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


class ProductColorSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductColor model.
    """
    class Meta:
        model = ProductColor
        fields = ['id', 'color']
        read_only_fields = ['id']


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model with nested colors.
    Includes all product fields and read-only fields for id and created_at.
    
    Requirements: 1.1, 1.3
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
            'sales_tax_percentage',
            'purchase_price',
            'purchase_tax_percentage',
            'current_stock',
            'published',
            'created_at',
            'colors'
        ]
        read_only_fields = ['id', 'created_at']



class SaleOrderLineSerializer(serializers.ModelSerializer):
    """
    Serializer for SaleOrderLine model.
    Includes product name for display purposes.
    
    Requirements: 3.1, 3.2, 3.3
    """
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    
    class Meta:
        model = SaleOrderLine
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'line_total']
        read_only_fields = ['id', 'unit_price', 'line_total']


class SaleOrderSerializer(serializers.ModelSerializer):
    """
    Serializer for SaleOrder model with nested line items.
    Includes customer email and calculated totals as read-only fields.
    
    Requirements: 3.1, 3.2, 3.3
    """
    lines = SaleOrderLineSerializer(many=True, read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    
    class Meta:
        model = SaleOrder
        fields = [
            'id',
            'customer',
            'customer_email',
            'order_date',
            'status',
            'subtotal',
            'discount_amount',
            'total_amount',
            'applied_coupon',
            'lines',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'customer',
            'customer_email',
            'order_date',
            'subtotal',
            'discount_amount',
            'total_amount',
            'created_at',
            'updated_at'
        ]



class DiscountOfferSerializer(serializers.ModelSerializer):
    """
    Serializer for DiscountOffer model.
    Includes all discount offer fields with validation for date range.
    
    Requirements: 7.1, 7.2, 13.1, 13.2
    """
    
    class Meta:
        model = DiscountOffer
        fields = [
            'id',
            'name',
            'discount_percentage',
            'start_date',
            'end_date',
            'available_on',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Validate date range.
        """
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be greater than or equal to start date.'
            })
        
        return data


class CouponSerializer(serializers.ModelSerializer):
    """
    Serializer for Coupon model.
    Includes discount_percentage from related offer and validates coupon code format.
    
    Requirements: 7.1, 7.2, 13.1, 13.2
    """
    discount_percentage = serializers.DecimalField(
        source='discount_offer.discount_percentage',
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    discount_offer_name = serializers.CharField(
        source='discount_offer.name',
        read_only=True
    )
    
    class Meta:
        model = Coupon
        fields = [
            'id',
            'code',
            'expiration_date',
            'status',
            'contact',
            'discount_offer',
            'discount_offer_name',
            'discount_percentage',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'discount_percentage', 'discount_offer_name']
    
    def validate_code(self, value):
        """
        Validate coupon code format.
        Must contain only alphanumeric characters, hyphens, and underscores.
        
        Requirements: 13.2
        """
        import re
        if not re.match(r'^[A-Za-z0-9_-]+$', value):
            raise serializers.ValidationError(
                "Code must contain only alphanumeric characters, hyphens, and underscores."
            )
        return value
    
    def validate(self, data):
        """
        Validate unique coupon code on creation.
        
        Requirements: 13.2
        """
        # Check uniqueness only on creation
        if not self.instance:
            code = data.get('code')
            if code and Coupon.objects.filter(code=code).exists():
                raise serializers.ValidationError({
                    'code': 'A coupon with this code already exists.'
                })
        
        return data



class CustomerInvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomerInvoice model.
    Includes order_id and customer_email for display purposes.
    Read-only fields for calculated amounts.
    
    Requirements: 8.1, 8.2, 8.3
    """
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    customer_email = serializers.EmailField(source='order.customer.email', read_only=True)
    
    class Meta:
        model = CustomerInvoice
        fields = [
            'id',
            'order',
            'order_id',
            'customer_email',
            'invoice_date',
            'due_date',
            'total_amount',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'order_id',
            'customer_email',
            'invoice_date',
            'total_amount',
            'created_at',
            'updated_at'
        ]



class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model.
    Includes all payment fields with validation for Razorpay fields.
    
    Requirements: 9.1, 10.1, 10.4, 10.5
    """
    
    class Meta:
        model = Payment
        fields = [
            'id',
            'amount',
            'payment_date',
            'method',
            'customer_invoice',
            'vendor_bill',
            'razorpay_order_id',
            'razorpay_payment_id',
            'razorpay_signature',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Validate Razorpay fields when method is razorpay.
        
        Requirements: 9.1, 10.1
        """
        method = data.get('method', 'razorpay')
        
        # Validate Razorpay fields when method is razorpay
        if method == 'razorpay':
            if not data.get('razorpay_order_id'):
                raise serializers.ValidationError({
                    'razorpay_order_id': 'Razorpay order ID is required for Razorpay payments.'
                })
        
        # Validate exactly one FK is set
        customer_invoice = data.get('customer_invoice')
        vendor_bill = data.get('vendor_bill')
        
        if not customer_invoice and not vendor_bill:
            raise serializers.ValidationError(
                "Payment must be linked to either a customer invoice or vendor bill."
            )
        
        if customer_invoice and vendor_bill:
            raise serializers.ValidationError(
                "Payment cannot be linked to both customer invoice and vendor bill."
            )
        
        return data


class SystemSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for SystemSettings model.
    Includes automatic_invoicing field for system-wide configuration.
    
    Requirements: 15.1, 15.2
    """
    
    class Meta:
        model = SystemSettings
        fields = [
            'id',
            'automatic_invoicing',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
