from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User, Contact


class Command(BaseCommand):
    help = 'Create admin user with contact record'

    def handle(self, *args, **options):
        email = 'admin@appareldesk.com'
        password = 'admin123'
        name = 'Admin User'
        
        try:
            with transaction.atomic():
                # Delete existing admin user and contact
                User.objects.filter(email=email).delete()
                Contact.objects.filter(email=email).delete()
                
                # Create admin user
                admin_user = User.objects.create_user(
                    email=email,
                    password=password,
                    name=name,
                    role='internal',
                    is_staff=True,
                    is_superuser=True,
                    is_active=True,
                    mobile='+91-9876543210',
                    city='Mumbai',
                    state='Maharashtra',
                    pincode='400001'
                )
                
                # Create contact record for admin
                admin_contact = Contact.objects.create(
                    name=name,
                    type='vendor',  # Admin is a vendor/internal user
                    email=email,
                    mobile='+91-9876543210',
                    city='Mumbai',
                    state='Maharashtra',
                    pincode='400001',
                    user=admin_user
                )
                
                # Verify password
                password_works = admin_user.check_password(password)
                
                self.stdout.write(
                    self.style.SUCCESS('✅ Admin setup completed successfully!')
                )
                self.stdout.write(f"User ID: {admin_user.id}")
                self.stdout.write(f"Email: {admin_user.email}")
                self.stdout.write(f"Name: {admin_user.name}")
                self.stdout.write(f"Role: {admin_user.role}")
                self.stdout.write(f"Is Active: {admin_user.is_active}")
                self.stdout.write(f"Is Staff: {admin_user.is_staff}")
                self.stdout.write(f"Is Superuser: {admin_user.is_superuser}")
                self.stdout.write(f"Password Works: {password_works}")
                self.stdout.write(f"Contact ID: {admin_contact.id}")
                self.stdout.write(f"Contact Type: {admin_contact.type}")
                self.stdout.write("Ready for login!")
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Admin setup failed: {str(e)}')
            )