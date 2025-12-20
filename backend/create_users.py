import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User

print("Creating test users...")

# Create customer user
customer_email = "customer@example.com"
if not User.objects.filter(email=customer_email).exists():
    customer = User.objects.create_user(
        email=customer_email,
        password="customer123",
        name="Customer User",
        role="external"
    )
    print(f"✅ Created customer: {customer_email}")
else:
    print(f"Customer already exists: {customer_email}")

# Create admin user
admin_email = "admin@appareldesk.com"
if not User.objects.filter(email=admin_email).exists():
    admin = User.objects.create_user(
        email=admin_email,
        password="admin123",
        name="Admin User",
        role="internal"
    )
    print(f"✅ Created admin: {admin_email}")
else:
    print(f"Admin already exists: {admin_email}")

print(f"\nTotal users in database: {User.objects.count()}")
for user in User.objects.all():
    print(f"- {user.email} ({user.role})")