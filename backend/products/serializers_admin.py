"""
Admin serializers for ApparelDesk Admin APIs.

Provides full CRUD serialization for admin users.
"""

from rest_framework import serializers
from .models import Product, PurchaseOrder, PurchaseOrderLine, VendorBill, Payment
from accounts.models import Contact


class AdminProductSerializer(serializers.ModelSerializer):
    """
    Admin serializer for Product with full access.
    Includes stock information (read-only).
    """
    
    class Meta:
        model = Product
        fields = [
            'id', 'product_name', 'product_category', 'product_type',
            'material', 'sales_price', 'sales_tax_percentage',
            'purchase_price', 'purchase_tax_percentage', 'current_stock',
            'published', 'created_at'
        ]
        read_only_fields = ['id', 'current_stock', 'created_at']


class AdminVendorSerializer(serializers.ModelSerializer):
    """
    Admin serializer for Vendor (Contact) management.
    """
    user_email = serializers.EmailField(source='user.email', read_only=True, allow_null=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'type', 'email', 'mobile',
            'city', 'state', 'pincode', 'user_id', 'user_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_type(self, value):
        """Ensure contact type is vendor or both."""
        if value not in ['vendor', 'both']:
            raise serializers.ValidationError("Contact type must be 'vendor' or 'both' for vendor management.")
        return value


class AdminPurchaseOrderLineSerializer(serializers.ModelSerializer):
    """
    Admin serializer for Purchase Order Lines.
    """
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    
    class Meta:
        model = PurchaseOrderLine
        fields = [
            'id', 'product', 'product_name', 'quantity', 'unit_price',
            'tax_percentage', 'line_subtotal', 'line_tax', 'line_total'
        ]
        read_only_fields = ['id', 'line_subtotal', 'line_tax', 'line_total']


class AdminPurchaseOrderSerializer(serializers.ModelSerializer):
    """
    Admin serializer for Purchase Orders with nested lines.
    """
    lines = AdminPurchaseOrderLineSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    vendor_email = serializers.EmailField(source='vendor.email', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'vendor', 'vendor_name', 'vendor_email', 'order_date',
            'status', 'subtotal', 'tax_amount', 'total_amount',
            'lines', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_date', 'subtotal', 'tax_amount', 'total_amount',
            'created_at', 'updated_at'
        ]


class AdminVendorBillSerializer(serializers.ModelSerializer):
    """
    Admin serializer for Vendor Bills.
    """
    purchase_order_id = serializers.IntegerField(source='purchase_order.id', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    
    class Meta:
        model = VendorBill
        fields = [
            'id', 'purchase_order', 'purchase_order_id', 'vendor',
            'vendor_name', 'bill_date', 'due_date', 'total_amount',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'bill_date', 'total_amount', 'created_at', 'updated_at']


class AdminVendorPaymentSerializer(serializers.ModelSerializer):
    """
    Admin serializer for Vendor Payments.
    """
    vendor_bill_id = serializers.IntegerField(source='vendor_bill.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'payment_date', 'method', 'vendor_bill',
            'vendor_bill_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Ensure payment is for vendor bill only."""
        if 'customer_invoice' in data and data.get('customer_invoice'):
            raise serializers.ValidationError("Vendor payment cannot be linked to customer invoice.")
        if not data.get('vendor_bill'):
            raise serializers.ValidationError("Vendor payment must be linked to a vendor bill.")
        return data
