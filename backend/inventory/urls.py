from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LoginView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from items.views.common import hello, get_config, get_status_counters, get_analytics, brigade_list, ErrorLogView
from users.views.maintenance import get_maintenance_status, toggle_maintenance, get_maintenance_settings

urlpatterns = [
    path('admin/', admin.site.urls),

    # 0. Auth URLs
    path('login/', LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('401/', lambda request: __import__('django.http', fromlist=['HttpResponse']).HttpResponseRedirect('/login/?next=' + request.path), name='401-redirect'),
    
    # 1. Health check (для k8s)
    path('api/hello/', hello, name='hello'),

    # 2. Items API
    path('api/items/', include('items.urls')),

    # 3. Common API endpoints (moved from items.urls for correct URL structure)
    path('api/config/', get_config, name='get_config'),
    path('api/status-counters/', get_status_counters, name='get_status_counters'),
    path('api/analytics-data/', get_analytics, name='get_analytics'),
    path('api/brigades/', brigade_list, name='brigade_list'),
    path('api/errors/log/', ErrorLogView.as_view(), name='log_error'),

    # 4. Users API (token/, me/, profile/, users/, sessions/)
    path('api/users/', include('users.urls', namespace='users')),

    # 4.1. Maintenance mode API
    path('api/maintenance/status/', get_maintenance_status, name='maintenance_status'),
    path('api/maintenance/toggle/', toggle_maintenance, name='maintenance_toggle'),
    path('api/maintenance/settings/', get_maintenance_settings, name='maintenance_settings'),

    # 5. Schema и Docs (последними!)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

