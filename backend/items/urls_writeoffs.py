"""URL-маршруты для writeoffs API (используются для обратной совместимости /api/writeoffs/)."""
from django.urls import path
from .views import writeoffs

urlpatterns = [
    # Write-offs endpoints для /api/writeoffs/
    path('', writeoffs.write_off_list, name='write_off_list'),
    path('filters/', writeoffs.write_off_filter_options, name='write_off_filter_options'),
    path('<int:write_off_id>/cancel/', writeoffs.write_off_cancel, name='write_off_cancel'),
    path('bulk-restore/', writeoffs.write_off_bulk_restore, name='write_off_bulk_restore'),
]

