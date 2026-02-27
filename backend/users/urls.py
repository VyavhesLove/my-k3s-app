from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Auth endpoints (обратная совместимость с фронтендом)
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User endpoints
    path('', views.user_list, name='user_list'),
    path('list/', views.user_list, name='user_list_alt'),  # для совместимости с фронтендом
    path('create/', views.create_user, name='create_user'),
    path('<int:user_id>/block/', views.toggle_user_block, name='toggle_user_block'),
    
    # Current user endpoints
    path('me/', views.get_current_user, name='current_user'),
    path('profile/', views.update_profile, name='update_profile'),
    path('password/', views.change_password, name='change_password'),
    path('history/', views.get_user_history, name='user_history'),
    
    # Sessions endpoints
    path('sessions/', views.get_active_sessions, name='active_sessions'),
    path('sessions/create/', views.create_session, name='create_session'),
    path('sessions/<int:session_id>/terminate/', views.terminate_session, name='terminate_session'),
]

