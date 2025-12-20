# Environment Variables Documentation

This document describes all environment variables used in the ApparelDesk backend application.

## Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` according to your environment

3. **NEVER** commit `.env` to version control (it's in `.gitignore`)

## Required Environment Variables

### Django Core Settings

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `SECRET_KEY` | Django secret key for cryptographic signing | None | ✅ Yes | `django-insecure-xyz123...` |
| `DEBUG` | Enable/disable debug mode | `False` | ✅ Yes | `True` (dev), `False` (prod) |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts | Empty | ✅ Yes | `localhost,127.0.0.1,example.com` |

**Security Notes:**
- Generate a secure `SECRET_KEY` for production using:
  ```python
  python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
  ```
- Always set `DEBUG=False` in production
- Configure proper `ALLOWED_HOSTS` for your domain

### CORS Settings

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:3000,http://127.0.0.1:3000` | ✅ Yes | `http://localhost:3000,https://app.example.com` |

**Notes:**
- Include all frontend URLs that will access the API
- Use HTTPS URLs in production
- Port 3000 is for React dev server, 5173 is for Vite dev server

### Database Settings (PostgreSQL)

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `DB_NAME` | PostgreSQL database name | `appareldesk_db` | ✅ Yes | `appareldesk_db` |
| `DB_USER` | PostgreSQL username | `postgres` | ✅ Yes | `appareldesk_admin` |
| `DB_PASSWORD` | PostgreSQL password | Empty | ✅ Yes | `secure_password_123` |
| `DB_HOST` | PostgreSQL host | `localhost` | ✅ Yes | `localhost` or `db.example.com` |
| `DB_PORT` | PostgreSQL port | `5432` | ✅ Yes | `5432` |

**Database Requirements:**
- PostgreSQL 12 or higher
- UTF8 encoding
- Database must be created before running migrations

**Setup Commands:**
```bash
# Create database (run in PostgreSQL)
CREATE DATABASE appareldesk_db;
CREATE USER appareldesk_admin WITH PASSWORD 'admin@123';
GRANT ALL PRIVILEGES ON DATABASE appareldesk_db TO appareldesk_admin;
```

### Razorpay Payment Gateway

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `RAZORPAY_API_KEY` | Razorpay API key | Empty | ✅ Yes | `rzp_test_RtqzLjqLxzOjqC` |
| `RAZORPAY_API_SECRET` | Razorpay API secret | Empty | ✅ Yes | `FX5iZ97nhL6Mb5wcUZpyoZ8A` |
| `RAZORPAY_TEST_MODE` | Enable test mode | `True` | ✅ Yes | `True` (dev), `False` (prod) |

**Razorpay Setup:**
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get test credentials from [API Keys page](https://dashboard.razorpay.com/app/keys)
3. For production, generate live credentials and set `RAZORPAY_TEST_MODE=False`

**Test Mode:**
- Use test credentials (starting with `rzp_test_`)
- No real money is charged
- Test cards: https://razorpay.com/docs/payments/payments/test-card-details/
- Example test card: 4111 1111 1111 1111, any CVV, any future expiry

**Production Mode:**
- Use live credentials (starting with `rzp_live_`)
- Real money transactions
- Complete KYC verification required
- Set `RAZORPAY_TEST_MODE=False`

## Application Configuration (settings.py)

The following configurations are set in `settings.py` and don't require environment variables:

### JWT Authentication
- Access token lifetime: 60 minutes
- Refresh token lifetime: 7 days
- Token rotation enabled
- Blacklist after rotation enabled

### REST Framework
- Authentication: JWT (JSON Web Tokens)
- Pagination: 20 items per page
- Filtering: Django filters, search, ordering
- Schema: OpenAPI 3.0 (drf-spectacular)

### Installed Apps
- Django core apps
- Django REST Framework
- JWT authentication
- CORS headers
- Django filters
- DRF Spectacular (OpenAPI/Swagger)
- Custom apps: accounts, products

## Environment-Specific Configurations

### Development Environment
```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
RAZORPAY_TEST_MODE=True
DB_HOST=localhost
```

### Production Environment
```env
DEBUG=False
ALLOWED_HOSTS=api.example.com,www.example.com
RAZORPAY_TEST_MODE=False
DB_HOST=production-db-host.example.com
SECRET_KEY=<strong-random-secret-key>
```

## Security Best Practices

1. **Never commit `.env` to version control**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Use strong passwords**
   - Database passwords
   - Secret keys
   - API secrets

3. **Rotate credentials regularly**
   - Change `SECRET_KEY` periodically
   - Rotate database passwords
   - Update API keys if compromised

4. **Production checklist**
   - [ ] `DEBUG=False`
   - [ ] Strong `SECRET_KEY`
   - [ ] Proper `ALLOWED_HOSTS`
   - [ ] HTTPS enabled
   - [ ] Production database credentials
   - [ ] Live Razorpay credentials
   - [ ] Secure database password
   - [ ] Environment variables in secure vault

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials
- Ensure database exists
- Verify network connectivity to DB host

### CORS Errors
- Add frontend URL to `CORS_ALLOWED_ORIGINS`
- Include protocol (http/https) and port
- Restart Django server after changes

### Razorpay Payment Failures
- Verify API credentials are correct
- Check test mode setting matches credentials
- Ensure test cards are used in test mode
- Check Razorpay dashboard for errors

### JWT Token Issues
- Tokens expire after 60 minutes
- Use refresh token to get new access token
- Check token format: `Bearer <token>`
- Verify token is not blacklisted

## Additional Resources

- [Django Settings Documentation](https://docs.djangoproject.com/en/4.2/ref/settings/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Razorpay Documentation](https://razorpay.com/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
