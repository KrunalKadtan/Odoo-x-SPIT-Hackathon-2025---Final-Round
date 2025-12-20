"""
Custom exception handler for ApparelDesk REST APIs.

This module provides a custom exception handler that formats error responses
consistently across all API endpoints.

Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
"""

from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError, AuthenticationFailed, PermissionDenied, NotFound
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.http import Http404


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error response format.
    
    Handles:
    - ValidationError (400 Bad Request)
    - AuthenticationFailed (401 Unauthorized)
    - PermissionDenied (403 Forbidden)
    - NotFound/Http404 (404 Not Found)
    - IntegrityError (400 Bad Request with constraint details)
    - Generic exceptions (500 Internal Server Error)
    
    Response format:
    {
        "error": "Error message",
        "detail": "Detailed error information (optional)",
        "field_errors": {"field": ["error1", "error2"]} (for validation errors)
    }
    
    Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
    """
    # Call DRF's default exception handler first to get the standard error response
    response = exception_handler(exc, context)
    
    # If DRF handled the exception, customize the response format
    if response is not None:
        custom_response_data = {}
        
        # Handle ValidationError (400 Bad Request)
        if isinstance(exc, ValidationError):
            # Requirement 17.1: Return 400 with detailed error messages
            if isinstance(response.data, dict):
                # Check if it's field-specific errors
                if any(isinstance(v, list) for v in response.data.values()):
                    custom_response_data['error'] = 'Validation failed'
                    custom_response_data['field_errors'] = response.data
                else:
                    # Non-field errors
                    custom_response_data['error'] = response.data.get('detail', 'Validation failed')
                    if 'detail' in response.data:
                        del response.data['detail']
                    if response.data:
                        custom_response_data['field_errors'] = response.data
            elif isinstance(response.data, list):
                custom_response_data['error'] = 'Validation failed'
                custom_response_data['detail'] = response.data
            else:
                custom_response_data['error'] = str(response.data)
            
            response.data = custom_response_data
        
        # Handle AuthenticationFailed (401 Unauthorized)
        elif isinstance(exc, AuthenticationFailed):
            # Requirement 17.3: Return 401 Unauthorized
            custom_response_data['error'] = 'Authentication failed'
            custom_response_data['detail'] = str(exc)
            response.data = custom_response_data
        
        # Handle PermissionDenied (403 Forbidden)
        elif isinstance(exc, PermissionDenied):
            # Requirement 17.4: Return 403 Forbidden
            custom_response_data['error'] = 'Permission denied'
            custom_response_data['detail'] = str(exc) if str(exc) else 'You do not have permission to perform this action'
            response.data = custom_response_data
        
        # Handle NotFound (404 Not Found)
        elif isinstance(exc, (NotFound, Http404)):
            # Requirement 17.2: Return 404 Not Found
            custom_response_data['error'] = 'Resource not found'
            custom_response_data['detail'] = str(exc) if str(exc) else 'The requested resource was not found'
            response.data = custom_response_data
        
        # Handle other DRF exceptions
        else:
            if hasattr(response.data, 'get'):
                detail = response.data.get('detail', str(exc))
            else:
                detail = str(exc)
            
            custom_response_data['error'] = detail
            response.data = custom_response_data
        
        return response
    
    # Handle Django ValidationError (not caught by DRF)
    if isinstance(exc, DjangoValidationError):
        # Requirement 17.1: Return 400 with detailed error messages
        custom_response_data = {
            'error': 'Validation failed'
        }
        
        if hasattr(exc, 'message_dict'):
            custom_response_data['field_errors'] = exc.message_dict
        elif hasattr(exc, 'messages'):
            custom_response_data['detail'] = exc.messages
        else:
            custom_response_data['detail'] = str(exc)
        
        return Response(custom_response_data, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle IntegrityError (database constraints)
    if isinstance(exc, IntegrityError):
        # Requirement 17.6: Return 400 with constraint details
        error_message = str(exc)
        
        # Extract constraint name if available
        constraint_name = None
        if 'UNIQUE constraint' in error_message:
            constraint_name = 'unique_constraint'
            error_detail = 'A record with this value already exists'
        elif 'FOREIGN KEY constraint' in error_message:
            constraint_name = 'foreign_key_constraint'
            error_detail = 'Referenced record does not exist'
        elif 'NOT NULL constraint' in error_message:
            constraint_name = 'not_null_constraint'
            error_detail = 'Required field cannot be null'
        elif 'CHECK constraint' in error_message:
            constraint_name = 'check_constraint'
            error_detail = 'Value does not meet constraint requirements'
        else:
            error_detail = 'Database constraint violation'
        
        custom_response_data = {
            'error': 'Database constraint violation',
            'detail': error_detail
        }
        
        if constraint_name:
            custom_response_data['constraint_type'] = constraint_name
        
        # Include original error in debug mode (be careful with sensitive data)
        # In production, you might want to log this instead
        custom_response_data['database_error'] = error_message
        
        return Response(custom_response_data, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle Http404 (Django's 404)
    if isinstance(exc, Http404):
        # Requirement 17.2: Return 404 Not Found
        custom_response_data = {
            'error': 'Resource not found',
            'detail': str(exc) if str(exc) else 'The requested resource was not found'
        }
        return Response(custom_response_data, status=status.HTTP_404_NOT_FOUND)
    
    # Handle all other exceptions (500 Internal Server Error)
    # Requirement 17.5: Return 500 with error details
    custom_response_data = {
        'error': 'Internal server error',
        'detail': str(exc)
    }
    
    # In production, you might want to log the full exception and return a generic message
    # For development, we include the exception details
    return Response(custom_response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
