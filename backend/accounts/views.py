from django.shortcuts import render
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Contact
from .serializers import PortalSignupSerializer, UserSerializer, ContactSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def portal_signup(request):
    """
    Portal signup API endpoint.
    Creates a User with role='portal' and an associated Contact with type='customer'.
    Both operations are wrapped in a database transaction for atomicity.
    
    Request body:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "securepassword123",
        "mobile": "+1234567890",  // optional
        "city": "Mumbai",  // optional
        "state": "Maharashtra",  // optional
        "pincode": "400001"  // optional
    }
    
    Returns:
    {
        "user": {
            "id": 1,
            "email": "john@example.com",
            "name": "John Doe",
            "role": "portal"
        },
        "contact": {
            "id": 1,
            "name": "John Doe",
            "type": "customer",
            "email": "john@example.com"
        },
        "tokens": {
            "refresh": "...",
            "access": "..."
        }
    }
    """
    # Validate request data
    serializer = PortalSignupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    validated_data = serializer.validated_data
    
    try:
        # Wrap User and Contact creation in a transaction
        # If either fails, both are rolled back (prevents orphan Users)
        with transaction.atomic():
            # Create User with role='portal'
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                name=validated_data['name'],
                role='portal',
                mobile=validated_data.get('mobile') or None,
                city=validated_data.get('city') or None,
                state=validated_data.get('state') or None,
                pincode=validated_data.get('pincode') or None
            )
            
            # Create Contact with type='customer' and link to User
            contact = Contact.objects.create(
                name=validated_data['name'],
                type='customer',
                email=validated_data['email'],
                mobile=validated_data.get('mobile') or None,
                city=validated_data.get('city') or None,
                state=validated_data.get('state') or None,
                pincode=validated_data.get('pincode') or None,
                user=user
            )
            
            # Generate JWT tokens for immediate login
            refresh = RefreshToken.for_user(user)
            
            # Prepare response data
            response_data = {
                'user': UserSerializer(user).data,
                'contact': ContactSerializer(contact).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        # If any error occurs, transaction is automatically rolled back
        return Response(
            {'error': f'Signup failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    User profile API endpoint.
    
    GET: Returns current user's profile data
    PUT: Updates current user's profile data
    
    Returns user data with all available fields for address auto-fill.
    """
    user = request.user
    
    if request.method == 'GET':
        # Return user profile data
        serializer = UserSerializer(user)
        profile_data = serializer.data
        
        # Add additional fields that frontend might expect
        profile_data.update({
            'full_name': user.name,
            'first_name': user.name.split()[0] if user.name else '',
            'last_name': ' '.join(user.name.split()[1:]) if user.name and len(user.name.split()) > 1 else '',
            'phone': user.mobile or '',
            'phone_number': user.mobile or '',
            'mobile': user.mobile or '',
            'address': user.address or '',
            'city': user.city or '',
            'state': user.state or '',
            'pincode': user.pincode or '',
            'postal_code': user.pincode or '',
            'zip_code': user.pincode or '',
        })
        
        return Response(profile_data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        # Update user profile
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Refresh user from database to get updated values
            user.refresh_from_db()
            
            # Return updated profile data
            updated_data = serializer.data
            updated_data.update({
                'full_name': user.name,
                'first_name': user.name.split()[0] if user.name else '',
                'last_name': ' '.join(user.name.split()[1:]) if user.name and len(user.name.split()) > 1 else '',
                'phone': user.mobile or '',
                'phone_number': user.mobile or '',
                'mobile': user.mobile or '',
                'address': user.address or '',
                'city': user.city or '',
                'state': user.state or '',
                'pincode': user.pincode or '',
                'postal_code': user.pincode or '',
                'zip_code': user.pincode or '',
            })
            
            return Response(updated_data, status=status.HTTP_200_OK)
        else:
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

