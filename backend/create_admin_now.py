import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User, Contact

# Delete existing admin
User.objects.filter(email='admin@appareldesk.com').delete()

# Create admin user
admin = User.objects.create_user(
    email='admin@appareldesk.com',
    password='admin123',
    name='Admin User',
    role='internal',
    is_staff=True,
    is_superuser=True
)

# Create contact
Contact.objects.create(
    name='Admin User',
    type='vendor',
    email='admin@appareldesk.com',
    user=admin
)

print("Admin created successfully!")
print(f"Email: {admin.email}")
print(f"Role: {admin.role}")
print(f"Password check: {admin.check_password('admin123')}")