#!/bin/bash
set -e

# Проверяем аргумент командной строки
ENV=${1:-production}
echo "🌍 Окружение: $ENV"

# Собираем бэкенд (он не зависит от окружения)
echo "📦 Собираем бэкенд..."
sudo nerdctl -n k8s.io build -t django-backend:local ./backend
sudo nerdctl -n k8s.io save django-backend:local | sudo k3s ctr -n k8s.io images import -

# Собираем фронтенд в зависимости от окружения
echo "📦 Собираем фронтенд для $ENV..."

if [ "$ENV" = "staging" ]; then
  # STAGING сборка (с логами)
  echo "🔧 Режим: STAGING (логи ВКЛЮЧЕНЫ)"
  sudo nerdctl -n k8s.io build \
    -t react-frontend:staging \
    -f ./frontend/Containerfile.staging \
    ./frontend
  
  sudo nerdctl -n k8s.io save react-frontend:staging | sudo k3s ctr -n k8s.io images import -
  
  # Меняем образ в deployment.yaml
  sed -i 's|image: docker.io/library/react-frontend:.*|image: docker.io/library/react-frontend:staging|g' frontend-deploy.yaml
  
  # Меняем host в ingress для staging
  sed -i 's|host: .*|host: staging.k8s.local|g' ingress.yaml
  
else
  # PRODUCTION сборка (без логов)
  echo "🚀 Режим: PRODUCTION (логи ОТКЛЮЧЕНЫ)"
  sudo nerdctl -n k8s.io build \
    -t react-frontend:production \
    -f ./frontend/Containerfile \
    ./frontend
  
  sudo nerdctl -n k8s.io save react-frontend:production | sudo k3s ctr -n k8s.io images import -
  
  # Меняем образ в deployment.yaml
  sed -i 's|image: docker.io/library/react-frontend:.*|image: docker.io/library/react-frontend:production|g' frontend-deploy.yaml
  
  # Меняем host в ingress для production
  sed -i 's|host: .*|host: k8s.local|g' ingress.yaml
fi

echo "🚀 Деплоим в K3s..."
kubectl apply -f .

echo "🔄 Рестартуем..."
kubectl rollout restart deployment react-frontend 2>/dev/null || true
kubectl rollout restart deployment django-backend 2>/dev/null || true

echo "⏳ Ждем готовности..."
kubectl rollout status deployment react-frontend --timeout=60s 2>/dev/null || true
kubectl rollout status deployment django-backend --timeout=60s 2>/dev/null || true

echo "✨ Готово! Окружение: $ENV"
kubectl get pods
kubectl get ingress

# Чистим
# sudo nerdctl -n k8s.io system prune -a -f 2>/dev/null || true

