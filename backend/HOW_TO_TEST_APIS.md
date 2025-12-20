# How to Test APIs in Django

This guide shows you how to test your Django REST Framework APIs.

## Quick Start

### 1. Run All Tests
```cmd
cd Odoo-x-SPIT-Hackathon-2025---Final-Round\backend
venv\Scripts\activate
pytest
```

### 2. Run Specific Test File
```cmd
pytest tests/test_api_signup.py
```

### 3. Run with Verbose Output
```cmd
pytest -v
```

## Testing APIs - The Basics

### What You Need
- `pytest` - Test framework
- `pytest-django` - Django integration for pytest
- `rest_framework.test.APIClient` - Makes HTTP requests to your API

### Basic API Test Structure

```python
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    """Create an API client for making requests."""
    return APIClient()


@pytest.mark.django_db
class TestYourAPI:
    """Test your API endpoint."""
    
    def test_successful_request(self, api_client):
        """Test a successful API call."""
        # 1. Get the URL
        url = reverse('app_name:endpoint_name')
        
        # 2. Prepare data
        data = {
            'field1': 'value1',
            'field2': 'value2'
        }
        
        # 3. Make the request
        response = api_client.post(url, data, format='json')
        
        # 4. Assert the response
        assert response.status_code == status.HTTP_201_CREATED
        assert 'expected_field' in response.data
        assert response.data['expected_field'] == 'expected_value'
```

## HTTP Methods

### POST Request (Create)
```python
response = api_client.post(url, data, format='json')
```

### GET Request (Read)
```python
response = api_client.get(url)
```

### PUT Request (Update - Full)
```python
response = api_client.put(url, data, format='json')
```

### PATCH Request (Update - Partial)
```python
response = api_client.patch(url, data, format='json')
```

### DELETE Request
```python
response = api_client.delete(url)
```

## Common Test Patterns

### 1. Test Successful Creation
```python
def test_create_resource(self, api_client):
    url = reverse('accounts:portal_signup')
    data = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'securepass123'
    }
    
    response = api_client.post(url, data, format='json')
    
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data['user']['email'] == 'john@example.com'
```

### 2. Test Validation Errors
```python
def test_missing_required_field(self, api_client):
    url = reverse('accounts:portal_signup')
    data = {
        'email': 'john@example.com'
        # Missing 'name' and 'password'
    }
    
    response = api_client.post(url, data, format='json')
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'errors' in response.data
```

### 3. Test Duplicate Prevention
```python
def test_duplicate_email(self, api_client):
    # Create first user
    User.objects.create_user(
        email='existing@example.com',
        password='pass123',
        name='Existing User'
    )
    
    # Try to create duplicate
    url = reverse('accounts:portal_signup')
    data = {
        'name': 'New User',
        'email': 'existing@example.com',
        'password': 'newpass123'
    }
    
    response = api_client.post(url, data, format='json')
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
```

### 4. Test Authentication
```python
def test_authenticated_request(self, api_client):
    # Create and login user
    user = User.objects.create_user(
        email='user@example.com',
        password='pass123',
        name='Test User'
    )
    api_client.force_authenticate(user=user)
    
    # Make authenticated request
    url = reverse('some:protected_endpoint')
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
```

### 5. Test Database Changes
```python
def test_creates_database_record(self, api_client):
    url = reverse('accounts:portal_signup')
    data = {
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'pass123'
    }
    
    response = api_client.post(url, data, format='json')
    
    # Verify database record was created
    assert User.objects.filter(email='john@example.com').exists()
    user = User.objects.get(email='john@example.com')
    assert user.name == 'John Doe'
```

## Status Codes Reference

```python
from rest_framework import status

# Success
status.HTTP_200_OK                  # GET, PUT, PATCH success
status.HTTP_201_CREATED             # POST success
status.HTTP_204_NO_CONTENT          # DELETE success

# Client Errors
status.HTTP_400_BAD_REQUEST         # Validation error
status.HTTP_401_UNAUTHORIZED        # Not authenticated
status.HTTP_403_FORBIDDEN           # Not authorized
status.HTTP_404_NOT_FOUND           # Resource not found

# Server Errors
status.HTTP_500_INTERNAL_SERVER_ERROR  # Server error
```

## Testing Your Signup API

Here's a complete example for testing the portal signup endpoint:

```python
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User, Contact


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestPortalSignup:
    
    def test_successful_signup(self, api_client):
        """Test successful user signup."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'securepass123',
            'mobile': '+1234567890',
            'city': 'Mumbai'
        }
        
        response = api_client.post(url, data, format='json')
        
        # Check response
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'contact' in response.data
        assert 'tokens' in response.data
        
        # Check user data
        assert response.data['user']['email'] == 'john@example.com'
        assert response.data['user']['role'] == 'portal'
        
        # Check database
        assert User.objects.filter(email='john@example.com').exists()
        assert Contact.objects.filter(email='john@example.com').exists()
    
    def test_duplicate_email_fails(self, api_client):
        """Test that duplicate email is rejected."""
        # Create existing user
        User.objects.create_user(
            email='existing@example.com',
            password='pass123',
            name='Existing User'
        )
        
        # Try to create duplicate
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'New User',
            'email': 'existing@example.com',
            'password': 'newpass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
```

## Running Tests

### Run all tests
```cmd
pytest
```

### Run specific file
```cmd
pytest tests/test_api_signup.py
```

### Run specific test class
```cmd
pytest tests/test_api_signup.py::TestPortalSignup
```

### Run specific test method
```cmd
pytest tests/test_api_signup.py::TestPortalSignup::test_successful_signup
```

### Run with output
```cmd
pytest -v -s
```

### Run and stop on first failure
```cmd
pytest -x
```

## Tips

1. **Always use `@pytest.mark.django_db`** - Required for tests that access the database
2. **Use fixtures** - Create reusable test data with `@pytest.fixture`
3. **Test both success and failure** - Test happy path and error cases
4. **Check database state** - Verify records are created/updated/deleted
5. **Use descriptive test names** - Name tests like `test_what_when_expected`
6. **Test one thing per test** - Keep tests focused and simple

## Alternative: Manual API Testing

You can also test APIs manually using tools like:

### 1. Postman
- Download from https://www.postman.com/
- Create requests with headers, body, etc.
- Save and organize API calls

### 2. cURL (Command Line)
```cmd
curl -X POST http://localhost:8000/api/accounts/signup/ ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"pass123\"}"
```

### 3. HTTPie (Command Line - Simpler)
```cmd
http POST http://localhost:8000/api/accounts/signup/ name="John Doe" email="john@example.com" password="pass123"
```

### 4. Django REST Framework Browsable API
- Start your server: `python manage.py runserver`
- Visit: `http://localhost:8000/api/accounts/signup/`
- Use the web interface to test

## Next Steps

1. Write tests for all your API endpoints
2. Run tests before committing code
3. Add tests to your CI/CD pipeline
4. Aim for high test coverage (80%+)
