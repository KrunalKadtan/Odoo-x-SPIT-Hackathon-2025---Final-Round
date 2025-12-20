from rest_framework import serializers
from .models import Product, ProductColor


class ProductColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductColor
        fields = ['color']


class ProductSerializer(serializers.ModelSerializer):
    colors = ProductColorSerializer(many=True, read_only=True)
    color_list = serializers.SerializerMethodField()
    
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
            'colors',
            'color_list'
        ]
    
    def get_color_list(self, obj):
        """Return colors as a simple list of strings."""
        return [color.color for color in obj.colors.all()]


class ProductCreateSerializer(serializers.ModelSerializer):
    colors = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Product
        fields = [
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
            'colors'
        ]
    
    def validate_sales_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Sales price must be greater than 0")
        return value
    
    def validate_purchase_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Purchase price must be greater than 0")
        return value
    
    def validate_current_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Current stock cannot be negative")
        return value
    
    def validate_sales_tax_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Sales tax percentage must be between 0 and 100")
        return value
    
    def validate_purchase_tax_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Purchase tax percentage must be between 0 and 100")
        return value