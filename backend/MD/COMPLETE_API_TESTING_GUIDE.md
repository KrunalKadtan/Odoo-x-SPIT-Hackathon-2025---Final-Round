# Complete API Testing Guide for ApparelDesk

This guide shows you how to test ALL APIs in your backend, both automatically with pytest and manually.

## Quick Start - Test Everything

```cmd
cd Odoo-x-SPIT-Hackathon-2025---Final-Round\backend
venv\Scripts\activate
pytest -v
```

---

## Available APIs in Your Backend

### 1. Portal Signup API
- **Endpoint**: `POST /api/accounts/signup/`
- **Purpose**: Register new portal users (customers)
- **Authentication**: None required

### 2. JWT Token Obtain API
- **Endpoint**: `POST /api/token/`
- **Purpose**: Login and get access/refresh tokens
- **Authentication**: None required

### 3. JWT Token Refresh API
- **Endpoint**: `POST /api/token/refresh/`
- **Purpose**: Get new access token using refresh token
- **Authentication**: Refresh token required

---

## Method 1: Automated Testing with Pytest (Recommended)

### Step 1: Activate Virtual Environment
```cmd
cd Odoo-x-SPIT-Hackathon-2025---Final-Round\backend
venv\Scripts\activate
```

### Step 2: Run All Tests
```cmd
pytest -v
```

### Step 3: Run Specific Test Files
```cmd
# Test signup API
pytest tests/test_api_signup.py -v

# Test all tests in tests directory
pytest tests/ -v

# Test with detailed output
pytest -v -s
```

### Create Complete Test Suite

Create a new file `tests/test_all_apis.py`:

```python
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User, Contact


@pytest.fixture
def api_client():
    """Create an API client for making requests."""
    return APIClient()


@pytest.fixture
def test_user(db):
    """Create a test user for authentication tests."""
    return User.objects.create_user(
        email='testuser@example.com',
        password='testpass123',
        name='Test User',
        role='portal'
    )


@pytest.mark.django_db
class TestPortalSignupAPI:
    """Test the portal signup endpoint."""
    
    def test_successful_signup(self, api_client):
        """Test successful user registration."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'password': 'securepass123',
            'mobile': '+1234567890',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'pincode': '400001'
        }
        
        response = api_client.post(url, data, format='json')
        
        # Check response status
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check response structure
        assert 'user' in response.data
        assert 'contact' in response.data
        assert 'tokens' in response.data
        
        # Check user data
        assert response.data['user']['email'] == 'john@example.com'
        assert response.data['user']['name'] == 'John Doe'
        assert response.data['user']['role'] == 'portal'
        
        # Check contact data
        assert response.data['contact']['email'] == 'john@example.com'
        assert response.data['contact']['type'] == 'customer'
        
        # Check tokens
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
        
        # Verify database records
        assert User.objects.filter(email='john@example.com').exists()
        assert Contact.objects.filter(email='john@example.com').exists()
    
    def test_signup_with_minimal_data(self, api_client):
        """Test signup with only required fields."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Jane Doe',
            'email': 'jane@example.com',
            'password': 'securepass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['email'] == 'jane@example.com'
    
    def test_signup_duplicate_email(self, api_client, test_user):
        """Test that duplicate email is rejected."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Another User',
            'email': 'testuser@example.com',  # Already exists
            'password': 'newpass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
    
    def test_signup_missing_required_fields(self, api_client):
        """Test validation for missing required fields."""
        url = reverse('accounts:portal_signup')
        
        # Missing name
        response = api_client.post(url, {
            'email': 'test@example.com',
            'password': 'pass123'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Missing email
        response = api_client.post(url, {
            'name': 'Test User',
            'password': 'pass123'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Missing password
        response = api_client.post(url, {
            'name': 'Test User',
            'email': 'test@example.com'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_signup_invalid_email(self, api_client):
        """Test validation for invalid email format."""
        url = reverse('accounts:portal_signup')
        data = {
            'name': 'Test User',
            'email': 'not-an-email',
            'password': 'pass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestJWTTokenAPI:
    """Test JWT token authentication endpoints."""
    
    def test_obtain_token_success(self, api_client, test_user):
        """Test successful token generation."""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'testuser@example.com',
            'password': 'testpass123'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_obtain_token_wrong_password(self, api_client, test_user):
        """Test token generation with wrong password."""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'testuser@example.com',
            'password': 'wrongpassword'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_obtain_token_nonexistent_user(self, api_client):
        """Test token generation for non-existent user."""
        url = reverse('token_obtain_pair')
        data = {
            'email': 'nonexistent@example.com',
            'password': 'somepassword'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_refresh_token_success(self, api_client, test_user):
        """Test successful token refresh."""
        # First, get tokens
        obtain_url = reverse('token_obtain_pair')
        obtain_data = {
            'email': 'testuser@example.com',
            'password': 'testpass123'
        }
        obtain_response = api_client.post(obtain_url, obtain_data, format='json')
        refresh_token = obtain_response.data['refresh']
        
        # Now refresh the token
        refresh_url = reverse('token_refresh')
        refresh_data = {
            'refresh': refresh_token
        }
        
        response = api_client.post(refresh_url, refresh_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
    
    def test_refresh_token_invalid(self, api_client):
        """Test token refresh with invalid token."""
        url = reverse('token_refresh')
        data = {
            'refresh': 'invalid-token-string'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestAuthenticationFlow:
    """Test complete authentication flow."""
    
    def test_signup_and_login_flow(self, api_client):
        """Test complete flow: signup -> login -> use token."""
        # Step 1: Signup
        signup_url = reverse('accounts:portal_signup')
        signup_data = {
            'name': 'Flow Test User',
            'email': 'flowtest@example.com',
            'password': 'flowpass123'
        }
        
        signup_response = api_client.post(signup_url, signup_data, format='json')
        assert signup_response.status_code == status.HTTP_201_CREATED
        
        # Tokens are returned immediately after signup
        access_token = signup_response.data['tokens']['access']
        refresh_token = signup_response.data['tokens']['refresh']
        
        assert access_token is not None
        assert refresh_token is not None
        
        # Step 2: Login again (optional, but testing it)
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'flowtest@example.com',
            'password': 'flowpass123'
        }
        
        login_response = api_client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK
        assert 'access' in login_response.data
        
        # Step 3: Refresh token
        refresh_url = reverse('token_refresh')
        refresh_data = {
            'refresh': refresh_token
        }
        
        refresh_response = api_client.post(refresh_url, refresh_data, format='json')
        assert refresh_response.status_code == status.HTTP_200_OK
        assert 'access' in refresh_response.data
```

### Run the Complete Test Suite

```cmd
# Save the above code to tests/test_all_apis.py, then run:
pytest tests/test_all_apis.py -v
```

---

## Method 2: Manual Testing with Django Server

### Step 1: Start the Server
```cmd
cd Odoo-x-SPIT-Hackathon-2025---Final-Round\backend
venv\Scripts\activate
python manage.py runserver
```

### Step 2: Use Django REST Framework Browsable API

Open your browser and visit:

1. **Signup API**: http://localhost:8000/api/accounts/signup/
2. **Token Obtain**: http://localhost:8000/api/token/
3. **Token Refresh**: http://localhost:8000/api/token/refresh/

You can test directly in the browser using the forms provided.

---

## Method 3: Manual Testing with cURL

### Test Signup API
```cmd
curl -X POST http://localhost:8000/api/accounts/signup/ ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"securepass123\",\"mobile\":\"+1234567890\",\"city\":\"Mumbai\"}"
```

### Test Token Obtain (Login)
```cmd
curl -X POST http://localhost:8000/api/token/ ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"securepass123\"}"
```

### Test Token Refresh
```cmd
curl -X POST http://localhost:8000/api/token/refresh/ ^
  -H "Content-Type: application/json" ^
  -d "{\"refresh\":\"YOUR_REFRESH_TOKEN_HERE\"}"
```

---

## Method 4: Manual Testing with Postman

### Setup Postman Collection

1. **Download Postman**: https://www.postman.com/downloads/

2. **Create a new collection** called "ApparelDesk APIs"

3. **Add requests**:

#### Request 1: Portal Signup
- **Method**: POST
- **URL**: `http://localhost:8000/api/accounts/signup/`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "mobile": "+1234567890",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
}
```

#### Request 2: Login (Token Obtain)
- **Method**: POST
- **URL**: `http://localhost:8000/api/token/`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
    "email": "john@example.com",
    "password": "securepass123"
}
```

#### Request 3: Token Refresh
- **Method**: POST
- **URL**: `http://localhost:8000/api/token/refresh/`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
    "refresh": "YOUR_REFRESH_TOKEN_FROM_LOGIN"
}
```

---

## Testing Checklist

Use this checklist to ensure all APIs are tested:

### Portal Signup API (`/api/accounts/signup/`)
- [ ] Successful signup with all fields
- [ ] Successful signup with only required fields
- [ ] Duplicate email rejection
- [ ] Missing required fields validation
- [ ] Invalid email format validation
- [ ] User record created in database
- [ ] Contact record created in database
- [ ] Tokens returned in response

### Token Obtain API (`/api/token/`)
- [ ] Successful login with correct credentials
- [ ] Failed login with wrong password
- [ ] Failed login with non-existent email
- [ ] Access and refresh tokens returned

### Token Refresh API (`/api/token/refresh/`)
- [ ] Successful token refresh with valid refresh token
- [ ] Failed refresh with invalid token
- [ ] New access token returned

---

## Common Issues and Solutions

### Issue 1: Tests fail with database errors
**Solution**: Make sure you're using `@pytest.mark.django_db` decorator

### Issue 2: Import errors
**Solution**: Ensure you're in the backend directory and virtual environment is activated

### Issue 3: Server not starting
**Solution**: Check if another process is using port 8000
```cmd
# Kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### Issue 4: Token refresh fails
**Solution**: Make sure you're using the refresh token, not the access token

---

## Next Steps

1. **Run the automated tests**: `pytest -v`
2. **Check test coverage**: `pytest --cov=accounts --cov=products`
3. **Add more tests** as you build more APIs
4. **Set up CI/CD** to run tests automatically

---

## Summary

You have **3 working APIs**:
1. ✅ Portal Signup - Creates users and contacts
2. ✅ Token Obtain - Login and get JWT tokens
3. ✅ Token Refresh - Refresh access tokens

**Recommended testing approach**:
- Use **pytest** for automated testing (fastest and most reliable)
- Use **Postman** for manual testing and API exploration
- Use **Django browsable API** for quick checks

Run `pytest -v` now to test everything!
