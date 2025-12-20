# Contact Model & Portal Signup Implementation

**Date:** December 20, 2025  
**Status:** ✅ COMPLETED

## Summary

Successfully implemented the Contact model with database integrity constraints and the portal signup API with transaction safety. Both tasks have been completed and thoroughly tested.

---

## TASK 1.2: Contact Model + DB Integrity ✅

### Implementation Details

#### Contact Model Structure

Created a comprehensive Contact model in `accounts/models.py` with the following fields:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BigAutoField | PRIMARY KEY | BIGSERIAL primary key |
| name | CharField(255) | NOT NULL | Contact name |
| type | CharField(10) | CHECK, INDEXED | customer, vendor, or both |
| email | EmailField(255) | INDEXED | Contact email |
| mobile | CharField(15) | NULLABLE, VALIDATED | Phone number |
| city | CharField(100) | NULLABLE | Location |
| state | CharField(100) | NULLABLE | Location |
| pincode | CharField(6) | NULLABLE, VALIDATED | 6-digit postal code |
| user_id | BigAutoField | FOREIGN KEY, NULLABLE, UNIQUE | One-to-one link to User |
| created_at | DateTimeField | AUTO | Creation timestamp |
| updated_at | DateTimeField | AUTO | Update timestamp |

#### Database Constraints ✅

1. **CHECK Constraint on type field**
   - Constraint name: `valid_contact_type`
   - Definition: `type IN ('customer', 'vendor', 'both')`
   - Status: ✅ Enforced at database level

2. **One-to-One Relationship with User**
   - Field: `user` (OneToOneField)
   - On Delete: SET_NULL
   - Nullable: Yes (contacts can exist without portal access)
   - Status: ✅ Enforced at database level

3. **Indexes**
   - `contact_type_idx`: Index on type field ✅
   - `contact_email_idx`: Index on email field ✅

#### Migration

- Migration file: `0003_contact_contact_valid_contact_type.py`
- Status: ✅ Applied successfully
- All constraints and indexes created correctly

#### Admin Configuration

Added ContactAdmin in `accounts/admin.py`:
- List display: name, type, email, mobile, user, created_at
- List filters: type, created_at
- Search fields: name, email, mobile
- Organized fieldsets for better UX

---

## TASK 1.3: Portal Signup Logic + DB Safety ✅

### Implementation Details

#### Portal Signup API Endpoint

**Endpoint:** `POST /api/accounts/signup/`  
**Permission:** AllowAny (public endpoint)  
**Authentication:** Returns JWT tokens on success

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "mobile": "+1234567890",  // optional
  "city": "Mumbai",  // optional
  "state": "Maharashtra",  // optional
  "pincode": "400001"  // optional
}
```

#### Response (Success - 201 Created)

```json
{
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "portal",
    "mobile": "+1234567890",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "created_at": "2025-12-20T06:30:00Z"
  },
  "contact": {
    "id": 1,
    "name": "John Doe",
    "type": "customer",
    "email": "john@example.com",
    "mobile": "+1234567890",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "user": 1,
    "created_at": "2025-12-20T06:30:00Z"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

#### Response (Error - 400 Bad Request)

```json
{
  "errors": {
    "email": ["User with this email already exists"],
    "password": ["Ensure this field has at least 8 characters."],
    "pincode": ["Pincode must contain only digits"]
  }
}
```

#### Transaction Safety ✅

**Implementation:**
```python
with transaction.atomic():
    # Create User with role='portal'
    user = User.objects.create_user(...)
    
    # Create Contact with type='customer'
    contact = Contact.objects.create(..., user=user)
```

**Benefits:**
- ✅ Both User and Contact are created atomically
- ✅ If Contact creation fails, User creation is rolled back
- ✅ Prevents orphan Users without Contacts
- ✅ Database integrity maintained

#### Validation

Created `PortalSignupSerializer` in `accounts/serializers.py`:

- **Required fields:** name, email, password
- **Optional fields:** mobile, city, state, pincode
- **Email validation:** Checks for duplicates, validates format
- **Password validation:** Minimum 8 characters
- **Pincode validation:** Must be exactly 6 digits
- **Mobile validation:** Regex pattern for phone numbers

#### URL Configuration

- Added `accounts/urls.py` with signup endpoint
- Integrated into main `appareldesk/urls.py` at `/api/accounts/`
- Full path: `POST /api/accounts/signup/`

---

## Test Results

### Contact Model Tests ✅

All tests passed successfully:

1. ✅ Table structure verified (11 columns with correct types)
2. ✅ CHECK constraint on type field enforced
3. ✅ Valid contact types (customer, vendor, both) accepted
4. ✅ Invalid contact types rejected at database level
5. ✅ Indexes on type and email fields created
6. ✅ One-to-one relationship with User works correctly
7. ✅ Duplicate user assignment prevented (one-to-one enforced)

### Portal Signup Tests ✅

All tests passed successfully:

1. ✅ Successful signup creates User with role='portal'
2. ✅ Successful signup creates Contact with type='customer'
3. ✅ User and Contact are linked via one-to-one relationship
4. ✅ Transaction rollback prevents orphan Users
5. ✅ Duplicate email validation works
6. ✅ Short password validation works
7. ✅ Invalid pincode validation works
8. ✅ JWT tokens generated on successful signup

### Transaction Safety Tests ✅

Verified that:
- ✅ When Contact creation fails, User creation is rolled back
- ✅ No orphan Users exist in database after failed transactions
- ✅ Database integrity maintained across all scenarios

---

## Files Created/Modified

### Created Files:
1. `accounts/serializers.py` - Serializers for User, Contact, and signup validation
2. `accounts/urls.py` - URL configuration for accounts app
3. `accounts/migrations/0003_contact_contact_valid_contact_type.py` - Contact model migration
4. `test_contact_and_signup.py` - Comprehensive test suite
5. `test_signup_direct.py` - Direct signup logic tests
6. `CONTACT_AND_SIGNUP_IMPLEMENTATION.md` - This documentation

### Modified Files:
1. `accounts/models.py` - Added Contact model
2. `accounts/views.py` - Added portal_signup view
3. `accounts/admin.py` - Added ContactAdmin configuration
4. `appareldesk/urls.py` - Integrated accounts URLs

---

## Database Schema

### contacts Table

```sql
CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(15),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(6),
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    CONSTRAINT valid_contact_type CHECK (type IN ('customer', 'vendor', 'both'))
);

CREATE INDEX contact_type_idx ON contacts(type);
CREATE INDEX contact_email_idx ON contacts(email);
```

---

## API Usage Examples

### Successful Signup

```bash
curl -X POST http://localhost:8000/api/accounts/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "mobile": "+1234567890",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }'
```

### Using JWT Token

```bash
# Use the access token from signup response
curl -X GET http://localhost:8000/api/some-protected-endpoint/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

---

## Requirements Validation

### TASK 1.2 Requirements ✅

- ✅ Contact model with BIGSERIAL primary key
- ✅ Fields: name, type, email, mobile, city, state, pincode
- ✅ user_id as OneToOne FK (nullable)
- ✅ ONE-TO-ONE relationship enforced at database level
- ✅ type CHECK constraint (customer, vendor, both)
- ✅ Indexes on type and email fields

### TASK 1.3 Requirements ✅

- ✅ User created with role='portal'
- ✅ Contact auto-created with type='customer'
- ✅ User & Contact creation wrapped in DB transaction
- ✅ Orphan Users prevented (transaction rollback on error)
- ✅ JWT tokens returned on successful signup
- ✅ Comprehensive validation (email, password, pincode)

---

## Conclusion

Both tasks have been successfully implemented with:
- ✅ Complete database integrity constraints
- ✅ Transaction safety for atomic operations
- ✅ Comprehensive validation
- ✅ Thorough testing (100% pass rate)
- ✅ Clean, maintainable code
- ✅ Proper documentation

The Contact model and portal signup API are production-ready and fully tested.
