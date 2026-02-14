from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Возвращает информацию о текущем пользователе"""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': getattr(user, 'role', 'user'),  # если есть поле role
        'first_name': user.first_name,
        'last_name': user.last_name,
    })

