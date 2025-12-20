# Implementation Plan: Codebase Merge

## Overview

This plan outlines the step-by-step approach to merge the `project-aarav/` codebase into `new/`, preserving the frontend from `new/` while integrating all backend functionality from both projects. The merge follows an additive strategy: keep everything from `new/` and add missing features from `project-aarav/`.

## Tasks

- [x] 1. Analyze and document codebase differences
  - Compare Django apps, models, views, and serializers between both projects
  - Identify unique features in `project-aarav/` that need to be ported
  - Document API endpoint differences
  - Create a feature matrix showing what exists where
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Merge Django models
  - [x] 2.1 Port missing models from `project-aarav/` to `new/`
    - Add `PurchaseOrder` model if missing
    - Add `SystemSettings` model if missing
    - Add any other unique models
    - _Requirements: 3.2_

  - [x] 2.2 Enhance existing models with additional fields
    - Add `payment_term` field to `SaleOrder` if missing
    - Add `address` field to `User` model if missing
    - Merge any other field additions
    - _Requirements: 3.3_

  - [x] 2.3 Verify model constraints and validators
    - Ensure all constraints are preserved
    - Verify indexes are maintained
    - Check that no duplicate models exist
    - _Requirements: 3.4, 3.5_

- [x] 3. Consolidate database migrations
  - [x] 3.1 Analyze migration files from both projects
    - List all migrations from `new/`
    - List all migrations from `project-aarav/`
    - Identify conflicts and dependencies
    - _Requirements: 6.1_

  - [x] 3.2 Create unified migration sequence
    - Resolve dependency conflicts
    - Ensure migrations can run in order
    - Test migration application
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 3.3 Preserve data integrity constraints
    - Verify all foreign keys are valid
    - Check unique constraints
    - Validate check constraints
    - _Requirements: 6.5_

- [ ] 4. Merge API endpoints and views
  - [x] 4.1 Port admin-specific views from `project-aarav/`
    - Copy `views_admin.py` if it exists
    - Copy `serializers_admin.py` if it exists
    - Integrate admin ViewSets
    - _Requirements: 4.1, 10.1_

  - [x] 4.2 Port vendor management views
    - Copy `views_vendor.py` if it exists
    - Copy `serializers_vendor.py` if it exists
    - Integrate vendor ViewSets
    - _Requirements: 4.2, 10.2_

  - [x] 4.3 Merge overlapping endpoints
    - Compare implementations for duplicate endpoints
    - Keep the more complete implementation
    - Ensure all frontend-required endpoints exist
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.4 Remove duplicate URL patterns
    - Consolidate URL configurations
    - Ensure no conflicting routes
    - Maintain RESTful conventions
    - _Requirements: 4.4, 4.5_

- [x] 5. Integrate business logic and services
  - [x] 5.1 Merge service layer functions
    - Port unique service functions from `project-aarav/`
    - Consolidate duplicate service implementations
    - Preserve all business rules
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Integrate payment processing logic
    - Merge Razorpay integration code
    - Consolidate payment service functions
    - Ensure transaction handling is maintained
    - _Requirements: 5.3, 5.4_

  - [x] 5.3 Consolidate utility functions
    - Merge helper functions
    - Remove duplicates
    - Organize into appropriate modules
    - _Requirements: 5.5_

- [x] 6. Merge permissions and authentication
  - [x] 6.1 Port permission classes
    - Copy `permissions.py` from `project-aarav/` if it exists
    - Merge custom permission logic
    - Integrate role-based access control
    - _Requirements: 10.3, 10.5_

  - [x] 6.2 Integrate admin vendor permissions
    - Port `admin_vendor_permissions.py` if it exists
    - Ensure proper access control for admin/vendor roles
    - _Requirements: 10.3, 10.5_

- [x] 7. Merge reporting and analytics features
  - [x] 7.1 Port reporting module
    - Copy `reports.py` from `project-aarav/` if it exists
    - Integrate reporting ViewSets
    - Add reporting URL patterns
    - _Requirements: 10.4_

  - [x] 7.2 Integrate analytics features
    - Port any analytics-related code
    - Ensure reporting endpoints are accessible
    - _Requirements: 10.4_

- [ ] 8. Update Django settings and configuration
  - [x] 8.1 Merge settings.py
    - Add any missing INSTALLED_APPS
    - Merge middleware configurations
    - Consolidate REST Framework settings
    - _Requirements: 7.1, 7.3_

  - [x] 8.2 Merge third-party integrations
    - Ensure Razorpay configuration is complete
    - Verify JWT authentication settings
    - Check CORS configuration
    - _Requirements: 7.4_

  - [x] 8.3 Consolidate environment variables
    - Merge .env file requirements
    - Document all required environment variables
    - Preserve security settings
    - _Requirements: 7.2, 7.5_

- [x] 9. Consolidate dependencies
  - [x] 9.1 Merge requirements.txt files
    - Combine package lists from both projects
    - Remove duplicate entries
    - Resolve version conflicts
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 9.2 Include testing dependencies
    - Ensure pytest and hypothesis are included
    - Add any missing test packages
    - Maintain compatible versions
    - _Requirements: 8.4, 8.5_

- [ ] 10. Merge test suites
  - [x] 10.1 Port test files from `project-aarav/`
    - Copy all test files to `new/backend/tests/`
    - Preserve property-based tests
    - Preserve unit tests
    - _Requirements: 9.1, 9.2_

  - [x] 10.2 Update test imports and references
    - Fix import paths in ported tests
    - Update model references
    - Ensure test fixtures work
    - _Requirements: 9.3_

  - [x] 10.3 Merge test factories
    - Consolidate factory definitions
    - Remove duplicate factories
    - Ensure all models have factories
    - _Requirements: 9.5_

- [x] 11. Code quality and cleanup
  - [x] 11.1 Remove dead code
    - Identify and remove unused imports
    - Remove commented-out code
    - Clean up orphaned files
    - _Requirements: 11.1_

  - [x] 11.2 Ensure consistent formatting
    - Run code formatter (black/autopep8)
    - Fix linting issues
    - Maintain PEP 8 compliance
    - _Requirements: 11.2_

  - [x] 11.3 Remove duplicate functions
    - Identify duplicate utility functions
    - Consolidate into single implementations
    - Update all references
    - _Requirements: 11.3_

  - [x] 11.4 Verify separation of concerns
    - Ensure models, views, serializers are properly separated
    - Check that business logic is in services
    - Maintain clean architecture
    - _Requirements: 11.4_

  - [x] 11.5 Preserve documentation
    - Keep all docstrings
    - Preserve inline comments
    - Update any outdated documentation
    - _Requirements: 11.5_

- [x] 12. Verification and validation
  - [x] 12.1 Verify migrations
    - Run `python manage.py makemigrations --check`
    - Apply all migrations to a test database
    - Verify no migration errors
    - _Requirements: 12.1_

  - [x] 12.2 Verify Django server starts
    - Run `python manage.py runserver`
    - Check for startup errors
    - Verify all apps load correctly
    - _Requirements: 12.2_

  - [x] 12.3 Verify API endpoints
    - Test all API endpoints manually or with automated tests
    - Ensure proper responses
    - Check authentication and permissions
    - _Requirements: 12.3_

  - [x] 12.4 Verify frontend-backend integration
    - Start both frontend and backend
    - Test key user flows
    - Ensure API calls succeed
    - _Requirements: 12.4_

  - [x] 12.5 Run all tests
    - Execute `pytest` to run all tests
    - Verify all tests pass
    - Fix any failing tests
    - _Requirements: 12.5_

- [x] 13. Final checkpoint
  - Ensure all migrations are applied successfully
  - Verify Django server runs without errors
  - Confirm all API endpoints are accessible
  - Validate frontend can communicate with backend
  - Ensure all tests pass
  - Ask the user if any questions or issues arise

## Notes

- The frontend in `new/` should remain completely unchanged
- All changes should be made to the backend in `new/`
- Use `project-aarav/` as a reference only - do not modify it
- Test incrementally after each major merge step
- Maintain backward compatibility with existing frontend API calls
- Document any breaking changes or required frontend updates
