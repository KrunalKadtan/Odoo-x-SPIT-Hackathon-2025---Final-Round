from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer, PortalSignupSerializer
from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user profile data"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user profile data to the response
        user_serializer = UserProfileSerializer(self.user)
        data['profile_data'] = user_serializer.data
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that includes user profile data in the response"""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
def portal_signup(request):
    """Handle portal user signup"""
    serializer = PortalSignupSerializer(data=request.data)
    
    if serializer.is_valid():
        # Create user
        user_data = serializer.validated_data
        password = user_data.pop('password')
        
        user = User.objects.create(**user_data)
        user.set_password(password)
        user.save()
        
        return Response({
            'message': 'User created successfully',
            'user_id': user.id
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Handle user profile operations"""
    user = request.user
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)