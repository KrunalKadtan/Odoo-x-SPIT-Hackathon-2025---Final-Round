"""
Vendor serializers for ApparelDesk Vendor User APIs.

Provides read-only and limited access serialization for vendor users.
"""

from rest_framework import serializers
from .models import Product, PurchaseOrder, PurchaseOrderLine, VendorBill, Payment
from accounts.models import Contact, User


class VendorProductSerializer(serializers.ModelSerializer):
    """
    Vendor serializer for Product (read-only).
    Used for reference during purchase flows.
    """
    
    class Meta:
        model = Product
        fields = [
            'id', 'product_name', 'product_category', 'product_type',
            'material', 'purchase_price', 'purchase_tax_percentage',
            'current_stock'
        ]
        read_only_fields = fields


class VendorPurchaseOrderLineSerializer(serializers.ModelSerializer):
    """
    Vendor serializer for Purchase Order Lines (read-only).
    """
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    
    class Meta:
        model = PurchaseOrderLine
        fields = [
            'id', 'product', 'product_name', 'quantity', 'unit_price',
            'tax_percentage', 'line_subtotal', 'line_tax', 'line_total'
        ]
        read_only_fields = fields


class VendorPurchaseOrderSerializer(serializers.ModelSerializer):
    """
    Vendor serializer for Purchase Orders (read-only).
    Vendor can only view their own purchase orders.
    """
    lines = VendorPurchaseOrderLineSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'vendor_name', 'order_date', 'status',
            'subtotal', 'tax_amount', 'total_amount', 'lines'
        ]
        read_only_fields = fields


class VendorBillSerializer(serializers.ModelSerializer):
    """
    Vendor serializer for Vendor Bills (read-only).
    Vendor can only view their own bills.
    """
    purchase_order_id = serializers.IntegerField(source='purchase_order.id', read_only=True)
    
    class Meta:
        model = VendorBill
        fields = [
            'id', 'purchase_order_id', 'bill_date', 'due_date',
            'total_amount', 'status'
        ]
        read_only_fields = fields


class VendorPaymentSerializer(serializers.ModelSerializer):
    """
    Vendor serializer for Payments (read-only).
    Vendor can only view payments for their bills.
    """
    vendor_bill_id = serializers.IntegerField(source='vendor_bill.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'payment_date', 'method', 'vendor_bill_id'
        ]
        read_only_fields = fields


class VendorSelfSerializer(serializers.ModelSerializer):
    """
    Serializer for vendor user's own contact information.
    Returns vendor contact info and linked user info.
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_mobile = serializers.CharField(source='user.mobile', read_only=True, allow_null=True)
    
    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'type', 'email', 'mobile',
            'city', 'state', 'pincode',
            'user_email', 'user_name', 'user_mobile'
        ]
        read_only_fields = fields
