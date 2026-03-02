"""Системная статистика для админ-панели."""
from django.core.management import call_command
from io import StringIO
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

# Модель UserSession определена в models_session.py для избежания циклических импортов
from ..models_session import UserSession


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_system_stats(request):
    """
    Возвращает статистику системы:
    - количество активных пользователей
    - количество активных сессий
    """
    # Проверяем, что пользователь - админ
    if not request.user.is_staff:
        return Response(
            {'error': 'Доступ запрещён'},
            status=403
        )
    
    User = get_user_model()
    
    # Количество активных пользователей (active=True)
    active_users_count = User.objects.filter(active=True).count()
    
    # Количество активных сессий
    active_sessions_count = UserSession.objects.filter(is_active=True).count()
    
    return Response({
        'active_users_count': active_users_count,
        'active_sessions_count': active_sessions_count,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_migrations_status(request):
    """
    Возвращает статус миграций базы данных.
    Использует Django management API для совместимости с K8s.
    """
    # Проверяем, что пользователь - админ
    if not request.user.is_staff:
        return Response(
            {'error': 'Доступ запрещён'},
            status=403
        )
    
    try:
        # Используем Django management API для получения миграций
        # Перехватываем вывод команды showmigrations
        out = StringIO()
        call_command('showmigrations', stdout=out)
        output = out.getvalue()
        
        # Парсим вывод
        lines = output.strip().split('\n')
        
        migrations = []
        applied = []
        unapplied = []
        
        for line in lines:
            if line.strip():
                # Проверяем, есть ли [X] или [ ] в начале строки
                is_applied = '[X]' in line
                is_pending = '[ ]' in line
                
                if is_applied or is_pending:
                    # Это миграция - убираем [X] или [ ] и парсим
                    clean_line = line.replace('[X]', '').replace('[ ]', '').strip()
                    
                    migrations.append({
                        'name': clean_line,
                        'applied': is_applied,
                        'type': 'migration'
                    })
                    
                    if is_applied:
                        applied.append(clean_line)
                    else:
                        unapplied.append(clean_line)
                else:
                    # Это имя схемы (app) - оставляем как есть
                    migrations.append({
                        'name': line.strip(),
                        'applied': None,
                        'type': 'schema'
                    })
        
        return Response({
            'migrations': migrations,
            'applied_count': len(applied),
            'unapplied_count': len(unapplied),
            'all_applied': len(unapplied) == 0,
            'raw_output': output
        })
        
    except Exception as e:
        return Response(
            {'error': f'Ошибка получения миграций: {str(e)}'},
            status=500
        )

