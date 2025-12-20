#!/usr/bin/env python
"""
Script to create migrations with automatic responses to prompts
"""
import subprocess
import sys
from io import StringIO

def create_migration():
    """Create migration with automatic responses"""
    # Prepare responses for the interactive prompts
    # Option 2 = Ignore for now (handle manually)
    responses = "2\n2\n2\n"  # Three "2" responses for the three fields
    
    # Run makemigrations with responses
    process = subprocess.Popen(
        [sys.executable, "manage.py", "makemigrations"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    stdout, stderr = process.communicate(input=responses)
    
    print("STDOUT:")
    print(stdout)
    print("\nSTDERR:")
    print(stderr)
    print(f"\nReturn code: {process.returncode}")

if __name__ == "__main__":
    create_migration()