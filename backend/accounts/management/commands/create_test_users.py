from django.core.management.base import BaseCommand
from accounts.models import User

class Command(BaseCommand):
    help = 'Create test users for development'

    def handle(self, *args, **options):
        self.stdout.write("Creating test users...")
        
        # Create admin user (internal)
        admin_email = "admin@appareldesk.com"
        if not User.objects.filter(email=admin_email).exists():
            User.objects.create_user(
                email=admin_email,
                password="admin123",
                name="Admin User",
                role="internal"
            )
            self.stdout.write(self.style.SUCCESS(f"✅ Created admin user: {admin_email}"))
        else:
            self.stdout.write(f"ℹ️  Admin user already exists: {admin_email}")
        
        # Create customer user (external)
        customer_email = "customer@example.com"
        if not User.objects.filter(email=customer_email).exists():
            User.objects.create_user(
                email=customer_email,
                password="customer123",
                name="Customer User",
                role="external"
            )
            self.stdout.write(self.style.SUCCESS(f"✅ Created customer user: {customer_email}"))
        else:
            self.stdout.write(f"ℹ️  Customer user already exists: {customer_email}")
        
        # Create vendor user
        vendor_email = "vendor@example.com"
        if not User.objects.filter(email=vendor_email).exists():
            User.objects.create_user(
                email=vendor_email,
                password="vendor123",
                name="Vendor User",
                role="vendor"
            )
            self.stdout.write(self.style.SUCCESS(f"✅ Created vendor user: {vendor_email}"))
        else:
            self.stdout.write(f"ℹ️  Vendor user already exists: {vendor_email}")
        
        self.stdout.write("\n📊 User Summary:")
        self.stdout.write(f"Total users: {User.objects.count()}")
        self.stdout.write(f"Internal users: {User.objects.filter(role='internal').count()}")
        self.stdout.write(f"External users: {User.objects.filter(role='external').count()}")
        self.stdout.write(f"Vendor users: {User.objects.filter(role='vendor').count()}")
        
        self.stdout.write(self.style.SUCCESS("\n🎉 Test users created successfully!"))