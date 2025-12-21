#!/usr/bin/env python
"""
Simple script to run test data creation
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

# Import and run the create_test_data function
from create_test_dashboard_data import create_test_data

if __name__ == '__main__':
    create_test_data()