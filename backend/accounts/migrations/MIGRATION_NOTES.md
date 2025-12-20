# Migration 0002: Enhanced User Model

## Overview

This migration transforms the User model from AbstractUser to AbstractBaseUser with enhanced identity fields, role management, and database-level constraints.

## Migration Steps

### 1. Add New Fields
- `name` (CharField): User's full name
- `role` (CharField): User classification ('internal' or 'portal') with index
- `mobile` (CharField): Phone number with regex validation
- `city`, `state`, `pincode` (CharField): Location fields (nullable)
- `created_at`, `updated_at` (DateTimeField): Automatic timestamps

### 2. Data Migration
**Function: `migrate_user_data()`**
- Combines `first_name` and `last_name` into `name` field
- Falls back to email if name is empty
- Sets `role` based on `is_staff` flag:
  - `is_staff=True` → `role='internal'`
  - `is_staff=False` → `role='portal'`

**Reverse Function: `reverse_migrate_user_data()`**
- Splits `name` back into `first_name` and `last_name` for rollback

### 3. Field Alterations
- Make `email` unique and indexed
- Update `id` field serialization
- Simplify `is_active`, `is_staff`, `password` field definitions

### 4. Database Constraints
- **CHECK Constraint**: `valid_role` ensures role is 'internal' or 'portal'
- **UNIQUE Constraint**: Email must be unique (via field definition)

### 5. Database Indexes
- `user_email_idx`: Index on email field for fast lookups
- `user_role_idx`: Index on role field for filtering

### 6. Model Configuration
- Update Meta options (verbose names)
- Change model managers (remove default UserManager)

### 7. Remove Old Fields
- Remove `username` (replaced by email as USERNAME_FIELD)
- Remove `first_name` and `last_name` (replaced by name)
- Remove `date_joined` (replaced by created_at)

## Requirements Validated

This migration satisfies the following requirements:
- **6.1**: Preserves existing user data during transition
- **6.2**: Adds new fields with appropriate defaults
- **6.3**: Creates database constraints (UNIQUE, CHECK, indexes)
- **6.4**: Handles username-based to email-based authentication transition
- **6.5**: Database reflects all new constraints and indexes after migration

## Safety Considerations

1. **Data Preservation**: Data migration happens BEFORE field removal
2. **Reversibility**: Includes reverse migration function
3. **Default Values**: All new required fields have defaults or are populated via data migration
4. **Constraint Timing**: Constraints added after data is migrated and cleaned

## Testing Recommendations

Before applying to production:
1. Backup database
2. Test on development/staging environment
3. Verify all existing users migrate correctly
4. Check that email uniqueness doesn't cause conflicts
5. Ensure role values are set correctly based on is_staff

## Applying the Migration

```bash
# Check migration plan
python manage.py migrate --plan

# Apply migration
python manage.py migrate

# Verify database state
python manage.py shell
>>> from accounts.models import User
>>> User.objects.first()  # Check fields
```

## Rollback

If needed, rollback to previous state:
```bash
python manage.py migrate accounts 0001_initial
```

Note: Rollback will restore first_name/last_name from name field via reverse migration function.
