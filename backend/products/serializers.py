"""
Serializers for the products app.
"""
from rest_framework import serializers
from .models import PaymentTerm, Product, ProductColor


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
