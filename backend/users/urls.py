from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    user_list, create_user, toggle_user_block, reset_user_password,
    get_current_user, update_profile, change_password,
    get_user_history, get_active_sessions, terminate_session, create_session
)

app_name = 'users'

urlpatterns = [
    # Auth endpoints (обратная совместимость с фронтендом)
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User endpoints
    path('', user_list, name='user_list'),
    path('list/', user_list, name='user_list_alt'),  # для совместимости с фронтендом
    path('create/', create_user, name='create_user'),
    path('<int:user_id>/toggle-block/', toggle_user_block, name='toggle_user_block'),
    path('<int:user_id>/reset-password/', reset_user_password, name='reset_user_password'),
    
    # Current user endpoints
    path('me/', get_current_user, name='current_user'),
    path('me/profile/', update_profile, name='update_profile'),
    path('me/update/', update_profile, name='update_profile_alt'),  # совместимость с фронтендом
    path('me/password/', change_password, name='change_password'),
    path('me/change-password/', change_password, name='change_password_alt'),  # совместимость с фронтендом
    path('me/history/', get_user_history, name='user_history'),
    path('me/sessions/', get_active_sessions, name='active_sessions'),
    path('me/sessions/create/', create_session, name='create_session'),
    path('me/sessions/terminate/', terminate_session, name='terminate_session_alt'),  # совместимость с фронтендом
    path('me/sessions/<int:session_id>/terminate/', terminate_session, name='terminate_session'),
    
    # Sessions endpoints (без me/)
    path('sessions/', get_active_sessions, name='active_sessions_alt'),
    path('sessions/create/', create_session, name='create_session_alt'),
    path('sessions/<int:session_id>/terminate/', terminate_session, name='terminate_session_third'),
]

