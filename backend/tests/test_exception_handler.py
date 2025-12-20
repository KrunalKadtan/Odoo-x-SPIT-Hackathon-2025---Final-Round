"""
Unit tests for custom exception handler.

Tests verify that the custom exception handler formats error responses
consistently across different error types.

Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
"""
import pytest
from rest_framework.test import APIRequestFactory
from rest_framework.exceptions import ValidationError, AuthenticationFailed, PermissionDenied, NotFound
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.http import Http404
from products.exceptions import custom_exception_handler


@pytest.mark.django_db
class TestCustomExceptionHandler:
    """Test custom exception handler."""
    
    def test_validation_error_format(self):
        """
        Test that ValidationError returns 400 with detailed error messages.
        Requirement: 17.1
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = ValidationError({'field': ['This field is required']})
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert 'field_errors' in response.data
        assert response.data['error'] == 'Validation failed'
    
    def test_not_found_error_format(self):
        """
        Test that NotFound returns 404 with error message.
        Requirement: 17.2
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = NotFound('Resource not found')
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
        assert response.data['error'] == 'Resource not found'
    
    def test_authentication_error_format(self):
        """
        Test that AuthenticationFailed returns 401 with error message.
        Requirement: 17.3
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = AuthenticationFailed('Invalid token')
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'error' in response.data
        assert response.data['error'] == 'Authentication failed'
    
    def test_permission_error_format(self):
        """
        Test that PermissionDenied returns 403 with error message.
        Requirement: 17.4
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = PermissionDenied('You do not have permission')
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'error' in response.data
        assert response.data['error'] == 'Permission denied'
    
    def test_generic_error_format(self):
        """
        Test that generic exceptions return 500 with error details.
        Requirement: 17.5
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = Exception('Generic error')
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert 'error' in response.data
        assert response.data['error'] == 'Internal server error'
    
    def test_integrity_error_format(self):
        """
        Test that IntegrityError returns 400 with constraint details.
        Requirement: 17.6
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = IntegrityError('UNIQUE constraint failed')
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert response.data['error'] == 'Database constraint violation'
        assert 'detail' in response.data
    
    def test_django_validation_error_format(self):
        """
        Test that Django ValidationError returns 400 with error message.
        Requirement: 17.1
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = DjangoValidationError('Django validation error')
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert response.data['error'] == 'Validation failed'
    
    def test_http404_error_format(self):
        """
        Test that Http404 returns 404 with error message.
        Requirement: 17.2
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = Http404('Page not found')
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'error' in response.data
        assert response.data['error'] == 'Resource not found'
    
    def test_validation_error_with_list_format(self):
        """
        Test that ValidationError with list format is handled correctly.
        Requirement: 17.1
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = ValidationError(['Error 1', 'Error 2'])
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert response.data['error'] == 'Validation failed'
    
    def test_django_validation_error_with_message_dict(self):
        """
        Test that Django ValidationError with message_dict is handled correctly.
        Requirement: 17.1
        """
        factory = APIRequestFactory()
        request = factory.get('/')
        
        exc = DjangoValidationError({'field1': ['Error 1'], 'field2': ['Error 2']})
        response = custom_exception_handler(exc, {'request': request})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
        assert 'field_errors' in response.data
        assert response.data['error'] == 'Validation failed'

