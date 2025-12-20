# Clean serializers file
from rest_framework import serializers
from .models import (
    Product, ProductColor, SaleOrder, SaleOrderLine, 
    CustomerInvoice, Payment, PaymentTerm, DiscountOffer, 
    Coupon, SystemSettings
)

# Basic serializers for the models
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class ProductColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductColor
        fields = '__all__'

class SaleOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleOrder
        fields = '__all__'

class SaleOrderLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleOrderLine
        fields = '__all__'

class CustomerInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerInvoice
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class PaymentTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTerm
        fields = '__all__'

class DiscountOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountOffer
        fields = '__all__'

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'