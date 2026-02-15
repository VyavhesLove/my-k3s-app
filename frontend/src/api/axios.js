import axios from 'axios';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
    baseURL: 'http://k8s.local/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ✅ Отдельный экземпляр для refresh токена (без интерцепторов, чтобы избежать цикла)
const refreshApi = axios.create({
    baseURL: 'http://k8s.local/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ✅ Защита от использования чистого axios в проекте
if (process.env.NODE_ENV === 'development') {
    const originalPost = axios.post;
    axios.post = function(...args) {
        console.warn(
            '⚠️ Используй import api from "../api/axios", а не чистый axios!\n',
            'URL:', args[0]
        );
        return originalPost.apply(this, args);
    };
}

// Автоматическое добавление слеша в конец URL (только если слеша нет)
api.interceptors.request.use((config) => {
    // Проверяем, что в конце URL нет слеша и это не запрос с параметрами (типа ?search=...)
    // Добавляем слеш только если его нет в конце и URL не пустой
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
        config.url += '/';
    }
    // Убираем двойной слеш, если он образовался
    if (config.url && config.url.includes('//') && !config.url.includes('?')) {
        config.url = config.url.replace(/\/+$/, '') + '/';
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 1. Перехватчик ЗАПРОСОВ: подкладываем токен в каждый запрос
api.interceptors.request.use(
    (config) => {
        console.log('[AXIOS REQUEST]', config.method?.toUpperCase(), config.url, config.params);
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Перехватчик ОТВЕТОВ: ловим 401 и обновляем токен
api.interceptors.response.use(
    (response) => {
        console.log('[AXIOS RESPONSE]', response.config.url, response.status);
        return response;
    },
    async (error) => {
        console.error('[AXIOS ERROR]', error.config?.url, error.response?.status, error.response?.data);
        const originalRequest = error.config;

        // Если ошибка 401 и мы еще не пробовали обновиться (_retry)
        if (error.response.status === 401 && !originalRequest._retry) {
            // Если мы на странице логина — не пытаемся обновить токен, просто пробрасываем ошибку
            if (window.location.pathname.includes('/login')) {
                return Promise.reject(error);
            }
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                // ✅ Используем refreshApi для обновления токена (без интерцепторов)
                const res = await refreshApi.post('token/refresh/', {
                    refresh: refreshToken,
                });

                if (res.status === 200) {
                    localStorage.setItem('accessToken', res.data.access);
                    // Обновляем заголовок в изначальном запросе и повторяем его
                    originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Если даже рефреш-токен сдох — выкидываем на логин
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;