#!/usr/bin/env python
import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory.settings')
sys.path.insert(0, '/home/pvn/my-k3s-app/backend')

import django
django.setup()

from django.urls import resolve, get_resolver

print("=== All registered URL patterns ===")
resolver = get_resolver()
for pattern in resolver.url_patterns:
    print(f"  {pattern}")

print("\n=== Trying to resolve /api/writeoffs/ ===")
try:
    resolved = resolve('/api/writeoffs/')
    print(f"  Match: {resolved}")
    print(f"  View: {resolved.func}")
    print(f"  Args: {resolved.args}")
    print(f"  Kwargs: {resolved.kwargs}")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n=== Trying to resolve /api/items/writeoffs/ ===")
try:
    resolved = resolve('/api/items/writeoffs/')
    print(f"  Match: {resolved}")
    print(f"  View: {resolved.func}")
except Exception as e:
    print(f"  ERROR: {e}")

