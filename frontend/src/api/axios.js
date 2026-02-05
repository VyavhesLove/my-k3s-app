import axios from 'axios';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
    baseURL: 'http://k8s.local/api/',
});

// Автоматическое добавление слеша в конец URL
api.interceptors.request.use((config) => {
    // Проверяем, что в конце URL нет слеша и это не запрос с параметрами (типа ?search=...)
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
        config.url += '/';
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 1. Перехватчик ЗАПРОСОВ: подкладываем токен в каждый запрос
api.interceptors.request.use(
    (config) => {
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
    (response) => response, // Если всё ок, просто возвращаем ответ
    async (error) => {
        const originalRequest = error.config;

        // Если ошибка 401 и мы еще не пробовали обновиться (_retry)
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                // Запрашиваем новый access токен
                const res = await axios.post('http://k8s.local/api/token/refresh/', {
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