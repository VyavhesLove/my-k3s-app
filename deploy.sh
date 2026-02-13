#!/bin/bash
set -e # Остановить скрипт при ошибке

echo "📦 Собираем бэкенд..."
sudo nerdctl -n k8s.io build -t django-backend:local ./backend
sudo nerdctl -n k8s.io save django-backend:local | sudo k3s ctr -n k8s.io images import -

echo "📦 Собираем фронтенд..."
sudo nerdctl -n k8s.io build -t react-frontend:local ./frontend
sudo nerdctl -n k8s.io save react-frontend:local | sudo k3s ctr -n k8s.io images import -

echo "🚀 Деплоим в K3s..."
kubectl apply -f . # Применит все yaml файлы в текущей папке

echo "🔄 Рестартуем для верности..."
kubectl rollout restart deployment django-backend
kubectl rollout restart deployment react-frontend

echo "⏳ Ждем завершения деплоя..."
kubectl rollout status deployment django-backend --timeout=90s
kubectl rollout status deployment react-frontend --timeout=90s

echo "✨ Прод готов! Проверяй порты."
kubectl get svc

sudo nerdctl -n k8s.io system prune -a

