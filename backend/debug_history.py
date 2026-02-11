"""Debug script for ItemHistory duplication issue."""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory.settings')
sys.path.insert(0, '/home/pvn/my-k3s-app/backend')
django.setup()

from items.models import Item, ItemHistory
from items.enums import ItemStatus
from items.services.history_service import HistoryService
from django.contrib.auth import get_user_model

User = get_user_model()

# Clean up any existing test data
User.objects.filter(username='debug_user').delete()
Item.objects.filter(name='Debug Item').delete()
ItemHistory.objects.all().delete()

# Create test data
user = User.objects.create_user(username='debug_user', password='123')
item = Item.objects.create(name='Debug Item', status=ItemStatus.AVAILABLE, location='Debug loc')

print("=" * 50)
print("Testing HistoryService.confirmed")
print("=" * 50)

# Test just the HistoryService.confirmed call
result = HistoryService.confirmed(item=item, user=user, comment='test comment', location=item.location)
print(f"Result from HistoryService.confirmed:")
print(f"  id: {result.id}")
print(f"  action_type: {result.action_type}")
print(f"  action: {result.action}")
print(f"  comment: {result.comment}")

# Check how many ItemHistory records exist
count = ItemHistory.objects.filter(item=item).count()
print(f"\nItemHistory count for item: {count}")

# Print all history records
print("\nAll ItemHistory records:")
for h in ItemHistory.objects.filter(item=item):
    print(f"  id={h.id}, action_type={h.action_type}, action={h.action}")

