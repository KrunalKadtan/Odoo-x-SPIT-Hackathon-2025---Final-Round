from rest_framework import serializers
from .models import User, Contact


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'mobile', 'address', 'city', 'state', 'pincode', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for User profile with additional computed fields."""
    
    full_name = serializers.CharField(source='name', read_only=True)
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    phone = serializers.CharField(source='mobile', read_only=True)
    phone_number = serializers.CharField(source='mobile', read_only=True)
    postal_code = serializers.CharField(source='pincode', read_only=True)
    zip_code = serializers.CharField(source='pincode', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'mobile', 'address', 'city', 'state', 'pincode', 'created_at',
            'full_name', 'first_name', 'last_name', 'phone', 'phone_number', 'postal_code', 'zip_code'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_first_name(self, obj):
        """Extract first name from full name."""
        if obj.name:
            return obj.name.split()[0]
        return ""
    
    def get_last_name(self, obj):
        """Extract last name from full name."""
        if obj.name:
            parts = obj.name.split()
            return " ".join(parts[1:]) if len(parts) > 1 else ""
        return ""


class ContactSerializer(serializers.ModelSerializer):
    """Serializer for Contact model."""
    
    class Meta:
        model = Contact
        fields = ['id', 'name', 'type', 'email', 'mobile', 'city', 'state', 'pincode', 'user', 'created_at']
        read_only_fields = ['id', 'created_at']


class PortalSignupSerializer(serializers.Serializer):
    """Serializer for portal signup request validation."""
    
    name = serializers.CharField(max_length=255, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    mobile = serializers.CharField(max_length=15, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    pincode = serializers.CharField(max_length=6, required=False, allow_blank=True)
    
    def validate_email(self, value):
        """Check if email already exists."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value
    
    def validate_pincode(self, value):
        """Validate pincode format if provided."""
        if value and not value.isdigit():
            raise serializers.ValidationError("Pincode must contain only digits")
        if value and len(value) != 6:
            raise serializers.ValidationError("Pincode must be exactly 6 digits")
        return value
