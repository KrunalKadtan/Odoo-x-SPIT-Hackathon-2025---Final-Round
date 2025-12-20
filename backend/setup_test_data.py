from accounts.models import User

# Create test users
print("Setting up test data...")

# Admin user
admin_email = "admin@appareldesk.com"
if not User.objects.filter(email=admin_email).exists():
    User.objects.create_user(
        email=admin_email,
        password="admin123",
        name="Admin User",
        role="internal"
    )
    print(f"Created admin: {admin_email}")

# Customer user  
customer_email = "customer@example.com"
if not User.objects.filter(email=customer_email).exists():
    User.objects.create_user(
        email=customer_email,
        password="customer123", 
        name="Customer User",
        role="external"
    )
    print(f"Created customer: {customer_email}")

print(f"Total users: {User.objects.count()}")
print("Test data setup complete!")