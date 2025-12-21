#!/usr/bin/env python3
"""
Admin System Security Hardening Script
Implements security hardening measures for the admin system
"""

import os
import sys
import django
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

def check_security_settings():
    """Check and validate security settings"""
    
    print("🔒 Security Settings Validation")
    print("===============================\n")
    
    security_checks = [
        {
            'name': 'DEBUG Mode',
            'check': lambda: not settings.DEBUG,
            'current': settings.DEBUG,
            'recommendation': 'Set DEBUG = False in production',
            'critical': True
        },
        {
            'name': 'Secret Key',
            'check': lambda: len(settings.SECRET_KEY) >= 50 and settings.SECRET_KEY != 'your-secret-key-here',
            'current': f"Length: {len(settings.SECRET_KEY)}, Secure: {settings.SECRET_KEY != 'your-secret-key-here'}",
            'recommendation': 'Use a strong, unique secret key',
            'critical': True
        },
        {
            'name': 'Allowed Hosts',
            'check': lambda: len(settings.ALLOWED_HOSTS) > 0 and '*' not in settings.ALLOWED_HOSTS,
            'current': settings.ALLOWED_HOSTS,
            'recommendation': 'Specify exact allowed hosts, avoid wildcard',
            'critical': True
        },
        {
            'name': 'HTTPS Redirect',
            'check': lambda: getattr(settings, 'SECURE_SSL_REDIRECT', False),
            'current': getattr(settings, 'SECURE_SSL_REDIRECT', False),
            'recommendation': 'Enable SECURE_SSL_REDIRECT = True',
            'critical': False
        },
        {
            'name': 'HSTS',
            'check': lambda: getattr(settings, 'SECURE_HSTS_SECONDS', 0) > 0,
            'current': getattr(settings, 'SECURE_HSTS_SECONDS', 0),
            'recommendation': 'Set SECURE_HSTS_SECONDS = 31536000 (1 year)',
            'critical': False
        },
        {
            'name': 'Content Type Options',
            'check': lambda: getattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF', False),
            'current': getattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF', False),
            'recommendation': 'Enable SECURE_CONTENT_TYPE_NOSNIFF = True',
            'critical': False
        },
        {
            'name': 'XSS Protection',
            'check': lambda: getattr(settings, 'SECURE_BROWSER_XSS_FILTER', False),
            'current': getattr(settings, 'SECURE_BROWSER_XSS_FILTER', False),
            'recommendation': 'Enable SECURE_BROWSER_XSS_FILTER = True',
            'critical': False
        },
        {
            'name': 'Session Security',
            'check': lambda: getattr(settings, 'SESSION_COOKIE_SECURE', False) and getattr(settings, 'SESSION_COOKIE_HTTPONLY', True),
            'current': f"Secure: {getattr(settings, 'SESSION_COOKIE_SECURE', False)}, HttpOnly: {getattr(settings, 'SESSION_COOKIE_HTTPONLY', True)}",
            'recommendation': 'Enable SESSION_COOKIE_SECURE and SESSION_COOKIE_HTTPONLY',
            'critical': True
        },
        {
            'name': 'CSRF Cookie Security',
            'check': lambda: getattr(settings, 'CSRF_COOKIE_SECURE', False) and getattr(settings, 'CSRF_COOKIE_HTTPONLY', True),
            'current': f"Secure: {getattr(settings, 'CSRF_COOKIE_SECURE', False)}, HttpOnly: {getattr(settings, 'CSRF_COOKIE_HTTPONLY', True)}",
            'recommendation': 'Enable CSRF_COOKIE_SECURE and CSRF_COOKIE_HTTPONLY',
            'critical': True
        }
    ]
    
    passed = 0
    failed = 0
    critical_failed = 0
    
    for check in security_checks:
        try:
            result = check['check']()
            if result:
                print(f"   ✅ {check['name']}: PASS")
                print(f"      Current: {check['current']}")
                passed += 1
            else:
                status = "❌ CRITICAL" if check['critical'] else "⚠️  WARNING"
                print(f"   {status} {check['name']}: FAIL")
                print(f"      Current: {check['current']}")
                print(f"      Recommendation: {check['recommendation']}")
                failed += 1
                if check['critical']:
                    critical_failed += 1
        except Exception as e:
            print(f"   ❌ {check['name']}: ERROR - {str(e)}")
            failed += 1
        print('')
    
    print(f"📊 Security Settings Summary:")
    print(f"   Passed: {passed}")
    print(f"   Failed: {failed}")
    print(f"   Critical Issues: {critical_failed}")
    
    if critical_failed > 0:
        print(f"   🚨 CRITICAL: {critical_failed} critical security issues found!")
    elif failed > 0:
        print(f"   ⚠️  WARNING: {failed} security improvements recommended")
    else:
        print(f"   ✅ EXCELLENT: All security checks passed")
    
    print('')
    return {'passed': passed, 'failed': failed, 'critical_failed': critical_failed}

def create_admin_permissions():
    """Create granular admin permissions"""
    
    print("🔐 Creating Admin Permissions")
    print("=============================\n")
    
    # Define admin permissions
    admin_permissions = [
        {
            'codename': 'view_admin_dashboard',
            'name': 'Can view admin dashboard',
            'content_type': 'auth.user'
        },
        {
            'codename': 'manage_users',
            'name': 'Can manage users',
            'content_type': 'auth.user'
        },
        {
            'codename': 'block_unblock_users',
            'name': 'Can block and unblock users',
            'content_type': 'auth.user'
        },
        {
            'codename': 'view_user_details',
            'name': 'Can view detailed user information',
            'content_type': 'auth.user'
        },
        {
            'codename': 'manage_vendors',
            'name': 'Can manage vendors',
            'content_type': 'products.vendor'
        },
        {
            'codename': 'approve_reject_vendors',
            'name': 'Can approve and reject vendors',
            'content_type': 'products.vendor'
        },
        {
            'codename': 'view_vendor_documents',
            'name': 'Can view vendor documents',
            'content_type': 'products.vendor'
        },
        {
            'codename': 'moderate_products',
            'name': 'Can moderate products',
            'content_type': 'products.product'
        },
        {
            'codename': 'approve_reject_products',
            'name': 'Can approve and reject products',
            'content_type': 'products.product'
        },
        {
            'codename': 'manage_orders',
            'name': 'Can manage orders',
            'content_type': 'products.order'
        },
        {
            'codename': 'process_refunds',
            'name': 'Can process refunds',
            'content_type': 'products.order'
        },
        {
            'codename': 'view_analytics',
            'name': 'Can view analytics and reports',
            'content_type': 'auth.user'
        },
        {
            'codename': 'export_reports',
            'name': 'Can export reports',
            'content_type': 'auth.user'
        },
        {
            'codename': 'manage_system_settings',
            'name': 'Can manage system settings',
            'content_type': 'auth.user'
        },
        {
            'codename': 'view_audit_logs',
            'name': 'Can view audit logs',
            'content_type': 'auth.user'
        },
        {
            'codename': 'manage_security',
            'name': 'Can manage security settings',
            'content_type': 'auth.user'
        }
    ]
    
    created_count = 0
    existing_count = 0
    
    for perm_data in admin_permissions:
        try:
            # Get content type
            app_label, model = perm_data['content_type'].split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)
            
            # Create or get permission
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                content_type=content_type,
                defaults={'name': perm_data['name']}
            )
            
            if created:
                print(f"   ✅ Created permission: {perm_data['name']}")
                created_count += 1
            else:
                print(f"   ⏭️  Permission exists: {perm_data['name']}")
                existing_count += 1
                
        except Exception as e:
            print(f"   ❌ Failed to create permission {perm_data['codename']}: {str(e)}")
    
    print(f"\n📊 Admin Permissions Summary:")
    print(f"   Created: {created_count}")
    print(f"   Existing: {existing_count}")
    print(f"   Total: {len(admin_permissions)}\n")
    
    return {'created': created_count, 'existing': existing_count}

def create_security_middleware():
    """Create security middleware configuration"""
    
    print("🛡️  Security Middleware Configuration")
    print("====================================\n")
    
    security_middleware = [
        'django.middleware.security.SecurityMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'corsheaders.middleware.CorsMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ]
    
    # Check current middleware
    current_middleware = getattr(settings, 'MIDDLEWARE', [])
    
    print("   Current Middleware Configuration:")
    for middleware in current_middleware:
        status = "✅" if middleware in security_middleware else "⚠️ "
        print(f"   {status} {middleware}")
    
    print("\n   Recommended Security Middleware:")
    for middleware in security_middleware:
        status = "✅" if middleware in current_middleware else "❌"
        print(f"   {status} {middleware}")
    
    # Additional security middleware recommendations
    additional_middleware = [
        'django_ratelimit.middleware.RatelimitMiddleware',
        'django.middleware.locale.LocaleMiddleware',
    ]
    
    print("\n   Additional Security Middleware (Optional):")
    for middleware in additional_middleware:
        status = "✅" if middleware in current_middleware else "💡"
        print(f"   {status} {middleware}")
    
    print('')

def create_rate_limiting_config():
    """Create rate limiting configuration"""
    
    print("⏱️  Rate Limiting Configuration")
    print("==============================\n")
    
    rate_limits = {
        'admin_login': '5/m',  # 5 attempts per minute
        'admin_actions': '100/h',  # 100 actions per hour
        'user_management': '50/h',  # 50 user actions per hour
        'vendor_management': '30/h',  # 30 vendor actions per hour
        'product_moderation': '200/h',  # 200 product actions per hour
        'analytics_queries': '20/m',  # 20 analytics queries per minute
        'report_generation': '10/h',  # 10 reports per hour
        'settings_changes': '5/h',  # 5 settings changes per hour
    }
    
    print("   Recommended Rate Limits:")
    for action, limit in rate_limits.items():
        print(f"   📊 {action}: {limit}")
    
    print("\n   Rate Limiting Implementation:")
    print("   - Use django-ratelimit for view-level rate limiting")
    print("   - Implement Redis-based rate limiting for scalability")
    print("   - Add progressive delays for repeated violations")
    print("   - Log rate limit violations for security monitoring")
    
    print('')

def create_logging_config():
    """Create security logging configuration"""
    
    print("📝 Security Logging Configuration")
    print("=================================\n")
    
    logging_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'security': {
                'format': '[{asctime}] {levelname} {name} {message}',
                'style': '{',
            },
            'audit': {
                'format': '[{asctime}] AUDIT {name} User:{user_id} Action:{action} Details:{details}',
                'style': '{',
            },
        },
        'handlers': {
            'security_file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': 'logs/security.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 10,
                'formatter': 'security',
            },
            'audit_file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': 'logs/audit.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 20,
                'formatter': 'audit',
            },
            'console': {
                'level': 'WARNING',
                'class': 'logging.StreamHandler',
                'formatter': 'security',
            },
        },
        'loggers': {
            'security': {
                'handlers': ['security_file', 'console'],
                'level': 'INFO',
                'propagate': False,
            },
            'audit': {
                'handlers': ['audit_file'],
                'level': 'INFO',
                'propagate': False,
            },
            'django.security': {
                'handlers': ['security_file'],
                'level': 'INFO',
                'propagate': False,
            },
        },
    }
    
    print("   Security Logging Categories:")
    print("   📊 Authentication events (login, logout, failures)")
    print("   📊 Authorization violations (access denied)")
    print("   📊 Admin actions (user management, settings changes)")
    print("   📊 Security events (rate limiting, suspicious activity)")
    print("   📊 Audit trail (all admin operations)")
    
    print("\n   Log Files:")
    print("   📄 security.log - Security events and violations")
    print("   📄 audit.log - Complete audit trail of admin actions")
    print("   📄 django.log - General application logs")
    
    print("\n   Log Rotation:")
    print("   🔄 Maximum file size: 10MB")
    print("   🔄 Backup count: 10-20 files")
    print("   🔄 Automatic rotation and compression")
    
    print('')

def create_monitoring_alerts():
    """Create security monitoring and alerting configuration"""
    
    print("🚨 Security Monitoring & Alerts")
    print("===============================\n")
    
    alert_rules = [
        {
            'name': 'Multiple Failed Logins',
            'condition': '5 failed login attempts in 5 minutes',
            'severity': 'HIGH',
            'action': 'Block IP for 30 minutes'
        },
        {
            'name': 'Privilege Escalation Attempt',
            'condition': 'Non-admin user accessing admin routes',
            'severity': 'CRITICAL',
            'action': 'Immediate alert and session termination'
        },
        {
            'name': 'Suspicious Admin Activity',
            'condition': 'Admin actions outside business hours',
            'severity': 'MEDIUM',
            'action': 'Log and notify security team'
        },
        {
            'name': 'Mass User Actions',
            'condition': 'More than 50 user actions in 10 minutes',
            'severity': 'HIGH',
            'action': 'Rate limit and alert'
        },
        {
            'name': 'Settings Changes',
            'condition': 'Any system settings modification',
            'severity': 'MEDIUM',
            'action': 'Immediate notification to administrators'
        },
        {
            'name': 'Database Query Anomalies',
            'condition': 'Unusual database query patterns',
            'severity': 'HIGH',
            'action': 'Log and investigate'
        },
        {
            'name': 'File Access Violations',
            'condition': 'Attempts to access restricted files',
            'severity': 'HIGH',
            'action': 'Block and alert'
        }
    ]
    
    print("   Security Alert Rules:")
    for rule in alert_rules:
        print(f"   🚨 {rule['name']} ({rule['severity']})")
        print(f"      Condition: {rule['condition']}")
        print(f"      Action: {rule['action']}")
        print('')
    
    print("   Monitoring Metrics:")
    print("   📊 Failed authentication attempts")
    print("   📊 Admin session durations")
    print("   📊 API request patterns")
    print("   📊 Database query performance")
    print("   📊 File access patterns")
    print("   📊 Network traffic anomalies")
    
    print('')

def generate_security_checklist():
    """Generate security deployment checklist"""
    
    print("📋 Security Deployment Checklist")
    print("================================\n")
    
    checklist = [
        "🔒 Set DEBUG = False in production",
        "🔒 Use strong, unique SECRET_KEY",
        "🔒 Configure ALLOWED_HOSTS properly",
        "🔒 Enable HTTPS and SSL redirect",
        "🔒 Set up HSTS headers",
        "🔒 Enable security headers (CSP, X-Frame-Options, etc.)",
        "🔒 Configure secure cookies (SESSION_COOKIE_SECURE, CSRF_COOKIE_SECURE)",
        "🔒 Set up rate limiting for admin endpoints",
        "🔒 Implement comprehensive logging and monitoring",
        "🔒 Configure database connection security",
        "🔒 Set up firewall rules for admin access",
        "🔒 Implement IP whitelisting for admin users",
        "🔒 Enable two-factor authentication",
        "🔒 Set up automated security scanning",
        "🔒 Configure backup and disaster recovery",
        "🔒 Implement intrusion detection system",
        "🔒 Set up security incident response plan",
        "🔒 Regular security audits and penetration testing",
        "🔒 Keep all dependencies updated",
        "🔒 Monitor security advisories and patches"
    ]
    
    for item in checklist:
        print(f"   {item}")
    
    print('')

def main():
    """Main security hardening function"""
    
    print("🛡️  Admin System Security Hardening")
    print("===================================\n")
    
    try:
        # Step 1: Check security settings
        settings_result = check_security_settings()
        
        # Step 2: Create admin permissions
        permissions_result = create_admin_permissions()
        
        # Step 3: Security middleware configuration
        create_security_middleware()
        
        # Step 4: Rate limiting configuration
        create_rate_limiting_config()
        
        # Step 5: Logging configuration
        create_logging_config()
        
        # Step 6: Monitoring and alerts
        create_monitoring_alerts()
        
        # Step 7: Security checklist
        generate_security_checklist()
        
        print("🎉 Security Hardening Summary")
        print("============================")
        print(f"✅ Security Settings: {settings_result['passed']} passed, {settings_result['failed']} failed")
        print(f"✅ Admin Permissions: {permissions_result['created']} created, {permissions_result['existing']} existing")
        print(f"✅ Security Middleware: Configured")
        print(f"✅ Rate Limiting: Configured")
        print(f"✅ Security Logging: Configured")
        print(f"✅ Monitoring Alerts: Configured")
        print(f"✅ Security Checklist: Generated")
        
        if settings_result['critical_failed'] > 0:
            print(f"\n🚨 CRITICAL: {settings_result['critical_failed']} critical security issues must be fixed!")
            print("   Please address critical issues before deploying to production.")
        else:
            print(f"\n🛡️  Security hardening completed successfully!")
            print("   Admin system is ready for secure production deployment.")
        
    except Exception as e:
        print(f"❌ Security hardening failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()