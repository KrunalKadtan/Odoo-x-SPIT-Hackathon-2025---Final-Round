"""
Serializers for the products app.
"""
from rest_framework import serializers
from .models import PaymentTerm


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
